import assert from 'node:assert/strict';
import { latestCommonYears } from '../src/data/annual-window.js';
import { AUTOMATED_ETF, AUTOMATED_PERFORMANCE, HISTORICAL_AUTOMATED_PERFORMANCE, buildAnnualPerformance, newerCompatibleAnnualPerformance } from '../src/data/automated-etf.js';
import { getInstrumentReturnValues, getInstrumentCalendarReturns } from '../src/data/instrument-returns.js';
import { annualizedReturn, computeYearlyPerf, performanceExcerpt } from '../src/pages/portfolio-generator/performance.js';
import { performanceEntries, annualPerformanceRange } from '../src/pages/etf-sheets/annualPerformance.js';
import { getComparisonPerformance, getComparisonYears } from '../src/pages/tweet-midi/comparisonPerformance.js';
import { CALENDAR_FX_YEARS } from '../src/data/calendar-fx.js';
import { ASSETS } from '../src/data/market-history.js';
import { getAnnualReturnStartYears, getAnnualReturns } from '../src/pages/tweet-midi/data/marketHistory.js';
import { buildRanking, buildTweet as buildRankingText, commonCoverage } from '../src/pages/performance-rankings/engine.js';
import { AUTOMATED_INDICES } from '../src/data/automated-indices.js';

const NativeDate = Date;
const now = new NativeDate('2027-01-05T12:00:00Z');
const isin = 'IE00B4L5Y983';
const lagging = 'IE00BKM4GZ66';
const oldLaggingDisplay = AUTOMATED_PERFORMANCE[lagging];
const oldRecord = structuredClone(AUTOMATED_ETF[isin]);
const oldDisplay = AUTOMATED_PERFORMANCE[isin];
const archive = [...getInstrumentReturnValues(isin)];
const oldFx2026 = CALENDAR_FX_YEARS[2026];
const histories = ['msciWorld', 'sp500'].map(id => ASSETS[id]);
const originalPoints = histories.map(asset => asset.points);
const closingYear = 2026;
let clock = new NativeDate('2026-12-31T23:59:59Z');
const original = AUTOMATED_ETF.IE00BYZK4552.performance;
const prior = { ...original, years: Object.fromEntries(Object.entries(original.years).filter(([year]) => Number(year) < closingYear)) };
const newerIssuer = { sourceUrl: 'https://example.test/official-calendar',
  performance: { ...prior, years: { ...prior.years, 2026: 12.34 } } };
