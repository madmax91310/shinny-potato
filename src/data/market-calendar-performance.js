import records from './monthly-duel-returns.json' with { type: 'json' }
import { latestCommonYears } from './annual-window.js'

// Kept separate from issuer NAV observations: a listing's currency is its own.
export function marketCalendarPerformance(isin, source = records, now = new Date()) {
  const record = source[isin]
  if (!record || record.isin !== isin || record.basis !== 'market-price' ||
      !record.checkedAt || !Number.isFinite(Date.parse(record.checkedAt)) || Date.parse(record.checkedAt)>now.getTime() ||
      !record.sourceUrls?.length || record.sourceUrls.some(url=>!url.startsWith('https://')) ||
      !record.listingEvidenceId?.startsWith(isin+'-') || !/^[a-f0-9]{64}$/.test(record.responseSha256??'') ||
      !['EUR', 'USD'].includes(record.currency)) return null
  const available = Object.fromEntries(Object.entries(record.years ?? {}).filter(([year, value]) =>
    /^20\d{2}$/.test(year) && Number(year) < now.getUTCFullYear() && Number.isFinite(value) && value > -100))
  const latest = latestCommonYears([available], { length: 6, minimum: 1, now }).at(-1)
  if (!latest) return null
  const calendarYears = Array.from({ length: 6 }, (_, i) => latest - 5 + i)
  return { ...record, source:record.source??record.sourceUrls[0], years: available, calendarYears,
    values: calendarYears.map(year => available[year] ?? null),
    periodStart: `${calendarYears[0]}-01-01`, periodEnd: `${latest}-12-31`,
    sourceKind: 'adjusted-market-price',
    note: 'Rendements calculés depuis les cours ajustés de la part exacte, distributions réinvesties. La devise est celle de la cotation ; ces rendements diffèrent du calendrier NAV de l’émetteur.' }
}
