import { writeFileSync } from 'node:fs'
import { QUALIFIED_INDEX_CALENDARS } from '../src/data/qualified-annual-calendars.js'
import { ETFS } from '../src/data/etf-cards.js'
import { getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js'
import HISTORY from '../src/data/anniversary-index-history.json' with { type: 'json' }
import { getCurrentIndexReturnSeries, INDEX_RETURNS } from '../src/data/index-returns.js'
import LONG from '../src/data/ranking-histories.json' with { type: 'json' }

const rows = {}
for (const etf of ETFS) {
  const record = getInstrumentAnnualPerformance(etf.isin)
  const source = record?.sourceUrl ?? (typeof record?.source === 'string' ? record.source : record?.source?.url)
  // Official exact-share NAV calendars only; never index proxies or YTD observations.
  if (record?.basis !== 'fund' || record.portfolioHistoryBasis === 'proxy' || !record.currency
    || !source?.startsWith('https://') || /proxy/i.test(record.method ?? '')) continue
  const values = record.years ?? Object.fromEntries((record.calendarYears ?? []).map((year, i) => [year, record.values[i]]))
  const years = Object.fromEntries(Object.entries(values).filter(([year, value]) => /^\d{4}$/.test(year)
    && Number(year) < new Date().getUTCFullYear() && Number.isFinite(value) && value > -100))
  if (!Object.keys(years).length) continue
  rows[`annual-${etf.isin}`] = { id: `annual-${etf.isin}`, label: etf.name, shortLabel: etf.name.replace(/ UCITS ETF.*$/, '').replace(/^(?:iShares|Amundi|Vanguard|State Street SPDR|Xtrackers) /, ''),
    isin: etf.isin, instrumentType: /\bETC\b|WisdomTree (?:Brent|WTI|Natural|Coffee|Cocoa|Wheat)/.test(etf.name) ? 'ETC' : 'ETF',
    frequency: 'annual', basis: 'fund-nav', currency: record.currency, years,
    group: `Calendriers annuels · ${etf.category ?? 'ETF'}`, pea: etf.pea ?? null,
    sourceUrls: [source], checkedAt: record.checkedAt, method: record.method,
  }
}
writeFileSync('src/data/ranking-annual.json', JSON.stringify(rows))
const ftse = getCurrentIndexReturnSeries('ftse-all-world', Object.keys(INDEX_RETURNS['ftse-all-world']).sort().at(-1))
const indexAnnual = { id: 'annual-ftseAllWorld', label: 'FTSE All-World', shortLabel: 'FTSE All-World', priceUnit: 'points',
  frequency: 'annual', basis: 'index-gross', currency: ftse.currency, years: Object.fromEntries(ftse.values),
  sourceUrls: ftse.metadata.sourceUrls, checkedAt: ftse.metadata.checkedAt, method: ftse.performance.detail }
const indexRows = { [indexAnnual.id]: indexAnnual }
for (const [id, source] of Object.entries(LONG)) {
  if (source.parser !== 'msci') continue
  const points = Object.fromEntries(source.points)
  const years = {}
  for (let year = 2006; year < new Date().getUTCFullYear(); year++) {
    if (points[`${year - 1}-12`] && points[`${year}-12`]) years[year] = (points[`${year}-12`] / points[`${year - 1}-12`] - 1) * 100
  }
  indexRows[`annual-${source.targetId ?? id}`] = { id: `annual-${source.targetId ?? id}`, label: source.label, shortLabel: source.label,
    priceUnit: 'points', frequency: 'annual', basis: source.variant === 'NETR' ? 'index-net' : 'index-gross',
    currency: source.currency, years, sourceUrls: source.sourceUrls, checkedAt: source.checkedAt, method: source.method }
}
// Preserve the longer qualified variant where it already exists; add actual official calendars only.
for (const record of Object.values(QUALIFIED_INDEX_CALENDARS)) {
  const existing = Object.values(indexRows).find(row => row.label.replace(/^Indice /, '') === record.label && row.basis === record.basis && row.currency === record.currency)
  if (!existing) indexRows[record.id] = record
}
writeFileSync('src/data/ranking-index-annual.json', JSON.stringify(indexRows))
writeFileSync('src/data/ranking-ftse.json', JSON.stringify(HISTORY.ftseAllWorld))
console.log(`${Object.keys(rows).length} exact-share official annual calendars projected for rankings.`)
