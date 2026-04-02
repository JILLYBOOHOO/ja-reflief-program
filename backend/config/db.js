const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost3306',
  user: 'root',         // your MySQL username
  password: '',         // EMPTY string since you have no password
  database: 'ja_relief' // your database name
});

db.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }
  console.log('✅ MySQL connected');
});

module.exports = db;
