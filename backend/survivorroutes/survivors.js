const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'), // ensure "uploads" folder exists in backend
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
  }
});

// Middleware to handle validation results
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register survivor
router.post('/register', 
  upload.single('idScan'),
  [
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('contact').notEmpty().withMessage('Contact is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  ],
  validateResults,
  async (req, res, next) => {
    try {
      const { website } = req.body;
      
      // Honeypot check: If the field is filled, it's likely a bot
      if (website && website.length > 0) {
        console.warn('Bot detected via honeypot field');
        // Silent rejection or 400 - bots don't care, but let's send a 201 to trick them into thinking it worked if you want, 
        // but here we'll just block it.
        return res.status(400).json({ error: 'Security verification failed.' });
      }

      let {
        fullName, contact, idType, idNumber, provisional,
        parish, address, dob, email, damageLevel, password,
        weight, emergencyContact, bloodType, currentMedications, 
        medicalConditions, allergies, preferredDoctorName, doctorContactNumber
      } = req.body;

      // Password complexity check
      const commonSequences = ['123', '234', '345', '456', '567', '678', '789', 'abc', 'password'];
      const isSimplePwd = commonSequences.some(seq => password.toLowerCase().includes(seq)) || /(.)\1\1/.test(password);
      if (isSimplePwd) {
          return res.status(400).json({ error: 'Password is too common or contains repetitive characters.' });
      }

      const isSimpleId = commonSequences.some(seq => idNumber && idNumber.toLowerCase().includes(seq)) || (idNumber && /(.)\1\1\1/.test(idNumber));
      if (isSimpleId) {
          return res.status(400).json({ error: 'ID Number cannot be a simple sequence like 1234 or aaaa.' });
      }

      // Handle FormData converting booleans to strings
      const isProvisional = provisional === 'true' || provisional === true || provisional === 1 || provisional === '1';

      if (!isProvisional && !idNumber) {
         return res.status(400).json({ error: 'ID Number is required when not requesting provisional access.' });
      }

      // If provisional and no ID provided, give a unique placeholder to prevent DB overlap
      if (isProvisional && (!idNumber || idNumber.trim() === '')) {
         idNumber = 'PROV-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      }

      const idScanPath = req.file ? req.file.filename : null;

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const { generateCardNumber, generateCVV, generatePIN, getInitialBalance } = require('../utils/card.util');
      const cardNumber = generateCardNumber();
      const cvv = generateCVV();
      const pin = generatePIN();
      const balance = getInitialBalance(damageLevel);

      const sql = `
        INSERT INTO survivors
        (fullName, contact, email, idType, idNumber, provisional, parish, address, dob, damageLevel, password, idScanPath, 
         weight, emergencyContact, bloodType, currentMedications, medicalConditions, allergies, preferredDoctorName, doctorContactNumber, cardNumber, cvv, pin, balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(sql, [
        fullName, contact, req.body.email || null, idType, idNumber, isProvisional, 
        parish, address, dob, damageLevel, hashedPassword, idScanPath,
        weight, emergencyContact, bloodType, currentMedications, medicalConditions, allergies, preferredDoctorName, doctorContactNumber,
        cardNumber, cvv, pin, balance
      ]);

      const token = jwt.sign(
        { id: result.insertId, idNumber: idNumber || 'PROV-' + result.insertId, role: 'survivor' },
        jwtSecret,
        { expiresIn: '8h' }
      );

      res.status(201).json({ 
        message: 'Survivor registered successfully', 
        token, 
        user: {
          id: result.insertId,
          name: fullName,
          idNumber: idNumber || 'PROV-' + result.insertId,
          role: 'survivor',
          hasPin: false
        }
      });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Registration failed', error: 'This ID Number is already registered.' });
      }
      next(err); // pass to global error handler
    }
  }
);

// Login survivor or admin
router.post('/login', [
  body('identifier').notEmpty().withMessage('Login Identifier is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validateResults, async (req, res, next) => {
  try {
    const { identifier, password, isAdminLogin } = req.body;

    // Helper to handle lockout/failed attempts
    const handleLoginOutcome = async (table, user, isMatch, customErrorMsg) => {
      const MAX_ATTEMPTS = 7;
      const LOCKOUT_MINUTES = 15;
      const START_COUNTDOWN_AT = 3;

      if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
        const remainingTime = Math.ceil((new Date(user.lockoutUntil) - new Date()) / 1000 / 60);
        return res.status(403).json({ 
          error: `Account locked due to too many failed attempts. Please try again in ${remainingTime} minutes.` 
        });
      }

      if (isMatch) {
        // Reset attempts
        await db.query(`UPDATE ${table} SET failedAttempts = 0, lockoutUntil = NULL WHERE id = ?`, [user.id]);
        return null; // Continue with login success
      } else {
        const newAttempts = (user.failedAttempts || 0) + 1;
        let lockoutUntil = null;
        let errorMsg = customErrorMsg || 'Incorrect password. Please try again.';

        if (newAttempts >= MAX_ATTEMPTS) {
          lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000);
          errorMsg = `Security Lockout: Too many failed attempts. Your account is locked for ${LOCKOUT_MINUTES} minutes.`;
        } else if (newAttempts >= START_COUNTDOWN_AT) {
          const remaining = MAX_ATTEMPTS - newAttempts;
          errorMsg = `Incorrect password. You have ${remaining} attempts remaining before a security lockout.`;
        } else {
          errorMsg = "Oops! We couldn't find an account with those details. Please double-check your ID, phone number, or password. If you're new or have forgotten your password, use the options below:";
        }

        await db.query(`UPDATE ${table} SET failedAttempts = ?, lockoutUntil = ? WHERE id = ?`, [newAttempts, lockoutUntil, user.id]);
        return res.status(401).json({ error: errorMsg });
      }
    };

    // First check admins
    const [adminRows] = await db.query('SELECT * FROM admins WHERE idNumber = ?', [identifier]);
    if (adminRows.length > 0) {
      const admin = adminRows[0];
      const isMatch = await bcrypt.compare(password, admin.password);
      
      const customString = isAdminLogin ? 'Invalid admin ID or password.' : null;
      const responseSent = await handleLoginOutcome('admins', admin, isMatch, customString);
      if (responseSent) return;

      const token = jwt.sign(
        { id: admin.id, idNumber: admin.idNumber, role: 'admin' },
        jwtSecret,
        { expiresIn: '8h' }
      );

      return res.json({
        message: 'Admin login successful',
        token,
        user: {
          id: admin.id,
          name: 'Administrator',
          idNumber: admin.idNumber,
          role: 'admin'
        }
      });
    }

    // If no admin was found, but the user requested Admin login specifically
    if (isAdminLogin) {
      return res.status(401).json({ error: 'Invalid Admin ID or password. Please check your credentials.' });
    }

    // Then check survivors
    const [rows] = await db.query('SELECT * FROM survivors WHERE fullName = ? OR contact = ? OR idNumber = ? OR email = ?', [identifier, identifier, identifier, identifier]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Oops! We couldn't find an account with those details. Please double-check your ID, phone number, or password. If you're new or have forgotten your password, use the options below:" });
    }

    const survivor = rows[0];
    const isMatch = await bcrypt.compare(password, survivor.password);
    
    const responseSent = await handleLoginOutcome('survivors', survivor, isMatch);
    if (responseSent) return;

    const token = jwt.sign(
      { id: survivor.id, idNumber: survivor.idNumber, role: 'survivor' },
      jwtSecret,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: survivor.id,
        name: survivor.fullName,
        idNumber: survivor.idNumber,
        role: 'survivor',
        dob: survivor.dob,
        weight: survivor.weight,
        emergencyContact: survivor.emergencyContact,
        bloodType: survivor.bloodType,
        currentMedications: survivor.currentMedications,
        medicalConditions: survivor.medicalConditions,
        allergies: survivor.allergies,
        preferredDoctorName: survivor.preferredDoctorName,
        doctorContactNumber: survivor.doctorContactNumber,
        cardNumber: survivor.cardNumber,
        balance: survivor.balance,
        email: survivor.email,
        hasPin: !!survivor.pin
      }
    });

  } catch (err) {
    next(err);
  }
});

// Reset Password (Mock flow)
router.post('/reset-password', [
  body('identifier').notEmpty().withMessage('Identifier is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], validateResults, async (req, res, next) => {
  try {
    const { identifier, newPassword } = req.body;
    
    // Check survivors to see if one matches the identifier
    const [rows] = await db.query('SELECT * FROM survivors WHERE fullName = ? OR contact = ? OR idNumber = ?', [identifier, identifier, identifier]);
    if (rows.length === 0) {
      // Don't leak whether the account exists or not in a real system, but for now we'll throw an error
      return res.status(404).json({ error: 'Account not found. Please check your spelling.' });
    }

    const survivor = rows[0];
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE survivors SET password = ?, failedAttempts = 0, lockoutUntil = NULL WHERE id = ?', [hashedPassword, survivor.id]);

    res.json({ message: 'Password successfully reset' });

  } catch (err) {
    next(err);
  }
});

// Middleware to verify JWT for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log(`[Backend AUTH] URL: ${req.url}, Header: ${authHeader ? (authHeader.substring(0, 15) + "...") : "MISSING"}`);
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  if (token && token.startsWith('mock_google_token_')) {
    console.log('[Backend AUTH] Bypass: Mock Google Token Detected');
    req.user = { id: 8, role: 'survivor' }; // Default to Jilan Buchanan for testing
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key', (err, user) => {
    if (err) {
      console.error('[Backend AUTH] JWT Verification Error:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// Request Magic Link for revealing card details
router.post('/request-magic-reveal', authenticateToken, async (req, res, next) => {
  try {
    const survivorId = req.user.id;
    const [rows] = await db.query('SELECT email, fullName, pin FROM survivors WHERE id = ?', [survivorId]);
    
    if (rows.length === 0 || !rows[0].email) {
      return res.status(400).json({ error: 'User email not found. Please update your profile.' });
    }

    const { email, fullName, pin } = rows[0];

    // If PIN is already set, we don't need a magic link, the frontend should handle PIN entry.
    // However, if they lost their PIN, this could be a reset flow.
    
    const magicToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60000); // 15 minutes

    await db.query('UPDATE survivors SET magicToken = ?, magicTokenExpires = ? WHERE id = ?', [magicToken, expires, survivorId]);

    const verificationUrl = `http://localhost:3000/api/survivors/verify-magic?token=${magicToken}&id=${survivorId}`;

    const mailOptions = {
      from: `"JA RELIEF Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Identity - JA RELIEF',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; background: #000; color: #fff; border: 4px solid #39FF14; border-radius: 30px; max-width: 600px; margin: auto;">
          <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="color: #39FF14; text-transform: uppercase; letter-spacing: 4px; font-weight: 900; margin: 0;">JA RELIEF</h1>
             <p style="color: #666; font-size: 12px; margin-top: 5px;">STRATEGIC COMMAND CENTER</p>
          </div>
          
          <h2 style="color: #fff; text-align: center; font-size: 24px;">Confirm Your Security Request</h2>
          <p style="font-size: 16px; line-height: 1.6; text-align: center; color: #ccc;">Hello ${fullName},<br>To securely reveal your Virtual Relief Card details, please click the verification button below. This ensures it's really you.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" style="background: #39FF14; color: #000; padding: 20px 40px; border-radius: 15px; text-decoration: none; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; display: inline-block; box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);">Verify Me Now</a>
          </div>
          
          <p style="font-size: 12px; opacity: 0.6; text-align: center;">This link will expire in 15 minutes. If you did not make this request, please contact our support team immediately.</p>
          
          <hr style="border: 0; border-top: 1px solid #222; margin: 30px 0;">
          <p style="font-size: 10px; text-align: center; color: #444;">© 2026 JA RELIEF | NATIONAL DISASTER RESPONSE HUB</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ message: 'Security verification link sent to your email.', email: email });
    } catch (emailErr) {
      console.warn('\n======================================================');
      console.warn(`⚠️  EMAIL FOR: ${email}`);
      console.warn('⚠️  SENDING FAILED (Likely invalid App Password)');
      console.warn('🛠️  SIMULATION MODE ACTIVE: Click the link below to verify:');
      console.warn(`👉 ${verificationUrl}`);
      console.warn('======================================================\n');
      
      // Still return 200 so the frontend UI works and user can test
      res.json({ 
        message: 'Security verification link sent to your email (Simulated via console).',
        email: email
      });
    }

  } catch (err) {
    console.error('Magic link request error:', err);
    res.status(500).json({ error: 'Failed: ' + err.message });
  }
});

// Verify Magic Link (GET route for browser click)
router.get('/verify-magic', async (req, res, next) => {
  try {
    const { token, id } = req.query;

    const [rows] = await db.query(
      'SELECT magicToken, magicTokenExpires FROM survivors WHERE id = ?', 
      [id]
    );

    if (rows.length === 0) return res.status(404).send('User not found.');

    const user = rows[0];

    if (!user.magicToken || user.magicToken !== token) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    if (new Date() > new Date(user.magicTokenExpires)) {
      return res.status(400).send('Verification link has expired.');
    }

    // Success! Mark as verified
    await db.query('UPDATE survivors SET isMagicVerified = 1, magicToken = NULL, magicTokenExpires = NULL WHERE id = ?', [id]);

    // Redirect back to dashboard with success status
    res.redirect('http://localhost:4200/dashboard?auth=verified');

  } catch (err) {
    next(err);
  }
});

// Set Security PIN (Simplified flow: remove magic link requirement)
router.post('/set-pin', authenticateToken, async (req, res, next) => {
  try {
    const { pin } = req.body;
    const survivorId = req.user.id;

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits.' });
    }

    // Validation: not 1234, not counting numbers, not repeating
    const commonPins = ['1234', '4321', '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '2580'];
    const sequentialUp = ['0123', '1234', '2345', '3456', '4567', '5678', '6789'];
    const sequentialDown = ['3210', '4321', '5432', '6543', '7654', '8765', '9876'];

    if (commonPins.includes(pin) || sequentialUp.includes(pin) || sequentialDown.includes(pin)) {
      return res.status(400).json({ error: 'Security Alert: This PIN is too common or sequential. Please choose a unique 4-digit code.' });
    }

    // Update PIN and reset verification flag (if used elsewhere)
    await db.query('UPDATE survivors SET pin = ?, isMagicVerified = 0 WHERE id = ?', [pin, survivorId]);
    
    // Also return the revealed details immediately for the "Boom" effect
    // Ensure the card has a number and CVV for the reveal, generate if missing
    let [cardRows] = await db.query('SELECT cvv, pin, cardNumber FROM survivors WHERE id = ?', [survivorId]);
    let card = cardRows[0];

    const { generateCardNumber, generateCVV } = require('../utils/card.util');
    
    if (!card.cardNumber || !card.cvv) {
      const newCardNumber = card.cardNumber || generateCardNumber();
      const newCVV = card.cvv || generateCVV();
      await db.query('UPDATE survivors SET cardNumber = ?, cvv = ? WHERE id = ?', [newCardNumber, newCVV, survivorId]);
      card.cardNumber = newCardNumber;
      card.cvv = newCVV;
    }

    res.json({ 
      heartbeat: 'UPDATED_BACKEND_v2',
      message: 'Security PIN set successfully.', 
      cvv: card.cvv,
      pin: card.pin,
      cardNumber: card.cardNumber
    });

  } catch (err) {
    next(err);
  }
});

// Verify PIN and Reveal Card Details
router.post('/verify-pin-reveal', authenticateToken, async (req, res, next) => {
  try {
    const { pin } = req.body;
    const survivorId = req.user.id;

    const [rows] = await db.query(
      'SELECT cvv, pin, cardNumber FROM survivors WHERE id = ?', 
      [survivorId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = rows[0];

    if (!user.pin || user.pin !== pin) {
      return res.status(400).json({ error: 'Incorrect security PIN.' });
    }

    res.json({
      cvv: user.cvv,
      pin: user.pin,
      cardNumber: user.cardNumber // Reveal unmasked card number if needed
    });

  } catch (err) {
    next(err);
  }
});

// Verify LOGIN PASSWORD to reveal PIN (Forgot PIN flow)
router.post('/verify-password-reveal', authenticateToken, async (req, res, next) => {
  try {
    const { password } = req.body;
    const survivorId = req.user.id;

    const [rows] = await db.query('SELECT password, cvv, pin, cardNumber FROM survivors WHERE id = ?', [survivorId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = rows[0];
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect account password.' });
    }

    res.json({
      cvv: user.cvv,
      pin: user.pin,
      cardNumber: user.cardNumber
    });

  } catch (err) {
    next(err);
  }
});

// Update Emergency Medical Information
router.post('/update-medical-info', authenticateToken, async (req, res, next) => {
  try {
    const survivorId = req.user.id;
    const { bloodType, weight, allergies, medicalConditions, currentMedications, emergencyContact } = req.body;

    await db.query(`
      UPDATE survivors 
      SET bloodType = ?, weight = ?, allergies = ?, medicalConditions = ?, currentMedications = ?, emergencyContact = ?
      WHERE id = ?
    `, [bloodType, weight, allergies, medicalConditions, currentMedications, emergencyContact, survivorId]);

    res.json({ message: 'Medical information updated successfully.' });

    next(err);
  }
});

// Fetch recent transactions for the survivor
router.get('/transactions', authenticateToken, async (req, res, next) => {
  try {
    const survivorId = req.user.id;
    
    // Check if user has any transactions
    const [existing] = await db.query('SELECT COUNT(*) as count FROM transactions WHERE survivorId = ?', [survivorId]);
    
    if (existing[0].count === 0) {
      console.log(`[Transactions] Seeding mock transactions for survivor ${survivorId}`);
      const mockTx = [
        [survivorId, 50000.00, 'Credit', 'Government Grant - Disaster Relief'],
        [survivorId, 550.00, 'Debit', 'MCC Hub - Food Supply Purchase'],
        [survivorId, 1200.00, 'Debit', 'Pharmacy Plus - Approved Merchant'],
        [survivorId, 2500.00, 'Debit', 'ATM Withdrawal - Kingston']
      ];
      // Values syntax for multiple rows: [ [row1], [row2] ] -> ( ... ), ( ... )
      await db.query('INSERT INTO transactions (survivorId, amount, type, description) VALUES ?', [mockTx]);
    }

    const [rows] = await db.query(
      'SELECT id, amount, type, description, createdAt FROM transactions WHERE survivorId = ? ORDER BY createdAt DESC LIMIT 10',
      [survivorId]
    );

    res.json(rows);
  } catch (err) {
    console.error('[Transactions Error]', err);
    next(err);
  }
});

// Simulate a Tap-to-Pay Transaction (Merchant Demo)
router.post('/simulate-payment', authenticateToken, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const survivorId = req.user.id;
    const merchants = [
      'Juici Patties - Half Way Tree',
      'Progressive Grocers - Kingston',
      'Texaco - Emergency Fuel',
      'Pharmacy Plus - Medical',
      'MegaMart - Supplies'
    ];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = (Math.random() * 2000 + 500).toFixed(2);

    await connection.beginTransaction();
    
    const [userRows] = await connection.query('SELECT balance FROM survivors WHERE id = ?', [survivorId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Survivor not found' });
    }
    
    let currentBalance = parseFloat(userRows[0].balance || 0);
    
    if (currentBalance < amount) {
      const mockAid = 15000;
      await connection.query('UPDATE survivors SET balance = balance + ? WHERE id = ?', [mockAid, survivorId]);
      currentBalance += mockAid;
      await connection.query('INSERT INTO transactions (survivorId, amount, type, description) VALUES (?, ?, ?, ?)', 
        [survivorId, mockAid, 'Credit', 'Emergency Assistance Top-up (Demo)']);
    }

    const newBalance = (currentBalance - amount).toFixed(2);
    await connection.query('UPDATE survivors SET balance = ? WHERE id = ?', [newBalance, survivorId]);
    
    await connection.query('INSERT INTO transactions (survivorId, amount, type, description) VALUES (?, ?, ?, ?)', 
      [survivorId, amount, 'Debit', `Simulated Payment: ${merchant}`]);

    await connection.commit();
    res.json({ message: 'Payment Successful!', amount, merchant, newBalance });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('[Simulate Payment Error]', err);
    next(err);
  } finally {
    if (connection) connection.release();
  }
});

// PANTRY REQUEST FLOW: SUBMIT REQUEST
router.post('/pantry-request', authenticateToken, async (req, res, next) => {
  try {
    const survivorId = req.user.id;
    const { items, otherItems } = req.body;
    
    // items is expected to be a JSON string or array of item names
    await db.query(`
      INSERT INTO survivor_requests (survivorId, requesterName, items, status) 
      VALUES (?, (SELECT fullName FROM survivors WHERE id = ?), ?, 'Request Made')
    `, [survivorId, survivorId, JSON.stringify({ selection: items, notes: otherItems })]);

    res.json({ message: 'Relief request submitted successfully!', status: 'Request Made' });
  } catch (err) {
    next(err);
  }
});

// PANTRY REQUEST FLOW: GET ACTIVE REQUEST STATUS
router.get('/active-request', authenticateToken, async (req, res, next) => {
  try {
    const survivorId = req.user.id;
    const [rows] = await db.query('SELECT * FROM survivor_requests WHERE survivorId = ? ORDER BY createdAt DESC LIMIT 1', [survivorId]);
    res.json(rows[0] || null);
  } catch (err) {
    next(err);
  }
});

// ADMIN FLOW: GET ALL PENDING REQUESTS
router.get('/admin/all-requests', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    const [rows] = await db.query('SELECT * FROM survivor_requests ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ADMIN FLOW: UPDATE REQUEST STATUS
router.patch('/admin/requests/:id/status', authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required.' });
    const { id } = req.params;
    const { status } = req.body;
    
    await db.query('UPDATE survivor_requests SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: `Request status updated to ${status}.` });
  } catch (err) {
    next(err);
  }
});

// GOOGLE SIGN-IN LOGIC
router.post('/google-login', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    
    // Check if this email belongs to a registered survivor
    const [rows] = await db.query('SELECT * FROM survivors WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      const user = rows[0];
      const token = jwt.sign(
        { id: user.id, idNumber: user.idNumber, role: 'survivor' },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );
      
      function normalizeUser(user) {
        // Aggressive normalization of identity properties
        const name = user.name || user.fullName || user.fullname || user.Fullname || user.FullName || 'Survivor';
        const id = user.idNumber || user.id_number || user.IdNumber || user.id?.toString() || '876###';
        
        return {
          ...user,
          name: name,
          idNumber: id
        };
      }

      return res.json({
        token,
        user: {
          id: user.id,
          idNumber: user.idNumber,
          name: user.fullName,
          email: user.email,
          role: 'survivor',
          balance: user.balance,
          cardNumber: user.cardNumber
        }
      });
    } else {
      // Not a registered survivor - allow as Donor
      // We don't need a formal record for mock donors in this demo
      return res.json({
        isDonor: true,
        message: 'Directing to Donation Portal...',
        user: { name, email, role: 'donor' }
      });
    }
  } catch (err) {
    next(err);
  }
});

// Fetch survivor profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT *, fullName as name FROM survivors WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Survivor not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
