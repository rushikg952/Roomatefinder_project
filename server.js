const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const listingRoutes = require('./routes/listings');
const matchingRoutes = require('./routes/matching');
const messageRoutes = require('./routes/messages');
const favoriteRoutes = require('./routes/favorites');
const reportRoutes = require('./routes/reports');
const statsRoutes = require('./routes/stats');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Roommate Finder System – RCPIT Shirpur',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for client-side navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error occurred',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server if not imported by tests
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Roommate Finder System – RCPIT Shirpur Backend Active `);
    console.log(` Server running on: http://localhost:${PORT}          `);
    console.log(`=======================================================`);
  });
}

module.exports = app;
