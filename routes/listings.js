const express = require('express');
const db = require('../database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/listings
router.get('/', optionalAuth, (req, res) => {
  try {
    const {
      gender,
      room_type,
      location,
      max_budget,
      keyword,
      available_only
    } = req.query;

    let query = `
      SELECT l.id, l.user_id, l.title, l.location, l.budget, l.room_type,
             l.amenities, l.preferred_gender, l.is_available, l.description,
             l.created_at, l.updated_at,
             u.full_name AS owner_name, u.avatar AS owner_avatar,
             u.is_verified AS owner_verified, u.department AS owner_dept,
             u.phone AS owner_phone, u.gender AS owner_gender
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (gender && gender !== 'All') {
      const gLower = gender.toLowerCase();
      if (gLower === 'female' || gLower.includes('female') || gLower.includes('girl')) {
        query += " AND (LOWER(l.preferred_gender) LIKE '%female%' OR LOWER(l.preferred_gender) LIKE '%girl%' OR LOWER(l.preferred_gender) = 'any')";
      } else if (gLower === 'male' || gLower.includes('boy') || (gLower.includes('male') && !gLower.includes('female'))) {
        query += " AND ((LOWER(l.preferred_gender) LIKE '%male%' AND LOWER(l.preferred_gender) NOT LIKE '%female%') OR LOWER(l.preferred_gender) LIKE '%boy%' OR LOWER(l.preferred_gender) = 'any')";
      } else {
        query += ' AND LOWER(l.preferred_gender) = LOWER(?)';
        params.push(gender);
      }
    }

    if (room_type && room_type !== 'All') {
      query += ' AND LOWER(l.room_type) LIKE LOWER(?)';
      params.push(`%${room_type}%`);
    }

    if (location && location !== 'All') {
      query += ' AND LOWER(l.location) LIKE LOWER(?)';
      params.push(`%${location}%`);
    }

    if (max_budget) {
      query += ' AND l.budget <= ?';
      params.push(Number(max_budget));
    }

    if (available_only === 'true' || available_only === '1') {
      query += ' AND l.is_available = 1';
    }

    if (keyword) {
      query += ` AND (
        LOWER(l.title) LIKE LOWER(?) OR
        LOWER(l.description) LIKE LOWER(?) OR
        LOWER(l.location) LIKE LOWER(?) OR
        LOWER(l.amenities) LIKE LOWER(?) OR
        LOWER(u.full_name) LIKE LOWER(?)
      )`;
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw, kw);
    }

    query += ' ORDER BY l.is_available DESC, l.id DESC';

    const listings = db.prepare(query).all(...params);

    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('Fetch listings error:', error);
    res.status(500).json({ success: false, error: 'Database error fetching listings: ' + error.message });
  }
});

// GET /api/listings/my
router.get('/my', requireAuth, (req, res) => {
  try {
    const listings = db.prepare(`
      SELECT l.*, u.full_name AS owner_name, u.avatar AS owner_avatar, u.is_verified AS owner_verified
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.user_id = ?
      ORDER BY l.id DESC
    `).all(req.user.id);

    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/listings/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const listing = db.prepare(`
      SELECT l.*, u.full_name AS owner_name, u.avatar AS owner_avatar,
             u.is_verified AS owner_verified, u.department AS owner_dept,
             u.phone AS owner_phone
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).get(req.params.id);

    if (!listing) {
      return res.status(404).json({ success: false, error: 'Listing not found.' });
    }

    res.json({ success: true, listing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/listings
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      title,
      location,
      budget,
      room_type,
      amenities = '',
      preferred_gender = 'Any',
      description = ''
    } = req.body;

    if (!title || !location || !budget || !room_type) {
      return res.status(400).json({ success: false, error: 'Title, location, budget, and room type are required.' });
    }

    const insertStmt = db.prepare(`
      INSERT INTO listings (
        user_id, title, location, budget, room_type, amenities,
        preferred_gender, is_available, description
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, 1, ?
      )
    `);

    const result = insertStmt.run(
      req.user.id,
      title.trim(),
      location.trim(),
      Number(budget),
      room_type.trim(),
      amenities.trim(),
      preferred_gender,
      description.trim()
    );

    const newListing = db.prepare(`
      SELECT l.*, u.full_name AS owner_name, u.avatar AS owner_avatar, u.is_verified AS owner_verified
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Room listing published successfully!',
      listing: newListing
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create listing: ' + error.message });
  }
});

// PUT /api/listings/:id
router.put('/:id', requireAuth, (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Listing not found.' });
    }

    if (existing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ success: false, error: 'You can only update your own listings.' });
    }

    const {
      title,
      location,
      budget,
      room_type,
      amenities,
      preferred_gender,
      description
    } = req.body;

    db.prepare(`
      UPDATE listings
      SET title = COALESCE(?, title),
          location = COALESCE(?, location),
          budget = COALESCE(?, budget),
          room_type = COALESCE(?, room_type),
          amenities = COALESCE(?, amenities),
          preferred_gender = COALESCE(?, preferred_gender),
          description = COALESCE(?, description),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title,
      location,
      budget ? Number(budget) : null,
      room_type,
      amenities,
      preferred_gender,
      description,
      listingId
    );

    const updated = db.prepare(`
      SELECT l.*, u.full_name AS owner_name, u.avatar AS owner_avatar, u.is_verified AS owner_verified
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).get(listingId);

    res.json({
      success: true,
      message: 'Listing updated successfully!',
      listing: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Listing not found.' });
    }

    if (existing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ success: false, error: 'You can only delete your own listings.' });
    }

    db.prepare('DELETE FROM listings WHERE id = ?').run(listingId);

    res.json({
      success: true,
      message: 'Listing deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/listings/:id/availability
router.patch('/:id/availability', requireAuth, (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Listing not found.' });
    }

    if (existing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ success: false, error: 'You do not own this listing.' });
    }

    const newStatus = existing.is_available ? 0 : 1;
    db.prepare('UPDATE listings SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, listingId);

    res.json({
      success: true,
      message: newStatus ? 'Listing marked as Available.' : 'Listing marked as Occupied.',
      is_available: newStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
