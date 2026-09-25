import { ETFS } from '../etf-sheets/data.js'
import { getAnnualPerformance } from '../etf-sheets/annualPerformance.js'
import { YEARS, getAsset } from '../portfolio-generator/data.js'
import { computeYearlyPerf } from '../portfolio-generator/performance.js'
import { ITEM_BY_ID, CATALOG, FX_SOURCE, euroReturn } from './catalog.js'

const cardByIsin = new Map(ETFS.map((etf) => [etf.isin, etf]))
const INITIAL = 10_000
const EXISTING_SOURCES = {
  msci_em: 'https://www.ishares.com/de/privatanleger/de/literature/fact-sheet/eimi-ishares-core-msci-em-imi-ucits-etf-fund-fact-sheet-de-de.pdf',
  msci_world_ishares: 'https://www.ishares.com/gls-download/literature/fact-sheet/swda-ishares-core-msci-world-ucits-etf-fund-fact-sheet-en-gb.pdf',
  ftse_allworld_vanguard: 'https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf',
}

function portfolio(common, satellite, name) {
  const assets = [{ ...common, pct: 70 }, { ...satellite, pct: 30 }]
  const annual = computeYearlyPerf(assets)
  let final = INITIAL
  for (const year of YEARS) final *= 1 + annual[year] / 100
  const worstYear = YEARS.reduce((worst, year) => annual[year] < annual[worst] ? year : worst)
  return { name, assets, annual, final, worstYear, worst: annual[worstYear] }
}

export function buildDuel(definition) {
  const ids = [definition.common, definition.left, definition.right]
  if (new Set(ids).size !== 3) throw new Error(`Duel sans contraste unique : ${definition.id}`)
  const assets = ids.map((id) => getAsset(id))
  if (assets.some((asset) => !asset?.isin)) throw new Error(`Actif absent : ${definition.id}`)
  const series = assets.map((asset) => {
    const card = cardByIsin.get(asset.isin)
    return card ? getAnnualPerformance(card) : null
  })
  if (series.some((s) => !s || s.values.length !== YEARS.length || !s.values.every(Number.isFinite))) {
    throw new Error(`Part sans six années vérifiées : ${definition.id}`)
  }
  if (new Set(series.map((s) => s.currency)).size !== 1) {
    throw new Error(`Devises incompatibles : ${definition.id}`)
  }
  if (assets.some((asset, i) => asset.r.some((value, year) => value !== series[i].values[year]))) {
    throw new Error(`Données divergentes entre outils : ${definition.id}`)
  }
  const [common, left, right] = assets
  return {
    ...definition,
    currency: series[0].currency,
    commonAsset: common,
    a: portfolio(common, left, definition.labels[0]),
    b: portfolio(common, right, definition.labels[1]),
    sources: assets.map((asset, i) => ({ name: asset.name, isin: asset.isin, url: series[i].source ?? EXISTING_SOURCES[asset.id] })),
  }
}

export function formatPercent(value) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

