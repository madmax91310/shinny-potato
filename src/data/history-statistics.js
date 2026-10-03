import { COMPANY_HISTORY, COMPANY_HISTORY_REVIEW } from './company-history.js'
import { MONTHLY_HISTORY_ADDITIONS, MONTHLY_HISTORY_ADDITIONS_REVIEW } from './monthly-history-additions.js'
// Calcul sur les seules clôtures mensuelles ajustées, jamais sur des prix interpolés.
// Le drawdown mensuel peut sous-estimer une baisse entre deux clôtures.
const histories = { ...COMPANY_HISTORY, ...MONTHLY_HISTORY_ADDITIONS }
const reviews = { ...COMPANY_HISTORY_REVIEW, ...MONTHLY_HISTORY_ADDITIONS_REVIEW }
export const HISTORY_STATISTIC_IDS = Object.keys(histories)
const monthIndex = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
export function monthlyDrawdown(points) {
  if (!points.length || points.some(p => !Number.isFinite(p.price) || p.price <= 0)) throw new Error('Série de prix invalide')
  let peak = 0
  let result = { drawdown: 0, peak: points[0], trough: points[0], recovery: points[0], monthsToRecovery: 0 }
  for (let i = 1; i < points.length; i++) {
    if (points[i].price > points[peak].price) peak = i
    const drawdown = (points[i].price / points[peak].price - 1) * 100
    if (drawdown < result.drawdown) {
      const recovery = points.slice(i + 1).find(p => p.price >= points[peak].price) ?? null
      result = { drawdown, peak: points[peak], trough: points[i], recovery,
        monthsToRecovery: recovery ? monthIndex(recovery.date) - monthIndex(points[peak].date) : null }
    }
  }
  return result
}
const pct = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
export const HISTORY_FACTS = HISTORY_STATISTIC_IDS.flatMap(id => {
  const asset = histories[id]
  const points = asset.points
  const stats = monthlyDrawdown(points)
  const evidence = reviews[`history:${id}`]
  const period = `${points[0].date} à ${points.at(-1).date}`
  const note = `${asset.isin ? 'Calcul sur les cours mensuels ajustés de l’ETF, revenus réinvestis. Frais du fonds déjà inclus ; hors frais du courtier et fiscalité.' : asset.priceMethod === 'adjusted' ? 'Calcul sur les clôtures mensuelles ajustées, dividendes réinvestis et divisions d’actions pris en compte. Hors frais et fiscalité.' : 'Calcul sur les niveaux mensuels d’un indice de prix, dividendes non réinvestis. Hors frais et fiscalité ; ce n’est pas la performance d’un ETF.'} Devise : ${asset.currency}.${asset.returnNote ? ' ' + asset.returnNote : ''}`
  const common = { methodNote: note, family: asset.isin ? 'obligations-historiques' : 'actions-historiques', indices: [asset.label], source: `Yahoo Finance · ${evidence.sourceUrls[0]}`, note }
  const initial = points.length * 100
  const lump = initial * points.at(-1).price / points[0].price
  const dca = points.reduce((units, p) => units + 100 / p.price, 0) * points.at(-1).price
  const money = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' ' + asset.currency
  return [
    { ...common, id: `monthly-drawdown-${id}`, category: 'Baisse maximale mensuelle',
      hook: `${asset.label} : aurais-tu gardé tes titres après une baisse de ${pct(Math.abs(stats.drawdown))} % ?`,
      context: `Sur l’historique ${period}, la plus forte baisse entre un sommet et un creux de clôture mensuelle est de ${pct(stats.drawdown)} %, de ${stats.peak.date} à ${stats.trough.date}.`,
      twist: stats.recovery ? `Le niveau du sommet a été retrouvé en ${stats.recovery.date}, ${stats.monthsToRecovery} mois après ce sommet.` : `Ce sommet n’a pas été retrouvé à la dernière clôture disponible, ${points.at(-1).date}.`,
      question: 'Tu aurais continué, réduit ta position ou vendu ?', fact: `Baisse et récupération calculées sur les seuls points mensuels. ${note}` },
    { ...common, id: `monthly-dca-${id}`, category: 'Tout investir ou étaler',
      hook: `${asset.label} : tout investir au départ ou 100 ${asset.currency} chaque mois ?`,
      context: `De ${period}, pour ${money(initial)} versés au total :\n💰 Investissement unique à la première clôture : ${money(lump)} à la fin.\n📅 100 ${asset.currency} à chaque clôture mensuelle : ${money(dca)} à la fin.`,
      twist: 'Les montants versés sont identiques, mais l’argent est exposé au marché plus longtemps avec le versement unique. L’argent en attente n’est pas rémunéré dans ce calcul.',
      question: 'Tu préfères investir tout de suite ou étaler tes versements ?', fact: `Versements aux clôtures mensuelles, fractions de titres admises. ${note}` },
  ]
})