assert.equal(newerCompatibleAnnualPerformance(prior, newerIssuer, clock), prior);
const renewed = newerCompatibleAnnualPerformance(prior, newerIssuer, now);
assert.equal(renewed.years[2026], 12.34);
assert.equal(renewed.sourceUrl, newerIssuer.performance.sourceUrl ?? newerIssuer.sourceUrl);
for (const performance of [{ ...newerIssuer.performance, currency: 'EUR' },
  { ...newerIssuer.performance, years: { ...newerIssuer.performance.years, 2025: 42 } }]) {
  assert.equal(newerCompatibleAnnualPerformance(prior, { ...newerIssuer, performance }, now), prior);
}
try {
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [clock.toISOString()])); }
    static now() { return clock.getTime(); }
  };
  for (const asset of histories) {
    const start = asset.points.find(point => point.date === '2025-12').price;
    // In-memory vendor fixture through December only. No new January point.
    asset.points = [
      ...asset.points.filter(point => point.date < '2026-01'),
      ...Array.from({ length: 12 }, (_, i) => ({ date: `2026-${String(i + 1).padStart(2, '0')}`, price: start * (1 + (i + 1) / 120) })),
    ];
  }
  const ranked = histories.map((asset, i) => ({ ...asset, id: String(i), basis: 'index-gross' }));
  assert(!getAnnualReturnStartYears('msciWorld').includes(closingYear), 'December on the calendar is still the current year');
  assert.deepEqual(getAnnualReturns('msciWorld', closingYear), []);
  assert(!commonCoverage(ranked).years.includes(closingYear));
  clock = now;
  const { annualProjection } = await import('./project-selected-data.mjs');
  const { FORMATS, MODES, getSecondaryOptionsForFormat, getPerformanceEntries, buildPerformanceDepuisText } = await import('../src/pages/tweet-midi/engines/performance.js');
  const options = getSecondaryOptionsForFormat(FORMATS.PERFORMANCE_DEPUIS, MODES.SIMPLE, 'msciWorld');
  assert.equal(options.at(-1), closingYear);
  assert(getSecondaryOptionsForFormat(FORMATS.PERFORMANCE_DEPUIS, MODES.COMPARATIF, 'msciWorld', 'sp500').includes(closingYear));
  const item = { assetId: 'msciWorld', year: closingYear };
  const projection = annualProjection();
  assert.equal(projection.years.msciWorld.at(-1), closingYear);
  assert.deepEqual(projection.returns.msciWorld[closingYear], getPerformanceEntries(item)[0].returns[0]);
  assert.match(buildPerformanceDepuisText(item), /2026 : \+10/);
  assert.deepEqual(getAnnualReturns('msciWorld', 2027), []);
  const result = buildRanking(ranked, { mode: 'year', startYear: closingYear });
  assert.equal(result.columns[0].label, '2026');
  assert.match(buildRankingText(result), /2026/);
  assert(!commonCoverage([ranked[0], { ...ranked[1], points: ranked[1].points.slice(0, -1) }]).years.includes(closingYear));

  AUTOMATED_ETF[isin].performance.years['2026'] = 10;
  AUTOMATED_ETF[isin].performance.years['2027'] = 99; // Current-year value must be excluded.
  AUTOMATED_PERFORMANCE[isin] = buildAnnualPerformance(AUTOMATED_ETF[isin]);
  const map = getInstrumentCalendarReturns(isin);
  assert.equal(map[2026], 10);
  assert.equal(map[2027], undefined);
  assert.deepEqual(getInstrumentReturnValues(isin), archive, 'Archived examples keep their original calendar');
  assert.deepEqual(latestCommonYears([map]), [2021, 2022, 2023, 2024, 2025, 2026]);
  const selection = [{ r: archive, calendarReturns: map, pct: 100, returnCurrency: 'EUR' }];
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
  const { 2026: _unpublished, ...laggingYears } = AUTOMATED_ETF[lagging].performance.years;
  AUTOMATED_PERFORMANCE[lagging] = buildAnnualPerformance({ ...AUTOMATED_ETF[lagging],
    performance: { ...AUTOMATED_ETF[lagging].performance, years: laggingYears } });
  assert.deepEqual(getComparisonYears([isin, lagging]), [2025, 2024, 2023], 'A comparison uses one common calendar');
  const other = { ...map }; delete other[2026];
  assert.deepEqual(Object.keys(computeYearlyPerf([...selection, { calendarReturns: other, pct: 0 }])), ['2020', '2021', '2022', '2023', '2024', '2025']);
  const hole = { ...map }; delete hole[2023];
  assert.deepEqual(latestCommonYears([hole]), [], 'A gap cannot become a six-year simulation');
  assert.equal(annualizedReturn({ 2025: null, 2026: 10 }), null);
  assert.deepEqual(latestCommonYears([{ 2026: -100 }]), []);
  const { CATALOG, euroReturn } = await import('../src/data/duel-assets.js');
  const world = CATALOG.find(item => item.isin === isin);
  delete CALENDAR_FX_YEARS[2026];
  assert.equal(euroReturn(world, 2026), null, 'Missing verified FX blocks the future EUR return');
  const usdAllocation = [{ ...selection[0], returnCurrency: 'USD' }];
  assert.equal(Object.keys(computeYearlyPerf(usdAllocation)).at(-1), '2025', 'Keep the qualified EUR history while the latest fixing is pending');
  CALENDAR_FX_YEARS[2026] = { asOf: '2026-12-31', rates: { EUR: 1, USD: 1.2 } }; // In-memory completed ECB year.
  assert(Number.isFinite(euroReturn(world, 2026)));
  assert.equal(Object.keys(computeYearlyPerf(usdAllocation)).at(-1), '2026', 'The same allocation advances automatically once the fixing is present');
  CALENDAR_FX_YEARS[2026].asOf = '2026-12-30';
  assert.equal(euroReturn(world, 2026), null, 'A recent December fixing cannot certify the annual conversion');
  CALENDAR_FX_YEARS[2026].asOf = '2026-12-31';
  const { buildCustomDuel, buildTweet } = await import('../src/pages/portfolio-duels/lib.js');
  const complement = CATALOG.find(item => item.id === 'msci_em');
  const savedCalendar = complement.calendarReturns;
  complement.calendarReturns = {...world.calendarReturns};
  let duel;
  try { duel = buildCustomDuel({ left: [{ id: world.id, pct: 80 }, {id:complement.id,pct:20}], right: [{ id: world.id, pct: 80 }, {id:complement.id,pct:20}] }); }
  finally { complement.calendarReturns = savedCalendar; }
  assert.deepEqual(duel.years, [2021, 2022, 2023, 2024, 2025, 2026]);
  assert.match(buildTweet(duel), /début 2021.*fin 2026/);
  console.log('Annual rollover: aligned returns, geometric results, ETF labels, common periods, missing FX and immutable archives verified.');
} finally {
  if (oldFx2026) CALENDAR_FX_YEARS[2026] = oldFx2026;
  else delete CALENDAR_FX_YEARS[2026];
  globalThis.Date = NativeDate;
  AUTOMATED_ETF[isin] = oldRecord;
  AUTOMATED_PERFORMANCE[isin] = oldDisplay;
  AUTOMATED_PERFORMANCE[lagging] = oldLaggingDisplay;
  histories.forEach((asset, i) => { asset.points = originalPoints[i]; });
}

