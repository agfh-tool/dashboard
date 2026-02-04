// server
const express = require('express');
const db = require('../db/db');

const router = express.Router();

// all bundeslaender
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM bundeslaender ORDER BY name'
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
