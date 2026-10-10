const express = require('express');
const db = require('../database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function calculateCompatibility(userA, userB) {
  if (!userA || !userB) return { score: 75, breakdown: { budget: 75, location: 75, food: 75, sleep: 75, study: 75, lifestyle: 75 } };

  const bA = Number(userA.budget) || 5000;
  const bB = Number(userB.budget) || 5000;
  const maxB = Math.max(bA, bB);
  const diffB = Math.abs(bA - bB);
  let budgetScore = maxB > 0 ? Math.max(10, Math.round(100 - (diffB / maxB) * 100)) : 100;

  const locA = (userA.location || '').toLowerCase().trim();
  const locB = (userB.location || '').toLowerCase().trim();
  let locationScore = 40;
  if (locA && locB) {
    if (locA === locB) locationScore = 100;
    else if (locA.includes('shirpur') && locB.includes('shirpur')) locationScore = 90;
    else if (locA.includes(locB) || locB.includes(locA)) locationScore = 80;
    else if ((locA.includes('karvand') && locB.includes('karvand')) || (locA.includes('nimzari') && locB.includes('nimzari'))) locationScore = 95;
    else locationScore = 45;
  }

  const foodA = (userA.food_pref || 'Any').toLowerCase();
  const foodB = (userB.food_pref || 'Any').toLowerCase();
  let foodScore = 70;
  if (foodA === 'any' || foodB === 'any' || foodA === foodB) foodScore = 100;
  else if (foodA.includes('veg') && foodB.includes('veg')) foodScore = 95;
  else if ((foodA.includes('non-veg') && foodB.includes('veg')) || (foodB.includes('non-veg') && foodA.includes('veg'))) foodScore = 30;

  const sleepA = (userA.sleep_pref || '').toLowerCase();
  const sleepB = (userB.sleep_pref || '').toLowerCase();
  let sleepScore = 70;
  if (!sleepA || !sleepB || sleepA === sleepB || sleepA.includes('flexible') || sleepB.includes('flexible')) sleepScore = 100;
  else if ((sleepA.includes('early') && sleepB.includes('night')) || (sleepB.includes('early') && sleepA.includes('night'))) sleepScore = 35;

  const studyA = (userA.study_pref || '').toLowerCase();
  const studyB = (userB.study_pref || '').toLowerCase();
  let studyScore = 70;
  if (!studyA || !studyB || studyA === studyB || studyA.includes('flexible') || studyB.includes('flexible')) studyScore = 100;
  else if ((studyA.includes('solo') && studyB.includes('group')) || (studyB.includes('solo') && studyA.includes('group'))) studyScore = 40;

  const lifeA = (userA.lifestyle_pref || '').toLowerCase();
  const lifeB = (userB.lifestyle_pref || '').toLowerCase();
  let lifeScore = 60;
  if (!lifeA || !lifeB || lifeA === lifeB) lifeScore = 100;
  else if (lifeA.includes('neat') && lifeB.includes('neat')) lifeScore = 95;

  const total = budgetScore * 0.25 + locationScore * 0.20 + foodScore * 0.15 + sleepScore * 0.15 + studyScore * 0.15 + lifeScore * 0.10;
  return {
    score: Math.min(99, Math.max(30, Math.round(total))),
    breakdown: { budget: budgetScore, location: locationScore, food: foodScore, sleep: sleepScore, study: studyScore, lifestyle: lifeScore }
  };
}

