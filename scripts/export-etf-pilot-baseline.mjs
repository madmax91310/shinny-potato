import { readFileSync } from 'node:fs';
import { getInstrumentReturnValues, getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js';
import { REVIEWED_PERFORMANCE_META } from '../src/data/instrument-performance-review.js';
const { instruments } = JSON.parse(readFileSync(new URL('./etf-pilot.json', import.meta.url)));
console.log(JSON.stringify(Object.fromEntries(instruments.map(({ isin }) => [isin, {
  currency: getInstrumentAnnualPerformance(isin)?.currency,
  values: getInstrumentReturnValues(isin),
  evidence: REVIEWED_PERFORMANCE_META[isin],
}]))));
