import { ETFS } from '../etf-sheets/data.js'
import { getAnnualPerformance } from '../etf-sheets/annualPerformance.js'
import { YEARS, getAsset } from '../portfolio-generator/data.js'
import { computeYearlyPerf } from '../portfolio-generator/performance.js'

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

export function buildTweet(duel) {
  const { a, b, commonAsset, currency } = duel
  const common = commonAsset.name
  const rows = YEARS.map((year) =>
    `${year} · A ${formatPercent(a.annual[year])} | B ${formatPercent(b.annual[year])}`,
  ).join('\n')
  return `⚔️ ${duel.hook}\n\n` +
    `🅰️ 70 % ${common} + 30 % ${a.assets[1].name}\n` +
    `🅱️ 70 % ${common} + 30 % ${b.assets[1].name}\n\n` +
    `📅 2020–2025\n${rows}\n\n` +
    `💰 10 000 ${currency === 'USD' ? '$' : '€'} au départ → A ${formatCapital(a.final, currency)} | B ${formatCapital(b.final, currency)}\n` +
    `📉 Pire année : A ${formatPercent(a.worst)} (${a.worstYear}) | B ${formatPercent(b.worst)} (${b.worstYear})\n\n` +
    `💬 ${duel.question}\n⚠️ Pas un conseil en investissement`
}
