const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all survivor requests (for admin/monitoring)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM survivor_requests ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// Record a new survivor request
router.post('/', async (req, res, next) => {
  try {
    const { requesterName, location, items, lat, lng } = req.body;
    
    // items is an array of objects ({name, quantity, status})
    const [result] = await db.query(
      'INSERT INTO survivor_requests (requesterName, location, items, lat, lng) VALUES (?, ?, ?, ?, ?)',
      [requesterName, location, JSON.stringify(items), lat, lng]
    );
    
    res.status(201).json({ message: 'Request recorded', id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// Update a request (fulfillment)
router.put('/:id', async (req, res, next) => {
  try {
    const { items } = req.body;
    await db.query(
      'UPDATE survivor_requests SET items = ? WHERE id = ?',
      [JSON.stringify(items), req.params.id]
    );
    res.json({ message: 'Request updated' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
