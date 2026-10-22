import { ASSETS, LATEST_YM, MONTHS_FULL, getAssetMinDate, SPARSE_MONTHLY_DATA_IDS, INCONSISTENT_MONTHLY_DATA_IDS } from '../../data/calculator-history.js'
import { computeAssetSeries, monthsBetween, fmtEUR, fmtPct, pct } from './lib.js'

// Fixed editorial dates, shared by every asset: never optimize the entry dates
// using that asset's future returns or present these as its exact peak/trough.
export const CRISES = [
  { id: 'covid', label: 'Covid (2020)', dates: ['2019-12', '2020-03', '2020-06'] },
  { id: 'inflation', label: 'Inflation et hausse des taux (2022)', dates: ['2021-12', '2022-06', '2023-01'] },
]
export const ENTRY_LABELS = ['Avant la crise', 'Pendant la crise', 'Après la crise']
export const crisisDateLabel = ym => `${MONTHS_FULL[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`

export function lossMonths(result) {
  let total = 0, longest = 0, current = 0
  result.series.forEach((value, i) => {
    if (value < result.invested[i] - Math.max(1, result.invested[i]) * 1e-10) {
      total++; current++; longest = Math.max(longest, current)
    } else current = 0
  })
  return { total, longest, stillUnderwater: current > 0 }
}

export function compareCrisis({ assetId, crisisId, amount, mode }) {
  const asset = ASSETS[assetId], crisis = CRISES.find(c => c.id === crisisId)
  const blocked = message => ({ available: false, message })
  if (!asset || !crisis) return blocked('Choisis un actif avec un historique et une crise.')
  if (!Number.isFinite(amount) || amount <= 0) return blocked('Indique un montant supérieur à 0.')
  if (!['lump', 'dca'].includes(mode)) return blocked('Choisis un mode de versement.')
  if (SPARSE_MONTHLY_DATA_IDS.has(assetId) || INCONSISTENT_MONTHLY_DATA_IDS.has(assetId)) {
    return blocked('Cette option nécessite un historique mensuel fiable pour mesurer les périodes en perte.')
  }
  const endYm = [asset.points.at(-1).date, LATEST_YM].sort()[0]
  if (crisis.dates[0] < getAssetMinDate(assetId) || crisis.dates.at(-1) > endYm) {
    return blocked('L’historique de cet actif ne couvre pas les trois dates de cette crise. Choisis une autre crise ou un autre actif.')
  }
  const points = new Map(asset.points.map(p => [p.date, p.price]))
  if (!monthsBetween(crisis.dates[0], endYm).every(ym => Number.isFinite(points.get(ym)) && points.get(ym) > 0)) {
    return blocked('Des clôtures mensuelles manquent sur cette période. Choisis une autre crise ou un autre actif.')
  }
  const entries = crisis.dates.map((startYm, i) => {
    const result = computeAssetSeries(asset.points, startYm, endYm, amount, mode)
    return { label: ENTRY_LABELS[i], startYm, result, loss: lossMonths(result) }
  })
  return { available: true, asset, assetId, crisis, amount, mode, endYm, entries }
}

export function crisisMethodNote(asset) {
  if (asset.methodNote) return asset.methodNote
  if (asset.priceMethod === 'adjusted') return asset.isin && asset.instrumentType !== 'EQUITY'
    ? 'Cours ajustés, revenus réinvestis, frais du produit inclus ; hors frais du courtier et fiscalité.'
    : 'Dividendes réinvestis et divisions d’actions pris en compte ; hors frais et fiscalité.'
  return asset.returnNote || 'Simulation sur les cours historiques de l’actif ; hors frais et fiscalité.'
}

export function buildCrisisTweet(comparison) {
  if (!comparison.available) return ''
  const { asset, crisis, amount, mode, endYm, entries } = comparison
  const lines = [
    `Et si tu avais commencé à investir juste avant une crise ? 👀`, '',
    `${asset.label} · ${crisis.label}`,
    `${fmtEUR(amount, asset.currency)}${mode === 'dca' ? ' par mois' : ' investis en une fois'} · résultats en ${crisisDateLabel(endYm)}`, '',
  ]
  for (const { label, startYm, result, loss } of entries) {
    lines.push(`${label} — ${crisisDateLabel(startYm)}`,
      `💰 Versé : ${fmtEUR(result.totalInvested, asset.currency)} → capital : ${fmtEUR(result.finalValue, asset.currency)}`,
      `Gain/perte sur les versements : ${fmtPct(pct(result.finalValue, result.totalInvested))}`,
      `📉 ${loss.total} mois en perte au total, dont ${loss.longest} consécutifs au maximum.${loss.stillUnderwater ? ' Encore en perte à la fin.' : ''}`, '')
  }
  if (mode === 'dca') lines.push('Même versement mensuel, mais durées et sommes totales versées différentes.', '')
  lines.push('Repères de départ fixes, pas les sommets ou creux exacts de cet actif. Mois en perte : capital inférieur aux versements cumulés à la clôture mensuelle.',
    crisisMethodNote(asset))
  if (asset.sourceCredit) lines.push(asset.sourceCredit)
  lines.push('', '💬 Tu aurais continué à investir pendant la baisse ?', '', 'Pas un conseil financier')
  return lines.join('\n')
}
