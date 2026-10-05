import records from './automated-etf.json' with { type: 'json' };
export const AUTOMATED_ETF = records;
export const AUTOMATED_AUM = Object.fromEntries(Object.entries(records).filter(([, r]) => r.aum).map(([isin, r]) => {
  const a = r.aum;
  const label = `Part : ${(a.amount / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} M${a.currency === 'USD' ? '$' : '€'} au ${a.asOf.split('-').reverse().join('/')}`;
  return [isin, { sheet: label, index: label, source: { ...a, url: r.sourceUrl, checkedAt: a.checkedAt, scope: 'Actif net de la part exacte' } }];
}));
export const AUTOMATED_PERFORMANCE = Object.fromEntries(Object.entries(records).filter(([, r]) => r.performance).map(([isin, r]) => [isin, {
  ...r.performance, source: r.sourceUrl, values: Array.from({ length: 6 }, (_, i) => r.performance.years[String(2020 + i)]),
  periodStart: '2020-01-01', periodEnd: '2025-12-31',
}]));
// Holdings keep their own date; a sector refresh cannot re-date them.
export function refreshFundDetails(isin, previous = {}) {
  const r = records[isin];
  if (!r) return previous;
  return { ...previous,
    ...(previous.holdings?.length ? { holdingsAsOf: previous.holdingsAsOf ?? previous.asOf } : {}),
    ...(r.sectors ? { sectors: r.sectors.rows.map(p => [p.label, p.weightPct]), sectorsAsOf: r.sectors.asOf,
      sectorsSource: r.sourceUrl, sectorsCheckedAt: r.sectors.checkedAt, basis: 'fund' } : {}),
    ...(r.countries ? { countries: r.countries.rows.map(p => [p.name, p.weightPct]), countriesAsOf: r.countries.asOf, countriesSource: r.sourceUrl } : {}),
    ...(AUTOMATED_PERFORMANCE[isin] ? { performance: AUTOMATED_PERFORMANCE[isin] } : {}),
  };
}
