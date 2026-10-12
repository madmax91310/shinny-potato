import { PRESENTATION_ETF_EXPANSION } from '../src/data/presentation-etf-expansion.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESENTATION_ETF_ADDITIONS } from '../src/data/presentation-etf-additions.js';
import { ETFS } from '../src/data/etf-cards.js';
import { ASSETS } from '../src/data/portfolio-assets.js';
import { AUTOMATED_ETF, buildAnnualPerformance } from '../src/data/automated-etf.js';
import { getAnnualPerformance, performanceEntries } from '../src/pages/etf-sheets/annualPerformance.js';
import { getETFArt } from '../src/pages/etf-sheets/visualIdentity.js';
const config = JSON.parse(readFileSync(new URL('./additional-etf-sources.json', import.meta.url))).instruments;
assert.equal(PRESENTATION_ETF_ADDITIONS.length, 6);
for (const r of PRESENTATION_ETF_ADDITIONS) {
  const card = ETFS.find(c => c.isin === r.isin);
  const record = AUTOMATED_ETF[r.isin];
  assert(card.presentationOnly && getETFArt(card.id));
  assert(!ASSETS.some(a => a.isin === r.isin));
  assert(config.some(s => s.isin === r.isin && s.enabled && s.required));
  assert(record.aum.amount > 0 && record.aum.asOf && record.aum.checkedAt);
  assert(Number.isFinite(record.characteristics.terPct));
  for (const field of ['holdings', 'countries', 'sectors']) assert(record[field].rows.length && record[field].asOf);
  const series = getAnnualPerformance(card);
  assert.equal(series.currency, 'USD');
  assert.equal(series.values.length, 6);
  assert(performanceEntries(series).length);
  if (r.isin === 'IE0003Z9E2Y3') {
    assert(series.values.every(v => v === null));
    assert.equal(performanceEntries(series)[0].label, '1 mois');
    assert.deepEqual(performanceEntries(series), record.performance.observations);
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
console.log('Six exact shares: active collectors, automated fields, cumulative/calendar separation, future rollover and presentation-only scope OK.');

const amundi = JSON.parse(readFileSync(new URL('./amundi-etf.json', import.meta.url))).instruments;
for (const r of PRESENTATION_ETF_EXPANSION) {
  const card = ETFS.find(c => c.isin === r.isin);
  const record = AUTOMATED_ETF[r.isin];
  assert(amundi.some(s => s.isin === r.isin && s.collectComposition));
  assert(card.presentationOnly && card.pea === true && card.listing && getETFArt(card.id));
  assert(record.aum.amount > 0 && Number.isFinite(record.characteristics.terPct));
  const series = getAnnualPerformance(card);
  assert.equal(series.currency, 'EUR');
  assert(series.values.some(Number.isFinite));
  assert.deepEqual(series.values, series.calendarYears.map(y => record.performance.years[y] ?? null));
}
console.log('Three PEA presentations: existing automated collectors, exact-share EUR performances, listing and visual identity OK.');
