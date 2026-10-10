const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/reports
router.post('/', requireAuth, (req, res) => {
  try {
    const { target_type, target_id, reason, details = '' } = req.body;

    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ success: false, error: 'target_type, target_id, and reason are required.' });
    }

    const result = db.prepare(`
      INSERT INTO reports (reporter_id, target_type, target_id, reason, details, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(req.user.id, target_type, Number(target_id), reason, details);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our campus safety team will review it.',
      reportId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reports (Admin moderation)
router.get('/', requireAuth, (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ success: false, error: 'Access denied: Admin only.' });
    }

    const reports = db.prepare(`
      SELECT r.*, u.full_name AS reporter_name, u.email AS reporter_email
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      ORDER BY r.id DESC
    `).all();

    res.json({
      success: true,
      count: reports.length,
      reports
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/reports/:id/status
router.patch('/:id/status', requireAuth, (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ success: false, error: 'Access denied: Admin only.' });
    }

    const { status } = req.body;
    const reportId = Number(req.params.id);

    db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status || 'resolved', reportId);

    res.json({
      success: true,
      message: `Report status updated to ${status}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
