// Server
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const db = require('../db/db');
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage()
});

// Begin Functions
function resolveBundeslandId(name) {
  return new Promise((resolve, reject) => {
    if (!name) {
      return reject({ code: 'BUNDESLAND_MISSING' });
    }

    db.get(
      'SELECT id FROM bundeslaender WHERE name = ?',
      [name.trim()],
      (err, row) => {
        if (err) return reject(err);
        if (!row) {
          return reject({
            code: 'BUNDESLAND_NOT_FOUND',
            name
          });
        }
        resolve(row.id);
      }
    );
  });
}

function createStandort(db, data, options = {}) {
  return new Promise((resolve, reject) => {
    const nameNorm = normalizeName(data.name);

    db.get(
      `
      SELECT id FROM standorte
      WHERE bundesland_id = ?
        AND name_norm = ?
      `,
      [data.bundesland_id, nameNorm],
      (err, existing) => {
        if (err) return reject(err);

        if (existing && !options.force) {
          return reject({ code: 'DUPLICATE' });
        }

        db.run(
          `
          INSERT INTO standorte
          (bundesland_id, name, name_norm, typ, pflegefachkraft, anerkennung, antrag_status, notiz, letzte_aenderung)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `,
          [
            data.bundesland_id,
            data.name.trim(),
            nameNorm,
            data.typ,
            data.pflegefachkraft ? 1 : 0,
            data.anerkennung ? 1 : 0,
            data.antrag_status,
            data.notiz
          ],
          function (err) {
            if (err) return reject(err);
            resolve(this.lastID);
          }
        );
      }
    );
  });
}

