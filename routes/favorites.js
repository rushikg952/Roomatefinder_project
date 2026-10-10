const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/favorites/ids
router.get('/ids', requireAuth, (req, res) => {
  try {
    const rows = db.prepare('SELECT listing_id FROM favorites WHERE user_id = ?').all(req.user.id);
    const favoriteIds = rows.map(r => r.listing_id);
    res.json({
      success: true,
      favoriteIds
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/favorites
router.get('/', requireAuth, (req, res) => {
  try {
    const favorites = db.prepare(`
      SELECT l.*, u.full_name AS owner_name, u.avatar AS owner_avatar,
             u.is_verified AS owner_verified, u.department AS owner_dept,
             f.created_at AS favorited_at
      FROM favorites f
      JOIN listings l ON f.listing_id = l.id
      JOIN users u ON l.user_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.id DESC
    `).all(req.user.id);

    res.json({
      success: true,
      count: favorites.length,
      favorites
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/favorites
router.post('/', requireAuth, (req, res) => {
  try {
    const { listing_id } = req.body;
    if (!listing_id) {
      return res.status(400).json({ success: false, error: 'listing_id is required.' });
    }

    const lid = Number(listing_id);
    const listing = db.prepare('SELECT id FROM listings WHERE id = ?').get(lid);
    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found.' });
    }

    // Insert or ignore if duplicate
    db.prepare(`
      INSERT OR IGNORE INTO favorites (user_id, listing_id)
      VALUES (?, ?)
    `).run(req.user.id, lid);

    res.json({
      success: true,
      message: 'Added to favorites!',
      isFavorited: true
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/favorites/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const lid = Number(req.params.id);
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND listing_id = ?').run(req.user.id, lid);

    res.json({
      success: true,
      message: 'Removed from favorites.',
      isFavorited: false
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
