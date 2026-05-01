require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Routes
const authRoutes   = require('./routes/auth');
const itemRoutes   = require('./routes/items');
const billRoutes   = require('./routes/bills');
const reportRoutes = require('./routes/reports');
const userRoutes   = require('./routes/users');

connectDB();

const app = express();

// CORS — only needed when frontend and backend are on different origins (local dev)
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
app.use(express.json());

// API Routes
app.use('/api/auth',    authRoutes);
app.use('/api/items',   itemRoutes);
app.use('/api/bills',   billRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users',   userRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ── Serve React frontend in production ────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(distPath));

  // SPA fallback — any route not matched by /api/* serves index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Dev 404 handler for API-only mode
  app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});

