import { PRESENTATION_ETF_EXPANSION } from '../src/data/presentation-etf-expansion.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESENTATION_ETF_ADDITIONS } from '../src/data/presentation-etf-additions.js';
import { ETFS } from '../src/data/etf-cards.js';
import { ASSETS } from '../src/data/portfolio-assets.js';
import { AUTOMATED_ETF, buildAnnualPerformance } from '../src/data/automated-etf.js';
import { getAnnualPerformance, performanceEntries } from '../src/pages/etf-sheets/annualPerformance.js';
import { getETFArt } from '../src/pages/etf-sheets/visualIdentity.js';
const config = [...JSON.parse(readFileSync(new URL('./additional-etf-sources.json', import.meta.url))).instruments, ...JSON.parse(readFileSync(new URL('./etf-pilot.json', import.meta.url))).instruments.map(s => ({...s, enabled:true, required:true}))];
const marketCalendars=JSON.parse(readFileSync(new URL('../src/data/monthly-duel-returns.json',import.meta.url)));
assert.equal(PRESENTATION_ETF_ADDITIONS.length, 11);
for (const r of PRESENTATION_ETF_ADDITIONS.filter(r=>!r.reviewedAt)) {
  const card = ETFS.find(c => c.isin === r.isin);
  const record = AUTOMATED_ETF[r.isin];
  assert(getETFArt(card.id));
  assert.equal(card.presentationOnly, !r.portfolioEnabled);
  const asset = ASSETS.find(a => a.isin === r.isin);
  if (r.portfolioEnabled) { assert(asset); assert.equal(asset.r.length, 6); assert(asset.r.every(Number.isFinite)); }
  else if(asset) { assert(asset.distinctCandidate); assert(Object.values(asset.calendarReturns).filter(Number.isFinite).length>=3); assert.match(asset.confidenceNote,/marché/); } // Recent exact-share market histories may serve manual portfolios, independently of NAV presentation history.
  assert(config.some(s => s.isin === r.isin && s.enabled && s.required));
  assert(record.aum.amount > 0 && record.aum.asOf && record.aum.checkedAt);
  assert(Number.isFinite(record.characteristics.terPct));
  for (const field of ['holdings', 'countries', 'sectors']) assert(record[field].rows.length && record[field].asOf);
  const series = getAnnualPerformance(card);
  assert.equal(series.currency, series.sourceKind==='adjusted-market-price'?marketCalendars[r.isin].currency:'USD');
  assert.equal(series.values.length, 6);
  assert(performanceEntries(series).length);
  if (series.sourceKind==='adjusted-market-price') {
    assert(series.values.some(Number.isFinite));
    assert.deepEqual(series.values,series.calendarYears.map(y=>marketCalendars[r.isin].years[y]??null));
    assert.match(series.note,/diffèrent du calendrier NAV/);
    assert.equal(record.performance.years&&Object.keys(record.performance.years).length,0,'No market return written into official NAV observations');
  } else {
    assert.deepEqual(series.values, series.calendarYears.map(y => record.performance.years[y] ?? null));
    assert(series.calendarYears.at(-1) < new Date().getUTCFullYear());
    const future = structuredClone(record);
    future.performance.years['2026'] = 10;
    const next = buildAnnualPerformance(future, new Date('2027-02-01T00:00:00Z'));
    assert.equal(next.calendarYears.at(-1), 2026);
    assert.equal(next.values.at(-1), 10);
  }
}
assert.equal(AUTOMATED_ETF.IE0003UVYC20.performance.years['2023'], undefined, 'Partial launch year stays excluded');
console.log('Seven exact shares: active collectors, automated fields, cumulative/calendar separation, future rollover and presentation-only scope OK.');

const amundi = JSON.parse(readFileSync(new URL('./amundi-etf.json', import.meta.url))).instruments;
for (const r of PRESENTATION_ETF_EXPANSION) {
  const card = ETFS.find(c => c.isin === r.isin);
  const record = AUTOMATED_ETF[r.isin];
  assert(amundi.some(s => s.isin === r.isin && s.collectComposition));
  assert.equal(card.presentationOnly, !r.portfolioEnabled);
  assert(card.pea === true && card.listing && getETFArt(card.id));
  if (r.portfolioEnabled) assert(ASSETS.find(a=>a.isin===r.isin)?.r.every(Number.isFinite));
  assert(record.aum.amount > 0 && Number.isFinite(record.characteristics.terPct));
  const series = getAnnualPerformance(card);
  assert.equal(series.currency, 'EUR');
  assert(series.values.some(Number.isFinite));
  assert.deepEqual(series.values, series.calendarYears.map(y => record.performance.years[y] ?? null));
}
console.log('Five PEA presentations: existing automated collectors, exact-share EUR performances, listing and visual identity OK.');

// New cards retain actual short histories and explicitly unavailable country data.
for (const r of PRESENTATION_ETF_ADDITIONS.filter(r=>r.reviewedAt)) {
 const card=ETFS.find(c=>c.isin===r.isin),record=AUTOMATED_ETF[r.isin];
 assert.equal(card.presentationOnly, !r.portfolioEnabled);
 assert(card.listing && getETFArt(card.id));
 if(r.portfolioEnabled) assert(ASSETS.find(a=>a.isin===r.isin)?.r.every(Number.isFinite));
 else {const asset=ASSETS.find(a=>a.isin===r.isin);if(asset){assert(asset.distinctCandidate && asset.manualOnly);assert(Object.values(asset.calendarReturns).filter(Number.isFinite).length>=3);assert.match(asset.confidenceNote,/marché/);}}
 assert.equal(card.lastVerified,'15/10/2026');
 assert.equal(card.distribution,r.distribution);
 const series=getAnnualPerformance(card);
 assert.equal(series.currency,series.sourceKind==='adjusted-market-price'?marketCalendars[r.isin].currency:record.performance.currency);
 assert(performanceEntries(series).length);
 for(const field of ['holdings','countries','sectors']) {
  if(record[field]) assert(record[field].rows.length && record[field].asOf);
  else assert.equal(record.fieldQualification[field].status,'not-published');
 }
 if(r.isin==='IE0003R87OG3'&&series.sourceKind==='adjusted-market-price') {
  assert(series.values.some(Number.isFinite));
  assert.deepEqual(series.values,series.calendarYears.map(y=>marketCalendars[r.isin].years[y]??null));
  assert.equal(Object.keys(record.performance.years).length,0);
 }
}
console.log('Four additional cards: issuer facts, exact listings and short/missing histories preserved.');
