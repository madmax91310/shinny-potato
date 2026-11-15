import FX from './monthly-fx.json' with { type: 'json' }
import { fxRate } from '../lib/fx-rate.js'
export const CALENDAR_FX_YEARS = Object.fromEntries(Object.entries(FX.months).filter(([month]) => month.endsWith('-12')).map(([month,row]) => [month.slice(0,4),row]))

// ECB references exclude TARGET closing days, including the two exceptional
// December closures documented by collect_annual_fx.py. Use UTC in every locale.
export function yearEndReferenceDate(year) {
  if (!Number.isInteger(Number(year)) || Number(year) < 1999) return null
  const date = new Date(Date.UTC(Number(year), 11, 31))
  while ([0, 6].includes(date.getUTCDay()) || [25, 26].includes(date.getUTCDate())
    || ([1999, 2001].includes(Number(year)) && date.getUTCDate() === 31)) {
    date.setUTCDate(date.getUTCDate() - 1)
  }
  return date.toISOString().slice(0, 10)
}

export function calendarRate(year, currency, fx = null) {
  const row = fx == null ? CALENDAR_FX_YEARS[year] : fx?.months?.[`${year}-12`]
  return row?.asOf === yearEndReferenceDate(year) ? fxRate(row.rates, currency) : null
}
export function convertCalendarReturn(value, year, source, target = 'EUR', fx = null) {
  if (!Number.isFinite(value) || value < -100) return null
  if (source === target) return value
  const s0 = calendarRate(year - 1, source, fx), s1 = calendarRate(year, source, fx)
  const t0 = calendarRate(year - 1, target, fx), t1 = calendarRate(year, target, fx)
  return s0 && s1 && t0 && t1 ? ((1 + value / 100) * s0 / s1 * t1 / t0 - 1) * 100 : null
}
export const CALENDAR_FX_SOURCE = FX.sourceUrl
