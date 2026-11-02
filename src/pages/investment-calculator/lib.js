import { requireHistoryWindow } from '../../data/history-window-quality.js'
import { LIVRET_A, INFLATION } from '../../data/history-parameters.js'
import { historyInCurrency } from '../../data/history-currency.js'
import { monthlyCurrencyFactor } from '../../data/history-currency.js'
import { fmtEUR, fmtPct } from '../../lib/format-currency.js'
import { monthlyHistoryMethod } from '../../lib/performance-conventions.js'
export { fmtEUR, fmtPct } from '../../lib/format-currency.js'
import { INFLATION_MONTHLY } from '../../data/inflation-monthly.js'
// Logique de calcul partagée avec Tweet Midi.
import { ASSETS, LATEST_YM, MONTHS_FULL, INCONSISTENT_MONTHLY_DATA_IDS, getAssetMinDate } from '../../data/calculator-history.js'

import { ymIndex,monthsBetween,clampYm,computeAssetSeries,sparseAssetSeries,computeBenchmarkSeries,computeCustomSeries,pct,applyPriceOverride } from '../../lib/investment-series.js'
export { ymIndex,indexToYm,monthsBetween,clampYm,interpolatePrice,computeAssetSeries,sparseAssetSeries,computeBenchmarkSeries,computeLivretSeries,computeCustomSeries,currencySymbol,pct,applyPriceOverride } from '../../lib/investment-series.js'
export function indexAnchorPoints(assetId, endYm) {
  return ASSETS[assetId].points.filter((point) => point.date.endsWith('-12') || point.date === endYm)
}

export function derive(state) {
  const inputs = [state.amountRaw, ...(state.assetId === 'custom' ? [state.customStart, state.customEnd] : [state.overridePriceRaw])]
  if (inputs.some(raw => raw !== '' && raw !== undefined && (!Number.isFinite(Number(raw)) || Number(raw) <= 0))) {
    throw Error('Montant ou prix invalide : saisis un nombre fini supérieur à 0.')
  }
  if(ASSETS[state.assetId]?.allowPriceOverride===false && state.overridePriceRaw) throw Error('Un prix de part ne peut pas revaloriser cette série en unités de performance.')
  if(state.assetId!=='custom' && ASSETS[state.assetId]?.historyPending) throw Error('Charger l’historique avant le calcul')
  const amount = parseFloat(state.amountRaw) || 0
  const isCustom = state.assetId === 'custom'
  const effectiveMode = isCustom || INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId) ? 'lump' : state.mode
  const requestedStart = clampYm(state.startYear + '-' + (state.startMonth < 10 ? '0' + state.startMonth : state.startMonth), LATEST_YM)
  const minimum = isCustom ? null : getAssetMinDate(state.assetId)
  // The engine also honours the verified floor, including when called outside the form.
  const startYm = minimum && ymIndex(requestedStart) < ymIndex(minimum) ? minimum : requestedStart
  // Sans prix saisi, on s'arrête au dernier mois réellement renseigné pour cet actif.
  // Sinon le DCA achète des mois supplémentaires au dernier prix, sans donnée de marché.
  const requestedEnd = isCustom ? null : ASSETS[state.assetId].points.at(-1).date
  const asset = isCustom ? null : historyInCurrency(ASSETS[state.assetId], state.currency, startYm, requestedEnd)
  const lastAssetYm = isCustom ? clampYm(Object.keys(INFLATION_MONTHLY).sort().at(-1), LATEST_YM) : asset.points.at(-1).date
  // Le prix facultatif revalorise les parts au terme de cette série, sans inventer
  // de nouveaux versements mensuels entre la dernière clôture et la saisie.
  const endYm = clampYm(lastAssetYm, LATEST_YM)
  const safeStartYm = ymIndex(startYm) > ymIndex(endYm) ? endYm : startYm

  if (!isCustom) requireHistoryWindow(ASSETS[state.assetId], safeStartYm, endYm, { contiguous: !INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId) && !ASSETS[state.assetId].priceUnit })

  let result = isCustom
    ? computeCustomSeries(safeStartYm, endYm, amount, state.customStart, state.customEnd)
    : INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId)
      ? sparseAssetSeries(indexAnchorPoints(state.assetId, endYm), safeStartYm, endYm, amount)
      : computeAssetSeries(asset.points, safeStartYm, endYm, amount, effectiveMode)

  if (!isCustom) {
    const override = state.overridePriceRaw && asset.fxConverted ? String(Number(state.overridePriceRaw) * monthlyCurrencyFactor(endYm, ASSETS[state.assetId].currency, asset.currency)) : state.overridePriceRaw
    result = applyPriceOverride(result, asset.points, override, endYm)
  }

  const compareEuro = isCustom || asset.currency === 'EUR'
  const livretComplete = monthsBetween(safeStartYm, endYm).slice(1)
    .every(month => Object.keys(LIVRET_A).some(since => since <= month))
  const livretA = compareEuro && livretComplete ? computeBenchmarkSeries(LIVRET_A, safeStartYm, endYm, amount, effectiveMode) : null
  // Market month-ends can arrive before INSEE. Keep the market result available
  // and omit a benchmark whose full period has not yet been published.
  const inflationComplete = monthsBetween(safeStartYm, endYm).slice(1)
    .every(month => month < '2017-01' ? Number.isFinite(INFLATION[Number(month.slice(0,4))]) : INFLATION_MONTHLY[month] !== undefined)
  const inflation = compareEuro && inflationComplete ? computeBenchmarkSeries(INFLATION, safeStartYm, endYm, amount, effectiveMode) : null

  if ([result, livretA, inflation].filter(Boolean).some(value =>
    ![value.finalValue, value.totalInvested, ...value.series, ...value.invested].every(Number.isFinite))) {
    throw Error('Ces valeurs dépassent la capacité de calcul. Réduis le montant ou les prix saisis.')
  }
  return { asset, currency: asset?.currency ?? 'EUR', amount, isCustom, effectiveMode, startYm: safeStartYm, endYm, result, livretA, inflation }
}

