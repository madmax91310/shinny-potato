import { PROPERTY_INFRA_RETURNS } from '../src/data/property-infrastructure-additions.js';
import { WORLD_FACTOR_RETURNS } from '../src/data/world-factor-additions.js';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { DATA_CATALOG, searchData, exportDataRecord } from '../src/data/catalog.js';
import { normalizeEvidence, EVIDENCE_FIELDS } from '../src/data/evidence.js';
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js';
import { INSTRUMENT_LISTINGS_BY_ISIN } from '../src/data/instrument-listings.js';
import { INDEX_FACTS } from '../src/data/index-facts.js';
import { INDEX_COMPARISON_RETURN_ADDITIONS } from '../src/data/index-comparison-return-additions.js';
import { INDEX_RETURNS } from '../src/data/index-returns.js';
import { describeDataField } from '../src/pages/data-search/lib.js';
import { getRestoredRoute } from '../src/restore-route.js';
import { maintenanceLinks } from '../src/data/maintenance-links.js';
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
    assert.equal(typeof describeDataField(field), 'string', `${record.id}: résumé impossible à afficher`);
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
assert(describeDataField({ label: 'Rendements 2020–2025', value: [1, 2, 3, 4, 5, 6] }).includes('2020 : +1'));
assert(describeDataField({ label: 'Rendements d’indice', value: { values: [[2025, 4]] } }).includes('2025 : +4'));
assert.equal(normalizeEvidence({ checkedAt: '2026-09-30' }).asOf, null);
assert.throws(() => normalizeEvidence({ asOf: '30/09/2026' }), /invalide/);
assert.throws(() => normalizeEvidence({ url: 'invented-source' }), /invalide/);
for (const [id, history] of Object.entries(INDEX_RETURNS)) for (const [date, series] of Object.entries(history)) {
  const factorSeries = WORLD_FACTOR_RETURNS[id]?.[date];
  const propertyInfraSeries = PROPERTY_INFRA_RETURNS[id]?.[date];
  const independent = INDEX_COMPARISON_RETURN_ADDITIONS[id]?.[date] ?? factorSeries ?? propertyInfraSeries;
  assert(INDEX_FACTS[id]?.[date] || independent === series, `${id}: série sans photographie ni preuve indépendante`);
  if (independent) {
    assert.equal(series.metadata.periodEnd, '2025-12-31');
    assert.equal(series.metadata.periodStart, factorSeries || propertyInfraSeries ? '2021-01-01' : '2023-01-01');
    assert(series.metadata.sourceUrls.length && series.metadata.checkedAt, `${id}: source indépendante non datée`);
    assert(DATA_CATALOG.some(record => record.fields.some(field => field.value === series)), `${id}: série absente du catalogue`);
  }
  assert(series.values.every(([year, value]) => year >= 2021 && year <= 2025 && (Number.isFinite(value) || (independent && value === null && !series.currency))), `${id}: série invalide`);
  assert.equal(series.metadata.asOf, date);
}
console.log(`${DATA_CATALOG.length} fiches recherchables ; couverture des instruments/indices/cotations, provenance, consommateurs et export JSON OK.`);

const route = '/shinny-potato/bibliotheque-donnees?q=DCAM&type=instrument&id=FR001400U5Q4';
assert.equal(getRestoredRoute(`https://example.com/shinny-potato/?__route=${encodeURIComponent(route)}`, '/shinny-potato/'), route);
assert.equal(getRestoredRoute('https://example.com/shinny-potato/?__route=https%3A%2F%2Fevil.example%2F', '/shinny-potato/'), null);
assert.equal(getRestoredRoute('https://example.com/shinny-potato/?__route=%2Fautre%2F', '/shinny-potato/'), null);

// Un raccourci de maintenance ne réécrit ni une preuve ni une valeur historique.
const beforeMaintenance = JSON.stringify(DATA_CATALOG);
let maintenanceFields = 0;
for (const record of DATA_CATALOG) for (const field of record.fields) {
  const links = maintenanceLinks(record, field);
  if (field.metadata.sourceStatus === 'archive-unverifiable') {
    assert.equal(links.length, 0, 'Une archive ne doit pas paraître recertifiée');
    continue;
  }
  if (record.consumers.length && field.metadata.sourceUrls.length) {
    assert(links.length, `${record.id}/${field.label}: accès de maintenance absent`);
    maintenanceFields++;
  }
  assert.equal(new Set(links.map(x => x.url)).size, links.length);
  assert(links.every(x => new URL(x.url).protocol === 'https:'));
}
const dcam = DATA_CATALOG.find(r => r.id === 'FR001400U5Q4');
const peaField = dcam.fields.find(f => f.label === 'Éligibilité PEA');
const dcamLinks = maintenanceLinks(dcam, peaField);
const searchLink = dcamLinks.find(x => x.kind === 'search');
assert(searchLink, 'Le PDF Amundi daté doit proposer une recherche explicite');
assert.equal(new URL(searchLink.url).searchParams.get('q'), 'site:www.amundietf.fr FR001400U5Q4 fiche mensuelle');
assert(dcamLinks.some(x => x.kind === 'profile' && x.url.includes('isin=FR001400U5Q4')));
const monthly = DATA_CATALOG.find(r => r.id === 'history:cac40');
const monthlyLinks = maintenanceLinks(monthly, monthly.fields[0]);
assert.equal(monthlyLinks.filter(x => x.url.includes('/quote/')).length, 1, 'Requêtes journalière et mensuelle dédoublonnées');
assert(monthlyLinks.some(x => x.url === 'https://finance.yahoo.com/quote/%5EFCHI/history/'));
assert.equal(JSON.stringify(DATA_CATALOG), beforeMaintenance);
console.log(`${maintenanceFields} champs actifs avec accès de consultation ; preuves historiques et archives inchangées.`);
