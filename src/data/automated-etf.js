import { unqualifiedFundRankingWeights,chooseNativeFundTopTen } from './holding-weight-basis.js';
import {newerCompatibleAum} from './aum-observations.js';
import {withInstrumentMetadata} from './instrument-metadata.js';
import expansionRecords from './exposure-etf-expansion-records.json' with { type:'json' };
import nonBondRecords from './non-bond-etf-records.json' with { type:'json' };
import { LIFESTRATEGY_RECORDS } from './lifestrategy.js';
import { latestCommonYears } from './annual-window.js';
import { withCurrentStrategyYears } from './benchmark-changes.js';
import baseRecords from './automated-etf.json' with { type: 'json' };
import nativeFundDetails from './native-fund-details.json' with { type: 'json' };
import { QUALIFIED_AUTOMATED_RECORDS } from './qualified-exposure-sheets.js';
const records = Object.fromEntries(Object.entries({ ...expansionRecords, ...baseRecords, ...nonBondRecords, ...QUALIFIED_AUTOMATED_RECORDS, ...LIFESTRATEGY_RECORDS }).map(([isin,record])=>[isin,withInstrumentMetadata(isin,record.performance ? { ...record, performance: withCurrentStrategyYears(isin, record.performance) } : record)]));
// A complete, qualified native book can supply a fund presentation's top ten.
// A newer unqualified ranking cannot change its NAV denominator or source date.
// This lightweight projection never admits an index or full overlap.
for (const [isin, native] of Object.entries(nativeFundDetails)) {
 const record=records[isin], previous=record?.holdings;
 if(record) records[isin]={...record,holdings:chooseNativeFundTopTen(isin,previous,native)};
}
// A registry specializing in composition may carry an earlier copy of the
// same share's annual calendar. Select the whole newer compatible observation.
export function newerCompatibleAnnualPerformance(previous, record, now = new Date()) {
  const candidate = record?.performance;
  if (!previous?.years || !candidate?.years || previous === candidate || previous.basis !== 'fund' ||
      candidate.basis !== previous.basis || candidate.currency !== previous.currency ||
      candidate.method !== previous.method || candidate.strategySince !== previous.strategySince ||
      candidate.portfolioHistoryBasis !== previous.portfolioHistoryBasis) return previous;
  const options = { length: 1, now };
  const oldYear = latestCommonYears([previous.years], options)[0];
  const newYear = latestCommonYears([candidate.years], options)[0];
  const sourceUrl = candidate.sourceUrl ?? record.sourceUrl;
  if (!(newYear > (oldYear ?? -Infinity)) || !sourceUrl?.startsWith('https://') ||
      Object.entries(previous.years).some(([year, value]) => Number.isFinite(value) && candidate.years[year] !== value)) return previous;
  return { ...candidate, sourceUrl };
}