export function buildTweetText(state, d) {
  const asset = d.isCustom ? null : d.asset ?? ASSETS[state.assetId]
  const assetLabel = d.isCustom ? (state.customLabel || 'cet actif') : asset.label
  // Actif coté en dollars (Amazon, S&P 500, Or...) : le montant simulé et le résultat restent dans
  // cette devise plutôt que mélangés avec un € qui donnerait un faux air de conversion (demande
  // utilisateur du 22/09/2026) — cf. le même choix dans App.jsx (ResultCard) et videoExport.js.
  const currency = asset ? asset.currency : 'EUR'
  const monthLabel = MONTHS_FULL[parseInt(d.startYm.split('-')[1], 10) - 1]
  const yearLabel = d.startYm.split('-')[0]
  const gainPct = pct(d.result.finalValue, d.result.totalInvested)
  const finalFmt = fmtEUR(d.result.finalValue, currency)
  const amountFmt = fmtEUR(d.amount, currency)
  const investmentLabel = d.isCustom ? assetLabel : asset.tweetPhrase

  const endLabel = `${MONTHS_FULL[Number(d.endYm.split('-')[1]) - 1]} ${d.endYm.split('-')[0]}`
  const gainAbs = d.result.finalValue - d.result.totalInvested
  const monthly = d.effectiveMode === 'dca'
  const monthlyAverage = asset?.historyConvention === 'monthly-average'
  const endingQuestion = d.isCustom
    ? 'Quelle évolution du prix voudrais-tu comparer à ce scénario ?'
    : monthly
    ? 'Tu aurais conservé ce rythme de versement sur cette durée ?'
    : 'Tu aurais gardé ce placement jusqu’au bout ?'
  const hookLine = d.effectiveMode === 'dca'
    ? `Et si tu avais investi ${amountFmt} par mois dans ${investmentLabel} depuis ${monthLabel} ${yearLabel} ? 🫢`
    : `Et si tu avais investi ${amountFmt} dans ${investmentLabel} en ${monthLabel} ${yearLabel} ? 🫢`

  const lines = [
    hookLine,
    '',
    `${d.isCustom ? `Avec les deux prix saisis, cette somme passerait de ${amountFmt} à ${finalFmt}` : state.overridePriceRaw ? `Au prix final saisi, voici le résultat en ${endLabel}` : monthlyAverage ? `En ${endLabel}, voici le résultat` : `À la clôture de ${endLabel}, voici le résultat`} 👇`,
    '',
    `💰 ${monthly ? 'Total versé' : 'Somme investie'} : ${fmtEUR(d.result.totalInvested, currency)}`,
    `${gainAbs < 0 ? '📉' : '📈'} Capital final : ${finalFmt}`,
    `${gainAbs < 0 ? '🔴 Perte' : '🟢 Gain'} : ${fmtEUR(Math.abs(gainAbs), currency)}${monthly ? '' : ` (${fmtPct(gainPct)})`}`,
    ...(monthly ? [`📊 ${gainAbs < 0 ? 'Perte' : 'Gain'} sur les sommes versées : ${fmtPct(gainPct)}`] : []),
  ]
  const paymentCount = d.result.months?.length
  const payments = paymentCount ? `${paymentCount} versement${paymentCount === 1 ? '' : 's'}` : 'Versements'
  const timing = monthlyAverage ? paymentCount === 1 ? 'mensuel simulé' : 'mensuels simulés' : paymentCount ? 'en fin de mois' : 'mensuels en fin de mois'
  if (monthly) lines.push('', `${payments} ${timing}, de ${monthLabel} ${yearLabel} à ${endLabel}, inclus.`)
  else if (!d.isCustom) lines.push('', monthlyAverage
    ? `Versement unique valorisé avec la moyenne de ${monthLabel} ${yearLabel}.`
    : `Versement unique à la clôture de ${monthLabel} ${yearLabel}.`)
  if (monthlyAverage) lines.push('', 'Simulation indicative sur des moyennes mensuelles de prix, hors frais et fiscalité.')
  if (d.isCustom) lines.push('', 'Scénario fondé uniquement sur les deux prix saisis, sans historique de marché, hors frais et fiscalité.')
  if (asset?.methodNote) lines.push('', asset.methodNote)

  if (state.assetId === 'silver') {
    lines.push('', 'Prix de futures COMEX continus en dollars, sans frais ni renouvellement des contrats : ce calcul ne représente pas le rendement d’un placement réel en argent.')
  }
  if (asset && monthlyHistoryMethod(asset)) lines.push('', monthlyHistoryMethod(asset))

  // Comparaison Livret A : uniquement pour les actifs en euros, jamais un montant en dollars
  // comparé à un Livret A en euros sans taux de change — même règle que ResultCard côté UI
  // (demande utilisateur du 22/09/2026, le mélange de devises corrigé plus tôt dans la session).
  const hasLivretCompare = currency === 'EUR' && d.livretA
  if (hasLivretCompare) {
    lines.push('', `Avec les mêmes versements sur un Livret A : ${fmtEUR(d.livretA.finalValue, 'EUR')} (simulation indicative)`)
  }
  if (asset?.sourceCredit) lines.push('', asset.sourceCredit)
  lines.push('', `💬 ${endingQuestion}`)

  return lines.join('\n')
}
