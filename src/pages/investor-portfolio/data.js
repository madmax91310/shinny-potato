import { investorIntroduction } from '../../data/investor-profiles.js'
export const INVESTORS = [
  ['tepper', 'David Tepper'], ['ackman', 'Bill Ackman'], ['berkshire', 'Berkshire Hathaway'],
  ['cathie-wood', 'Cathie Wood'], ['thiel', 'Peter Thiel'],
  ['druckenmiller', 'Stanley Druckenmiller'], ['loeb', 'Daniel Loeb'],
  ['aschenbrenner', 'Leopold Aschenbrenner'],
  ['li-lu', 'Li Lu'], ['gates-trust', 'Gates Foundation Trust'], ['klarman', 'Seth Klarman'],
  ['terry-smith', 'Terry Smith'], ['pabrai', 'Mohnish Pabrai'], ['hohn', 'Christopher Hohn'],
  ['baker-bros', 'Baker Bros. Advisors'], ['icahn', 'Carl Icahn'],
  ['laffont', 'Philippe Laffont'], ['renaissance', 'Renaissance Technologies'],
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
  if (identity?.archetype !== 'hedge_fund' || !snapshot?.periodEnd || !Array.isArray(snapshot.holdings)) {
    throw new Error('Ce portefeuille 13F ne contient pas de photographie exploitable.')
  }
  const holdings = snapshot.holdings.filter((row) => !row.putCall && Number.isFinite(row.weight) && row.weight > 0)
    .sort((a, b) => b.weight - a.weight)
  if (!holdings.length || holdings.some((row) => row.weight > 1) || holdings.reduce((sum, row) => sum + row.weight, 0) > 1.02) {
    throw new Error('Les poids transmis ne permettent pas une répartition fiable.')
  }
  return { identity, snapshot, holdings: portfolioCompanies(holdings), filingHistory: payload.data.filingHistory || [], sourceUrl: payload.data.sourceUrl || `https://tracefour.com/trackers/${identity.slug}`, fetchedAt: payload.as_of }
}

