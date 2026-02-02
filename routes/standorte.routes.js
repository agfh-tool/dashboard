// Server
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const db = require('../db/db');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* =========================
   Helper Functions
========================= */

async function resolveBundeslandId(name) {
  if (!name) {
    throw { code: 'BUNDESLAND_MISSING' };
  }

  const { rows } = await db.query(
    'SELECT id FROM bundeslaender WHERE name = $1',
    [name.trim()]
  );

  if (!rows[0]) {
    throw { code: 'BUNDESLAND_NOT_FOUND', name };
  }

  return rows[0].id;
}

async function createStandort(data, options = {}) {
  const nameNorm = normalizeName(data.name);

  const existing = await db.query(
    `
    SELECT id FROM standorte
    WHERE bundesland_id = $1
      AND name_norm = $2
    `,
    [data.bundesland_id, nameNorm]
  );

  if (existing.rows[0] && !options.force) {
    throw { code: 'DUPLICATE' };
  }

  const result = await db.query(
    `
    INSERT INTO standorte
      (bundesland_id, name, name_norm, typ,
       pflegefachkraft, anerkennung, antrag_status, notiz)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id
    `,
    [
      data.bundesland_id,
      data.name.trim(),
      nameNorm,
      data.typ,
      !!data.pflegefachkraft,
      !!data.anerkennung,
      data.antrag_status,
      data.notiz
    ]
  );

  return result.rows[0].id;
}

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
  if (value === null || value === undefined) return false;

  const v = String(value).toLowerCase().trim();
  return v === '1' || v === 'true' || v === 'ja' || v === 'yes';
}

/* =========================
   META
========================= */

router.get('/bundeslaender/meta', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        bundesland,
        abrechnung,
        anerkannt_fuer,
        anerkennung,
        kontakt,
        verordnung,
        notiz
      FROM bundesland_meta
    `);

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
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/bundeslaender/meta', async (req, res) => {
  const { bundesland, field, value } = req.body;

  const allowedFields = [
    'abrechnung',
    'anerkannt_fuer',
    'anerkennung',
    'kontakt',
    'verordnung',
    'notiz'
  ];

  if (!bundesland || !allowedFields.includes(field)) {
    return res.status(400).json({ error: 'Ungültige Daten' });
  }

  try {
    await db.query(
      `
      INSERT INTO bundesland_meta (bundesland, ${field})
      VALUES ($1, $2)
      ON CONFLICT (bundesland)
      DO UPDATE SET ${field} = EXCLUDED.${field}
      `,
      [bundesland, value]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

/* =========================
   Standorte
========================= */

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT s.*, b.name AS bundesland
      FROM standorte s
      JOIN bundeslaender b ON s.bundesland_id = b.id
      ORDER BY b.name, s.name
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }

  const content = req.file.buffer
    .toString('utf8')
    .replace(/^\uFEFF/, '');

  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ';',
    relax_column_count: true
  });

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    try {
      const bundeslandId = await resolveBundeslandId(row.bundesland);

      await createStandort({
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
      if (
        err.code === 'DUPLICATE' ||
        err.code === 'BUNDESLAND_NOT_FOUND'
      ) {
        skipped++;
      } else {
        return res.status(500).json(err);
      }
    }
  }

  res.json({ inserted, skipped });
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT s.*, b.name AS bundesland
      FROM standorte s
      JOIN bundeslaender b ON s.bundesland_id = b.id
      WHERE s.id = $1
      `,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Nicht gefunden' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', async (req, res) => {
  try {
    const id = await createStandort(req.body, {
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

router.put('/:id', async (req, res) => {
  const s = req.body;
  const nameNorm = normalizeName(s.name);

  try {
    const existing = await db.query(
      `
      SELECT id FROM standorte
      WHERE bundesland_id = $1
        AND name_norm = $2
        AND id != $3
      `,
      [s.bundesland_id, nameNorm, req.params.id]
    );

    if (existing.rows[0] && !s.force) {
      return res.status(409).json({ error: 'duplicate' });
    }

    const result = await db.query(
      `
      UPDATE standorte SET
        bundesland_id = $1,
        name = $2,
        name_norm = $3,
        typ = $4,
        pflegefachkraft = $5,
        anerkennung = $6,
        antrag_status = $7,
        notiz = $8,
        letzte_aenderung = now()
      WHERE id = $9
      `,
      [
        s.bundesland_id,
        s.name.trim(),
        nameNorm,
        s.typ,
        !!s.pflegefachkraft,
        !!s.anerkennung,
        s.antrag_status,
        s.notiz,
        req.params.id
      ]
    );

    res.json({ updated: result.rowCount });
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM standorte WHERE id = $1',
      [req.params.id]
    );

    res.json({ deleted: result.rowCount });
  } catch (err) {
    res.status(500).json(err);
  }
});

/* =========================
   Kontakt
========================= */

router.get('/:id/kontakt', async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT name, telefon, email, notiz
      FROM standort_kontakte
      WHERE standort_id = $1
      `,
      [req.params.id]
    );

    res.json(
      rows[0] || {
        name: '',
        telefon: '',
        email: '',
        notiz: ''
      }
    );
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put('/:id/kontakt', async (req, res) => {
  const { name, telefon, email, notiz } = req.body;

  try {
    await db.query(
      `
      INSERT INTO standort_kontakte
        (standort_id, name, telefon, email, notiz, letzte_aenderung)
      VALUES ($1,$2,$3,$4,$5,now())
      ON CONFLICT (standort_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        telefon = EXCLUDED.telefon,
        email = EXCLUDED.email,
        notiz = EXCLUDED.notiz,
        letzte_aenderung = now()
      `,
      [
        req.params.id,
        name || '',
        telefon || '',
        email || '',
        notiz || ''
      ]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
