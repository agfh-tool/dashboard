// db/db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL verbunden');
});

module.exports = {
  query(text, params) {
    return pool.query(text, params);
  }
};
