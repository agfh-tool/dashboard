const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage()
});

router.post('/db', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const targetPath = '/data/database.sqlite';

  fs.writeFile(targetPath, req.file.buffer, err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Write failed' });
    }

    res.json({ success: true });
  });
});

module.exports = router;
