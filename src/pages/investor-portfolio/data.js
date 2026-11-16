import { logoIdentity } from './media.js'
import { monetaryStatus, publicationPlan, portfolioOwner, cash, weightLabel, emojiFor } from './publication.js'
import { investorModel } from '../../data/investor-models.js'
import { modelPortfolio, buildModelTweet } from './models.js'
import { INVESTORS } from '../../data/investor-roster.js'
export { INVESTORS } from '../../data/investor-roster.js'

export const ATTRIBUTION = 'Données : Tracefour · tracefour.com · CC BY 4.0'
export const COLORS = ['#dcba75', '#54d5b0', '#6da9e7', '#d9928b', '#a89bd9', '#84b6ae']
const SHORT_NAMES = { AMZN: 'Amazon', MU: 'Micron', TSM: 'TSMC', GOOG: 'Alphabet', GOOGL: 'Alphabet', UBER: 'Uber',
  BN: 'Brookfield', MSFT: 'Microsoft', HHH: 'Howard Hughes', QSR: 'Restaurant Brands',
  AAPL: 'Apple', AXP: 'American Express', KO: 'Coca-Cola', BAC: 'Bank of America',
  TSLA: 'Tesla', AMD: 'AMD', SPCX: 'SpaceX', TEM: 'Tempus AI', HOOD: 'Robinhood',
  VIST: 'Vista Energy', VST: 'Vistra', AEP: 'American Electric Power', DTE: 'DTE Energy',
  NTRA: 'Natera', STM: 'STMicroelectronics', INSM: 'Insmed', FOXA: 'Fox',
  WBD: 'Warner Bros. Discovery', CRH: 'CRH', TDS: 'Telephone and Data Systems',
  SNDK: 'Sandisk', BE: 'Bloom Energy', NBIS: 'Nebius', PDD: 'PDD Holdings',
  EWBC: 'East West Bancorp', CROX: 'Crocs', CAT: 'Caterpillar', CNI: 'Canadian National',
  WM: 'Waste Management', DE: 'Deere', ELV: 'Elevance Health', FERG: 'Ferguson',
  MAR: 'Marriott', SYK: 'Stryker', WAT: 'Waters', V: 'Visa', CHD: 'Church & Dwight',
  HCC: 'Warrior Met Coal', RIG: 'Transocean', AMR: 'Alpha Metallurgical Resources', KSPI: 'Kaspi',
  GE: 'General Electric', MCO: 'Moody’s', SPGI: 'S&P Global', INCY: 'Incyte', ONC: 'BeiGene',
  RVMD: 'Revolution Medicines', MDGL: 'Madrigal Pharmaceuticals', ACAD: 'ACADIA Pharmaceuticals',
  IEP: 'Icahn Enterprises', CVI: 'CVR Energy', UAN: 'CVR Partners', CTRI: 'Centuri', IFF: 'International Flavors & Fragrances',
  LRCX: 'Lam Research', AMAT: 'Applied Materials', NVDA: 'Nvidia', META: 'Meta', INTC: 'Intel', UTHR: 'United Therapeutics',
}
const COMPANY_NAMES = { apple:'Apple', amazon:'Amazon', alphabet:'Alphabet', microsoft:'Microsoft', micron:'Micron', tsmc:'TSMC', nvidia:'Nvidia', meta:'Meta', tesla:'Tesla', cocacola:'Coca-Cola', 'bank-of-america':'Bank of America', 'american-express':'American Express', broadcom:'Broadcom', asml:'ASML', berkshire:'Berkshire Hathaway', visa:'Visa' }
// Editorial identity from Tepper's SEC row (2026-06-30), CUSIP and class together.
// Never label every iShares security as the same ETF from the issuer name alone.
const SECURITY_NAMES = { '464286772': { shareClass: 'MSCI STH KOR ETF', name: 'ETF MSCI Corée du Sud' } }
export function holdingName(row) {
  const security = SECURITY_NAMES[row.cusip]
  if (security && security.shareClass === row.shareClass) return security.name
  return (SHORT_NAMES[row.ticker] || COMPANY_NAMES[logoIdentity(row)?.id] || (row.issuerName === row.issuerName.toUpperCase()
    ? row.issuerName.toLocaleLowerCase('fr-FR').replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('fr-FR'))
    : row.issuerName)).replace(/(?:\s*,\s*)+$/g, '').trim()
}