// GET /api/profiles
router.get('/', optionalAuth, (req, res) => {
  try {
    const {
      gender,
      location,
      department,
      food_pref,
      sleep_pref,
      study_pref,
      lifestyle_pref,
      max_budget,
      is_verified,
      keyword
    } = req.query;

    let query = `
      SELECT id, email, full_name, prn, gender, age, department, year_of_study,
             phone, location, budget, food_pref, sleep_pref, study_pref, lifestyle_pref,
             bio, avatar, is_verified, is_admin, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    // Exclude currently logged in user from peer list
    if (req.user) {
      query += ' AND id != ?';
      params.push(req.user.id);
    }

    if (gender && gender !== 'All') {
      query += ' AND LOWER(gender) = LOWER(?)';
      params.push(gender);
    }

    if (location && location !== 'All') {
      query += ' AND LOWER(location) LIKE LOWER(?)';
      params.push(`%${location}%`);
    }

    if (department && department !== 'All') {
      query += ' AND LOWER(department) = LOWER(?)';
      params.push(department);
    }

    if (food_pref && food_pref !== 'All') {
      query += ' AND LOWER(food_pref) LIKE LOWER(?)';
      params.push(`%${food_pref}%`);
    }

    if (sleep_pref && sleep_pref !== 'All') {
      query += ' AND LOWER(sleep_pref) LIKE LOWER(?)';
      params.push(`%${sleep_pref}%`);
    }

    if (study_pref && study_pref !== 'All') {
      query += ' AND LOWER(study_pref) LIKE LOWER(?)';
      params.push(`%${study_pref}%`);
    }

    if (lifestyle_pref && lifestyle_pref !== 'All') {
      query += ' AND LOWER(lifestyle_pref) LIKE LOWER(?)';
      params.push(`%${lifestyle_pref}%`);
    }

    if (max_budget) {
      query += ' AND budget <= ?';
      params.push(Number(max_budget));
    }

    if (is_verified !== undefined && is_verified !== '' && is_verified !== 'All') {
      query += ' AND is_verified = ?';
      params.push(Number(is_verified) ? 1 : 0);
    }

    if (keyword) {
      query += ' AND (LOWER(full_name) LIKE LOWER(?) OR LOWER(bio) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?) OR LOWER(department) LIKE LOWER(?))';
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }

    query += ' ORDER BY is_verified DESC, id DESC';

    const profiles = db.prepare(query).all(...params);

    const scored = profiles.map(p => {
      const comp = calculateCompatibility(req.user || { budget: 5000, location: 'Shirpur' }, p);
      return {
        ...p,
        compatibilityScore: comp.score,
        compatibilityBreakdown: comp.breakdown
      };
    });

    res.json({
      success: true,
      count: scored.length,
      profiles: scored
    });
  } catch (error) {
    console.error('Fetch profiles error:', error);
    res.status(500).json({ success: false, error: 'Database error fetching profiles: ' + error.message });
  }
});

// GET /api/profiles/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, full_name, prn, gender, age, department, year_of_study,
             phone, location, budget, food_pref, sleep_pref, study_pref, lifestyle_pref,
             bio, avatar, is_verified, is_admin, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    const comp = calculateCompatibility(req.user, user);
    res.json({
      success: true,
      profile: {
        ...user,
        compatibilityScore: comp.score,
        compatibilityBreakdown: comp.breakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Database error: ' + error.message });
  }
});

// PUT /api/profiles/me
router.put('/me', requireAuth, (req, res) => {
  try {
    const {
      full_name,
      gender,
      age,
      department,
      year_of_study,
      phone,
      location,
      budget,
      food_pref,
      sleep_pref,
      study_pref,
      lifestyle_pref,
      bio
    } = req.body;

    const updateStmt = db.prepare(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          gender = COALESCE(?, gender),
          age = COALESCE(?, age),
          department = COALESCE(?, department),
          year_of_study = COALESCE(?, year_of_study),
          phone = COALESCE(?, phone),
          location = COALESCE(?, location),
          budget = COALESCE(?, budget),
          food_pref = COALESCE(?, food_pref),
          sleep_pref = COALESCE(?, sleep_pref),
          study_pref = COALESCE(?, study_pref),
          lifestyle_pref = COALESCE(?, lifestyle_pref),
          bio = COALESCE(?, bio),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateStmt.run(
      full_name,
      gender,
      age ? Number(age) : null,
      department,
      year_of_study,
      phone,
      location,
      budget ? Number(budget) : null,
      food_pref,
      sleep_pref,
      study_pref,
      lifestyle_pref,
      bio,
      req.user.id
    );

    const updatedUser = db.prepare(`
      SELECT id, email, full_name, prn, gender, age, department, year_of_study,
             phone, location, budget, food_pref, sleep_pref, study_pref, lifestyle_pref,
             bio, avatar, is_verified, is_admin
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update profile: ' + error.message });
  }
});

// POST /api/profiles/verify
router.post('/verify', requireAuth, (req, res) => {
  try {
    const { prn } = req.body;
    if (!prn || !prn.trim()) {
      return res.status(400).json({ success: false, error: 'PRN number is required for verification.' });
    }

    const trimmedPrn = prn.trim().toUpperCase();

    // Check if PRN taken by another user
    const existing = db.prepare('SELECT id FROM users WHERE UPPER(prn) = ? AND id != ?').get(trimmedPrn, req.user.id);
    if (existing) {
      return res.status(400).json({ success: false, error: 'This PRN is already registered to another account.' });
    }

    db.prepare(`
      UPDATE users
      SET prn = ?, is_verified = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(trimmedPrn, req.user.id);

    const updatedUser = db.prepare(`
      SELECT id, email, full_name, prn, gender, age, department, year_of_study,
             phone, location, budget, food_pref, sleep_pref, study_pref, lifestyle_pref,
             bio, avatar, is_verified, is_admin
      FROM users WHERE id = ?
    `).get(req.user.id);

    res.json({
      success: true,
      message: 'Student PRN successfully verified! Verified badge unlocked.',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Verification failed: ' + error.message });
  }
});

module.exports = router;
