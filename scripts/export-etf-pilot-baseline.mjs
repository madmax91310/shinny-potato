import { INSTRUMENT_AUM_BY_ISIN } from '../src/data/instrument-aum.js';
import { COMPARISON_ETF_DETAILS } from '../src/data/comparison-etf-details.js';
import { readFileSync } from 'node:fs';
import { getInstrumentReturnValues, getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js';
import { REVIEWED_PERFORMANCE_META } from '../src/data/instrument-performance-review.js';
const instruments = ['etf-pilot.json', 'amundi-etf.json', 'ssga-etf.json', 'additional-etf-sources.json'].flatMap(file => JSON.parse(readFileSync(new URL(file, import.meta.url))).instruments);
console.log(JSON.stringify(Object.fromEntries(instruments.map(({ isin }) => [isin, {
  currency: getInstrumentAnnualPerformance(isin)?.currency,
  values: (() => { try { return getInstrumentReturnValues(isin); } catch { return null; } })(),
  evidence: REVIEWED_PERFORMANCE_META[isin],
  aumAsOf: INSTRUMENT_AUM_BY_ISIN[isin]?.source?.asOf,
  sectorsAsOf: COMPARISON_ETF_DETAILS[isin]?.sectorsAsOf ?? COMPARISON_ETF_DETAILS[isin]?.asOf,
  countriesAsOf: COMPARISON_ETF_DETAILS[isin]?.countriesAsOf,
  performanceCheckedAt: getInstrumentAnnualPerformance(isin)?.checkedAt,
}]))));
