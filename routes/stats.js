const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const totalStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_admin = 0').get().c;
    const totalListings = db.prepare('SELECT COUNT(*) as c FROM listings').get().c;
    const availableListings = db.prepare('SELECT COUNT(*) as c FROM listings WHERE is_available = 1').get().c;
    const verifiedStudents = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_verified = 1').get().c;
    const totalFavorites = db.prepare('SELECT COUNT(*) as c FROM favorites').get().c;
    const totalMessages = db.prepare('SELECT COUNT(*) as c FROM messages').get().c;

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalListings,
        availableListings,
        verifiedStudents,
        totalFavorites,
        totalMessages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