export function percentage(weight) {
  return `${(weight * 100).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

export function dateFR(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
}

// Regroupe les catégories d’actions connues ; les poids restent ceux du relevé.
// Les positions en fonds/ETF restent des positions, pas des entreprises.
export function portfolioCompanies(holdings) {
  const groups = new Map()
  for (const row of holdings) {
    const alphabet = ['GOOG', 'GOOGL', 'GOOG(L)'].includes(row.ticker)
    const berkshire = ['BRK.A', 'BRK.B', 'BRK.{A,B}'].includes(row.ticker)
    const key = alphabet ? 'alphabet' : berkshire ? 'berkshire' : row.issuerName.trim().toLocaleLowerCase('fr-FR')
    const ticker = row.ticker
    const previous = groups.get(key)
    if (previous) {
      previous.weight += row.weight
      if (alphabet && previous.ticker !== ticker) previous.ticker = 'GOOG(L)'
      if (berkshire && previous.ticker !== ticker) previous.ticker = 'BRK.{A,B}'
    }
    else groups.set(key, { ...row, ticker, issuerName: alphabet ? 'Alphabet' : berkshire ? 'Berkshire Hathaway' : row.issuerName })
  }
  return [...groups.values()].sort((a, b) => b.weight - a.weight)
}

function tickers(row) {
  return row.ticker ? ({ 'GOOG(L)': '$GOOG $GOOGL', 'BRK.{A,B}': '$BRK.A $BRK.B' }[row.ticker] || '$' + row.ticker) : ''
}

export function portfolioEditorial(portfolio) {
  const { identity, holdings } = portfolio
  const companies = portfolioCompanies(holdings)
  const top = companies.slice(0, 5)
  const total = companies.reduce((sum, row) => sum + row.weight, 0)
  const funds = companies.some(row => /\b(?:ETF|ISHARES|SPDR|PROSHARES|INVESCO|VANGUARD|FUND|FUNDS|TRUST)\b/i.test(row.issuerName)
    && !['BRK.{A,B}'].includes(row.ticker))
  const unit = funds ? 'positions' : 'entreprises'
  const singularUnit = funds ? 'position' : 'entreprise'
  let sum = 0
  const cumulative = top.map(row => (sum += row.weight))
  let count = cumulative.findIndex(value => value >= .9 - 1e-9) + 1
  if (!count) count = cumulative.findIndex(value => value >= .7 - 1e-9) + 1
  if (!count) count = top.length
  const concentration = cumulative[count - 1]
  const near = Math.abs(concentration * 100 - Math.round(concentration * 100)) > .05
  const hookWeight = near ? 'Près de ' + Math.round(concentration * 100) + ' %' : percentage(concentration)
  const owner = identity.slug === 'gates-trust' ? 'du Gates Foundation Trust'
    : identity.slug === 'baker-bros' ? 'des frères Baker' : 'de ' + identity.displayName
  const hook = count === 1
    ? '📊 ' + percentage(top[0].weight) + ' sur une seule ' + (funds ? 'position' : 'entreprise') + ' : voici le portefeuille déclaré ' + owner + ' 👇'
    : '📊 ' + hookWeight + ' sur ' + (concentration >= .7 ? 'seulement ' : '') + count + ' ' + unit + ' : voici le portefeuille déclaré ' + owner + ' 👇'
  const topSum = cumulative.at(-1)
  const lead = top[0]
  const rest = Math.max(0, total - topSum)
  const countLabel = count === 1 ? 'Cette ligne représente' : 'Les ' + count + ' premières ' + unit + ' représentent'
  let overview = countLabel + ' ' + percentage(concentration) + ' du portefeuille déclaré.'
  const leadName = holdingName(lead)
  const second = top[1]
  const otherCount = companies.length - top.length
  let explanation
  let question
  if (lead.weight > total / 2) {
    const others = Math.max(0, total - lead.weight)
    explanation = leadName + ' pèse davantage que toutes les autres positions présentées réunies : ' + percentage(lead.weight) + ' contre ' + percentage(others) + '.'
    question = leadName + ' à ' + percentage(lead.weight) + ' : serais-tu à l’aise avec ce poids sur une seule ligne ?'
  } else if ((cumulative[2] ?? topSum) >= .7) {
    const n = Math.min(3, top.length)
    const concentratedWeight = cumulative[n - 1] < 1 && cumulative[n - 1] >= .9995 ? 'près de 100 %' : percentage(cumulative[n - 1])
    overview = leadName + ' arrive en tête avec ' + percentage(lead.weight) + '.'
    explanation = 'Les ' + n + ' premières ' + unit + ' totalisent à elles seules ' + concentratedWeight + ' du relevé.'
    question = 'Concentrer ' + concentratedWeight + ' sur ' + n + ' ' + unit + ' comme ici : tu pourrais garder cette répartition ?'
  } else if (second && lead.weight - second.weight <= .005 + 1e-9) {
    overview = 'Les ' + top.length + ' premières ' + unit + ' représentent ' + percentage(topSum) + ' du portefeuille déclaré.'
    if (otherCount) overview += otherCount === 1
      ? ' L’autre ' + singularUnit + ' représente les ' + percentage(rest) + ' restants.'
      : ' Les ' + otherCount + ' autres ' + unit + ' se partagent les ' + percentage(rest) + ' restants.'
    explanation = leadName + ' et ' + holdingName(second) + ' sont presque à égalité en tête : ' + percentage(lead.weight) + ' et ' + percentage(second.weight) + '. Aucune ligne ne domine seule cette répartition.'
    question = leadName + ' ou ' + holdingName(second) + ' : laquelle choisirais-tu pour ta première ligne ?'
  } else if (lead.weight > .25 && otherCount && lead.weight > rest) {
    explanation = leadName + ' représente ' + percentage(lead.weight) + ' du portefeuille déclaré. À elle seule, cette ligne pèse davantage que ' + (otherCount === 1 ? 'la position hors du top 5, qui représente ' : 'les ' + otherCount + ' positions hors du top 5 réunies, qui totalisent ') + percentage(rest) + '.'
    const weightLabel = lead.weight <= 1 / 3 ? 'plus d’un quart de ton portefeuille' : percentage(lead.weight) + ' de ton portefeuille'
    question = 'Mettre ' + weightLabel + ' sur ' + leadName + ' : tu serais à l’aise avec ce choix ?'
    // Start with the concrete comparison, then give the concentration already announced in the hook.
    const concentrationSummary = overview
    overview = explanation
    explanation = concentrationSummary
  } else {
    explanation = leadName + ' arrive en tête avec ' + percentage(lead.weight) + (second ? ', devant ' + holdingName(second) + ' à ' + percentage(second.weight) : '') + '. ' + (otherCount ? (otherCount === 1 ? 'L’autre ' + singularUnit + ' représente ' : 'Les ' + otherCount + ' autres ' + unit + ' représentent ensemble ') + percentage(rest) + ' du relevé.' : 'Toutes les ' + unit + ' du relevé figurent ici.')
    question = leadName + ' à ' + percentage(lead.weight) + ' : tu garderais ce poids ou tu répartirais davantage ?'
  }
  const classes = companies.some(row => ['GOOG(L)', 'BRK.{A,B}'].includes(row.ticker))
    ? 'Les catégories d’actions d’une même entreprise sont regroupées : deux catégories ne constituent pas deux entreprises différentes.' : ''
  return { hook, top, explanation: [overview, explanation, classes].filter(Boolean).join('\n\n'), question }
}

// Compare reported security lines, before company/class grouping. Weight changes
// are intentionally never interpreted as changes in the number of shares.
export function movementExcerpt(snapshot) {
  const prior = snapshot.quarterChanges?.priorPeriodLabel
  if (!prior || !Array.isArray(snapshot.holdings)) return ''
  const rows = snapshot.holdings.filter(row => !row.putCall && row.weight > 0)
    .sort((a, b) => b.weight - a.weight)
  const label = row => [holdingName(row), tickers(row)].filter(Boolean).join(' ')
  const change = row => Math.abs(row.sharesChangePct).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
  const buckets = [
    rows.filter(row => row.isNew === true).map(row => '🆕 Nouvelle ligne : ' + label(row)),
    rows.filter(row => !row.isNew && row.ticker !== 'BRK.{A,B}' && Number.isFinite(row.sharesChangePct) && row.sharesChangePct >= .05)
      .map(row => '📈 ' + label(row) + ' : nombre d’actions +' + change(row) + ' %'),
    rows.filter(row => !row.isNew && row.ticker !== 'BRK.{A,B}' && Number.isFinite(row.sharesChangePct) && row.sharesChangePct <= -.05 && row.sharesChangePct >= -100)
      .map(row => '📉 ' + label(row) + ' : nombre d’actions −' + change(row) + ' %'),
    (snapshot.quarterChanges.exits || []).filter(row => !row.putCall && !rows.some(current => row.ticker ? current.ticker === row.ticker : current.issuerName === row.issuerName))
      .map(row => '🚪 Ligne sortie : ' + label(row)),
  ]
  // One example per available category, then fill remaining slots by position size.
  const selected = buckets.flatMap(bucket => bucket.slice(0, 1))
  for (const bucket of buckets) {
    for (const line of bucket.slice(1)) if (selected.length < 4) selected.push(line)
  }
  if (!selected.length) return ''
  const period = String(prior).replace(/^Q([1-4]) /, 'T$1 ')
  return '🔄 Quelques mouvements depuis ' + period + '\n' + selected.join('\n')
}

export function buildTweet(portfolio, intro = '') {
  const { identity, snapshot } = portfolio
  const editorial = portfolioEditorial(portfolio)
  const icon = ['🥇', '🥈', '🥉', '📍', '📍']
  const presentation = intro.trim() || investorIntroduction(identity.slug) || identity.displayName + ' gère les investissements déclarés par ' + (identity.entityName || identity.displayName) + '.'
  const who = identity.slug === 'cathie-wood' ? '👤 Qui est-elle ?'
    : ['berkshire', 'gates-trust', 'renaissance'].includes(identity.slug) ? '🏛️ Qui est-ce ?'
      : identity.slug === 'baker-bros' ? '👥 Qui sont-ils ?' : '👤 Qui est-il ?'
  return [
    editorial.hook,
    who + '\n' + presentation,
    '💼 Ses principales positions au ' + dateFR(snapshot.periodEnd) + '\n' + editorial.top.map((row, i) => icon[i] + ' ' + holdingName(row) + ' ' + tickers(row) + ' : ' + percentage(row.weight)).join('\n'),
    snapshot.holdings?.some(row => row.putCall) ? 'Les options du relevé sont exclues de cette liste ; les poids restent calculés sur le total déclaré.' : '',
    movementExcerpt(snapshot),
    '🔍 Ce qui distingue ce portefeuille\n' + editorial.explanation,
    '💬 ' + editorial.question,
  ].filter(Boolean).join('\n\n')
}

export async function loadPortfolio(slug, signal) {
  if (!INVESTORS.some(([key]) => key === slug)) throw new Error('Investisseur inconnu.')
  const url = `${import.meta.env.BASE_URL}data/investors/${slug}.json`
  const response = await fetch(url, { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error(`Données indisponibles (${response.status}). Réessaie plus tard.`)
  const portfolio = normalizePortfolio(await response.json())
  if (portfolio.identity.slug !== slug) throw new Error('La réponse ne correspond pas à l’investisseur choisi.')
  return portfolio
}
