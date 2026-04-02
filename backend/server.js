const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');

require('dotenv').config();

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images from backend to be loaded if needed
}));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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

app.use('/api/survivors', survivorRoutes);
app.use('/api/payments', paymentRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('JA Relief API running');
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