export function normalizePortfolio(payload) {
  const identity = payload?.data?.identity
  const snapshot = payload?.data?.snapshot
  if (identity?.archetype !== 'hedge_fund' || !snapshot?.periodEnd || !Array.isArray(snapshot.holdings)) {
    throw new Error('Ce portefeuille 13F ne contient pas de photographie exploitable.')
  }
  const period = snapshot.periodEnd
  const keys = new Set()
  if (!INVESTORS.some(([slug,name]) => slug === identity.slug && name === identity.displayName) || !/^\d{4}-(03-31|06-30|09-30|12-31)$/.test(period) || period > new Date().toISOString().slice(0, 10)) {
    throw new Error('L’identité ou la date du relevé 13F est invalide.')
  }
  for (const row of snapshot.holdings) {
    const key = JSON.stringify([row.cusip || row.securityId || (row.ticker && row.ticker !== 'Unmapped CUSIP' ? row.ticker : row.issuerName), row.shareClass || null, row.putCall || null])
    if (typeof row.issuerName !== 'string' || !row.issuerName.trim() || typeof (row.ticker ?? '') !== 'string'
      || ![undefined, null, 'PUT', 'CALL'].includes(row.putCall) || !Number.isFinite(row.weight) || row.weight <= 0 || row.weight > 1 || keys.has(key)) {
      throw new Error('Le relevé contient une position invalide ou dupliquée.')
    }
    keys.add(key)
  }
  const declaredWeight = snapshot.holdings.reduce((sum, row) => sum + row.weight, 0)
  if (declaredWeight < .95 || declaredWeight > 1.02) throw new Error('Le relevé 13F est incomplet.')
  const holdings = snapshot.holdings.filter((row) => !row.putCall && Number.isFinite(row.weight) && row.weight > 0)
    .map(row => row.ticker === 'Unmapped CUSIP' ? { ...row, ticker: '' } : row)
    .sort((a, b) => b.weight - a.weight)
  if (!holdings.length || holdings.some((row) => row.weight > 1) || holdings.reduce((sum, row) => sum + row.weight, 0) > 1.02) {
    throw new Error('Les poids transmis ne permettent pas une répartition fiable.')
  }
  const problem = monetaryStatus(snapshot)
  const total = problem ? null : holdings.reduce((sum, row) => sum + row.value, 0)
  const names = new Map()
  for (const row of holdings) { const name=holdingName(row); names.set(name,(names.get(name)||0)+1) }
  const distinct = holdings.map(row => ({ ...row,
    weight: total ? row.value / total : row.weight,
    displayLabel: names.get(holdingName(row)) > 1 ? `${[...holdingName(row)].slice(0,20).join('')} (${row.cusip || row.ticker || row.securityId || row.shareClass})` : holdingName(row),
  }))
  return { identity, snapshot, problem, total, discoverySourceUrl: payload.data.discoverySourceUrl || null, holdings: distinct, filingHistory: payload.data.filingHistory || [], sourceUrl: payload.data.sourceUrl || `https://tracefour.com/trackers/${identity.slug}`, fetchedAt: payload.as_of }
}

export function percentage(weight) {
  return weightLabel(weight)
}

export function dateFR(iso) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T12:00:00Z`))
}

// Preserve security and share-class boundaries; provider groupings remain explicit.
export function portfolioCompanies(holdings) {
  return holdings.map(row => ({ ...row })).sort((a,b) => b.weight-a.weight)
}

export function buildTweet(portfolio, intro = '') {
  if (portfolio.kind === 'model') return buildModelTweet(portfolio, intro, percentage)
  const { identity, snapshot } = portfolio
  if (portfolio.problem) return `Portefeuille de ${portfolioOwner(portfolio)} :\n\nPositions au ${dateFR(snapshot.periodEnd)}\n\nDonnées incomplètes : ${portfolio.problem}`
  const plan = publicationPlan(portfolio)
  return [
    `Portefeuille de ${portfolioOwner(portfolio)} :`,
    `Positions déclarées au ${dateFR(snapshot.periodEnd)} · hors options`,
    [...plan.entries].sort((a,b) => b.weight-a.weight).map(row => `${row.other ? '📦' : emojiFor(row.ticker || logoIdentity(row)?.id)} ${row.label} : ${percentage(row.weight)} · ${cash(row.value, plan.currency)}`).join('\n'),
    ...(snapshot.reconciliationWarning ? ['Chiffres SEC ; le fournisseur affiche un autre total.'] : []),
    'Quelle ligne aimerais-tu avoir dans ton portefeuille ? 👇',
  ].join('\n\n')
}

export async function loadPortfolio(slug, signal) {
  if (investorModel(slug)) return modelPortfolio(slug)
  if (!INVESTORS.some(([key]) => key === slug)) throw new Error('Investisseur inconnu.')
  const url = `${import.meta.env.BASE_URL}data/investors/${slug}.json`
  const response = await fetch(url, { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error(`Données indisponibles (${response.status}). Réessaie plus tard.`)
  const portfolio = normalizePortfolio(await response.json())
  if (portfolio.identity.slug !== slug) throw new Error('La réponse ne correspond pas à l’investisseur choisi.')
  try {
    const reviewResponse = await fetch(`${import.meta.env.BASE_URL}data/investors/review-metadata.json`, { signal, cache: 'no-cache' })
    if (reviewResponse.ok) {
      const review = (await reviewResponse.json()).find(row => row.data?.identity?.slug === slug && row.data?.snapshot?.periodEnd === portfolio.snapshot.periodEnd)
      portfolio.lastSuccessfulPollAt = review?.lastSuccessfulPollAt || null
      portfolio.lastError = review?.lastAttemptStatus === 'failed' ? review.lastError : null
    }
  } catch (error) { if (error.name === 'AbortError') throw error }
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/investors/media/manifest.json`, {signal,cache:'no-cache'})
    if(response.ok)portfolio.media={portrait:(await response.json())[slug]}
  } catch(error) {if(error.name==='AbortError')throw error}
  return portfolio
}
