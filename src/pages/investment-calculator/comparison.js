import { ASSETS, MONTHS_FULL } from '../../data/market-history.js'
import { fmtEUR, fmtPct, pct, monthsBetween } from './lib.js'
import { computeComparativeSeries } from './videoExport.js'

// One calculation shared by the post preview and the video export.
export function computeComparison(inputs, asset1Id, asset2Id, mode1, mode2) {
  const { amount, startYm, endYm, overrideAssetId, overridePriceRaw } = inputs
  const n = monthsBetween(startYm, endYm).length
  const total = inputs.mode === 'dca' ? amount * n : amount
  const side = (assetId, mode, override) => ({
    asset: ASSETS[assetId], mode, amount: mode === 'dca' ? total / n : total,
    override: Boolean(override),
    result: computeComparativeSeries(assetId, startYm, endYm, mode === 'dca' ? total / n : total, mode, override),
  })
  return {
    startYm, endYm,
    sides: [
      side(asset1Id, mode1, asset1Id === overrideAssetId ? overridePriceRaw : ''),
      side(asset2Id, mode2, asset2Id === overrideAssetId && asset2Id !== asset1Id ? overridePriceRaw : ''),
    ],
  }
}

const dateLabel = ym => `${MONTHS_FULL[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`

export function buildComparisonTweet(comparison) {
  const { sides, startYm, endYm } = comparison
  const lines = [
    'Et si tu avais choisi l’un de ces deux placements ? 👀', '',
    `📅 ${dateLabel(startYm)} → ${dateLabel(endYm)}`, '',
  ]
  sides.forEach(({ asset, mode, amount, result, override }, i) => {
    const gain = result.finalValue - result.totalInvested
    lines.push(
      `${i === 0 ? '🅰️' : '🅱️'} ${asset.label}`,
      mode === 'dca' ? `${fmtEUR(amount, asset.currency)} par mois · ${fmtEUR(result.totalInvested, asset.currency)} versés au total` : `${fmtEUR(amount, asset.currency)} investis au départ, sans versement supplémentaire`,
      `💰 Capital final : ${fmtEUR(result.finalValue, asset.currency)}`,
      `${gain < 0 ? '📉 Perte' : '📈 Gain'} : ${fmtEUR(Math.abs(gain), asset.currency)} (${fmtPct(pct(result.finalValue, result.totalInvested))}${mode === 'dca' ? ' des sommes versées' : ''})`,
    )
    if (override) lines.push('Valorisation au prix final saisi manuellement.')
    if (asset.methodNote) lines.push(asset.methodNote)
    else if (asset.priceMethod === 'adjusted') lines.push(asset.isin
      ? 'Revenus réinvestis, frais du fonds inclus ; hors frais du courtier et fiscalité.'
      : 'Dividendes réinvestis et divisions d’actions pris en compte ; hors frais et fiscalité.')
    if (asset.returnNote) lines.push(asset.returnNote)
    lines.push('')
  })
  const [a, b] = sides
  if (a.asset.currency === b.asset.currency) {
    const delta = Math.round(a.result.finalValue) - Math.round(b.result.finalValue)
    lines.push(delta === 0 ? '📊 Les deux placements terminent au même montant arrondi.'
      : `📊 ${fmtEUR(Math.abs(delta), a.asset.currency)} de plus pour le placement ${delta > 0 ? 'A' : 'B'}.`)
  } else lines.push('📌 Résultats dans la devise de chaque actif, sans conversion de change : les montants finaux ne sont pas directement comparables.')
  for (const credit of new Set(sides.map(side => side.asset.sourceCredit).filter(Boolean))) lines.push('', credit)
  lines.push('', '💬 Tu aurais choisi lequel, et pourquoi ?')
  return lines.join('\n')
}
