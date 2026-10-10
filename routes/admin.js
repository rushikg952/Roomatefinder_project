const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Middleware: ensure user is admin
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
  }
  next();
}

// GET /api/admin/overview
router.get('/overview', requireAuth, requireAdmin, (req, res) => {
  try {
    const totalStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_admin = 0').get().c;
    const verifiedStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_verified = 1').get().c;
    const totalListings = db.prepare('SELECT COUNT(*) as c FROM listings').get().c;
    const pendingReports = db.prepare("SELECT COUNT(*) as c FROM reports WHERE status = 'pending'").get().c;
    const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;

    res.json({
      success: true,
      overview: {
        totalStudents,
        verifiedStudents,
        totalListings,
        pendingReports,
        totalMessages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/users
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, email, full_name, prn, gender, age, department, year_of_study,
             phone, location, is_verified, is_admin, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/admin/users/:id/verify
router.patch('/users/:id/verify', requireAuth, requireAdmin, (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = db.prepare('SELECT is_verified FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const newStatus = user.is_verified ? 0 : 1;
    db.prepare('UPDATE users SET is_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, userId);

    res.json({
      success: true,
      message: newStatus ? 'User verified.' : 'User verification revoked.',
      is_verified: newStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAuth, requireAdmin, (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own admin account.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({
      success: true,
      message: 'User account and associated records deleted.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
