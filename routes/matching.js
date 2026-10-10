const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function calculateScore(userA, userB) {
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

router.get('/compatibility/:peerId', requireAuth, (req, res) => {
  try {
    const peer = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.peerId);
    if (!peer) {
      return res.status(404).json({ success: false, error: 'Peer user not found.' });
    }

    const result = calculateScore(req.user, peer);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
