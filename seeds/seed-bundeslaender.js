const db = require('../db/db');

const bundeslaender = [
  ['Baden-Württemberg', 'BW'],
  ['Bayern', 'BY'],
  ['Berlin', 'BE'],
  ['Brandenburg', 'BB'],
  ['Bremen', 'HB'],
  ['Hamburg', 'HH'],
  ['Hessen', 'HE'],
  ['Mecklenburg-Vorpommern', 'MV'],
  ['Niedersachsen', 'NI'],
  ['Nordrhein-Westfalen', 'NW'],
  ['Rheinland-Pfalz', 'RP'],
  ['Saarland', 'SL'],
  ['Sachsen', 'SN'],
  ['Sachsen-Anhalt', 'ST'],
  ['Schleswig-Holstein', 'SH'],
  ['Thüringen', 'TH']
];

db.serialize(() => {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO bundeslaender (name, kuerzel) VALUES (?, ?)`
  );

  bundeslaender.forEach(b => stmt.run(b));
  stmt.finalize();
});

console.log('Bundesländer eingefügt');