// A static comparatif review must give way to the exact issuer series in all outputs.
const reviewedIsin = 'FR0007056841';
const reviewedRecord = AUTOMATED_ETF[reviewedIsin];
const reviewedDisplay = AUTOMATED_PERFORMANCE[reviewedIsin];
const indexIds = ['stoxx600', 'eurostoxx50'];
const previousIndexReturns = indexIds.map(id => AUTOMATED_INDICES[id].returns);
const { ETF_PUBLICATION_DATA, ETFS } = await import('../src/pages/etf-sheets/records.js');
const previousSheet = ETF_PUBLICATION_DATA[reviewedIsin].performance;
try {
  globalThis.Date = class extends NativeDate {
    constructor(...args) { super(...(args.length ? args : [now.toISOString()])); }
    static now() { return now.getTime(); }
  };
  const performance = { ...reviewedRecord.performance, years: { ...reviewedRecord.performance.years, 2026: 12.34 } };
  AUTOMATED_PERFORMANCE[reviewedIsin] = buildAnnualPerformance({ ...reviewedRecord, performance });
  ETF_PUBLICATION_DATA[reviewedIsin].performance = AUTOMATED_PERFORMANCE[reviewedIsin];
  const { buildText, buildFactRows } = await import('../src/pages/etf-sheets/lib.js');
  const share = ETFS.find(etf => etf.isin === reviewedIsin);
  assert.match(buildText(share), /2026 : \+12,34 %/);
  assert(buildFactRows(share).some(row => /2026 \+12,34 %/.test(row.text)));
  const { DEFAULT_THEMES } = await import('../src/data/etf-themes.js');
  const usa = DEFAULT_THEMES.find(theme => theme.id === 'usa');
  const theme = { ...usa, etfs: usa.etfs.filter(etf => etf.isin === reviewedIsin) };
  const { buildTweetText } = await import('../src/pages/etf-tweets/lib/tweetFormat.js');
  const { getComparisonPaperCards } = await import('../src/pages/tweet-midi/comparatifEtfImage.js');
  assert.match(buildTweetText(theme), /2026 : \+12,34 %/);
  assert(getComparisonPaperCards(theme)[0].sections.some(section => section.rows.some(row => row.label === '2026' && row.value === '+12,34 %')));

  const { FAMILIES } = await import('../src/data/index-comparisons.js');
  const { getIndexComparisonPairs } = await import('../src/data/index-comparison-pairs.js');
  const europe = getIndexComparisonPairs(FAMILIES.find(family => family.id === 'europe'))[0];
  const { getIndexComparisonPerformance } = await import('../src/data/index-comparison-performance.js');
  assert.deepEqual(getIndexComparisonPerformance(europe).map(row => row.key), indexIds);
  for (const id of indexIds) {
    const previous = AUTOMATED_INDICES[id].returns;
    AUTOMATED_INDICES[id].returns = { ...previous, asOf: '2026-12-31', values: [[2026, 12.34], ...previous.values.filter(([year]) => year < 2026)] };
  }
  const { buildTweetText: buildIndexText } = await import('../src/pages/index-comparator/lib.js');
  const { getIndexPaperCards } = await import('../src/pages/index-comparator/imageExport.js');
  assert.match(buildIndexText(europe), /2026 : \+12,34 %/);
  assert(getIndexPaperCards(europe).every(card => card.sections.some(section => section.rows.some(row => row.label.startsWith('2026') && row.value === '+12,34 %'))));
} finally {
  globalThis.Date = NativeDate;
  AUTOMATED_PERFORMANCE[reviewedIsin] = reviewedDisplay;
  ETF_PUBLICATION_DATA[reviewedIsin].performance = previousSheet;
  indexIds.forEach((id, i) => { AUTOMATED_INDICES[id].returns = previousIndexReturns[i]; });
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

// -100% is an observed loss, never a gap that permits choosing another window.
const lossYears = Object.fromEntries([2020,2021,2022,2023,2024,2025].map(year=>[year,year===2022?-100:5]));
assert.deepEqual(latestCommonYears([lossYears],{now:new Date('2026-06-01')}),[2020,2021,2022,2023,2024,2025]);
assert.equal(annualizedReturn(lossYears),-100);
assert.deepEqual(latestCommonYears([{2020:2,2021:2,2022:-100,2023:2,2024:2}],{minimum:3,now:new Date('2026-06-01')}),[2020,2021,2022,2023,2024]);

// The provenance gate must pass for a share with archived evidence once the
// issuer supplies the next complete calendar year.
const propertyIsin = 'IE00B1FZSF77';
const propertyRecord = AUTOMATED_ETF[propertyIsin];
const propertyDisplay = AUTOMATED_PERFORMANCE[propertyIsin];
try {
  const next = { ...propertyRecord, performance: { ...propertyRecord.performance, years: { ...propertyRecord.performance.years, 2026: 10 } } };
  AUTOMATED_ETF[propertyIsin] = next;
  AUTOMATED_PERFORMANCE[propertyIsin] = buildAnnualPerformance(next, now);
  await import('./audit-data-provenance.mjs');
  const { DATA_CATALOG } = await import('../src/data/catalog.js');
  const fields = DATA_CATALOG.find(record => record.id === propertyIsin).fields;
  assert.equal(fields.find(field => field.label === 'Rendements 2020–2025').value.at(-1), propertyRecord.performance.years[2025]);
  assert.equal(fields.find(field => field.label === 'Rendements 2021–2026').value.at(-1), 10);
} finally {
  AUTOMATED_ETF[propertyIsin] = propertyRecord;
  AUTOMATED_PERFORMANCE[propertyIsin] = propertyDisplay;
}
