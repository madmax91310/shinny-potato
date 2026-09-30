export const INVESTORS = [
  ['tepper', 'David Tepper'], ['ackman', 'Bill Ackman'], ['berkshire', 'Berkshire Hathaway'],
  ['cathie-wood', 'Cathie Wood'], ['thiel', 'Peter Thiel'],
  ['druckenmiller', 'Stanley Druckenmiller'], ['loeb', 'Daniel Loeb'],
  ['aschenbrenner', 'Leopold Aschenbrenner'],
]

export const ATTRIBUTION = 'Données : Tracefour · tracefour.com · CC BY 4.0'
export const COLORS = ['#dcba75', '#54d5b0', '#6da9e7', '#d9928b', '#a89bd9', '#84b6ae']

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
  return { identity, snapshot, holdings, filingHistory: payload.data.filingHistory || [], sourceUrl: `https://tracefour.com/trackers/${identity.slug}`, fetchedAt: payload.as_of }
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
  return [
    `Où ${identity.displayName} place-t-il ses plus gros paris ? 👇`,
    intro.trim(),
    `Voici les principales positions déclarées par ${identity.entityName || identity.displayName} au ${dateFR(snapshot.periodEnd)} :`,
    ...top.map((row, i) => `${icon[i]} ${row.issuerName} ${row.ticker ? `$${row.ticker}` : ''} → ${percentage(row.weight)}`),
    `Ces cinq lignes représentent ${percentage(sum)} des positions affichées.`,
    'Quel poids te surprend le plus ?',
  ].filter(Boolean).join('\n\n')
}

export async function loadPortfolio(slug, signal) {
  if (!INVESTORS.some(([key]) => key === slug)) throw new Error('Investisseur inconnu.')
  const response = await fetch(`https://tracefour.com/data/trackers/${slug}.json`, { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error(`Tracefour ne répond pas (${response.status}). Réessaie plus tard.`)
  const portfolio = normalizePortfolio(await response.json())
  if (portfolio.identity.slug !== slug) throw new Error('La réponse ne correspond pas à l’investisseur choisi.')
  return portfolio
}
