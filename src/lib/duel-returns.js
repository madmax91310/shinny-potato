import { convertCalendarReturn } from '../data/calendar-fx.js'

export function euroReturn(item, year) {
  if (item.euroCalendarReturns) return item.euroCalendarReturns[year] ?? null
  const original = item.calendarReturns?.[year] ?? item.values[year - 2020]
  if (!Number.isFinite(original)) return null
  return convertCalendarReturn(original, year, item.currency, 'EUR')
}
