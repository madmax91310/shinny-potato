import assert from 'node:assert/strict';
import { DATA_CATALOG } from '../src/data/catalog.js';
import { FAMILIES } from '../src/data/index-comparisons.js';
import { normalizeEvidence } from '../src/data/evidence.js';
import { describeEvidenceDate } from '../src/pages/data-search/lib.js';
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js';
import { ETF_TER_BY_ISIN } from '../src/data/etf-ter.js';
import { OFFICIAL_AUM_OBSERVATIONS } from '../src/data/instrument-aum-observations.js';
import { REVIEWED_INDEX_SNAPSHOTS } from '../src/data/index-source-review.js';
import { VERIFIED_RETURNS } from '../src/data/verified-returns.js';
import { ARCHIVE_SOURCE_REVIEW } from '../src/data/archive-source-review.js';
import { INDEX_FACTS } from '../src/data/index-facts.js';

const unresolved = DATA_CATALOG.flatMap(r => r.fields.filter(f => !f.metadata.sourceUrls.length).map(f => ({ id: r.id, field: f })));
assert.equal(unresolved.length, 18, 'Reliquat sans URL modifié : une nouvelle preuve doit être revue explicitement');
assert.equal(ARCHIVE_SOURCE_REVIEW.length, 19);
for (const { id, field } of unresolved) {
  const review = ARCHIVE_SOURCE_REVIEW.find(r => r.id === id && (r.key ? field.value === INDEX_FACTS[id][r.key] : true));
  assert(review, `${id}: nouvelle absence de source sans revue individuelle`);
  assert.equal(field.metadata.sourceStatus, 'archive-unverifiable');
  assert.equal(field.metadata.sourceReason, review.sourceReason);
  assert.equal(field.metadata.reviewedAt, '2026-09-30');
  assert.equal(field.metadata.checkedAt, null, `${id}: revue transformée en certification`);
}
for (const family of FAMILIES) for (const index of family.indices) if (index.indexFacts) {
  assert.notEqual(index.indexFacts.metadata.sourceStatus, 'archive-unverifiable', `${index.name}: archive non vérifiable devenue active`);
}
const february = INDEX_FACTS['ftse-all-world-high-dividend-yield']['2026-02-27'];
assert.equal(february.constituents, 2397);
assert.equal(february.metadata.asOf, '2026-02-27');
assert.equal(february.metadata.sourceStatus, 'documented');
assert.match(february.metadata.sourceReason, /Source secondaire/);
assert.throws(() => normalizeEvidence({ sourceStatus: 'archive-unverifiable', reviewedAt: '2026-09-30' }), /raison/);
assert.throws(() => normalizeEvidence({ sourceStatus: 'archive-unverifiable', sourceReason: 'Document absent', reviewedAt: '2026-09-30', checkedAt: '2026-09-30' }), /aucun contrôle/);
assert.match(describeEvidenceDate(INDEX_FACTS['msci-japan-imi']['2026-05-31'].metadata), /date héritée non recertifiée/);

for (const isin of Object.keys(INSTRUMENTS_BY_ISIN)) {
  const record = DATA_CATALOG.find(r => r.id === isin);
  for (const field of record.fields.filter(f => ['Identité', 'Frais annuels (%)', 'Rendements 2020–2025', 'Rendements 2023–2025 du comparateur'].includes(f.label))) {
    assert(field.metadata.sourceUrls.length, `${isin}/${field.label}: source individuelle supprimée`);
    if (field.label === 'Identité' || field.label.startsWith('Frais')) assert.equal(field.metadata.checkedAt, '2026-09-30');
    if (field.label.startsWith('Rendements')) assert.equal(field.metadata.periodEnd, '2025-12-31');
  }
  if (VERIFIED_RETURNS[isin]) assert.deepEqual(record.fields.find(f => f.label === 'Rendements 2020–2025').value, VERIFIED_RETURNS[isin].values, `${isin}: catalogue différent de la série réellement consommée`);
}
for (const family of FAMILIES) for (const index of family.indices) if (index.indexFacts) {
  assert(index.indexFacts.metadata.sourceUrls.length, `${index.name}: indice actif sans source`);
  assert.equal(index.indexFacts.metadata.checkedAt, '2026-09-30', `${index.name}: indice actif non contrôlé`);
}
for (const [isin, observation] of Object.entries(OFFICIAL_AUM_OBSERVATIONS)) {
  assert(observation.amountMillions > 0 && ['EUR', 'USD'].includes(observation.currency));
  const fields = DATA_CATALOG.find(r => r.id === isin).fields;
  assert.equal(fields.find(f => f.label === 'Encours daté publié par l’émetteur').metadata.asOf, observation.asOf);
  // Une nouvelle observation ne doit jamais dater rétroactivement l’encours justETF.
  if (isin !== 'IE000DQLYVB9') assert.equal(fields.find(f => f.label === 'Encours').metadata.asOf, null);
}
for (const series of DATA_CATALOG.filter(r => r.type === 'series')) {
  const f = series.fields[0];
  assert.equal(f.metadata.periodStart, f.value.points[0].date);
  assert.equal(f.metadata.periodEnd, f.value.points.at(-1).date);
  assert.equal(f.metadata.dateStatus, 'month-only');
}
assert.equal(ETF_TER_BY_ISIN.IE00B52SFT06, '0,03');
assert.equal(ETF_TER_BY_ISIN.IE00BP3QZ825, '0,25');
assert.equal(REVIEWED_INDEX_SNAPSHOTS['msci-em-latin-america-selection']['2026-08-31'].constituents, 41);
assert.equal(FAMILIES.find(f => f.id === 'style').perfMethodNote.includes('Value et Quality'), true);
assert.throws(() => normalizeEvidence({ dateStatus: 'dated' }), /incompatible/);
assert.throws(() => normalizeEvidence({ dateStatus: 'not-published', asOf: '2026-09-30' }), /incompatible/);
assert.match(describeEvidenceDate(normalizeEvidence({ dateStatus: 'not-published' })), /non publiée/);
assert.equal(normalizeEvidence({ checkedAt: '2026-09-30', dateStatus: 'not-published' }).asOf, null);
console.log('Provenance : sources individuelles, indices actifs contrôlés, périodes, encours datés distincts et absence de dates fabriquées OK.');
