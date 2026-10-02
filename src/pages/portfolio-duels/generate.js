import { CATALOG, buildCustomDuel } from './lib.js'
const byRole = (role) => CATALOG.filter((asset) => asset.role === role)
const pick = (items) => items[Math.floor(Math.random() * items.length)]

function allocation() {
  const base = pick(byRole('base'))
  const complement = Math.random() < .55 ? pick(byRole('complement')) : null
  const theme = Math.random() < .45 ? pick(byRole('theme')) : null
  const complementWeight = complement ? pick([10, 20, 25]) : 0
  const themeWeight = theme ? pick([10, 15, 20]) : 0
  return [{ id: base.id, pct: 100 - complementWeight - themeWeight },
    ...(complement ? [{ id: complement.id, pct: complementWeight }] : []),
    ...(theme ? [{ id: theme.id, pct: themeWeight }] : [])]
}
const signatureOf = (lines) => lines.map((line) => `${line.id}:${line.pct}`).join('|')
const labelOf = (lines) => lines.map((line) => CATALOG.find((item) => item.id === line.id).label).join(' + ')

export function generateDuel(previousId = '') {
  for (let attempt = 0; attempt < 80; attempt++) {
    const left = allocation()
    const right = allocation()
    const signature = `${signatureOf(left)}/${signatureOf(right)}`
    const id = `genere-${[...signature].reduce((hash, char) => Math.imul(hash, 31) + char.charCodeAt(0) | 0, 0).toString(36).replace('-', 'n')}`
    if (id === previousId) continue
    const duel = buildCustomDuel({ left, right, id, title: 'Deux façons de construire ton portefeuille',
      labels: [labelOf(left), labelOf(right)] })
    if (duel.years.every((year) => Math.abs(duel.a.annual[year] - duel.b.annual[year]) < .001)) continue
    return duel
  }
  throw new Error('Aucune combinaison différente disponible.')
}
