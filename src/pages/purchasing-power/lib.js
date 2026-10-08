import { GENERAL_PRICE_LEVELS, YEAR_MAX, POSTES, SMIC, PRICE_OBSERVATION, RENT_OBSERVATION, SMIC_OBSERVATION } from '../../data/purchasing-power.js'

export const CURRENT_YEAR = Number(PRICE_OBSERVATION.asOf.slice(0, 4))

// Ratio de niveaux comparables : pas de composition de taux arrondis.
export function cumulateLevel(levelTable, startYear, latestValue) {
  const start = levelTable[startYear]
  if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(latestValue) || latestValue <= 0) throw new Error('Niveau officiel absent')
  return latestValue / start
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
// de la dernière période publiée — ratio des niveaux mensuels INSEE dans une même base.
export function computeBrut(amount, startYear) {
  const factor = cumulateLevel(GENERAL_PRICE_LEVELS, startYear, PRICE_OBSERVATION.general)
  const newAmount = amount * factor
  const inflationCumPct = Math.round((factor - 1) * 1e10) / 1e8
  return { amount, startYear, newAmount, inflationCumPct, factor }
}

// Mode "comparaison par poste" : combien il faut aujourd'hui pour ce que `amount` payait à
// startYear pour un poste donné (loyer = niveaux IRL ; alimentation/énergie = niveaux IPC).
export function computePoste(amount, startYear, posteId) {
  const poste = POSTES[posteId]
  const factor = cumulateLevel(poste.series, startYear, poste.latestValue)
  const newAmount = amount * factor
  const posteCumPct = Math.round((factor - 1) * 1e10) / 1e8
  const generalFactor = cumulateLevel(GENERAL_PRICE_LEVELS, startYear, PRICE_OBSERVATION.general)
  const generalCumPct = Math.round((generalFactor - 1) * 1e10) / 1e8
  return { amount, startYear, posteId, newAmount, posteCumPct, generalCumPct, factor }
}

// Évolution du SMIC sur la même période, pour le bloc de contexte du mode "brut" (a-t-on suivi
// l'inflation ou pas ?).
export function computeSmicEvolution(startYear) {
  const factor = cumulateLevel(SMIC, startYear, SMIC_OBSERVATION.value)
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
  const growthPct = state.growthPct ?? (general ? 10 : 20)
  if (!Number.isFinite(growthPct) || growthPct <= -100) throw new Error('Variation testée invalide')
  const testedAmount = state.amount * (1 + growthPct / 100)
  const generalAmount = state.amount * (general ? result.factor : 1 + result.generalCumPct / 100)
  const observation = rent ? RENT_OBSERVATION.label : PRICE_OBSERVATION.label
  const startLabel = rent ? `T1 ${state.startYear}` : String(state.startYear)
  const headline = erosion
    ? ['MÊME BUDGET.', change <= 0 ? 'MOINS DE POUVOIR D’ACHAT.' : 'PLUS DE POUVOIR D’ACHAT.']
    : general ? ['POUR GARDER', 'LE MÊME POUVOIR D’ACHAT']
      : rent ? ['SI TON LOYER', 'SUIVAIT L’IRL']
        : [energy ? 'TON BUDGET ÉNERGIE.' : 'LE MÊME PANIER.', `${fmtEUR(Math.abs(change))} DE ${change >= 0 ? 'PLUS' : 'MOINS'}.`]
  return {
    ...result, endAmount, change, pricePct, equivalentPct, erosion, general, rent, energy, growthPct, testedAmount, generalAmount,
    observation, startLabel, headline, provisional: !rent && PRICE_OBSERVATION.provisional,
    scene: general ? 'revenu' : rent ? 'loyer' : energy ? 'energie' : 'courses',
    metricLabel: erosion ? `Pouvoir d’achat en euros de ${state.startYear}` : general ? `Revenu testé : ${fmtEUR(testedAmount)} · seuil pour suivre les prix` : rent ? 'Estimation si le loyer suivait l’IRL' : energy ? 'Estimation selon l’indice Énergie' : `Budget testé : ${fmtEUR(testedAmount)} · seuil pour les mêmes courses`,
    period: `${startLabel} → ${observation}`,
  }
}

