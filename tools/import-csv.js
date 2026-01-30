const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(
  path.join(__dirname, '../db/database.db')
);

function parseLandkreis(value) {
  if (!value) return { kuerzel: null, name: null };

  const match = value.match(/^([A-Z]{2})-Landkreis\s+(.*)$/);
  return {
    kuerzel: match ? match[1] : null,
    name: match ? match[2] : value
  };
}

function bool(v) {
  return v === 'ja' || v === 'WAHR' || v === 'true';
}

function status(row) {
  if (row['Anerkennung: ja/nein'] === 'ja') return 'genehmigt';
  if (row['Antrag versendet']) return 'in_pruefung';
  return 'kein';
}

fs.createReadStream(
  path.join(__dirname, '../Übersicht - Anerkennungen_Aktuell.csv')
)
.pipe(csv({ separator: ';' }))
.on('data', row => {
  const region = parseLandkreis(row['Landkreis']);

  if (!region.kuerzel || !region.name) return;

  db.get(
    `SELECT id FROM bundeslaender WHERE kuerzel = ?`,
    [region.kuerzel],
    (err, bl) => {
      if (!bl) return;

      db.run(
        `
        INSERT INTO standorte (
          bundesland_id,
          name,
          typ,
          pflegefachkraft,
          anerkennung,
          antrag_status,
          notiz
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          bl.id,
          region.name,
          'Landkreis',
          bool(row['PFK vorhanden']),
          row['Anerkennung: ja/nein'] === 'ja',
          status(row),
          row['Besonderheit'] || null
        ]
      );
    }
  );
})
.on('end', () => {
  console.log('✅ CSV-Import abgeschlossen');
  db.close();
});
