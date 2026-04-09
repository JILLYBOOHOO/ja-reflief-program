const mysql = require('mysql2/promise');
require('dotenv').config();

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
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
      weight VARCHAR(20),
      emergencyContact VARCHAR(255),
      bloodType VARCHAR(20),
      currentMedications TEXT,
      medicalConditions TEXT,
      allergies TEXT,
      preferredDoctorName VARCHAR(255),
      doctorContactNumber VARCHAR(50),
      medicalConsent BOOLEAN DEFAULT FALSE,
      cardNumber VARCHAR(50),
      cvv VARCHAR(10),
      pin VARCHAR(10),
      otpCode VARCHAR(10),
      otpExpires TIMESTAMP NULL,
      balance DECIMAL(15, 2) DEFAULT 0,
      failedAttempts INT DEFAULT 0,
      lockoutUntil TIMESTAMP NULL,
      email VARCHAR(150),
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

  await connection.query(`
    CREATE TABLE IF NOT EXISTS hazard_reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reporterName VARCHAR(255) DEFAULT 'Anonymous',
      dangerType VARCHAR(100) NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      mediaPath VARCHAR(255),
      mediaLink TEXT,
      status VARCHAR(20) DEFAULT 'Pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query('DROP TABLE IF EXISTS admins');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      idNumber VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      failedAttempts INT DEFAULT 0,
      lockoutUntil TIMESTAMP NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const bcrypt = require('bcrypt');
  // Secure Admin Credentials (non-sequential to pass new validation)
  const secureAdminId = "842931";
  const secureAdminPwd = "adminpassword123";

  const [adminRows] = await connection.query('SELECT * FROM admins WHERE idNumber = ?', [secureAdminId]);
  if (adminRows.length === 0) {
    const hashedPassword = await bcrypt.hash(secureAdminPwd, 10);
    await connection.query('INSERT INTO admins (idNumber, password) VALUES (?, ?)', [secureAdminId, hashedPassword]);
    console.log(`✅ Secure admin created: ID Number "${secureAdminId}", password "${secureAdminPwd}"`);
    
    // Optional: Remove the legacy sequential admin if it exists
    await connection.query('DELETE FROM admins WHERE idNumber = "123456"');
  }

  await connection.query(`
    CREATE TABLE IF NOT EXISTS survivor_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requesterName VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      items TEXT, -- JSON string of {name, quantity, status}
      lat DECIMAL(10, 8),
      lng DECIMAL(11, 8),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      survivorId INT,
      amount DECIMAL(15, 2) NOT NULL,
      type ENUM('Credit', 'Debit') NOT NULL,
      description VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survivorId) REFERENCES survivors(id) ON DELETE CASCADE
    )
  `);

  const indexes = [
    { name: 'idx_survivor_fullname_lookup', table: 'survivors', details: '(fullName)' },
    { name: 'idx_survivor_fullname', table: 'survivors', details: '(fullName)' },
    { name: 'idx_survivor_contact', table: 'survivors', details: '(contact)' },
    { name: 'idx_survivor_parish', table: 'survivors', details: '(parish)' },
    { name: 'idx_hazard_status', table: 'hazard_reports', details: '(status)' },
    { name: 'idx_hazard_dangertype', table: 'hazard_reports', details: '(dangerType)' },
    { name: 'idx_request_requestername', table: 'survivor_requests', details: '(requesterName)' },
    { name: 'idx_donation_date', table: 'monetary_donations', details: '(donationDate)' }
  ];

  for (const idx of indexes) {
    try {
      await connection.query(`CREATE INDEX ${idx.name} ON ${idx.table}${idx.details}`);
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME') {
        console.warn(`Could not create index ${idx.name}: ${e.message}`);
      }
    }
  }

  console.log('Database tables and indexes initialized successfully');

  // Populate initial pantry data if empty
  const [pantryCount] = await connection.query('SELECT COUNT(*) as count FROM pantry');
  if (pantryCount[0].count === 0) {
    const initialItems = [
      // Liquids
      { name: 'Water', category: 'Liquids', quantity: 2500, unit: 'BOTTLE' },
      { name: 'Syrup', category: 'Liquids', quantity: 450, unit: 'BOTTLE' },
      { name: 'Tin Juice', category: 'Liquids', quantity: 820, unit: 'CAN' },
      { name: 'Malta', category: 'Liquids', quantity: 300, unit: 'BOTTLE' },
      // Staples & Grains
      { name: 'Rice', category: 'Staples & Grains', quantity: 1200, unit: 'KG' },
      { name: 'Flour', category: 'Staples & Grains', quantity: 950, unit: 'KG' },
      { name: 'Sugar', category: 'Staples & Grains', quantity: 600, unit: 'KG' },
      { name: 'Cornmeal', category: 'Staples & Grains', quantity: 400, unit: 'KG' },
      { name: 'Oats / Noodles', category: 'Staples & Grains', quantity: 750, unit: 'PACK' },
      { name: 'Macaroni & Cheese', category: 'Staples & Grains', quantity: 500, unit: 'BOX' },
      // Canned/Tin Items
      { name: 'Tin Milk', category: 'Canned/Tin Items', quantity: 850, unit: 'CAN' },
      { name: 'Baked Beans', category: 'Canned/Tin Items', quantity: 1400, unit: 'CAN' },
      { name: 'Red Peas', category: 'Canned/Tin Items', quantity: 900, unit: 'CAN' },
      { name: 'Corned Beef', category: 'Canned/Tin Items', quantity: 1100, unit: 'CAN' },
      { name: 'Tin Mackerel', category: 'Canned/Tin Items', quantity: 1300, unit: 'CAN' },
      { name: 'Sardines', category: 'Canned/Tin Items', quantity: 1250, unit: 'CAN' },
      { name: 'Tuna', category: 'Canned/Tin Items', quantity: 600, unit: 'CAN' },
      { name: 'Spam', category: 'Canned/Tin Items', quantity: 350, unit: 'CAN' },
      { name: 'Sausages', category: 'Canned/Tin Items', quantity: 400, unit: 'CAN' },
      // Hygiene Kits
      { name: 'Soap Bars', category: 'Hygiene Kits', quantity: 1800, unit: 'BAR' },
      { name: 'Toothbrush Kit', category: 'Hygiene Kits', quantity: 900, unit: 'KIT' },
      { name: 'Sanitary Pads', category: 'Hygiene Kits', quantity: 1200, unit: 'PACK' },
      { name: 'Laundry Soap', category: 'Hygiene Kits', quantity: 500, unit: 'BOX' },
      // Tools & Shelter
      { name: 'Heavy Duty Tarp', category: 'Tools & Shelter', quantity: 150, unit: 'UNIT' },
      { name: 'Solar Lantern', category: 'Tools & Shelter', quantity: 80, unit: 'UNIT' },
      { name: 'Basic Tool Kit', category: 'Tools & Shelter', quantity: 45, unit: 'UNIT' },
      { name: 'Batteries (AA/AAA)', category: 'Tools & Shelter', quantity: 2000, unit: 'UNIT' },
      // Health Support
      { name: 'First Aid Kit', category: 'Health Support', quantity: 300, unit: 'UNIT' },
      { name: 'Bandages & Gauze', category: 'Health Support', quantity: 1500, unit: 'UNIT' },
      { name: 'Disinfectant Spray', category: 'Health Support', quantity: 600, unit: 'BOTTLE' }
    ];

    for (const item of initialItems) {
      await connection.query('INSERT INTO pantry (itemName, category, quantity, unit) VALUES (?, ?, ?, ?)', [item.name, item.category, item.quantity, item.unit]);
    }
    console.log(`✅ Strategic Pantry populated with ${initialItems.length} items`);
  }

  // Populate sample donors and historical donations
  const [donorCount] = await connection.query('SELECT COUNT(*) as count FROM donors');
  if (donorCount[0].count === 0) {
    const sampleDonors = [
      { name: 'Digicel Foundation', email: 'relief@digicelfoundation.org', contact: '876-000-0001', type: 'Corporate' },
      { name: 'Jamaica National Group', email: 'help@jngroup.com', contact: '876-111-2222', type: 'Corporate' },
      { name: 'Global Relief Force', email: 'admin@globalrelief.org', contact: '800-444-5555', type: 'International NGO' }
    ];

    for (const donor of sampleDonors) {
      const [res] = await connection.query('INSERT INTO donors (fullName, email, contactNumber, donorType) VALUES (?, ?, ?, ?)', [donor.name, donor.email, donor.contact, donor.type]);
      
      // Add a historic monetary donation for each
      const amount = Math.floor(Math.random() * 500000) + 150000;
      await connection.query('INSERT INTO monetary_donations (donorId, amount, paymentMethod, referenceNumber, donationDate) VALUES (?, ?, ?, ?, ?)', 
        [res.insertId, amount, 'Bank Transfer', 'REF-' + Date.now(), new Date()]);
    }
    console.log(`✅ Sample Donors and Monetary Donations summarized`);
  }

  // Add some sample in-kind pledges
  const [pledgeCount] = await connection.query('SELECT COUNT(*) as count FROM pledge_donations_in_kind');
  if (pledgeCount[0].count === 0) {
    await connection.query('INSERT INTO pledge_donations_in_kind (donorName, contact, itemName, quantity, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['Supreme Ventures', '876-777-8888', 'Solar Lanterns, Water Case', 150, '100 Lanterns and 50 Cases of Spring Water', 'Pending']);
    await connection.query('INSERT INTO pledge_donations_in_kind (donorName, contact, itemName, quantity, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['Carimed Ltd', '876-900-1000', 'Hygiene Kits', 500, 'Household hygiene essential starter packs', 'Verified']);
    console.log(`✅ Sample In-Kind Pledges seeded`);
  }

  await connection.end();
}

init().catch(err => {
  console.error('❌ Error initializing database:', err);
});
