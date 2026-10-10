const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Helper to remove password_hash before returning user
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      prn = '',
      gender = 'Prefer not to say',
      age = 20,
      department = 'Computer Engineering',
      year_of_study = 'Third Year',
      phone = '',
      location = 'Shirpur',
      budget = 5000,
      food_pref = 'Any',
      sleep_pref = 'Flexible / Moderate',
      study_pref = 'Quiet Solo Study',
      lifestyle_pref = 'Neat & Organized',
      bio = ''
    } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(trimmedEmail);
    if (existing) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    if (prn && prn.trim()) {
      const existingPrn = db.prepare('SELECT id FROM users WHERE LOWER(prn) = ?').get(prn.trim().toLowerCase());
      if (existingPrn) {
        return res.status(400).json({ success: false, error: 'A student with this PRN is already registered.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatars = gender === 'Female' ? ['🌸', '🐱', '🔬', '🌷', '✨'] : ['🎨', '🏀', '🎧', '⚡', '🚀'];
    const chosenAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    const isVerified = trimmedEmail.endsWith('@rcpit.ac.in') ? 1 : 0;

    const insertStmt = db.prepare(`
      INSERT INTO users (
        email, password_hash, full_name, prn, gender, age, department,
        year_of_study, phone, location, budget, food_pref, sleep_pref,
        study_pref, lifestyle_pref, bio, avatar, is_verified, is_admin
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0
      )
    `);

    const result = insertStmt.run(
      trimmedEmail,
      passwordHash,
      full_name.trim(),
      prn.trim() || null,
      gender,
      Number(age) || 20,
      department,
      year_of_study,
      phone.trim(),
      location.trim() || 'Shirpur',
      Number(budget) || 5000,
      food_pref,
      sleep_pref,
      study_pref,
      lifestyle_pref,
      bio.trim() || `Student at RCPIT Shirpur (${department}).`,
      chosenAvatar,
      isVerified
    );

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to Roommate Finder.',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Server error during registration: ' + error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { emailOrPrn, password } = req.body;

    if (!emailOrPrn || !password) {
      return res.status(400).json({ success: false, error: 'Email/PRN and password are required.' });
    }

    const identifier = emailOrPrn.trim().toLowerCase();
    const user = db.prepare(`
      SELECT * FROM users
      WHERE LOWER(email) = ? OR (prn IS NOT NULL AND LOWER(prn) = ?)
    `).get(identifier, identifier);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email/PRN or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email/PRN or password.' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Server error during login: ' + error.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user)
  });
});

module.exports = router;
