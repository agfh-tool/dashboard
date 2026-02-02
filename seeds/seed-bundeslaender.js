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

async function seedBundeslaender() {
  try {
    for (const [name, kuerzel] of bundeslaender) {
      await db.query(
        `
        INSERT INTO bundeslaender (name, kuerzel)
        VALUES ($1, $2)
        ON CONFLICT (kuerzel) DO NOTHING
        `,
        [name, kuerzel]
      );
    }

    console.log('Bundesländer eingefügt');
    process.exit(0);
  } catch (err) {
    console.error('Seed fehlgeschlagen:', err);
    process.exit(1);
  }
}

seedBundeslaender();
