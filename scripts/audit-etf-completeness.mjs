import { AUTOMATED_ETF, AUTOMATED_PERFORMANCE } from '../src/data/automated-etf.js';
import monthlyRecords from '../src/data/automated-etf-monthly.json' with {type:'json'};
import otherMonthlyRecords from '../src/data/non-bond-monthly-records.json' with {type:'json'};
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ETFS } from '../src/data/etf-cards.js';
import { REVIEWED_PERFORMANCE_META } from '../src/data/instrument-performance-review.js';
import { getAnnualPerformance, performanceEntries, formatAnnualPerformance, performanceImageHeading } from '../src/pages/etf-sheets/annualPerformance.js';
import { DATA_CATALOG } from '../src/data/catalog.js';
import { ROUTING_PRESENTATION_FACTS } from '../src/data/routing-presentation-facts.js';
import { getPreferredInstrumentListing } from '../src/data/instrument-listings.js';
import { getInstrumentFacts } from '../src/data/instrument-facts.js';
const capture = JSON.parse(readFileSync(new URL('./source-snapshots/etf-completeness-2026-10-04.json', import.meta.url)));
const rollingReview = JSON.parse(readFileSync(new URL('./source-snapshots/live-data-connections-2026-10-20.json', import.meta.url))).rollingPerformanceReview;
const qyld = REVIEWED_PERFORMANCE_META.IE00BM8R0J59;
assert.equal(qyld.qualificationHold.sourceUrl, rollingReview.url);
assert.equal(qyld.qualificationHold.sha256, rollingReview.sha256);
assert.equal(qyld.qualificationHold.checkedAt, rollingReview.checkedAt);
assert.deepEqual(qyld.archivedObservations, capture.performances.IE00BM8R0J59.observations, 'Les valeurs du relevé initial restent intactes en archive');
assert(!qyld.observations?.length, 'Le relevé non recertifié ne devient pas un rendement courant');
const today = new Date().toISOString().slice(0, 10);
const unpublished = new Set(capture.unpublished);
// A newly qualified exact-share calendar resolves the archived absence/conflict.
// Its values, currency, URL and verification date are checked against the active record below.
const sourceConflicts = new Set(capture.sourceConflicts.filter(isin => !AUTOMATED_ETF[isin]?.performance));
let annual = 0, other = 0, withoutPublishedPerformance = 0;
for (const etf of ETFS) {
  const observed = ROUTING_PRESENTATION_FACTS[etf.isin];
  const facts = observed && getInstrumentFacts(etf.isin);
  // Routing-only presentations can omit unobserved structure/listings. Existing
  // complete cards keep their strict contract; missing facts must never be inferred.
  if (!observed || etf.listing) assert(etf.listing?.ticker && etf.listing.exchange && etf.listing.currency, `${etf.isin}: cotation manquante`);
  if (observed) {
    assert(etf.presentationOnly, `${etf.isin}: incomplete structure cannot enter automatic portfolios`);
    assert.deepEqual(etf.listing, getPreferredInstrumentListing(etf.isin));
    assert.equal(etf.distribution, facts.distribution);
    assert.equal(etf.location, facts.location);
    assert(observed.characteristicsSource.url && observed.characteristicsSource.checkedAt <= today);
  }
  for (const key of ['positions', 'distribution', 'location', 'aum', 'ter']) {
    if (observed && ['distribution','location'].includes(key) && facts[key] === null) continue;
    assert(etf[key] && !/non document|inconnu|\bundefined\b|\bNaN\b/i.test(etf[key]), `${etf.isin}: ${key} absent`);
  }
  const series = getAnnualPerformance(etf);
  if (observed && !series) {
    assert(!AUTOMATED_ETF[etf.isin]?.performance && !capture.performances[etf.isin], `${etf.isin}: observed performance must not be dropped`);
    withoutPublishedPerformance++;
    continue;
  }
  assert(series, `${etf.isin}: bloc de performance absent`);
  assert.equal(series.values.length, 6);
  assert(series.values.every(v => v === null || Number.isFinite(v)));
  assert(formatAnnualPerformance(series) && performanceImageHeading(series));
  if (series.values.some(Number.isFinite)) annual++;
  else if (series.observations?.length) other++;
  else {
    const reviewedHold = etf.isin === 'IE00BM8R0J59';
    assert(unpublished.has(etf.isin) || sourceConflicts.has(etf.isin) || reviewedHold, `${etf.isin}: absence non revue`);
    assert.equal(series.availability, reviewedHold ? 'not-published' : sourceConflicts.has(etf.isin) ? 'source-conflict' : 'not-yet-published');
    assert(series.note && series.source);
  }
  for (const entry of performanceEntries(series)) {
    assert(Number.isFinite(entry.value) && entry.label);
    if (entry.asOf) assert(entry.asOf <= series.checkedAt && entry.asOf <= today, `${etf.isin}: période future`);
  }
  const evidence = capture.performances[etf.isin];
  const automated = AUTOMATED_ETF[etf.isin];
  if(series.sourceKind==='adjusted-market-price') {
    const source=Object.values({...monthlyRecords,...otherMonthlyRecords}).find(r=>r.isin===etf.isin&&r.listingEvidenceId===series.listingEvidenceId&&r.currency===series.currency);
    assert(source&&source.field==='adjclose'&&source.responseSha256===series.responseSha256,`${etf.isin}: exact adjusted-price source required`);
    assert(!AUTOMATED_PERFORMANCE[etf.isin]?.values.some(Number.isFinite),'Published NAV must retain precedence');
    const points=new Map(source.points);
    for(const [index,year]of series.calendarYears.entries())if(Number.isFinite(series.values[index])) {
      const months=[`${year-1}-12`,...Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`)];
      assert(months.every(month=>Number.isFinite(points.get(month))&&points.get(month)>0));
      assert.equal(series.values[index],(points.get(`${year}-12`)/points.get(`${year-1}-12`)-1)*100);
    }
  } else if (automated?.performance) {
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
assert.deepEqual(getAnnualPerformance(stoxx).values, AUTOMATED_PERFORMANCE[stoxx.isin].values);
for (const isin of ['FR001400U5Q4', 'IE0000N55FP4', 'FR0014017NX3', 'IE00BM8R0J59', ...sourceConflicts]) {
 const series=getAnnualPerformance(ETFS.find(e=>e.isin===isin));
 if(series.sourceKind==='adjusted-market-price')assert(series.listingEvidenceId.startsWith(isin+'-'));
 else if(!AUTOMATED_PERFORMANCE[isin]?.values.some(Number.isFinite))assert(series.values.every(v=>v===null));
}
for (const isin of ['IE00BKPSFC54', 'IE00BMW42413', 'IE00BKPX3K41', 'DE000A27Z304']) {
 const series=getAnnualPerformance(ETFS.find(e=>e.isin===isin)),index=series.calendarYears.indexOf(2020);
 if(index>=0)assert.equal(series.values[index], null, `${isin}: année 2020 incomplète publiée`);
}
console.log(`${ETFS.length} présentations ; ${annual} historiques annuels, ${other} performances sur périodes datées, ${withoutPublishedPerformance} nouvelles fiches sans performance publiée, ${unpublished.size} parts sans historique publié et ${sourceConflicts.size} conflits de sources explicitement signalés.`);
