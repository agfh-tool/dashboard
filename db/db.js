const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH =
  process.env.DB_PATH ||
  path.join(__dirname, '..', 'data', 'database.sqlite');

const db = new sqlite3.Database(DB_PATH, err => {
  if (err) {
    console.error('❌ DB Fehler:', err);
  } else {
    console.log('✅ DB verbunden:', DB_PATH);
  }
});

module.exports = db;
