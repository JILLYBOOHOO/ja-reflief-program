const mysql = require('mysql2/promise');
require('dotenv').config();

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  const dbName = process.env.DB_NAME || 'ja_relief';
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
  await connection.query(`USE ${dbName}`);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS survivors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      contact VARCHAR(50) NOT NULL,
      idType VARCHAR(50),
      idNumber VARCHAR(50) NOT NULL UNIQUE,
      provisional BOOLEAN DEFAULT FALSE,
      parish VARCHAR(100),
      address TEXT,
      dob DATE,
      damageLevel VARCHAR(50),
      password VARCHAR(255) NOT NULL,
      idScanPath VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS pantry (
      id INT AUTO_INCREMENT PRIMARY KEY,
      itemName VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      quantity INT DEFAULT 0,
      unit VARCHAR(50),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS pledge_donations_in_kind (
      id INT AUTO_INCREMENT PRIMARY KEY,
      donorName VARCHAR(255) NOT NULL,
      contact VARCHAR(50),
      itemName VARCHAR(255) NOT NULL,
      quantity INT DEFAULT 0,
      description TEXT,
      status VARCHAR(50) DEFAULT 'Pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS donors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      fullName VARCHAR(255) NOT NULL,
      contactNumber VARCHAR(50),
      email VARCHAR(150),
      address TEXT,
      donorType VARCHAR(50),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS monetary_donations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      donorId INT,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'JMD',
      paymentMethod VARCHAR(50),
      referenceNumber VARCHAR(100),
      donationDate DATE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (donorId) REFERENCES donors(id) ON DELETE SET NULL
    )
  `);

  await connection.query('DROP TABLE IF EXISTS admins');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      idNumber VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const bcrypt = require('bcrypt');
  const [adminRows] = await connection.query('SELECT * FROM admins WHERE idNumber = "123456"');
  if (adminRows.length === 0) {
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    await connection.query('INSERT INTO admins (idNumber, password) VALUES (?, ?)', ['123456', hashedPassword]);
    console.log('✅ Default admin created: ID Number "123456", password "adminpassword"');
  }

  console.log('✅ Database and tables initialized successfully');
  await connection.end();
}

init().catch(err => {
  console.error('❌ Error initializing database:', err);
});