// normalise
function normalizeName(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

function parseBool(value) {
  if (value === null || value === undefined) return 0;

  const v = String(value).toLowerCase().trim();

  return v === '1' ||
         v === 'true' ||
         v === 'ja' ||
         v === 'yes'
    ? 1
    : 0;
}

// META BEGIN

// meta bundesland
router.get('/bundeslaender/meta', (req, res) => {
  db.all(
    `
SELECT
  bundesland,
  abrechnung,
  anerkannt_fuer,
  anerkennung,
  kontakt,
  verordnung,
  notiz
FROM bundesland_meta

    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      const result = {};
      rows.forEach(row => {
result[row.bundesland] = {
  abrechnung: row.abrechnung || '',
  anerkannt_fuer: row.anerkannt_fuer || '',
  anerkennung: row.anerkennung || '',
  kontakt: row.kontakt || '',
  verordnung: row.verordnung || '',
  notiz: row.notiz || ''
};
      });

      res.json(result);
    }
  );
});

// upsert meta
router.put('/bundeslaender/meta', (req, res) => {
  const { bundesland, field, value } = req.body;

  if (!bundesland || !field) {
    return res.status(400).json({ error: 'Ungültige Daten' });
  }

const allowedFields = [
  'abrechnung',
  'anerkannt_fuer',
  'anerkennung',
  'kontakt',
  'verordnung',
  'notiz'
];

  if (!allowedFields.includes(field)) {
    return res.status(400).json({ error: 'Ungültiges Feld' });
  }

const sql = `
  INSERT INTO bundesland_meta (bundesland, ${field})
  VALUES (?, ?)
  ON CONFLICT(bundesland)
  DO UPDATE SET
    ${field} = excluded.${field}
`;

  db.run(sql, [bundesland, value], err => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// load all standort
router.get('/', (req, res) => {
  db.all(
    `
    SELECT s.*, b.name AS bundesland
    FROM standorte s
    JOIN bundeslaender b ON s.bundesland_id = b.id
    ORDER BY b.name, s.name
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

// csv import post
router.post(
  '/import',
  upload.single('file'),
  async (req, res) => {

    console.log('>>> IMPORT ROUTE HIT <<<');
    console.log('FILE:', req.file);


    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

const content = req.file.buffer
  .toString('utf8')
  .replace(/^\uFEFF/, '');

console.log('CSV RAW:\n', content);

const rows = parse(content, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  delimiter: ';',
  relax_column_count: true
});

console.log('PARSED ROWS:', rows);

    let inserted = 0;
    let skipped = 0;

for (const row of rows) {
  try {
    const bundeslandId = await resolveBundeslandId(row.bundesland);

    await createStandort(db, {
      name: row.standort,
      bundesland_id: bundeslandId,
      typ: row.typ,
      pflegefachkraft: parseBool(row.pflegefachkraft),
      anerkennung: parseBool(row.anerkennung),
      antrag_status: row.status,
      notiz: row.notiz
    });

    inserted++;
  } catch (err) {
    console.error('IMPORT ERROR:', err, 'ROW:', row);

    if (err.code === 'DUPLICATE') {
      skipped++;
    } else if (err.code === 'BUNDESLAND_NOT_FOUND') {
      skipped++;
    } else {
      return res.status(500).json(err);
    }
  }
}
console.log('ROWS:', rows);

    res.json({ inserted, skipped });
  }
);

// load single standort
router.get('/:id', (req, res) => {
  db.get(
    `
    SELECT 
      s.*,
      s.bundesland_id,
      b.name AS bundesland
    FROM standorte s
    JOIN bundeslaender b ON s.bundesland_id = b.id
    WHERE s.id = ?
    `,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json(err);
      if (!row) return res.status(404).json({ error: 'Nicht gefunden' });
      res.json(row);
    }
  );
});

// new standort
router.post('/', async (req, res) => {
  try {
    const id = await createStandort(db, req.body, {
      force: req.body.force
    });
    res.json({ id });
  } catch (err) {
    if (err.code === 'DUPLICATE') {
      return res.status(409).json({ error: 'duplicate' });
    }
    res.status(500).json(err);
  }
});

// edit standort
router.put('/:id', (req, res) => {
  const s = req.body;
  const nameNorm = normalizeName(s.name);

  db.get(
    `
    SELECT id FROM standorte
    WHERE bundesland_id = ?
      AND name_norm = ?
      AND id != ?
    `,
    [s.bundesland_id, nameNorm, req.params.id],
    (err, existing) => {
      if (err) return res.status(500).json(err);

      if (existing && !s.force) {
        return res.status(409).json({ error: 'duplicate' });
      }

      db.run(
        `
        UPDATE standorte SET
          bundesland_id = ?,
          name = ?,
          name_norm = ?,
          typ = ?,
          pflegefachkraft = ?,
          anerkennung = ?,
          antrag_status = ?,
          notiz = ?,
          letzte_aenderung = datetime('now')
        WHERE id = ?
        `,
        [
          s.bundesland_id,
          s.name.trim(),
          nameNorm,
          s.typ,
          s.pflegefachkraft ? 1 : 0,
          s.anerkennung ? 1 : 0,
          s.antrag_status,
          s.notiz,
          req.params.id
        ],
        function (err) {
          if (err) return res.status(500).json(err);
          res.json({ updated: this.changes });
        }
      );
    }
  );
});

// delete standort
router.delete('/:id', (req, res) => {
  db.run(
    `DELETE FROM standorte WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ deleted: this.changes });
    }
  );
});

// get kontakt
router.get('/:id/kontakt', (req, res) => {
  db.get(
    `
    SELECT
      name,
      telefon,
      email,
      notiz
    FROM standort_kontakte
    WHERE standort_id = ?
    `,
    [req.params.id],
    (err, row) => {
      if (err) return res.status(500).json(err);

      res.json(row || {
        name: '',
        telefon: '',
        email: '',
        notiz: ''
      });
    }
  );
});

// put kontakt
router.put('/:id/kontakt', (req, res) => {
  const { name, telefon, email, notiz } = req.body;

  db.run(
    `
    INSERT INTO standort_kontakte
      (standort_id, name, telefon, email, notiz, letzte_aenderung)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(standort_id)
    DO UPDATE SET
      name = excluded.name,
      telefon = excluded.telefon,
      email = excluded.email,
      notiz = excluded.notiz,
      letzte_aenderung = datetime('now')
    `,
    [
      req.params.id,
      name || '',
      telefon || '',
      email || '',
      notiz || ''
    ],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

// export
module.exports = router;