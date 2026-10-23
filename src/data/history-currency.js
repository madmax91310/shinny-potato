import FX from './monthly-fx.json' with { type: 'json' }
import { fxRate } from '../lib/fx-rate.js'
import { conversionNote, currencyWord } from '../lib/performance-conventions.js'
export function monthlyCurrencyFactor(date, source, target, fx = FX) {
  if (source === target) return 1
  let rates = fx.months[date]?.rates
  if ([source,target].includes('TWD')) {
    const cross=fx.derived?.TWD?.observations?.[date]
    if(!cross?.asOf?.startsWith(`${date}-`)||!Number.isFinite(cross.value)||!Number.isFinite(cross.usdPerEur)||cross.value<=0||cross.usdPerEur<=0)throw new Error(`Fixing commun H.10/BCE absent en ${date}.`)
    // Legacy cross proofs retain USD/EUR at the common day; other currencies
    // require the full same-day ECB snapshot, never the later ECB month-end.
    rates={...(cross.ecbRates??{EUR:1,USD:cross.usdPerEur}),TWD:cross.value}
    if(rates.USD!==cross.usdPerEur)throw new Error(`Fixings H.10/BCE incompatibles en ${date}.`)
  }
  const a = fxRate(rates, source), b = fxRate(rates, target)
  if (!a || !b) throw new Error(`Change BCE absent pour ${source}/${target} en ${date}.`)
  return b / a
}
export function monthlyFxEvidence(currencies,fx=FX) {
  const cross=currencies.includes('TWD')?fx.derived?.TWD:null
  return {method:cross?'h10-ecb':'ecb',sourceCredit:cross?'Federal Reserve H.10 / BCE':'BCE',
    sourceUrls:[...new Set([cross?.sourceUrl,fx.sourceUrl].filter(Boolean))]}
}
export function historyInCurrency(asset, target, start = asset.points[0].date, end = asset.points.at(-1).date, fx = FX) {
  if (!target || target === 'native' || target === 'original' || target === asset.currency) return asset
  if (!['EUR', 'USD'].includes(target)) throw new Error('Devise de calcul invalide.')
  const lastRate = Object.keys(fx.months).sort().at(-1)
  const points = asset.points.filter(p => p.date >= start && p.date <= end && p.date <= lastRate)
    .map(p => ({ ...p, price: p.price * monthlyCurrencyFactor(p.date, asset.currency, target, fx) }))
  if (!points.length || points[0].date > start) throw new Error('Historique de change incomplet sur cette période.')
  const evidence=monthlyFxEvidence([asset.currency,target],fx)
  const note = `${conversionNote({ method: evidence.method })} (${asset.currency} → ${target})`
  const method = asset.methodNote?.replace(/en dollars|en euros|en livres|en yens|en francs suisses/g, `en ${currencyWord(target)}`).replace(new RegExp(`\b${asset.currency}\b`, 'g'), target)
  return { ...asset, currency: target, originalCurrency: asset.currency, fxConverted: true,
    methodNote: [method, note].filter(Boolean).join(' · '), sourceCredit: [asset.sourceCredit, evidence.sourceCredit].filter(Boolean).join(' · '),
    fxSourceUrl: evidence.sourceUrls[0], fxSourceUrls:evidence.sourceUrls, points }
}
export function historyCurrencies(asset, start, end) {
  return ['EUR','USD'].filter(currency => { try { historyInCurrency(asset, currency, start, end); return true } catch { return false } })
}
