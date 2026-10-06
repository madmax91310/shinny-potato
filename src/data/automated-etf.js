import { latestCommonYears } from './annual-window.js';
import records from './automated-etf.json' with { type: 'json' };
export const AUTOMATED_ETF = records;
export const AUTOMATED_AUM = Object.fromEntries(Object.entries(records).filter(([, r]) => r.aum).map(([isin, r]) => {
  const a = r.aum;
  const symbol = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' }[a.currency] ?? ` ${a.currency}`;
  const label = `${a.scope === 'fund' ? 'Fonds' : 'Part'} : ${(a.amount / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M${symbol} au ${a.asOf.split('-').reverse().join('/')}`;
  return [isin, { sheet: label, index: label, source: { ...a, amountMillions: a.amount / 1e6, url: a.sourceUrl ?? r.sourceUrl, checkedAt: a.checkedAt, scope: a.scope === 'fund' ? 'Actif net du fonds' : 'Actif net de la part exacte' } }];
}));
export function buildAnnualPerformance(record, now = new Date()) {
  const latest = latestCommonYears([record.performance.years], { length: 6, minimum: 1, now }).at(-1);
  const years = latest ? Array.from({ length: 6 }, (_, i) => latest - 5 + i) : [];
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
    ...(r.holdings ? { holdings: r.holdings.rows.map(p => [p.name, p.weightPct]), holdingsAsOf: r.holdings.asOf, holdingsSource: r.holdings.sourceUrl ?? r.sourceUrl, holdingsCheckedAt: r.holdings.checkedAt, basis: r.holdings.basis === 'index' ? 'tracked-index' : (r.holdings.basis ?? 'fund') } : {}),
    ...(r.sectors ? { sectors: r.sectors.rows.map(p => [p.label, p.weightPct]), sectorsAsOf: r.sectors.asOf,
      sectorsSource: r.sectors.sourceUrl ?? r.sourceUrl, sectorsCheckedAt: r.sectors.checkedAt, basis: r.sectors.basis === 'index' ? 'tracked-index' : (r.sectors.basis ?? 'fund') } : {}),
    ...(r.countries ? { countries: r.countries.rows.map(p => [p.name, p.weightPct]), countriesAsOf: r.countries.asOf, countriesSource: r.countries.sourceUrl ?? r.sourceUrl } : {}),
    ...(AUTOMATED_PERFORMANCE[isin] ? { performance: AUTOMATED_PERFORMANCE[isin] } : {}),
  };
}

export const HISTORICAL_AUTOMATED_PERFORMANCE = Object.fromEntries(Object.entries(AUTOMATED_PERFORMANCE).map(([isin, series]) => [isin, { ...series, values: Array.from({ length: 6 }, (_, i) => series.years[2020 + i] ?? null), calendarYears: [2020, 2021, 2022, 2023, 2024, 2025], periodStart: '2020-01-01', periodEnd: '2025-12-31' }]));
