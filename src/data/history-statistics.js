import { ASSETS } from './market-history.js'
import { MARKET_HISTORY_REVIEW } from './market-history-review.js'
import { DIVERSIFICATION_HISTORY } from './diversification-history.js'
import { MSCI_HISTORY } from './msci-history.js'
import { COMPANY_HISTORY } from './company-history.js'
import { MONTHLY_HISTORY_ADDITIONS } from './monthly-history-additions.js'
// Calcul sur les seules clôtures mensuelles ajustées, jamais sur des prix interpolés.
// Le drawdown mensuel peut sous-estimer une baisse entre deux clôtures.
const baselineHistories = { ...COMPANY_HISTORY, ...MONTHLY_HISTORY_ADDITIONS, ...DIVERSIFICATION_HISTORY, msciWorldSmallCap: MSCI_HISTORY.msciWorldSmallCap }
const histories = Object.fromEntries(Object.keys(baselineHistories).map(id => [id, ASSETS[id]]))
const reviews = MARKET_HISTORY_REVIEW
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
const monthName = date => new Date(`${date}-01T00:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
export const HISTORY_FACTS = HISTORY_STATISTIC_IDS.flatMap(id => {
  const asset = histories[id]
  const points = asset.points
  const stats = monthlyDrawdown(points)
  const evidence = reviews[`history:${id}`]
  const period = `${points[0].date} à ${points.at(-1).date}`
  const note = asset.methodNote && asset.priceUnit === 'points' ? `${asset.methodNote} Calcul sur les seuls niveaux mensuels ; hors frais et fiscalité.` : `${asset.isin ? 'Calcul sur les cours mensuels ajustés de l’ETF, revenus réinvestis. Frais du fonds déjà inclus ; hors frais du courtier et fiscalité.' : asset.priceMethod === 'adjusted' ? 'Calcul sur les clôtures mensuelles ajustées, dividendes réinvestis et divisions d’actions pris en compte. Hors frais et fiscalité.' : 'Calcul sur les niveaux mensuels d’un indice de prix, dividendes non réinvestis. Hors frais et fiscalité ; ce n’est pas la performance d’un ETF.'} Devise : ${asset.currency}.${asset.returnNote ? ' ' + asset.returnNote : ''}`
  const common = { methodNote: note, family: asset.isin ? 'obligations-historiques' : asset.priceUnit === 'points' ? 'indices-historiques' : 'actions-historiques', indices: [asset.label], source: `${asset.methodNote && /MSCI/.test(asset.label) ? 'MSCI' : 'Yahoo Finance'} · ${evidence.sourceUrls[0]}`, note }
  const initial = points.length * 100
  const lump = initial * points.at(-1).price / points[0].price
  const dca = points.reduce((units, p) => units + 100 / p.price, 0) * points.at(-1).price
  const money = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' ' + asset.currency
  // Revue éditoriale 10/10/2026 : raconter le parcours, sans inventer sa cause.
  // Les deux scénarios et les bornes mensuelles conservent exactement leurs calculs.
  const gap = lump - dca
  const start = monthName(points[0].date)
  const end = monthName(points.at(-1).date)
  const recovery = stats.recovery
    ? `Il faut attendre ${monthName(stats.recovery.date)} pour retrouver le niveau de ${monthName(stats.peak.date)}, soit ${stats.monthsToRecovery} mois après ce sommet.`
    : `À la dernière clôture disponible, en ${end}, le niveau de ${monthName(stats.peak.date)} n’a toujours pas été retrouvé.`
  const waiting = !stats.recovery
    ? 'L’histoire reste donc ouverte à la fin de cette série, même si le graphique donne déjà du recul sur la chute.'
    : stats.monthsToRecovery >= 120
      ? 'Plus de dix ans pour retrouver ce niveau, c’est long quand cet argent devait servir à un projet.'
      : stats.monthsToRecovery >= 60
        ? 'Pendant toutes ces années, il fallait vivre la baisse sans connaître la date du retour à ce niveau.'
        : stats.monthsToRecovery >= 12
          ? 'Sur le graphique, on voit déjà le retour au sommet. Les investisseurs qui traversaient la baisse, eux, ne connaissaient pas encore la suite.'
          : 'Le retour à ce niveau arrive assez vite avec le recul. Mais pendant la chute, rien ne permettait de connaître cette date à l’avance.'
  const drawdownHook = stats.drawdown < 0
    ? `${asset.label} a perdu ${pct(Math.abs(stats.drawdown))} % entre ${monthName(stats.peak.date)} et ${monthName(stats.trough.date)}, d’après ses clôtures mensuelles.`
    : `Sur l’historique mensuel disponible de ${asset.label}, chaque clôture est au moins aussi haute que les précédentes.`
  const drawdownContext = stats.drawdown < 0
    ? `C’est la plus forte baisse depuis un sommet dans la série qui va de ${start} à ${end}.\n\n${recovery}`
    : `La série va de ${start} à ${end}. Elle ne montre donc aucune baisse depuis un sommet entre deux clôtures mensuelles, même si les cours ont pu reculer à l’intérieur d’un mois.`
  const comparisonEnding = gap > 0
    ? `À l’arrivée, le placement en une fois vaut environ ${money(gap)} de plus. L’argent a travaillé plus longtemps, mais il a aussi été exposé aux baisses dès le départ.`
    : gap < 0
      ? `À l’arrivée, les achats mensuels valent environ ${money(-gap)} de plus. Sur ce parcours précis, étaler les achats a mieux fonctionné que tout investir au départ.`
      : 'À l’arrivée, les deux approches donnent le même montant, malgré des dates d’achat différentes.'
  return [
    { ...common, id: `monthly-drawdown-${id}`, category: 'Baisse maximale mensuelle',
      hook: drawdownHook,
      context: drawdownContext,
      twist: `${stats.drawdown < 0 ? waiting + '\n\n' : ''}Les clôtures mensuelles peuvent masquer une baisse plus forte en cours de mois. Ce n’est pas une limite à ce que ce placement pourrait perdre à l’avenir.`,
      fact: `Baisse et récupération calculées sur les seuls points mensuels (${period}). ${note}` },
    { ...common, id: `monthly-dca-${id}`, category: 'Tout investir ou étaler',
      hook: `Tu as ${money(initial)} à investir sur ${asset.label}. Tu mets tout d’un coup ou tu prends ton temps ?`,
      context: `J’ai comparé les deux sur son historique de ${start} à ${end}.\n\nEn investissant toute la somme à la première clôture, le placement termine à environ ${money(lump)}. En achetant pour 100 ${asset.currency} à chaque clôture mensuelle, il termine à environ ${money(dca)}.\n\nLa somme versée est la même dans les deux cas.`,
      twist: `${comparisonEnding}\n\nDans ce calcul, l’argent qui attend d’être investi ne rapporte rien. Le résultat raconte cette période, pas ce que donnera le prochain départ.`,
      fact: `Versements aux clôtures mensuelles (${period}), fractions de titres admises. ${note}` },
  ]
})
