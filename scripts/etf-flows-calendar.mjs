export const calendarUrl = 'https://www.nyse.com/trade/hours-calendars'
const months = 'January February March April May June July August September October November December'.split(' ')
const iso = date => date.toISOString().slice(0, 10)

export function shift(day, days) {
  const date = new Date(day + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return iso(date)
}

export function lastWeekMonday(now = new Date()) {
  const today = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/Paris', dateStyle: 'short'}).format(now)
  return shift(today, -((new Date(today).getUTCDay() + 6) % 7) - 7)
}

export function tradingWeek(monday, html) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(monday) || new Date(monday).getUTCDay() !== 1 || shift(monday, 0) !== monday) {
    throw new Error('La date de recette doit être un lundi au format AAAA-MM-JJ.')
  }
  // Read the exchange's full-day closure table. Footnotes about early closes remain sessions.
  const table = html.match(/<table\b[\s\S]*?<\/table>/gi)?.find(content => content.includes('Juneteenth') && content.includes('Good Friday'))
  const rows = Array.from(table?.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi) ?? [], ([, row]) =>
    Array.from(row.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi), ([, cell]) => cell.replace(/<[^>]*>/g, '').trim()))
  const [header, ...holidays] = rows
  if (!header || holidays.length < 10 || holidays.some(row => row.length !== header.length)) {
    throw new Error('Table des fermetures NYSE non reconnue.')
  }
  const first = shift(monday, -7)
  const last = shift(monday, 4)
  const years = [...new Set([first.slice(0, 4), last.slice(0, 4)])]
  const closed = new Set()
  for (const year of years) {
    const column = header.indexOf(year)
    // The NYSE drops past years from its rolling table. For the first week of
    // January, a past year is needed only for the previous close in December.
    if (column < 1) throw new Error(`Calendrier NYSE indisponible pour ${year}.`)
    for (const row of holidays) {
      const cell = row[column]
      if (/^(?:—|&mdash;)\s*\**$/.test(cell)) continue
      const match = /^[A-Za-z]+, ([A-Za-z]+) (\d{1,2})\b/.exec(cell)
      if (!match || !months.includes(match[1])) throw new Error(`Date NYSE illisible pour ${year}.`)
      closed.add(`${year}-${String(months.indexOf(match[1]) + 1).padStart(2, '0')}-${match[2].padStart(2, '0')}`)
    }
  }
  const open = day => ![0, 6].includes(new Date(day).getUTCDay()) && !closed.has(day)
  const sessions = Array.from({length: 5}, (_, i) => shift(monday, i)).filter(open)
  const opens = Array.from({length: 7}, (_, i) => shift(monday, -i - 1)).find(open)
  if (!sessions.length || !opens) throw new Error('Semaine NYSE sans séances vérifiables.')
  return {monday, sessions, opens}
}
