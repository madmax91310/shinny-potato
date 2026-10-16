import './test-automated-characteristics.mjs';
import assert from 'node:assert/strict';
import { AUTOMATED_ETF, AUTOMATED_PERFORMANCE } from '../src/data/automated-etf.js';
import { DATA_CATALOG } from '../src/data/catalog.js';
import { ETF_TER_BY_ISIN } from '../src/data/etf-ter.js';
import { ASSETS } from '../src/data/market-history.js';
import { buildGapInventory } from './automation-gap-inventory.mjs';
const ids = { IE00B4556L06:'etcPalladium', IE00B4LHWP62:'etcPlatinum', IE000UL6CLP7:'etfSilverMiners', IE0003R87OG3:'etfAvantisSmallValue' };
for (const [isin,history] of Object.entries(ids)) {
  const r = AUTOMATED_ETF[isin];
  assert(r?.aum?.amount > 0 && r.aum.asOf && r.aum.checkedAt, `${isin}: dated, validated fund assets`);
  assert.equal(r.aum.currency, 'USD');
  assert.equal(r.aum.scope, 'fund');
  const entry = DATA_CATALOG.find(r => r.id === isin);
  assert(entry?.fields.some(f => f.registry === 'src/data/etf-ter.js' && f.value === ETF_TER_BY_ISIN[isin]));
  assert(entry.fields.some(f => f.label === 'Encours' && f.metadata.asOf === r.aum.asOf));
  assert(ASSETS[history]?.points.length > 12, `${isin}: existing history still connected`);
}
assert.equal(ASSETS.etfAvantisSmallValue.currency, 'EUR');
assert.equal(AUTOMATED_PERFORMANCE.IE0003R87OG3.currency, 'USD');
for (const isin of ['IE000UL6CLP7','IE0003R87OG3']) {
  const performance = AUTOMATED_PERFORMANCE[isin];
  assert(performance.values.every(v => v === null), 'Rolling returns never become calendar years');
  assert(performance.observations.length >= 3);
  assert(DATA_CATALOG.find(r => r.id === isin).fields.some(f => f.label.startsWith('Performance ') && f.metadata.currency === 'USD'));
  assert.equal(buildGapInventory().gaps.find(g => g.id === isin && g.field === 'performance').status,'not-published');
}
for (const isin of ['IE00B4556L06','IE00B4LHWP62']) {
  assert(AUTOMATED_PERFORMANCE[isin].values.every(Number.isFinite));
  for (const field of ['countries','sectors','holdings']) assert.equal(buildGapInventory().gaps.find(g => g.id === isin && g.field === field).status,'not-applicable');
}
assert(!AUTOMATED_ETF.IE00BM8R0J59.performance, 'No accumulating QYLD return attributed to distributing share');
console.log('Priority issuer fees/assets, calendar/cumulative returns and separate historical currencies are consumed correctly.');