// Registries describe different capabilities. An older specialized record must
// not hide a later compatible exact-share observation from the main reader.
for (const [isin, record] of Object.entries(records)) {
 for (const registry of [expansionRecords,baseRecords,nonBondRecords,QUALIFIED_AUTOMATED_RECORDS,LIFESTRATEGY_RECORDS]) {
  const source = registry[isin]
  if (source?.aum) record.aum=newerCompatibleAum(record.aum,source.aum)
  if (source?.performance && record.performance) record.performance = newerCompatibleAnnualPerformance(record.performance,
    { ...source, performance: withCurrentStrategyYears(isin, source.performance) })
 }
}
export const AUTOMATED_ETF = records;
export const AUTOMATED_AUM = Object.fromEntries(Object.entries(records).filter(([, r]) => r.aum).map(([isin, r]) => {
  const a = r.aum;
  const symbol = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' }[a.currency] ?? ` ${a.currency}`;
  const label = `${a.scope === 'fund' ? 'Fonds' : 'Part'} : ${(a.amount / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M${symbol} au ${a.asOf.split('-').reverse().join('/')}`;
  return [isin, { sheet: label, index: label, source: { ...a, amountMillions: a.amount / 1e6, url: a.sourceUrl ?? r.sourceUrl, checkedAt: a.checkedAt, scope: a.scope === 'fund' ? 'Actif net du fonds' : 'Actif net de la part exacte' } }];
}));
export function buildAnnualPerformance(record, now = new Date()) {
  const latest = latestCommonYears([record.performance.years], { length: 6, minimum: 1, now }).at(-1) ?? now.getUTCFullYear() - 1;
  const years = Array.from({ length: 6 }, (_, i) => latest - 5 + i);
  return { ...record.performance, source: record.performance.sourceUrl ?? record.sourceUrl,
    values: years.map(year => record.performance.years[year] ?? null), calendarYears: years,
    periodStart: `${years[0]}-01-01`, periodEnd: `${years.at(-1)}-12-31` };
}
export const AUTOMATED_PERFORMANCE = Object.fromEntries(Object.entries(records).filter(([, r]) => r.performance).map(([isin, record]) => [isin, buildAnnualPerformance(record)]));
// Holdings keep their own date; a sector refresh cannot re-date them.
export function refreshFundDetails(isin, previous = {}) {
  const r = records[isin];
  if (!r) return previous;
  return { ...previous,
    ...(previous.holdings?.length ? { holdingsAsOf: previous.holdingsAsOf ?? previous.asOf } : {}),
    ...(r.holdings && !unqualifiedFundRankingWeights(r.holdings) ? { holdings: r.holdings.rows.map(p => [p.name, p.weightPct]), holdingsAsOf: r.holdings.asOf, holdingsWeightBasis: r.holdings.weightBasis, holdingsSource: r.holdings.sourceUrl ?? r.sourceUrl, holdingsCheckedAt: r.holdings.checkedAt, holdingsBasis: r.holdings.basis === 'index' ? 'tracked-index' : (r.holdings.basis ?? 'fund'), basis: r.holdings.basis === 'index' ? 'tracked-index' : (r.holdings.basis ?? 'fund') } : {}),
    ...(unqualifiedFundRankingWeights(r.holdings) ? {holdings: [], holdingsAsOf: r.holdings.asOf, holdingsSource: r.holdings.sourceUrl ?? r.sourceUrl, holdingsWeightBasis: 'issuer-fund-ranking-unqualified-nav-denominator'} : {}),
    ...(r.sectors ? { sectors: r.sectors.rows.map(p => [p.label, p.weightPct]), sectorsAsOf: r.sectors.asOf,
      sectorsSource: r.sectors.sourceUrl ?? r.sourceUrl, sectorsCheckedAt: r.sectors.checkedAt, sectorsBasis: r.sectors.basis === 'index' ? 'tracked-index' : (r.sectors.basis ?? 'fund'), basis: r.sectors.basis === 'index' ? 'tracked-index' : (r.sectors.basis ?? 'fund') } : {}),
    ...(r.countries ? { countries: r.countries.rows.map(p => [p.name, p.weightPct]), countriesAsOf: r.countries.asOf, countriesSource: r.countries.sourceUrl ?? r.sourceUrl,
      countriesBasis: r.countries.basis === 'index' ? 'tracked-index' : (r.countries.basis ?? 'fund'), countriesIndex: r.countries.index } : {}),
    ...(AUTOMATED_PERFORMANCE[isin] ? { performance: AUTOMATED_PERFORMANCE[isin] } : {}),
  };
}

export const HISTORICAL_AUTOMATED_PERFORMANCE = Object.fromEntries(Object.entries(AUTOMATED_PERFORMANCE).map(([isin, series]) => [isin, { ...series, values: Array.from({ length: 6 }, (_, i) => series.years[2020 + i] ?? null), calendarYears: [2020, 2021, 2022, 2023, 2024, 2025], periodStart: '2020-01-01', periodEnd: '2025-12-31' }]));
