import { AUTOMATED_ETF, AUTOMATED_PERFORMANCE } from '../src/data/automated-etf.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ETFS } from '../src/data/etf-cards.js';
import { REVIEWED_PERFORMANCE_META } from '../src/data/instrument-performance-review.js';
import { getAnnualPerformance, performanceEntries, formatAnnualPerformance, performanceImageHeading } from '../src/pages/etf-sheets/annualPerformance.js';
import { DATA_CATALOG } from '../src/data/catalog.js';
const capture = JSON.parse(readFileSync(new URL('./source-snapshots/etf-completeness-2026-10-04.json', import.meta.url)));
const today = new Date().toISOString().slice(0, 10);
const unpublished = new Set(capture.unpublished);
// A newly qualified exact-share calendar resolves the archived absence/conflict.
// Its values, currency, URL and verification date are checked against the active record below.
const sourceConflicts = new Set(capture.sourceConflicts.filter(isin => !AUTOMATED_ETF[isin]?.performance));
let annual = 0, other = 0;
for (const etf of ETFS) {
  assert(etf.listing?.ticker && etf.listing.exchange && etf.listing.currency, `${etf.isin}: cotation manquante`);
  for (const key of ['positions', 'distribution', 'location', 'aum', 'ter']) assert(etf[key] && !/non document|inconnu|\bundefined\b|\bNaN\b/i.test(etf[key]), `${etf.isin}: ${key} absent`);
  const series = getAnnualPerformance(etf);
  assert(series, `${etf.isin}: bloc de performance absent`);
  assert.equal(series.values.length, 6);
  assert(series.values.every(v => v === null || Number.isFinite(v)));
  assert(formatAnnualPerformance(series) && performanceImageHeading(series));
  if (series.values.some(Number.isFinite)) annual++;
  else if (series.observations?.length) other++;
  else {
    assert(unpublished.has(etf.isin) || sourceConflicts.has(etf.isin), `${etf.isin}: absence non revue`);
    assert.equal(series.availability, sourceConflicts.has(etf.isin) ? 'source-conflict' : 'not-yet-published');
    assert(series.note && series.source);
  }
  for (const entry of performanceEntries(series)) {
    assert(Number.isFinite(entry.value) && entry.label);
    if (entry.asOf) assert(entry.asOf <= series.checkedAt && entry.asOf <= today, `${etf.isin}: période future`);
  }
  const evidence = capture.performances[etf.isin];
  const automated = AUTOMATED_ETF[etf.isin];
  if (automated?.performance) {
    assert.deepEqual(series.values, AUTOMATED_PERFORMANCE[etf.isin].values);
    assert.equal(series.currency, automated.currency);
    assert.equal(series.source, automated.performance.sourceUrl ?? automated.sourceUrl);
    assert.equal(series.checkedAt, automated.performance.checkedAt);
    assert(series.checkedAt <= today);
  } else if (evidence) {
    assert.deepEqual(series.values, evidence.values, `${etf.isin}: divergence du relevé`);
    assert.equal(series.currency, evidence.currency);
    assert.equal(series.source, evidence.source);
    assert.equal(series.checkedAt, capture.checkedAt);
    assert.match(evidence.documentSha256, /^[a-f0-9]{64}$/);
    assert(evidence.evidenceExcerpt);
    const catalog = DATA_CATALOG.find(r => r.id === etf.isin);
    for (const observation of series.observations ?? []) assert(catalog.fields.some(f => f.label === `Performance ${observation.label}` && f.metadata.asOf === observation.asOf));
    if (REVIEWED_PERFORMANCE_META[etf.isin].portfolioHistoryBasis === 'proxy') assert(catalog.fields.some(f => f.label === 'Historique de simulation 2020–2025'), `${etf.isin}: proxy confondu avec la performance réelle`);
  }
}
// Régressions concrètes : STOXX 50 présent ; aucun historique d’un autre fonds
// attribué aux nouvelles parts World, small cap, QYLD ou PEA Global.
const stoxx = ETFS.find(e => e.isin === 'IE00B53L3W79');
assert.deepEqual(getAnnualPerformance(stoxx).values, [-2.89, 23.98, -9.04, 22.78, 11.54, 21.78]);
for (const isin of ['FR001400U5Q4', 'IE0000N55FP4', 'FR0014017NX3', 'IE00BM8R0J59', ...sourceConflicts]) assert(getAnnualPerformance(ETFS.find(e => e.isin === isin)).values.every(v => v === null));
for (const isin of ['IE00BKPSFC54', 'IE00BMW42413', 'IE00BKPX3K41', 'DE000A27Z304']) assert.equal(getAnnualPerformance(ETFS.find(e => e.isin === isin)).values[0], null, `${isin}: année 2020 incomplète publiée`);
console.log(`${ETFS.length} cotations ; ${annual} historiques annuels, ${other} performances sur périodes datées, ${unpublished.size} parts sans historique publié et ${sourceConflicts.size} conflits de sources explicitement signalés.`);
