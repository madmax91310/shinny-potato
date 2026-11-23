import {createHash} from 'node:crypto'
import {calendarUrl, lastWeekMonday, shift, tradingWeek} from './etf-flows-calendar.mjs'
import {rankRows} from '../src/pages/etf-flows/weekly.js'

const root = 'https://etfiq.com'
const license = root + '/license/'
const geography = {
  US: 'États-Unis', world: 'Monde', international: 'Actions internationales', 'emerging-markets': 'Marchés émergents',
  'pacific-asia': 'Asie-Pacifique', 'asia-ex-japan': 'Asie-Pacifique hors Japon', europe: 'Europe',
  'latin-america': 'Amérique latine', 'china-region': 'Chine et région', india: 'Inde', japan: 'Japon',
}
const sectors = {
  'sector-communications': 'Communications', 'sector-consumer-cyclical': 'Consommation cyclique',
  'sector-consumer-defensive': 'Consommation défensive', 'sector-energy': 'Énergie',
  'sector-financial': 'Finance', 'sector-health': 'Santé', 'sector-industrials': 'Industrie',
  'sector-materials': 'Matériaux', 'sector-real-estate': 'Immobilier américain',
  'sector-real-estate-global': 'Immobilier mondial', 'sector-technology': 'Technologie', 'sector-utilities': 'Services aux collectivités',
}
const fundLabels = {
  TCAF: 'Actions à appréciation du capital', TLT: 'Bons du Trésor américain à 20 ans et plus',
  FNOV: 'Actions américaines avec protection partielle (novembre)', BAI: 'Intelligence artificielle et technologie',
  DYNF: 'Actions américaines à rotation factorielle', SOXX: 'Semi-conducteurs', QQQ: 'Nasdaq-100',
  GLD: 'Or physique', IDEF: 'Industrie de la défense', HYG: 'Obligations d’entreprises à haut rendement',
}
const names = [
  [/S&P\s*500/i, 'S&P 500'], [/NASDAQ[ -]?100/i, 'Nasdaq-100'], [/semiconductor/i, 'Semi-conducteurs'],
  [/Emerging Markets/i, 'Actions des marchés émergents'], [/Small[ -]Cap/i, 'Actions de petites capitalisations'],
  [/Treasury/i, 'Bons du Trésor américain'], [/High Yield/i, 'Obligations à haut rendement'],
  [/Bitcoin/i, 'Bitcoin'], [/Ether(?:eum)?\b/i, 'Ether'], [/Gold/i, 'Or'], [/Silver/i, 'Argent métal'],
  [/Cybersecurity/i, 'Cybersécurité'], [/Artificial Intelligence/i, 'Intelligence artificielle'],
]
const categoryLabels = {Stocks: 'Actions', Bonds: 'Obligations', Allocation: 'Allocation diversifiée', Commodities: 'Matières premières'}
function fundLabel(row, classification) {
  const {ticker, name, category, issuer} = row
  const exposure = classification?.group === 'us-stocks' ? 'Actions américaines'
    : sectors[classification?.segment] ?? categoryLabels[category]
  const named = names.find(([pattern]) => pattern.test(name))?.[1]
  // Preserve the proper name or benchmark where the source gives no French descriptor.
  const properName = name.replace(/\bETF(?: Trust)?\b/gi, '').replace(/,?\s+Series \d+$/i, '').trim()
  return fundLabels[ticker] ?? (named && /\b(?:[23]X|Ultra|Leveraged)\b/i.test(name) ? named + ' à effet de levier' : named)
    ?? (exposure && issuer ? `${exposure} (${issuer})` : `Fonds ${properName || ticker}`)
}

function requireData(condition, message) {
  if (!condition) throw new Error(message)
}

function checkCite(cite, date) {
  requireData(cite?.publisher === 'ETFIQ' && cite.class === 'ETFIQ-computed' && cite.license === license
    && cite.as_of === date, `Provenance ou licence ETFIQ non reconnue pour le ${date}.`)
}

function matches(actual, expected) {
  return Array.isArray(actual) && actual.length === expected.length && actual.every((value, index) => value === expected[index])
}

