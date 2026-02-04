const express = require('express');
require('./init');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/bundeslaender', require('./routes/bundeslaender.routes'));
app.use('/api/standorte', require('./routes/standorte.routes'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

// spa fallback
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
