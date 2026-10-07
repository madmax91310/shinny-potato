import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INDEX_FACTS, CURRENT_INDEX_SNAPSHOTS, getIndexFacts, getCurrentIndexFacts, getCurrentIndexDescription, formatIndexConstituents } from '../src/data/index-facts.js';
import { SHEETS } from '../src/data/index-factsheets.js';
import { FAMILIES } from '../src/data/index-comparisons.js';

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
    assert(Object.values(CURRENT_INDEX_SNAPSHOTS).includes(facts) || Object.values(INDEX_FACTS).some((history) => Object.values(history).includes(facts)), `${index.name}: référence non canonique`);
    // Toutes les descriptions d’indices proviennent de la photographie et de sa variante.
    const id = Object.entries(CURRENT_INDEX_SNAPSHOTS).find(([, f]) => f === facts)?.[0]
      ?? Object.entries(INDEX_FACTS).find(([, h]) => Object.values(h).includes(facts))[0];
    assert.equal(index.desc, getCurrentIndexDescription(id, facts.asOf ?? 'methodology', family.id), `${index.name}: description divergente`);
  }
  const aliases = { 'World': 'MSCI World', 'World ex USA': 'MSCI World ex USA', 'World Small Cap': 'MSCI World Small Cap', 'Dividend Aristocrats mondial': 'Dividend Aristocrats', 'Euro Dividend Aristocrats': 'Euro Dividend Aristocrats (PEA)', 'PAEEM': 'Émergents global (indice ESG)', 'PAASI': 'Asie émergente' };
  for (const text of family.diversification.chain) {
    const label = text.split(' (')[0];
    const name = aliases[label] ?? label;
    const index = family.indices.find((x) => x.name === name || (label === 'Dividend Aristocrats mondial' && x.name.startsWith('Dividend Aristocrats mondial')))
      ?? FAMILIES.flatMap((f) => f.indices).find((x) => x.name === name);
    const facts = index?.indexFacts;
    if (!facts) continue;
    const count = text.match(/\(~?([\d ]+)/)?.[1];
    if (!count) continue;
    const expected = ['PAEEM', 'PAASI'].includes(label) ? facts.marketCount
      : text.includes('(~') ? facts.approximateConstituents : facts.targetConstituents ?? facts.constituents;
    assert.equal(Number(count.replaceAll(' ', '')), expected, `${label}: chaîne divergente`);
  }
}
for (const [id, history] of Object.entries(INDEX_FACTS)) {
  for (const [date, facts] of Object.entries(history)) {
    assert((facts.source?.url === null || facts.source?.url?.startsWith('https://')) && facts.source.label && facts.provenance, `${id}: provenance absente`);
    assert(facts.constituents === null || (Number.isInteger(facts.constituents) && facts.constituents > 0), `${id}: comptage invalide`);
    assert(['legacy-undated', 'methodology'].includes(date) ? facts.asOf === null : date === facts.asOf && /^\d{4}-\d{2}-\d{2}$/.test(date), `${id}: date incohérente`);
    assert(Object.isFrozen(facts), `${id}: photographie modifiable`);
  }
}
for (const [id, facts] of Object.entries(CURRENT_INDEX_SNAPSHOTS)) {
  const active = JSON.parse(readFileSync('src/data/automated-indices.json'))[id].facts;
  assert.equal(getCurrentIndexFacts(id, facts.asOf), facts, `${id}: observation courante ignorée à date identique`);
  assert.notEqual(facts, getIndexFacts(id, facts.asOf), `${id}: archive modifiée par la façade courante`);
  assert.deepEqual(facts.holdings, active.holdings, `${id}: positions courantes divergentes`);
  assert.equal(facts.source.url, active.source.url, `${id}: provenance courante divergente`);
}
SHEETS.forEach(auditSheet);
FAMILIES.forEach(auditFamily);
for (const index of FAMILIES.flatMap((family) => family.indices)) {
  if (!['Or physique', 'Argent physique', 'Bitcoin', 'Ethereum'].includes(index.name)) assert(index.indexFacts, `${index.name}: photographie commune supprimée`);
}
// Interdire les recopies dans les fiches et les chaînes de diversification partagées.
const sheetsCode = readFileSync(new URL('../src/data/index-factsheets.js', import.meta.url), 'utf8');
assert(!/\b(?:constituents|markets|marketCap|countries|sectors|holdings|topWeight)\s*:/.test(sheetsCode), 'Composition locale réintroduite');
const comparatorCode = readFileSync(new URL('../src/data/index-comparisons.js', import.meta.url), 'utf8');
for (const line of comparatorCode.split('\n').filter((line) => line.includes('chain:'))) {
  assert(!/[A-Za-z][^'`]* \(\d/.test(line) || /Or physique|Argent physique|Bitcoin|Ethereum/.test(line), 'Comptage partagé recopié dans une chaîne');
}
// Vérifier que les gardes rejettent effectivement les régressions, tout en acceptant l'histoire.
assert.throws(() => auditSheet({ ...SHEETS.find((s) => s.id === 'acwi'), constituents: 2461 }), /diverge/);
const world = FAMILIES.find((f) => f.id === 'monde');
assert.throws(() => auditFamily({ ...world, indices: world.indices.map((index) => index.name === 'FTSE All-World' ? { ...index, desc: '4 263 valeurs' } : index) }), /divergente/);
assert.equal(getIndexFacts('topix', '2026-04-30').constituents, 1650);
assert.equal(getIndexFacts('topix', '2026-07-31').constituents, 1637);
assert.equal(getIndexFacts('world', 'legacy-undated').constituents, 1283);
assert.equal(getIndexFacts('msci-world-enhanced-value', '2026-07-31').constituents, 400);
assert.equal(getIndexFacts('msci-world-enhanced-value', 'legacy-undated').constituents, 401);
assert.equal(getIndexFacts('russell-1000', 'methodology').constituents, null);
const usa = FAMILIES.find((f) => f.id === 'usa');
assert.throws(() => auditFamily({ ...usa, diversification: { ...usa.diversification, chain: ['MSCI USA (999)'] } }), /divergente/);
assert.throws(() => getIndexFacts('world', '2026-01-01'), /absente/);
console.log(`Faits d’indices : ${SHEETS.length} fiches, ${FAMILIES.length} familles ; sources, photographies, cohérence et gardes de régression OK.`);
console.log(`31/08/2026 : ACWI ${formatIndexConstituents('acwi', '2026-08-31')}, All-World ${formatIndexConstituents('ftse-all-world', '2026-08-31')}. Historiques conservés.`);
