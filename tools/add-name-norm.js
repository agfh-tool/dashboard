const db = require('../db/db');

db.serialize(() => {
  db.run(
    `ALTER TABLE standorte ADD COLUMN name_norm TEXT`,
    err => {
      if (err) {
        console.log('ℹ️ name_norm existiert evtl. schon:', err.message);
      } else {
        console.log('✅ Spalte name_norm hinzugefügt');
      }
    }
  );

  db.run(
    `
    UPDATE standorte
    SET name_norm = lower(trim(name))
    `,
    err => {
      if (err) {
        console.error('❌ Fehler beim Befüllen:', err);
      } else {
        console.log('✅ name_norm initial befüllt');
      }
    }
  );
});
