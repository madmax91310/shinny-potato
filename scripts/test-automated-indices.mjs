import assert from 'node:assert/strict';
import { AUTOMATED_INDICES } from '../src/data/automated-indices.js';
import { INDEX_FACTS, getIndexFacts, getCurrentIndexFacts } from '../src/data/index-facts.js';
import { INDEX_RETURNS, getCurrentIndexReturnSeries } from '../src/data/index-returns.js';
import { AUTOMATED_ETF, refreshFundDetails } from '../src/data/automated-etf.js';
import { SHEETS } from '../src/data/index-factsheets.js';
for (const [id, record] of Object.entries(AUTOMATED_INDICES)) {
  if (record.facts && INDEX_FACTS[id]) {
    const dates = Object.keys(INDEX_FACTS[id]).filter(d => /^\d{4}-/.test(d)).sort();
    const fallback = dates[0];
    const current = getCurrentIndexFacts(id, fallback);
    assert.equal(current.asOf, dates.at(-1), `${id}: current date regressed`);
    assert(current.source.url.startsWith('https://'));
    assert(Object.isFrozen(getIndexFacts(id, fallback)));
  }
  if (record.returns && INDEX_RETURNS[id]) {
    for (const [date, archive] of Object.entries(INDEX_RETURNS[id])) {
      const current = getCurrentIndexReturnSeries(id, date);
      assert.equal(current.metadata.currency, archive.metadata.currency);
      if (current !== archive) {
        assert.equal(current.source.url, record.returns.source.url);
        assert.equal(current.metadata.checkedAt, record.returns.source.checkedAt);
        assert.deepEqual(current.values, record.returns.values.filter(([year]) => archive.values.some(([archivedYear]) => archivedYear === year)));
      }
    }
  }
}
const baseline = getIndexFacts('world','2026-08-31');
assert.equal(baseline.asOf,'2026-08-31');
for (const sheet of SHEETS) {
  assert(sheet.source.some(s => s.url === sheet.indexFacts.source.url));
  assert(sheet.returns.every(([year,value]) => year <= 2025 && Number.isFinite(value)));
}
for (const [isin, r] of Object.entries(AUTOMATED_ETF)) {
  if (r.holdings?.basis === 'index') {
    const refreshed=refreshFundDetails(isin);
    assert.equal(refreshed.basis,'tracked-index');
    assert.equal(refreshed.holdingsSource,r.holdings.sourceUrl);
    assert.equal(refreshed.holdingsAsOf,r.holdings.asOf);
  }
}
console.log('Current index data, immutable historical snapshots, compatible return conventions and synthetic exposures verified.');
