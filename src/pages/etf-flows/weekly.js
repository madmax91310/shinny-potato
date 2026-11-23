const fullDate = new Intl.DateTimeFormat('fr-FR', {dateStyle: 'long', timeZone: 'UTC'})
const monthDay = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'long', timeZone: 'UTC'})
const dayNumber = new Intl.DateTimeFormat('fr-FR', {day: 'numeric', timeZone: 'UTC'})
const decimal = new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 2, useGrouping: false})

export const blocks = [
  ['geography', '🌍 Par pays et par zone'],
  ['sectors', '🏭 Par secteur'],
  ['funds', '💸 Top 5 des ETF cotés aux États-Unis'],
]

export function dateRange(start, end) {
  const first = start.slice(0, 7) === end.slice(0, 7) ? dayNumber : start.slice(0, 4) === end.slice(0, 4) ? monthDay : fullDate
  return `du ${first.format(new Date(start))} au ${fullDate.format(new Date(end))}`
}

function amount(usd) {
  const absolute = Math.abs(usd)
  const sign = usd < 0 ? '−' : '+'
  if (absolute < 10_000) return `${sign}<0,01 M$`
  return absolute >= 1e9 ? `${sign}${decimal.format(absolute / 1e9)} Md$` : `${sign}${decimal.format(absolute / 1e6)} M$`
}

export function rankRows(rows) {
  const byId = (a, b) => (a.id > b.id) - (a.id < b.id)
  return {
    inflows: rows.filter(row => row.usd > 0).sort((a, b) => b.usd - a.usd || byId(a, b)),
    outflows: rows.filter(row => row.usd < 0).sort((a, b) => a.usd - b.usd || byId(a, b)),
  }
}

export function renderPost(edition) {
  const sections = blocks.map(([key, title]) => {
    const {inflows, outflows} = rankRows(edition.groups[key])
    const lists = [['🟢 Entrées', inflows], ['🔴 Sorties', outflows]].map(([heading, rows]) => {
      const lines = rows.slice(0, 5).map(({id, label, usd}, i) =>
        `${i + 1}. ${key === 'funds' ? id + ' · ' : ''}${label} ${amount(usd)}`)
      return [heading, lines.length ? lines.join('\n') : 'Aucun flux vérifié pour ce signe.'].join('\n\n')
    })
    const limits = []
    if (inflows.length < 5 || outflows.length < 5) {
      limits.push(`Couverture vérifiée · ${Math.min(inflows.length, 5)}/5 entrées et ${Math.min(outflows.length, 5)}/5 sorties.`)
    }
    if (key === 'geography') {
      const usIn = inflows.findIndex(row => row.id === 'US')
      const usOut = outflows.findIndex(row => row.id === 'US')
      if (usIn >= 5) limits.push(`États-Unis · rang ${usIn + 1} des entrées ${amount(inflows[usIn].usd)}.`)
      if (usOut >= 5) limits.push(`États-Unis · rang ${usOut + 1} des sorties ${amount(outflows[usOut].usd)}.`)
      if (usIn < 0 && usOut < 0) limits.push('États-Unis · flux net nul, hors classement.')
    }
    return [title, ...lists, ...limits].join('\n\n')
  })
  return [
    `📊 Flux nets des ETF ${dateRange(edition.sessions[0], edition.sessions.at(-1))}`,
    ...sections,
    `Sources · ETFIQ (${edition.sessions.at(-1)}) ${edition.sources.weekly} · Relevés quotidiens ${edition.sources.daily.join(' · ')} · Classification (${edition.sources.taxonomyDate}) ${edition.sources.taxonomy}`,
  ].join('\n\n')
}
