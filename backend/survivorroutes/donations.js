const express = require('express');
const router = express.Router();
const db = require('../db');

// Record a new monetary donation
router.post('/monetary', async (req, res, next) => {
  try {
    const { amount, donorName, donorPhone, donorEmail } = req.body;
    
    // Create donor record
    const [donorRes] = await db.query(
      'INSERT INTO donors (fullName, contactNumber, email, donorType) VALUES (?, ?, ?, ?)',
      [donorName, donorPhone || '', donorEmail || '', 'Monetary']
    );

    // Create donation linked to donor
    const [result] = await db.query(
      'INSERT INTO monetary_donations (donorId, amount, donationDate) VALUES (?, ?, CURDATE())',
      [donorRes.insertId, amount]
    );
    
    res.status(201).json({ message: 'Donation recorded', id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// Record an in-kind donation (pledge)
router.post('/pledge', async (req, res, next) => {
  try {
    const { donorName, donorPhone, donorEmail, items, center, dropOffDate } = req.body;
    
    // Save items array as a JSON string in description to fit the legacy table
    const [result] = await db.query(
      'INSERT INTO pledge_donations_in_kind (donorName, contact, itemName, description, status) VALUES (?, ?, ?, ?, ?)',
      [donorName, donorPhone || donorEmail, 'Pledge Package', JSON.stringify({ items, center, dropOffDate }), 'Pending']
    );
    
    res.status(201).json({ message: 'Pledge recorded', id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// Get monetary donations for the dashboard
router.get('/monetary', async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT m.amount, m.createdAt, d.fullName as donorName, d.contactNumber as donorPhone, d.email as donorEmail 
            FROM monetary_donations m 
            LEFT JOIN donors d ON m.donorId = d.id 
            ORDER BY m.createdAt DESC LIMIT 50
        `);
        res.json(rows);
    } catch(err) {
        next(err);
    }
});

// Get pledges for the dashboard
router.get('/pledges', async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT donorName, contact as donorPhone, description as items, createdAt 
            FROM pledge_donations_in_kind 
            ORDER BY createdAt DESC LIMIT 50
        `);
        // Map legacy DB format to new frontend format
        const formatted = rows.map(r => {
            let parsed = {};
            try { parsed = JSON.parse(r.items); } catch(e) {}
            return {
                donorName: r.donorName,
                donorPhone: r.donorPhone,
                items: parsed.items || [],
                center: parsed.center || '',
                dropOffDate: parsed.dropOffDate || '',
                createdAt: r.createdAt
            };
        });
        res.json(formatted);
    } catch(err) {
        next(err);
    }
});

module.exports = router;
