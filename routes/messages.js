const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/unread-count
router.get('/unread-count', requireAuth, (req, res) => {
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0').get(req.user.id);
    res.json({
      success: true,
      unreadCount: row ? row.count : 0
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/messages/conversations
router.get('/conversations', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;

    // Find all distinct partner IDs
    const partners = db.prepare(`
      SELECT DISTINCT
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS partner_id
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
    `).all(userId, userId, userId);

    const conversations = [];

    for (const p of partners) {
      const partner = db.prepare(`
        SELECT id, full_name, avatar, is_verified, department
        FROM users WHERE id = ?
      `).get(p.partner_id);

      if (!partner) continue;

      const lastMsg = db.prepare(`
        SELECT message_text, created_at, sender_id
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY id DESC LIMIT 1
      `).get(userId, p.partner_id, p.partner_id, userId);

      const unreadRow = db.prepare(`
        SELECT COUNT(*) as count
        FROM messages
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `).get(p.partner_id, userId);

      conversations.push({
        partner_id: partner.id,
        partner_name: partner.full_name,
        partner_avatar: partner.avatar,
        partner_verified: partner.is_verified,
        partner_dept: partner.department,
        last_message: lastMsg ? lastMsg.message_text : '',
        last_message_time: lastMsg ? lastMsg.created_at : '',
        unread_count: unreadRow ? unreadRow.count : 0
      });
    }

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/messages/thread/:partnerId
router.get('/thread/:partnerId', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const partnerId = Number(req.params.partnerId);

    const partner = db.prepare(`
      SELECT id, full_name, avatar, is_verified, department, phone, email
      FROM users WHERE id = ?
    `).get(partnerId);

    if (!partner) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Mark messages from partner to current user as read
    db.prepare(`
      UPDATE messages
      SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(partnerId, userId);

    const messages = db.prepare(`
      SELECT id, sender_id, receiver_id, listing_id, message_text, is_read, created_at
      FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY id ASC
    `).all(userId, partnerId, partnerId, userId);

    res.json({
      success: true,
      partner,
      messages
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/messages
router.post('/', requireAuth, (req, res) => {
  try {
    const { receiver_id, message_text, listing_id = null } = req.body;

    if (!receiver_id || !message_text || !message_text.trim()) {
      return res.status(400).json({ success: false, error: 'Recipient and message text are required.' });
    }

    const rId = Number(receiver_id);
    const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(rId);
    if (!receiver) {
      return res.status(404).json({ success: false, error: 'Recipient not found.' });
    }

    const result = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, listing_id, message_text, is_read)
      VALUES (?, ?, ?, ?, 0)
    `).run(req.user.id, rId, listing_id ? Number(listing_id) : null, message_text.trim());

    const newMsg = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: newMsg
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