function checkWeekly(weekly, {monday, sessions, opens}) {
  const start = sessions[0], end = sessions.at(-1)
  checkCite(weekly.cite, end)
  const week = weekly.week
  requireData(weekly.schemaVersion === 1 && weekly.edition === end && weekly.asOf === end
    && week?.monday === monday && week.from === start && week.to === end && week.reach === end && week.opens === opens
    && week.partial === false && matches(week.sessions, sessions) && matches(week.counted, sessions)
    && matches(weekly.daily?.map(row => row.d), sessions) && weekly.daily.every(row => row.funds > 0 && Number.isSafeInteger(row.flow))
    && weekly.coverage?.daysCounted === sessions.length && Number.isSafeInteger(weekly.coverage.universe)
    && weekly.coverage.universe > 0 && Array.isArray(weekly.funds?.inflows) && Array.isArray(weekly.funds.outflows),
  `Édition hebdomadaire ETFIQ incomplète ou incompatible avec le calendrier NYSE jusqu’au ${end}.`)
}

function dailyMap(daily, date, opens) {
  checkCite(daily.cite, date)
  const window = daily.window
  requireData(daily.schemaVersion === 1 && daily.asOf === date && daily.basis === 'daily' && window?.from === date
    && window.to === date && window.opens === opens && window.days === 1 && Array.isArray(daily.funds)
    && daily.total?.funds > 0 && Number.isSafeInteger(daily.total.flowUsd),
  `Relevé ETFIQ partiel ou invalide pour le ${date}.`)
  const rows = new Map(), seen = new Set()
  let publishedFunds = 0, publishedFlow = 0
  for (const row of daily.funds) {
    requireData(typeof row.ticker === 'string' && /^[A-Z0-9][A-Z0-9.-]*$/.test(row.ticker) && !seen.has(row.ticker),
      `Ticker invalide ou dupliqué le ${date}.`)
    seen.add(row.ticker)
    if (row.status !== 'ok') continue
    requireData(row.held === false && row.basis === 'daily', `Statut quotidien contradictoire pour ${row.ticker} le ${date}.`)
    requireData(Number.isSafeInteger(row.flowUsd) && typeof row.name === 'string' && row.name.trim(),
      `Flux USD invalide pour ${row.ticker} le ${date}.`)
    publishedFunds++
    publishedFlow += row.flowUsd
    if (row.navDate === opens) rows.set(row.ticker, row)
  }
  requireData(publishedFunds === daily.total.funds && publishedFlow === daily.total.flowUsd,
    `Le détail du relevé ETFIQ ne correspond pas au total du ${date}.`)
  requireData(rows.size > 0, `Aucun relevé de séance exploitable le ${date}.`)
  return rows
}

function exposureKey(classification) {
  if (classification?.status !== 'classified' || classification.category !== 'stocks') return null
  const {group, segment} = classification
  if (group === 'us-stocks') return ['geography', 'US']
  if (group === 'sector-stocks' && Object.hasOwn(sectors, segment)) return ['sectors', segment]
  if (group !== 'international-stocks') return null
  if (segment.startsWith('global-')) return ['geography', 'world']
  if (segment.startsWith('foreign-')) return ['geography', 'international']
  if (Object.hasOwn(geography, segment)) return ['geography', segment]
  return null
}

function checkTaxonomy(taxonomy, end) {
  const date = taxonomy.cite?.as_of
  checkCite(taxonomy.cite, date)
  requireData(/^\d{4}-\d{2}-\d{2}$/.test(date) && date >= end && date <= shift(end, 7)
    && taxonomy.version === 2 && taxonomy.funds && typeof taxonomy.funds === 'object'
    && Array.isArray(taxonomy.taxonomy), 'Photographie des catégories ETFIQ indisponible pour cette semaine.')
  const sectorSegments = taxonomy.taxonomy.find(row => row.id === 'stocks')?.groups?.find(group => group.id === 'sector-stocks')?.segments
  requireData(sectorSegments && matches(sectorSegments.map(row => row.id).sort(), Object.keys(sectors).sort()),
    'Les catégories sectorielles ETFIQ ont changé.')
}

