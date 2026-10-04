import { GENERAL_INFLATION, YEAR_MAX, POSTES, SMIC, PRICE_OBSERVATION } from '../../data/purchasing-power.js'

export const CURRENT_YEAR = 2026

// Moyenne de l’année de départ -> moyenne 2025 -> observation mensuelle datée.
export function cumulateRate(rateTable, startYear, latestFactor = PRICE_OBSERVATION.general / 100) {
  let factor = 1
  for (let y = startYear + 1; y <= PRICE_OBSERVATION.baseYear; y++) {
    const rate = rateTable[y]
    if (rate === undefined) throw new Error(`Inflation annuelle absente pour ${y}`)
    factor *= 1 + rate / 100
  }
  return factor * latestFactor
}

// Ratio simple entre deux points d'une série de NIVEAUX (IRL, SMIC).
export function cumulateLevel(levelTable, startYear) {
  const a = levelTable[startYear]
  const b = levelTable[CURRENT_YEAR]
  if (!a || !b) return 1
  return b / a
}

export function fmtEUR(n) {
  try {
    return (Math.round(n * 100) / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
  } catch {
    return Math.round(n).toLocaleString('fr-FR') + ' €'
  }
}

export function fmtPct(n) {
  const s = Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (n >= 0 ? '+' : '-') + s + ' %'
}

// Mode "brut" : combien vaut, en pouvoir d'achat réel, un montant fixé à startYear, exprimé en euros
// d'aujourd'hui — à partir de l'inflation générale INSEE (réutilisée depuis investment-calculator).
export function computeBrut(amount, startYear) {
  const factor = cumulateRate(GENERAL_INFLATION, startYear)
  const newAmount = amount * factor
  const inflationCumPct = Math.round((factor - 1) * 1e10) / 1e8
  return { amount, startYear, newAmount, inflationCumPct, factor }
}

// Mode "comparaison par poste" : combien il faut aujourd'hui pour ce que `amount` payait à
// startYear pour un poste donné (loyer = ratio de niveaux IRL, alimentation/carburant = taux composés).
export function computePoste(amount, startYear, posteId) {
  const poste = POSTES[posteId]
  const factor = poste.seriesType === 'level' ? cumulateLevel(poste.series, startYear) : cumulateRate(poste.series, startYear, poste.latestFactor)
  const newAmount = amount * factor
  const posteCumPct = Math.round((factor - 1) * 1e10) / 1e8
  const generalFactor = cumulateRate(GENERAL_INFLATION, startYear)
  const generalCumPct = Math.round((generalFactor - 1) * 1e10) / 1e8
  return { amount, startYear, posteId, newAmount, posteCumPct, generalCumPct, factor }
}

// Évolution du SMIC sur la même période, pour le bloc de contexte du mode "brut" (a-t-on suivi
// l'inflation ou pas ?).
export function computeSmicEvolution(startYear) {
  const factor = cumulateLevel(SMIC, startYear)
  return Math.round((factor - 1) * 1e10) / 1e8
}

// One editorial model feeds text and PNG: same calculation, dates, subject and direction.
export function purchasingPowerStory(state) {
  if (!Number.isFinite(state.amount) || state.amount <= 0 || !Number.isInteger(state.startYear)
    || state.startYear < 2010 || state.startYear > YEAR_MAX) throw new Error('Montant ou année invalide')
  if (!['brut', 'erosion', 'par-poste'].includes(state.mode)) throw new Error('Lecture inconnue')
  const general = state.mode !== 'par-poste'
  if (!general && !POSTES[state.posteId]) throw new Error('Poste inconnu')
  const result = general ? computeBrut(state.amount, state.startYear) : computePoste(state.amount, state.startYear, state.posteId)
  const erosion = state.mode === 'erosion'
  const endAmount = erosion ? state.amount / result.factor : result.newAmount
  const change = endAmount - state.amount
  const pricePct = general ? result.inflationCumPct : result.posteCumPct
  const equivalentPct = (1 / result.factor - 1) * 100
  const rent = !general && state.posteId === 'loyer'
  const energy = !general && state.posteId === 'carburant'
  const observation = rent ? 'T2 2026' : PRICE_OBSERVATION.label
  const startLabel = rent ? `T1 ${state.startYear}` : String(state.startYear)
  const headline = erosion
    ? ['MÊME BUDGET.', change <= 0 ? 'MOINS DE POUVOIR D’ACHAT.' : 'PLUS DE POUVOIR D’ACHAT.']
    : general ? ['POUR GARDER', 'LE MÊME POUVOIR D’ACHAT']
      : rent ? ['SI TON LOYER', 'SUIVAIT L’IRL']
        : [energy ? 'TON BUDGET ÉNERGIE.' : 'LE MÊME PANIER.', `${fmtEUR(Math.abs(change))} DE ${change >= 0 ? 'PLUS' : 'MOINS'}.`]
  return {
    ...result, endAmount, change, pricePct, equivalentPct, erosion, general, rent, energy,
    observation, startLabel, headline,
    scene: general ? 'revenu' : rent ? 'loyer' : energy ? 'energie' : 'courses',
    metricLabel: erosion ? `Pouvoir d’achat en euros de ${state.startYear}` : general ? 'Revenu nécessaire pour suivre les prix' : rent ? 'Estimation si le loyer suivait l’IRL' : energy ? 'Estimation selon l’indice Énergie' : 'Estimation selon les prix alimentaires',
    period: `${startLabel} → ${observation}`,
  }
}

export function buildTweetText(state) {
  const d = purchasingPowerStory(state)
  const difference = fmtEUR(Math.abs(d.change))
  const priceChange = fmtPct(d.pricePct)
  if (d.erosion) return [
    `💶 Le montant n’a pas changé. Ce qu’il permet d’acheter, si.`,
    `Avec un budget resté à ${fmtEUR(state.amount)} depuis ${state.startYear}, ton pouvoir d’achat en ${d.observation} équivaut à environ ${fmtEUR(d.endAmount)} en euros de ${state.startYear}.`,
    `📉 ${difference} de pouvoir d’achat ${d.change <= 0 ? 'en moins' : 'en plus'}, soit ${fmtPct(d.equivalentPct)}.`,
    `Les prix ont évolué de ${priceChange} sur la période. Une hausse des prix et une perte de pouvoir d’achat ne se calculent pas avec le même pourcentage.`,
    `Repère INSEE : moyenne ${state.startYear} → ${d.observation}. Il s’agit d’une moyenne, pas de ton panier personnel.`,
    `💬 Quel poste pèse davantage dans ton budget aujourd’hui ?`,
  ].join('\n\n')
  if (d.general) return [
    `💶 Ton revenu a-t-il suivi les prix depuis ${state.startYear} ?`,
    `Pour conserver le pouvoir d’achat d’un revenu mensuel de ${fmtEUR(state.amount)} en ${state.startYear}, il faudrait environ ${fmtEUR(d.endAmount)} en ${d.observation}.`,
    `📍 ${fmtEUR(state.amount)} → ${fmtEUR(d.endAmount)}`,
    `Soit ${difference} ${d.change >= 0 ? 'de plus' : 'de moins'} par mois pour acheter l’équivalent, selon l’inflation générale (${priceChange}).`,
    `Cette hausse permettrait de suivre les prix. Elle ne signifierait pas forcément vivre mieux.`,
    `Repère INSEE : moyenne ${state.startYear} → ${d.observation}. Ton budget peut évoluer différemment de cette moyenne.`,
    `💬 Ton revenu a-t-il évolué dans les mêmes proportions ?`,
  ].join('\n\n')
  const hook = d.rent
    ? `🏠 Si ton loyer avait suivi l’IRL depuis ${state.startYear}, où en serait-il ?`
    : d.energy ? `⚡ Ton budget énergie de ${state.startYear} suffirait-il encore aujourd’hui ?`
      : `🛒 Le même panier de courses, ${difference} ${d.change >= 0 ? 'de plus' : 'de moins'}.`
  const intro = d.rent
    ? `Un loyer de ${fmtEUR(state.amount)} au T1 ${state.startYear} atteindrait environ ${fmtEUR(d.endAmount)} au ${d.observation} s’il avait suivi l’IRL.`
    : `Un budget mensuel de ${fmtEUR(state.amount)} ${d.energy ? 'pour l’énergie' : 'pour les courses'} en ${state.startYear} correspondrait à environ ${fmtEUR(d.endAmount)} en ${d.observation}, selon l’indice ${d.energy ? 'Énergie' : 'Alimentation'}.`
  const caveat = d.rent
    ? `L’IRL sert de référence aux révisions : il ne mesure pas le prix de tous les loyers.`
    : d.energy ? `L’énergie regroupe notamment carburants, gaz et électricité. Ce n’est pas l’évolution exacte de ta facture ou du prix à la pompe.`
      : `C’est un repère moyen pour un panier comparable, pas le prix d’une liste précise de produits.`
  return [
    hook, intro,
    `📍 ${fmtEUR(state.amount)} → ${fmtEUR(d.endAmount)}`,
    `Soit ${difference} ${d.change >= 0 ? 'de plus' : 'de moins'} par mois. Sur 12 mois au même niveau de dépense, l’écart représenterait ${fmtEUR(Math.abs(d.change) * 12)}.`,
    `${d.rent ? 'L’IRL' : d.energy ? 'L’énergie' : 'L’alimentation'} : ${priceChange}, contre ${fmtPct(d.generalCumPct)} pour les prix en général.`,
    `${caveat} Repère INSEE : ${d.rent ? 'T1' : 'moyenne'} ${state.startYear} → ${d.observation}${d.rent ? `. Prix en général : ${PRICE_OBSERVATION.label}` : ''}.`,
    d.rent ? `💬 Ton loyer a-t-il suivi cette évolution ?` : d.energy ? `💬 Quel poste énergie pèse le plus dans ton budget ?` : `💬 Tu le ressens surtout sur quels produits ?`,
  ].join('\n\n')
}

// Tirage "Aléatoire" avec anti-répétition dans la session : évite de retirer la même combinaison
// tant que l'espace des combinaisons n'a pas quasiment tourné une fois (même logique que Tweet Midi,
// cf. tweet-midi/lib.js pickNext).
export function pickRandomState(history) {
  const years = []
  for (let y = 2010; y <= YEAR_MAX; y++) years.push(y)
  const modes = ['brut', 'erosion', 'par-poste']
  const postesIds = ['loyer', 'alimentation', 'carburant']
  const amounts = [100, 500, 1000, 5000]

  const combos = []
  for (const amount of amounts) {
    for (const startYear of years) {
      for (const mode of modes) {
        if (mode !== 'par-poste') {
          combos.push({ amount, startYear, mode, posteId: null })
        } else {
          for (const posteId of postesIds) combos.push({ amount, startYear, mode, posteId })
        }
      }
    }
  }
  const keyOf = (c) => `${c.amount}|${c.startYear}|${c.mode}|${c.posteId}`
  const seen = new Set(history)
  let pool = combos.filter((c) => !seen.has(keyOf(c)))
  if (pool.length === 0) pool = combos // la bibliothèque a tourné : on relâche l'anti-répétition
  const picked = pool[Math.floor(Math.random() * pool.length)]
  return { ...picked, key: keyOf(picked) }
}
