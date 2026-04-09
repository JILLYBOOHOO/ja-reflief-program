const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createPam() {
  const db = require('./db');
  
  const fullName = 'Pam Halpert';
  const contact = '876-555-0101';
  const idType = 'National ID';
  const idNumber = 'PAM-777-TEST';
  const email = 'pam@dundermifflin.com';
  const password = 'PamPassword2026!';

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { generateCardNumber, generateCVV, generatePIN } = require('./utils/card.util');
    const cardNumber = generateCardNumber();
    const cvv = generateCVV();
    const pin = generatePIN();

    const sql = `
      INSERT INTO survivors
      (fullName, contact, email, idType, idNumber, provisional, parish, address, password, cardNumber, cvv, pin, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      fullName, contact, email, idType, idNumber, false, 
      'Kingston', '123 Fake Street', hashedPassword,
      cardNumber, cvv, pin, 50000.00
    ]);

    console.log('✅ User Pam created successfully!');
    console.log(`Login ID / Email / Contact: ${idNumber} or ${email}`);
    console.log(`Password: ${password}`);
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('User Pam already exists!');
      process.exit(0);
    } else {
      console.error(err);
      process.exit(1);
    }
  }
}

createPam();
