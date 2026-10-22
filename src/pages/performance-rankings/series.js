import { commonCoverage, monthAt, monthIndex, portfolioReturn, validateSeries } from './engine.js'
import { monthlyCurrencyFactor } from '../../data/history-currency.js'

export function convertAsset(asset, currency, fx) {
  if (!currency || currency === 'original' || currency === asset.currency) return asset
  const factor = date => monthlyCurrencyFactor(date, asset.currency, currency, fx)
  // Prices and ECB rates are collected separately: a price month newer than the latest
  // rate shortens the converted period instead of disabling the asset. A gap inside the
  // rate history still fails.
  const latestRate = Object.keys(fx.months).sort().at(-1)
  const firstRate = Object.keys(fx.months).sort()[0]
  const covered = date => date >= firstRate && date <= latestRate
  const common = { ...asset, currency, originalCurrency: asset.currency, fxConverted: true, fxSourceUrl: fx.sourceUrl }
  if (asset.frequency === 'annual') {
    const years = Object.fromEntries(Object.entries(asset.years).filter(([year]) => covered(`${Number(year)-1}-12`) && covered(`${year}-12`)).map(([year, value]) => [year,
      ((1 + value / 100) * factor(`${year}-12`) / factor(`${Number(year) - 1}-12`) - 1) * 100]))
    return { ...common, years }
  }
  if (asset.portfolio) throw new Error('Convertis les lignes du portefeuille avant de le calculer.')
  const converted = { ...common, points: asset.points.filter(p => covered(p.date)).map(p => ({ date: p.date, price: p.price * factor(p.date) })) }
  validateSeries(converted)
  return converted
}

export function buildPortfolio({ id, label, lines, rebalance = 'annual' }, assets, currency, fx) {
  if (!id || !label.trim() || lines.length < 1 || lines.length > 6 || !['none', 'annual', 'monthly'].includes(rebalance)) throw new Error('Portefeuille invalide.')
  if (new Set(lines.map(l => l.id)).size !== lines.length || lines.some(l => !assets[l.id] || !Number.isFinite(Number(l.pct)) || Number(l.pct) <= 0)) throw new Error('Chaque portefeuille exige des actifs distincts et des poids positifs.')
  const total = lines.reduce((sum, l) => sum + Number(l.pct), 0)
  if (Math.abs(total - 100) > 1e-8) throw new Error(`${label} : les poids doivent totaliser 100 % (actuellement ${total} %).`)
  const converted = lines.map(line => ({ pct: Number(line.pct), asset: convertAsset(assets[line.id], currency, fx) }))
  if (converted.some(l => l.asset.frequency === 'annual' || l.asset.portfolio)) throw new Error('Les portefeuilles utilisent des historiques mensuels, sans calendrier annuel ni portefeuille imbriqué.')
  const members = converted.map(l => l.asset)
  members.forEach(validateSeries)
  if (members.some(a => ['monthly-average', 'price-index', 'futures-price'].includes(a.basis))) throw new Error('Convention de rendement non qualifiée pour une allocation.')
  const coverage = members.length === 1 ? { start: members[0].points[0].date, end: members[0].points.at(-1).date, currency: members[0].currency } : commonCoverage(members)
  const result = { id, label: label.trim(), shortLabel: label.trim(), currency: coverage.currency, basis: 'portfolio',
    fxConverted: members.some(a => a.fxConverted), frequency: 'monthly',
    indexVariants: [...new Set(members.flatMap(a => a.basis.startsWith('index-') ? [a.basis] : []))],
    portfolio: { lines: converted, rebalance }, points: [] }
  for (let index = monthIndex(coverage.start); index <= monthIndex(coverage.end); index++) {
    const date = monthAt(index)
    result.points.push({ date, price: index === monthIndex(coverage.start) ? 100 : 100 * (1 + portfolioReturn(result, coverage.start, date) / 100) })
  }
  validateSeries(result)
  return result
}
