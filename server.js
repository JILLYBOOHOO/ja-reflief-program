const express = require('express');
const compression = require('compression');
const path = require('path');
const app = express();

// Enable Gzip Compression to reduce file sizes by 60-70%
app.use(compression());

// The path to your Angular build output
const DIST_FOLDER = path.join(process.cwd(), 'dist/ja-relief');

// Serve static files from the dist directory
// Set a far-future max-age for static assets to leverage browser caching
app.use(express.static(DIST_FOLDER, {
  maxAge: '1y',
  index: false
}));

// All other routes should redirect to index.html to support Angular's client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST_FOLDER, 'index.html'));
});

// Use the PORT environment variable provided by Railway, or default to 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Vanguard Production Server running on port ${PORT} with Gzip and Caching enabled.`);
});
