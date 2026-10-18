import FX from './monthly-fx.json' with { type: 'json' }
import { fxRate } from '../lib/fx-rate.js'
import { conversionNote, currencyWord } from '../lib/performance-conventions.js'
export function monthlyCurrencyFactor(date, source, target, fx = FX) {
  if (source === target) return 1
  const rates = fx.months[date]?.rates
  const a = fxRate(rates, source), b = fxRate(rates, target)
  if (!a || !b) throw new Error(`Change BCE absent pour ${source}/${target} en ${date}.`)
  return b / a
}
export function historyInCurrency(asset, target, start = asset.points[0].date, end = asset.points.at(-1).date, fx = FX) {
  if (!target || target === 'native' || target === 'original' || target === asset.currency) return asset
  if (!['EUR', 'USD'].includes(target)) throw new Error('Devise de calcul invalide.')
  const lastRate = Object.keys(fx.months).sort().at(-1)
  const points = asset.points.filter(p => p.date >= start && p.date <= end && p.date <= lastRate)
    .map(p => ({ ...p, price: p.price * monthlyCurrencyFactor(p.date, asset.currency, target, fx) }))
  if (!points.length || points[0].date > start) throw new Error('Historique de change incomplet sur cette période.')
  const note = `${conversionNote({ method: 'ecb' })} (${asset.currency} → ${target})`
  const method = asset.methodNote?.replace(/en dollars|en euros|en livres|en yens|en francs suisses/g, `en ${currencyWord(target)}`).replace(new RegExp(`\b${asset.currency}\b`, 'g'), target)
  return { ...asset, currency: target, originalCurrency: asset.currency, fxConverted: true,
    methodNote: [method, note].filter(Boolean).join(' · '), sourceCredit: [asset.sourceCredit, 'BCE'].filter(Boolean).join(' · '),
    fxSourceUrl: fx.sourceUrl, points }
}
export function historyCurrencies(asset, start, end) {
  return ['EUR','USD'].filter(currency => { try { historyInCurrency(asset, currency, start, end); return true } catch { return false } })
}
