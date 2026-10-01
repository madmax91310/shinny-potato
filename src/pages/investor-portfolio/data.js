import { investorIntroduction } from '../../data/investor-profiles.js'
export const INVESTORS = [
  ['tepper', 'David Tepper'], ['ackman', 'Bill Ackman'], ['berkshire', 'Berkshire Hathaway'],
  ['cathie-wood', 'Cathie Wood'], ['thiel', 'Peter Thiel'],
  ['druckenmiller', 'Stanley Druckenmiller'], ['loeb', 'Daniel Loeb'],
  ['aschenbrenner', 'Leopold Aschenbrenner'],
  ['li-lu', 'Li Lu'], ['gates-trust', 'Gates Foundation Trust'], ['klarman', 'Seth Klarman'],
]

export const ATTRIBUTION = 'Données : Tracefour · tracefour.com · CC BY 4.0'
export const COLORS = ['#dcba75', '#54d5b0', '#6da9e7', '#d9928b', '#a89bd9', '#84b6ae']
const SHORT_NAMES = { AMZN: 'Amazon', MU: 'Micron', TSM: 'TSMC', GOOG: 'Alphabet', GOOGL: 'Alphabet', UBER: 'Uber' }
export function holdingName(row) {
  return SHORT_NAMES[row.ticker] || (row.issuerName === row.issuerName.toUpperCase()
    ? row.issuerName.toLocaleLowerCase('fr-FR').replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('fr-FR'))
    : row.issuerName)
}

export function normalizePortfolio(payload) {
  const identity = payload?.data?.identity
  const snapshot = payload?.data?.snapshot
  if (identity?.archetype !== 'hedge_fund' || !snapshot?.periodEnd || !snapshot?.filedAt || !Array.isArray(snapshot.holdings)) {
    throw new Error('Ce portefeuille 13F ne contient pas de photographie exploitable.')
  }
  const holdings = snapshot.holdings.filter((row) => !row.putCall && Number.isFinite(row.weight) && row.weight > 0)
    .sort((a, b) => b.weight - a.weight)
  if (!holdings.length || holdings.some((row) => row.weight > 1) || holdings.reduce((sum, row) => sum + row.weight, 0) > 1.02) {
    throw new Error('Les poids transmis ne permettent pas une répartition fiable.')
  }
  return { identity, snapshot, holdings, filingHistory: payload.data.filingHistory || [], sourceUrl: payload.data.sourceUrl || `https://tracefour.com/trackers/${identity.slug}`, fetchedAt: payload.as_of }
}

export function percentage(weight) {
  return `${(weight * 100).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

export function dateFR(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
}

export function buildTweet(portfolio, intro = '') {
  const { identity, snapshot, holdings } = portfolio
  const top = holdings.slice(0, 5)
  const sum = top.reduce((value, row) => value + row.weight, 0)
  const icon = ['🥇', '🥈', '🥉', '📍', '📍']
  const presentation = intro.trim() || investorIntroduction(identity.slug) || `${identity.displayName} gère les investissements déclarés par ${identity.entityName || identity.displayName}.`
  const owner = identity.slug === 'gates-trust' ? 'du Gates Foundation Trust' : `de ${identity.displayName}`
  return [
    `Les plus grosses positions ${owner} 👇`,
    presentation,
    `Voici les principales positions déclarées par ${identity.entityName || identity.displayName} au ${dateFR(snapshot.periodEnd)} :`,
    top.map((row, i) => `${icon[i]} ${holdingName(row)} ${row.ticker ? `$${row.ticker}` : ''} → ${percentage(row.weight)}`).join('\n'),
    `${top.length === 1 ? 'Cette ligne représente' : `Ces ${top.length === 5 ? 'cinq' : top.length} lignes représentent`} ${percentage(sum)} des positions affichées.`,
    'Quel poids te surprend le plus ?',
  ].filter(Boolean).join('\n\n')
}

export async function loadPortfolio(slug, signal) {
  if (!INVESTORS.some(([key]) => key === slug)) throw new Error('Investisseur inconnu.')
  const extra = ['li-lu', 'gates-trust', 'klarman'].includes(slug)
  const url = extra ? `${import.meta.env.BASE_URL}data/investors/${slug}.json` : `https://tracefour.com/data/trackers/${slug}.json`
  const response = await fetch(url, { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error(`Données indisponibles (${response.status}). Réessaie plus tard.`)
  const portfolio = normalizePortfolio(await response.json())
  if (portfolio.identity.slug !== slug) throw new Error('La réponse ne correspond pas à l’investisseur choisi.')
  return portfolio
}
