import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { DATA_CATALOG, searchData, exportDataRecord } from '../src/data/catalog.js';
import { normalizeEvidence, EVIDENCE_FIELDS } from '../src/data/evidence.js';
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js';
import { INSTRUMENT_LISTINGS_BY_ISIN } from '../src/data/instrument-listings.js';
import { INDEX_FACTS } from '../src/data/index-facts.js';
import { INDEX_RETURNS } from '../src/data/index-returns.js';
import { TOOLS } from '../src/tools.js';
const ids = new Set();
for (const file of readdirSync(new URL('../src/data/', import.meta.url)).filter((name) => name.endsWith('.js'))) {
  assert(!/from ['"].*pages\//.test(readFileSync(new URL(`../src/data/${file}`, import.meta.url), 'utf8')), `${file}: dépendance aux pages réintroduite`);
}
for (const record of DATA_CATALOG) {
  assert(!ids.has(record.id), `Identifiant dupliqué : ${record.id}`); ids.add(record.id);
  assert(record.name && record.fields.length, `${record.id}: fiche incomplète`);
  for (const consumer of record.consumers) assert(TOOLS.some((t) => t.to === consumer.path), `${record.id}: consommateur orphelin`);
  for (const field of record.fields) {
    assert(existsSync(new URL(`../${field.registry}`, import.meta.url)), `${record.id}: registre absent`);
    assert.deepEqual(Object.keys(field.metadata), EVIDENCE_FIELDS, `${record.id}: contrat de provenance divergent`);
    assert(field.metadata.scope, `${record.id}: périmètre absent`);
    for (const key of ['asOf', 'checkedAt']) assert(field.metadata[key] === null || /^\d{4}-\d{2}-\d{2}$/.test(field.metadata[key]), `${record.id}: date invalide`);
    assert(field.metadata.sourceUrls.every((url) => url.startsWith('https://')), `${record.id}: URL invalide`);
  }
  assert.equal(JSON.parse(exportDataRecord(record)).id, record.id);
}
for (const isin of Object.keys(INSTRUMENTS_BY_ISIN)) assert(ids.has(isin), `Instrument manquant : ${isin}`);
for (const id of Object.keys(INDEX_FACTS)) assert(ids.has(id), `Indice manquant : ${id}`);
for (const [isin, listings] of Object.entries(INSTRUMENT_LISTINGS_BY_ISIN)) {
  for (const listing of listings) assert(searchData(listing.ticker).some((r) => r.id === isin), `Ticker introuvable : ${isin}/${listing.ticker}`);
}
assert.equal(searchData('FR001400U5Q4')[0].id, 'FR001400U5Q4');
assert(searchData('DCAM').some((r) => r.id === 'FR001400U5Q4'));
assert(searchData('msci-usa', 'index').some((r) => r.id === 'msci-usa'));
assert(searchData('emergents').length > 0, 'Recherche sans accents absente');
assert.equal(searchData('zzzintrouvablezzz').length, 0);
assert(searchData('world', 'index').every((r) => r.type === 'index'));
const aum = searchData('FR001400U5Q4')[0].fields.find((f) => f.label === 'Encours');
assert.equal(aum.metadata.asOf, null, 'Une consultation a été transformée en photographie');
assert.equal(aum.metadata.checkedAt, '2026-09-29');
assert.equal(normalizeEvidence({ checkedAt: '2026-09-30' }).asOf, null);
assert.throws(() => normalizeEvidence({ asOf: '30/09/2026' }), /invalide/);
assert.throws(() => normalizeEvidence({ url: 'invented-source' }), /invalide/);
for (const [id, history] of Object.entries(INDEX_RETURNS)) for (const [date, series] of Object.entries(history)) {
  assert(INDEX_FACTS[id]?.[date], `${id}: rendements sans photographie`);
  assert(series.values.every(([year, value]) => year >= 2021 && year <= 2025 && Number.isFinite(value)), `${id}: série invalide`);
  assert.equal(series.metadata.asOf, date);
}
console.log(`${DATA_CATALOG.length} fiches recherchables ; couverture des instruments/indices/cotations, provenance, consommateurs et export JSON OK.`);