export function formatCapital(value, currency) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(value))} ${currency === 'USD' ? '$' : '€'}`
}

export function buildCustomDuel(definition) {
  const selection = [...definition.left, ...definition.right]
  for (const [side, lines] of [['A', definition.left], ['B', definition.right]]) {
    if (lines.length < 2 || lines.length > 5) throw new Error(`Le portefeuille ${side} doit avoir 2 à 5 actifs.`)
    if (new Set(lines.map((line) => line.id)).size !== lines.length) throw new Error(`Actif en double dans le portefeuille ${side}.`)
    if (lines.some((line) => !ITEM_BY_ID.has(line.id) || !Number.isInteger(line.pct) || line.pct < 1 || line.pct > 95)) {
      throw new Error(`Choix ou pondération invalide dans le portefeuille ${side}.`)
    }
    if (lines.reduce((total, line) => total + line.pct, 0) !== 100) throw new Error(`Le portefeuille ${side} doit totaliser 100 %.`)
  }
  const years = YEARS.filter((year) => selection.every((line) => Number.isFinite(euroReturn(ITEM_BY_ID.get(line.id), year))))
  if (years.length < 3 || years.some((year, i) => i && year !== years[i - 1] + 1) || years.at(-1) !== 2025) {
    throw new Error('Il faut au moins trois années consécutives communes se terminant en 2025.')
  }
  const makePortfolio = (lines, name) => {
    const assets = lines.map((line) => ({ ...ITEM_BY_ID.get(line.id), pct: line.pct }))
    const annual = Object.fromEntries(years.map((year) => [year, assets.reduce((total, asset) => total + asset.pct * euroReturn(asset, year) / 100, 0)]))
    let final = INITIAL
    for (const year of years) final *= 1 + annual[year] / 100
    const worstYear = years.reduce((worst, year) => annual[year] < annual[worst] ? year : worst)
    return { name, assets, annual, final, worstYear, worst: annual[worstYear] }
  }
  const unique = [...new Set(selection.map((line) => line.id))].map((id) => ITEM_BY_ID.get(id))
  return {
    id: definition.id ?? 'composition-personnalisee', title: definition.title ?? 'Deux choix, deux portefeuilles',
    hook: definition.hook ?? 'Deux portefeuilles, le même montant au départ. Tu aurais choisi lequel ?',
    question: definition.question ?? 'Tu aurais choisi A ou B ? 👇', currency: 'EUR', years,
    a: makePortfolio(definition.left, definition.labels?.[0] ?? 'Portefeuille A'),
    b: makePortfolio(definition.right, definition.labels?.[1] ?? 'Portefeuille B'),
    sources: [...unique.map((asset) => ({ name: asset.name, url: asset.source, note: asset.note })),
      { name: 'Taux EUR/USD de fin d’année (BCE)', url: FX_SOURCE, note: 'Conversion annuelle des rendements en USD vers EUR.' }],
  }
}

export { CATALOG }

export function buildTweet(duel) {
  const { a, b, commonAsset, currency } = duel
  const years = duel.years ?? YEARS
  const symbol = currency === 'USD' ? '$' : '€'
  const rows = years.map((year) =>
    `${year} : ${formatPercent(a.annual[year])} / ${formatPercent(b.annual[year])}`,
  ).join('\n')
  if (!commonAsset) {
    const allocation = (portfolio) => portfolio.assets.map((asset) => `${asset.pct} % ${asset.name}`).join('\n')
    return `⚔️ ${duel.hook}\n\n` +
      `Même départ : 10 000 ${symbol}, de ${years[0]} à ${years.at(-1)}.\n\n` +
      `🅰️ ${a.name}\n${allocation(a)}\n\n` +
      `🅱️ ${b.name}\n${allocation(b)}\n\n` +
      `À l’arrivée : A ${formatCapital(a.final, currency)} · B ${formatCapital(b.final, currency)}.\n\n` +
      `📊 Chaque année (A / B) :\n${rows}\n\n` +
      `📉 Pire année : A ${formatPercent(a.worst)} en ${a.worstYear}, B ${formatPercent(b.worst)} en ${b.worstYear}.\n\n` +
      `${duel.question}\n\n⚠️ Pas un conseil en investissement.`
  }
  return `⚔️ ${duel.hook}\n\n` +
    `Même point de départ : 10 000 ${symbol} investis de 2020 à 2025.\n` +
    `70 % dans ${commonAsset.name} pour les deux. Le choix porte sur les 30 % restants :\n\n` +
    `🅰️ ${a.name} : ${a.assets[1].name}\n` +
    `🅱️ ${b.name} : ${b.assets[1].name}\n\n` +
    `À l'arrivée : ${formatCapital(a.final, currency)} pour A, ${formatCapital(b.final, currency)} pour B.\n\n` +
    `📊 Chaque année (A / B) :\n${rows}\n\n` +
    `📉 Pire année : A ${formatPercent(a.worst)} en ${a.worstYear}, B ${formatPercent(b.worst)} en ${b.worstYear}.\n\n` +
    `${duel.question}\n\n⚠️ Pas un conseil en investissement.`
}
