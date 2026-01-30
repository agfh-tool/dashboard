// Server
const express = require('express');
const db = require('../db/db');
const router = express.Router();

// all bundesländer
router.get('/', (req, res) => {
  db.all(
    `SELECT * FROM bundeslaender ORDER BY name`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

// export
module.exports = router;
