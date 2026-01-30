const db = require('./db/db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS bundeslaender (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kuerzel TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS standorte (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bundesland_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      name_norm TEXT NOT NULL,
      typ TEXT CHECK(typ IN ('Ort', 'Landkreis')),
      pflegefachkraft INTEGER DEFAULT 0,
      anerkennung INTEGER DEFAULT 0,
      antrag_status TEXT DEFAULT 'kein',
      notiz TEXT,
      letzte_aenderung TEXT,
      FOREIGN KEY (bundesland_id) REFERENCES bundeslaender(id)
    )
  `);
});

console.log('Datenbank initialisiert');