export function createEdition(period, weekly, daily, taxonomy, sources) {
  const {sessions, opens} = period
  checkWeekly(weekly, period)
  checkTaxonomy(taxonomy, sessions.at(-1))
  const maps = sessions.map((date, index) => dailyMap(daily[index], date, index === 0 ? opens : sessions[index - 1]))
  const published = new Map()
  for (const row of [...weekly.funds.inflows, ...weekly.funds.outflows]) {
    requireData(typeof row.t === 'string' && !published.has(row.t), 'Ticker dupliqué dans l’édition hebdomadaire ETFIQ.')
    published.set(row.t, row)
  }
  const funds = [], sums = {geography: new Map(), sectors: new Map()}
  const exclusions = {partialDaily: 0, weeklyMismatch: 0}
  const allTickers = new Set([...maps.flatMap(map => [...map.keys()]), ...published.keys()])
  for (const ticker of allTickers) {
    const observations = maps.map(map => map.get(ticker))
    if (observations.some(row => !row)) {
      exclusions.partialDaily++
      continue
    }
    const usd = observations.reduce((total, row) => total + row.flowUsd, 0)
    const reference = published.get(ticker)
    if (reference && (reference.complete !== true || reference.from !== sessions[0] || reference.to !== sessions.at(-1)
      || reference.days !== sessions.length || reference.of !== sessions.length || reference.flow !== usd)) {
      exclusions.weeklyMismatch++
      continue
    }
    const classification = Object.hasOwn(taxonomy.funds, ticker) ? taxonomy.funds[ticker] : null
    funds.push({id: ticker, label: fundLabel(observations.at(-1), classification), usd})
    const placement = exposureKey(classification)
    if (!placement) continue
    const [key, id] = placement
    const rows = sums[key], previous = rows.get(id)
    const label = (key === 'geography' ? geography : sectors)[id]
    rows.set(id, {id, label, usd: (previous?.usd ?? 0) + usd, fundCount: (previous?.fundCount ?? 0) + 1})
  }
  requireData(funds.length > 0 && sums.geography.has('US') && sums.sectors.size > 0,
    'Couverture insuffisante pour valider les trois blocs, dont les États-Unis.')
  const {inflows, outflows} = rankRows(funds)
  return {
    monday: period.monday, sessions, currency: 'USD', sources: {...sources, taxonomyDate: taxonomy.cite.as_of},
    coverage: {universe: weekly.coverage.universe, verifiedFunds: funds.length, ...exclusions,
      dailyFunds: maps.map(map => map.size),
      geographyFunds: [...sums.geography.values()].reduce((sum, row) => sum + row.fundCount, 0),
      sectorFunds: [...sums.sectors.values()].reduce((sum, row) => sum + row.fundCount, 0)},
    groups: {geography: [...sums.geography.values()].sort(byId), sectors: [...sums.sectors.values()].sort(byId),
      funds: [...inflows.slice(0, 5), ...outflows.slice(0, 5)]},
  }
}

const byId = (a, b) => (a.id > b.id) - (a.id < b.id)

export async function collectEdition(monday = lastWeekMonday()) {
  requireData(monday <= lastWeekMonday(), 'La semaine demandée doit être terminée.')
  const digests = {}
  async function fetchSource(url, json = true) {
    const response = await fetch(url, {signal: AbortSignal.timeout(30_000), headers: {Accept: json ? 'application/json' : 'text/html'}})
    requireData(response.ok, `${url} · HTTP ${response.status}`)
    const body = await response.text()
    digests[url] = createHash('sha256').update(body).digest('hex')
    return json ? JSON.parse(body) : body
  }
  const period = tradingWeek(monday, await fetchSource(calendarUrl, false))
  const end = period.sessions.at(-1)
  const weeklyUrl = `${root}/data/flows/weekly/${end}.json`
  const weekly = await fetchSource(weeklyUrl)
  checkWeekly(weekly, period)
  const dailyUrls = period.sessions.map(date => `${root}/data/flows/daily/${date}.json`)
  const taxonomyUrl = `${root}/data/categories.json`
  const [daily, taxonomy] = await Promise.all([Promise.all(dailyUrls.map(url => fetchSource(url))), fetchSource(taxonomyUrl)])
  const edition = createEdition(period, weekly, daily, taxonomy, {
    weekly: `${root}/flows/weekly/${end}/`, daily: dailyUrls, taxonomy: taxonomyUrl,
  })
  return {...edition, evidence: {calendar: calendarUrl, license, sha256: Object.fromEntries(Object.entries(digests).sort())}}
}
