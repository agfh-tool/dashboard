const db = require('./db/db');

async function init() {
  // bundeslaender
  await db.query(`
    CREATE TABLE IF NOT EXISTS bundeslaender (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      kuerzel TEXT NOT NULL
    )
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_bundeslaender_kuerzel
    ON bundeslaender (kuerzel)
  `);

  // standorte
  await db.query(`
CREATE TABLE IF NOT EXISTS standorte (
  id SERIAL PRIMARY KEY,
  bundesland_id INTEGER NOT NULL REFERENCES bundeslaender(id),
  name TEXT NOT NULL,
  name_norm TEXT NOT NULL,
  typ TEXT CHECK (typ IN ('Landkreis', 'kreisfrei', 'angehoerig')),
  pflegefachkraft BOOLEAN DEFAULT false,
  anerkennung BOOLEAN DEFAULT false,
  antrag_status TEXT DEFAULT 'kein',
  notiz TEXT,
  letzte_aenderung TIMESTAMP DEFAULT now()
);
  `);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_standort_name
    ON standorte (bundesland_id, name_norm)
  `);

  // bundesland_meta
  await db.query(`
    CREATE TABLE IF NOT EXISTS bundesland_meta (
      bundesland VARCHAR(50) PRIMARY KEY,
      abrechnung TEXT,
      anerkannt_fuer TEXT,
      anerkennung TEXT,
      kontakt TEXT,
      verordnung TEXT,
      notiz TEXT
    )
  `);

  // standort_kontakte
  await db.query(`
    CREATE TABLE IF NOT EXISTS standort_kontakte (
      id SERIAL PRIMARY KEY,
      standort_id INTEGER UNIQUE NOT NULL
        REFERENCES standorte(id) ON DELETE CASCADE,
      name TEXT,
      telefon TEXT,
      email TEXT,
      notiz TEXT,
      letzte_aenderung TIMESTAMP DEFAULT now()
    )
  `);

  console.log('✅ PostgreSQL Schema vollständig initialisiert');
}

init().catch(err => {
  console.error(err);
  process.exit(1);
});