export function buildTweetText(state) {
  const d = purchasingPowerStory(state)
  const base = fmtEUR(state.amount), end = fmtEUR(d.endAmount), tested = fmtEUR(d.testedAmount)
  const growth = fmtPct(d.growthPct), prices = fmtPct(d.pricePct)
  const quality = d.provisional ? "Donnée mensuelle provisoire de l’INSEE." : null
  const direction = d.testedAmount - d.endAmount
  const equal = Math.abs(direction) < 0.005
  const verdict = equal ? 'autant' : direction > 0 ? 'davantage' : 'moins'
  if (d.erosion) return [
    `💶 ${base} par mois depuis ${state.startYear}. Même budget… mais peux-tu encore acheter autant ?`,
    `Entre ${state.startYear} et ${d.observation}, les prix ont évolué de ${prices}.`,
    `Tes ${base} équivalent désormais à environ ${end} en euros de ${state.startYear} : ${fmtPct(d.equivalentPct)} de pouvoir d’achat.`,
    `Pour acheter l’équivalent de ce que ce budget permettait au départ, il faudrait environ ${fmtEUR(d.newAmount)} par mois.`,
    ...(quality ? [quality] : []),
    `💬 Tu as ajusté ton budget, changé tes achats ou réduit les quantités ?`,
  ].join('\n\n')
  if (d.general) return [
    `💶 Ton salaire passe de ${base} à ${tested} depuis ${state.startYear}. Tu gagnes ${fmtEUR(Math.abs(d.testedAmount - state.amount))} ${d.growthPct >= 0 ? 'de plus' : 'de moins'}… mais peux-tu acheter davantage ?`,
    `Testons cette évolution face aux prix 👇`,
    `📈 Ton salaire : ${growth}\n🛒 Les prix entre ${state.startYear} et ${d.observation} : ${prices}`,
    `Pour conserver le pouvoir d’achat de tes ${base} de départ, il faudrait environ ${end} par mois.`,
    equal ? `Avec ${tested}, ton salaire suit exactement les prix.` : `Avec ${tested}, tu peux acheter ${verdict} : ton revenu a ${direction > 0 ? 'davantage' : 'moins'} progressé que les prix.`,
    ...(quality ? [quality] : []),
    `💬 Tes dernières augmentations t’ont permis de vivre mieux, ou surtout de suivre les dépenses ?`,
  ].join('\n\n')
  if (d.rent) return [
    `🏠 ${base} de loyer au ${d.startLabel} : que donnerait une révision suivant l’IRL jusqu’au ${d.observation} ?`,
    `Un loyer révisé selon cet indice atteindrait environ ${end} par mois, soit ${fmtEUR(Math.abs(d.change))} ${d.change >= 0 ? 'de plus' : 'de moins'}.`,
    `📍 IRL : ${prices} entre ${d.startLabel} et ${d.observation}. Pour les prix en général : ${fmtPct(d.generalCumPct)} entre ${state.startYear} et ${PRICE_OBSERVATION.label}.`,
    ...(quality ? [quality] : []),
    `💬 Ton loyer a-t-il suivi cette évolution, ou est-il resté stable ?`,
  ].join('\n\n')
  if (d.energy) {
    const gap = d.endAmount - d.generalAmount
    return [
      `⚡ ${fmtPct(d.generalCumPct)} pour les prix en général. ${prices} pour l’énergie.`,
      `Voilà l’écart entre ${state.startYear} et ${d.observation} 👇`,
      `Pour l’équivalent d’un budget énergie de ${base} par mois au départ :\n• en suivant les prix en général : ${fmtEUR(d.generalAmount)}\n• en suivant les prix de l’énergie : ${end}`,
      `Soit ${fmtEUR(Math.abs(gap))} ${gap >= 0 ? 'de plus' : 'de moins'} par mois que si l’énergie avait suivi l’inflation générale.`,
      ...(quality ? [quality] : []),
    `💬 Tu as changé de contrat, réduit ta consommation ou absorbé la différence ?`,
    ].join('\n\n')
  }
  return [
    `🛒 Ton budget courses évolue de ${growth} depuis ${state.startYear} ? ${equal ? 'C’est exactement l’évolution des prix alimentaires.' : direction < 0 ? 'Pourtant, les prix alimentaires ont augmenté davantage.' : 'Cette fois, ton budget progresse davantage que les prix alimentaires.'}`,
    `Entre ${state.startYear} et ${d.observation} :\n🥦 Alimentation : ${prices}\n🛒 Prix en général : ${fmtPct(d.generalCumPct)}`,
    `Les courses qui coûtaient ${base} au départ demanderaient environ ${end} pour acheter l’équivalent.`,
    `Avec la variation testée, ton budget passe à ${tested}. Il permet d’acheter ${verdict} qu’au départ.`,
    ...(quality ? [quality] : []),
    `💬 Tu as augmenté ton budget courses, ou changé les produits et les quantités ?`,
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
