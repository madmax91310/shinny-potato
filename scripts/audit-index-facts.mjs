import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INDEX_FACTS, getIndexFacts, formatIndexConstituents } from '../src/data/index-facts.js';
import { SHEETS } from '../src/pages/factsheet-tweets/data.js';
import { FAMILIES } from '../src/pages/index-comparator/data.js';

const compositionKeys = ['constituents', 'markets', 'marketCap', 'countries', 'sectors', 'holdings', 'topWeight'];
function auditSheet(sheet) {
  assert(sheet.indexFacts, `${sheet.id}: référence de photographie absente`);
  for (const key of compositionKeys) assert.deepEqual(sheet[key], sheet.indexFacts[key], `${sheet.id}: ${key} diverge du registre`);
  assert.equal(sheet.snapshot.split(' (')[0].split(' · ')[0], sheet.indexFacts.snapshot, `${sheet.id}: date divergente`);
  assert(sheet.source.some(({ url }) => url === sheet.indexFacts.source.url), `${sheet.id}: source divergente`);
}
function auditFamily(family) {
  for (const index of family.indices) {
    if (!index.indexFacts) continue;
    const facts = index.indexFacts;
    assert(Object.values(INDEX_FACTS).some((history) => Object.values(history).includes(facts)), `${index.name}: référence non canonique`);
    // Comparer les comptages de titres, sans confondre les noms nominaux S&P 500/Nasdaq 100.
    const normalize = (s) => s.replaceAll('\u202f', ' ').replaceAll('\u00a0', ' ');
    const numbers = [...normalize(index.desc).matchAll(/\b(\d{1,3}(?: \d{3})*|\d+) (?:valeurs|sociétés|entreprises)/g)];
    for (const [, value] of numbers) assert.equal(Number(value.replaceAll(' ', '')), facts.constituents, `${index.name}: description divergente`);
  }
  const labels = { 'STOXX 600': 'stoxx600', 'MSCI Europe': 'mscieurope', 'EURO STOXX 50': 'eurostoxx50', 'MSCI World': 'world', 'World': 'world', 'MSCI ACWI': 'acwi', 'FTSE All-World': 'ftse-all-world', 'World ex USA': 'world-ex-usa', 'World Small Cap': 'world-small-cap', 'TOPIX': 'topix', 'Nikkei 225': 'nikkei225' };
  for (const text of family.diversification.chain) {
    const label = text.split(' (')[0];
    const id = labels[label];
    if (!id) continue;
    const date = id === 'topix' ? '2026-07-31' : '2026-08-31';
    const count = text.match(/\(([\d ]+)/)?.[1];
    assert.equal(Number(count?.replaceAll(' ', '')), getIndexFacts(id, date).constituents, `${label}: chaîne divergente`);
  }
}
for (const [id, history] of Object.entries(INDEX_FACTS)) {
  for (const [date, facts] of Object.entries(history)) {
    assert(facts.source?.url.startsWith('https://') && facts.source.label && facts.provenance, `${id}: provenance absente`);
    assert(Number.isInteger(facts.constituents) && facts.constituents > 0, `${id}: comptage invalide`);
    assert(date === 'legacy-undated' ? facts.asOf === null : date === facts.asOf && /^\d{4}-\d{2}-\d{2}$/.test(date), `${id}: date incohérente`);
    assert(Object.isFrozen(facts), `${id}: photographie modifiable`);
  }
}
SHEETS.forEach(auditSheet);
FAMILIES.forEach(auditFamily);
const sharedNames = ['STOXX 600', 'EURO STOXX 50', 'MSCI Europe', 'MSCI World', 'MSCI ACWI', 'FTSE All-World', 'MSCI World ex USA', 'MSCI World Small Cap', 'TOPIX', 'Nikkei 225', 'S&P 500'];
for (const index of FAMILIES.flatMap((family) => family.indices)) {
  if (sharedNames.includes(index.name)) assert(index.indexFacts, `${index.name}: photographie commune supprimée`);
}
// Interdire les recopies dans les fiches et les chaînes de diversification partagées.
const sheetsCode = readFileSync(new URL('../src/pages/factsheet-tweets/data.js', import.meta.url), 'utf8');
assert(!/\b(?:constituents|markets|marketCap|countries|sectors|holdings|topWeight)\s*:/.test(sheetsCode), 'Composition locale réintroduite');
const comparatorCode = readFileSync(new URL('../src/pages/index-comparator/data.js', import.meta.url), 'utf8');
for (const line of comparatorCode.split('\n').filter((line) => line.includes('chain:'))) {
  assert(!/(?:MSCI World|MSCI ACWI|FTSE All-World|STOXX 600|EURO STOXX 50|MSCI Europe|TOPIX|Nikkei 225|World ex USA|World Small Cap|World) \(\d/.test(line), 'Comptage partagé recopié dans une chaîne');
}
// Vérifier que les gardes rejettent effectivement les régressions, tout en acceptant l'histoire.
assert.throws(() => auditSheet({ ...SHEETS.find((s) => s.id === 'acwi'), constituents: 2461 }), /diverge/);
const world = FAMILIES.find((f) => f.id === 'monde');
assert.throws(() => auditFamily({ ...world, indices: world.indices.map((index) => index.name === 'FTSE All-World' ? { ...index, desc: '4 263 valeurs' } : index) }), /divergente/);
assert.equal(getIndexFacts('topix', '2026-04-30').constituents, 1650);
assert.equal(getIndexFacts('topix', '2026-07-31').constituents, 1637);
assert.equal(getIndexFacts('world', 'legacy-undated').constituents, 1283);
assert.throws(() => getIndexFacts('world', '2026-01-01'), /absente/);
console.log(`Faits d’indices : ${SHEETS.length} fiches, ${FAMILIES.length} familles ; sources, photographies, cohérence et gardes de régression OK.`);
console.log(`31/08/2026 : ACWI ${formatIndexConstituents('acwi', '2026-08-31')}, All-World ${formatIndexConstituents('ftse-all-world', '2026-08-31')}. Historiques conservés.`);
