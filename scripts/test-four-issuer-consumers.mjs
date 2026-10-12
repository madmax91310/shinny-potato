import assert from 'node:assert/strict';
import { AUTOMATED_ETF, AUTOMATED_PERFORMANCE, refreshFundDetails } from '../src/data/automated-etf.js';
import { ETFS } from '../src/data/etf-cards.js';
import { getInstrumentAum } from '../src/data/instrument-aum.js';
import { getInstrumentAnnualPerformance, getInstrumentDuelSeries } from '../src/data/instrument-returns.js';
import { getAnnualPerformance } from '../src/pages/etf-sheets/annualPerformance.js';

for (const isin of ['IE000RDRMSD1', 'IE00B3F81R35', 'GB00BLD4ZL17', 'GB00BLD4ZM24']) {
  const record = AUTOMATED_ETF[isin];
  const card = ETFS.find(c => c.isin === isin);
  assert(card && record.aum.amount > 0);
  assert.equal(card.aum, getInstrumentAum(isin, 'sheet'));
  const series = AUTOMATED_PERFORMANCE[isin];
  for (const actual of [getAnnualPerformance(card), getInstrumentAnnualPerformance(isin), getInstrumentDuelSeries(isin)]) {
    assert.equal(actual.currency, record.currency);
    assert.deepEqual(actual.years, record.performance.years);
    assert.equal(actual.source, record.performance.sourceUrl ?? record.sourceUrl);
  }
  assert.deepEqual(series.values, series.calendarYears.map(y => record.performance.years[y] ?? null));
  const details = refreshFundDetails(isin);
  for (const field of ['countries', 'sectors']) {
    if (!record[field]) continue;
    assert.deepEqual(details[field].map(r => r[1]), record[field].rows.map(r => r.weightPct));
    assert.equal(details[field + 'AsOf'], record[field].asOf);
  }
}
console.log('Four recovered issuers: presentation AUM, annual performances, comparison/duel series and signed details share the validated registry.');
