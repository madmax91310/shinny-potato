import assert from 'node:assert/strict';
import { latestCommonYears } from '../src/data/annual-window.js';
import { AUTOMATED_ETF, AUTOMATED_PERFORMANCE, HISTORICAL_AUTOMATED_PERFORMANCE, buildAnnualPerformance } from '../src/data/automated-etf.js';
import { getInstrumentReturnValues, getInstrumentCalendarReturns } from '../src/data/instrument-returns.js';
import { annualizedReturn, computeYearlyPerf, performanceExcerpt } from '../src/pages/portfolio-generator/performance.js';
import { performanceEntries, annualPerformanceRange } from '../src/pages/etf-sheets/annualPerformance.js';
import { getComparisonPerformance, getComparisonYears } from '../src/pages/tweet-midi/comparisonPerformance.js';

const NativeDate = Date;
const now = new NativeDate('2027-02-16T12:00:00Z');
const isin = 'IE00B4L5Y983';
const oldRecord = structuredClone(AUTOMATED_ETF[isin]);
const oldDisplay = AUTOMATED_PERFORMANCE[isin];
const archive = [...getInstrumentReturnValues(isin)];
try {
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [now.toISOString()])); }
    static now() { return now.getTime(); }
  };
  AUTOMATED_ETF[isin].performance.years['2026'] = 10;
  AUTOMATED_ETF[isin].performance.years['2027'] = 99; // Current-year value must be excluded.
  AUTOMATED_PERFORMANCE[isin] = buildAnnualPerformance(AUTOMATED_ETF[isin]);
  const map = getInstrumentCalendarReturns(isin);
  assert.equal(map[2026], 10);
  assert.equal(map[2027], undefined);
  assert.deepEqual(getInstrumentReturnValues(isin), archive, 'Archived examples keep their original calendar');
  assert.deepEqual(latestCommonYears([map]), [2021, 2022, 2023, 2024, 2025, 2026]);
  const selection = [{ r: archive, calendarReturns: map, pct: 100 }];
  const perf = computeYearlyPerf(selection);
  assert.deepEqual(Object.keys(perf), ['2021', '2022', '2023', '2024', '2025', '2026']);
  assert.equal(perf[2026], 10);
  assert.match(performanceExcerpt(perf), /2021 à 2026/);
  const capital = Object.values(perf).reduce((v, pct) => v * (1 + pct / 100), 1);
  assert(Math.abs(annualizedReturn(perf) - (capital ** (1 / 6) - 1) * 100) < 1e-10);
  const display = AUTOMATED_PERFORMANCE[isin];
  assert.equal(annualPerformanceRange(display), '2021–2026');
  assert.equal(performanceEntries(display).at(-1).label, '2026');
  assert.deepEqual(getComparisonPerformance(isin).rows.map(row => row.year), [2026, 2025, 2024]);
  const lagging = 'IE00BKM4GZ66';
  assert.deepEqual(getComparisonYears([isin, lagging]), [2025, 2024, 2023], 'A comparison uses one common calendar');
  const other = { ...map }; delete other[2026];
  assert.deepEqual(Object.keys(computeYearlyPerf([...selection, { calendarReturns: other, pct: 0 }])), ['2020', '2021', '2022', '2023', '2024', '2025']);
  const hole = { ...map }; delete hole[2023];
  assert.deepEqual(latestCommonYears([hole]), [], 'A gap cannot become a six-year simulation');
  assert.equal(annualizedReturn({ 2025: null, 2026: 10 }), null);
  assert.deepEqual(latestCommonYears([{ 2026: -100 }]), []);
  const { CATALOG, EUR_USD, euroReturn } = await import('../src/data/duel-assets.js');
  const world = CATALOG.find(item => item.isin === isin);
  assert.equal(euroReturn(world, 2026), null, 'Missing verified FX blocks the future EUR return');
  EUR_USD[2026] = 1.2; // Simulate the next completed ECB year, never write it to data.
  assert(Number.isFinite(euroReturn(world, 2026)));
  const { buildCustomDuel, buildTweet } = await import('../src/pages/portfolio-duels/lib.js');
  const duel = buildCustomDuel({ left: [{ id: world.id, pct: 100 }], right: [{ id: world.id, pct: 100 }] });
  assert.deepEqual(duel.years, [2021, 2022, 2023, 2024, 2025, 2026]);
  assert.match(buildTweet(duel), /début 2021.*fin 2026/);
  delete EUR_USD[2026];
  console.log('Annual rollover: aligned returns, geometric results, ETF labels, common periods, missing FX and immutable archives verified.');
} finally {
  globalThis.Date = NativeDate;
  AUTOMATED_ETF[isin] = oldRecord;
  AUTOMATED_PERFORMANCE[isin] = oldDisplay;
}

const recentIsin = 'FR001400S9V0';
const previousRecent = HISTORICAL_AUTOMATED_PERFORMANCE[recentIsin];
try {
  const partial = [null, null, null, null, null, 5];
  HISTORICAL_AUTOMATED_PERFORMANCE[recentIsin] = { values: partial };
  assert.equal(getInstrumentReturnValues(recentIsin), partial, 'A newly collected partial fund history remains available without a simulation proxy');
} finally {
  if (previousRecent) HISTORICAL_AUTOMATED_PERFORMANCE[recentIsin] = previousRecent;
  else delete HISTORICAL_AUTOMATED_PERFORMANCE[recentIsin];
}
