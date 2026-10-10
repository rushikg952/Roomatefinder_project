const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'rcpit-roommate-finder-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: Boolean(user.is_admin)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT id, email, full_name, prn, gender, age, department, year_of_study,
             phone, location, budget, food_pref, sleep_pref, study_pref, lifestyle_pref,
             bio, avatar, is_verified, is_admin, created_at, updated_at
      FROM users WHERE id = ?
    `).get(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`
      SELECT id, email, full_name, prn, gender, age, department, year_of_study,
             phone, location, budget, food_pref, sleep_pref, study_pref, lifestyle_pref,
             bio, avatar, is_verified, is_admin
      FROM users WHERE id = ?
    `).get(decoded.id);

    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  requireAuth,
  optionalAuth
};
