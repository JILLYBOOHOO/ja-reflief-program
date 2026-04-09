const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');

require('dotenv').config();

const app = express();

// 🚀 [Vanguard Step 1]: Force Gzip Compression at the top level
app.use(compression());

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false // Relaxed for external SDKs used in emergency
}));

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));
app.use(express.json());

// Serve uploads with 7 day cache
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: true
}));
app.use(morgan('dev'));


// Simple Rate Limiter
const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 1, // per 1 second by IP
});

app.use((req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).send('Too Many Requests');
    });
});

// Routes
const survivorRoutes = require('./survivorroutes/survivors');
const paymentRoutes = require('./survivorroutes/payments');
const hazardRoutes = require('./survivorroutes/hazards');
const donationRoutes = require('./survivorroutes/donations');
const adminStatsRoutes = require('./survivorroutes/admin_stats');
const requestRoutes = require('./survivorroutes/requests');

app.use('/api/survivors', survivorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminStatsRoutes);
app.use('/api/requests', requestRoutes);

// 🚀 [Vanguard Step 2]: Titan-Static Caching for all build assets
app.use(express.static(path.join(__dirname, '../dist/ja-relief'), {
  maxAge: '1y',
  immutable: true,
  index: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Catch all other routes to enable Angular router navigation (e.g. /register)
app.get(/.*/, (req, res) => {
  // 🚨 [NUCLEAR CACHE BUSTER]: Force the browser to NEVER cache the shell
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, '../dist/ja-relief/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`JA Relief API running on port ${PORT}`);
});

