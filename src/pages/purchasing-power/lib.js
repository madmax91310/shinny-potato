import { GENERAL_INFLATION, YEAR_MAX, POSTES, SMIC } from '../../data/purchasing-power.js'

// Année d'arrivée fixe : "aujourd'hui" au sens de la fraîcheur de données de l'app (cf. LATEST_YM
// dans src/data/market-history.js, qui s'arrête à 2026-08) — jamais sélectionnable par
// l'utilisateur, seule l'année de départ l'est (2010 à YEAR_MAX).
export const CURRENT_YEAR = 2026

// Compose une série de TAUX annuels (%) entre startYear+1 et CURRENT_YEAR inclus — jamais le taux
// de startYear lui-même (cf. commentaire de convention en tête de data.js).
export function cumulateRate(rateTable, startYear) {
  let factor = 1
  for (let y = startYear + 1; y <= CURRENT_YEAR; y++) {
    const rate = rateTable[y]
    if (rate === undefined) continue
    factor *= 1 + rate / 100
  }
  return factor
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
    return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
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
  const inflationCumPct = (factor - 1) * 100
  return { amount, startYear, newAmount, inflationCumPct, factor }
}

// Mode "comparaison par poste" : combien il faut aujourd'hui pour ce que `amount` payait à
// startYear pour un poste donné (loyer = ratio de niveaux IRL, alimentation/carburant = taux composés).
export function computePoste(amount, startYear, posteId) {
  const poste = POSTES[posteId]
  const factor = poste.seriesType === 'level' ? cumulateLevel(poste.series, startYear) : cumulateRate(poste.series, startYear)
  const newAmount = amount * factor
  const posteCumPct = (factor - 1) * 100
  const generalFactor = cumulateRate(GENERAL_INFLATION, startYear)
  const generalCumPct = (generalFactor - 1) * 100
  return { amount, startYear, posteId, newAmount, posteCumPct, generalCumPct, factor }
}

// Évolution du SMIC sur la même période, pour le bloc de contexte du mode "brut" (a-t-on suivi
// l'inflation ou pas ?).
export function computeSmicEvolution(startYear) {
  const factor = cumulateLevel(SMIC, startYear)
  return (factor - 1) * 100
}

export function buildTweetText(state) {
  if (state.mode === 'brut') {
    const d = computeBrut(state.amount, state.startYear)
    const difference = Math.abs(d.newAmount - state.amount)
    return [
      `${fmtEUR(state.amount)} en ${state.startYear}.`,
      ``,
      `Pour retrouver le même pouvoir d'achat en ${CURRENT_YEAR}, il faudrait environ ${fmtEUR(d.newAmount)}.`,
      ``,
      `${fmtEUR(difference)} ${d.newAmount >= state.amount ? "d'écart" : 'de moins'} sur cette somme. Les prix ont ${d.inflationCumPct >= 0 ? 'augmenté' : 'baissé'} de ${Math.abs(d.inflationCumPct).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} % sur la période, selon l'indice général des prix (INSEE).`,
      ``,
      `2026 : estimation provisoire, l'année n'est pas terminée.`,
      ``,
      `Ton revenu a-t-il évolué dans les mêmes proportions ?`,
    ].join('\n')
  }

  const poste = POSTES[state.posteId]
  const d = computePoste(state.amount, state.startYear, state.posteId)
  const difference = Math.abs(d.newAmount - state.amount)
  const change = Math.abs(d.posteCumPct).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const generalChange = Math.abs(d.generalCumPct).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const intro = state.posteId === 'loyer'
    ? `${fmtEUR(state.amount)} de loyer en ${state.startYear} correspondraient à environ ${fmtEUR(d.newAmount)} en ${CURRENT_YEAR} si cette somme avait suivi l'IRL.`
    : state.posteId === 'carburant'
      ? `${fmtEUR(state.amount)} consacrés au carburant en ${state.startYear} correspondent à environ ${fmtEUR(d.newAmount)} en ${CURRENT_YEAR} selon l'indice Énergie, plus large que les seuls carburants.`
      : `${fmtEUR(state.amount)} consacrés à l'alimentation en ${state.startYear} correspondent à environ ${fmtEUR(d.newAmount)} en ${CURRENT_YEAR}, selon l'indice des prix alimentaires.`
  const indicator = state.posteId === 'loyer' ? "L'IRL" : state.posteId === 'carburant' ? "L'indice Énergie" : "L'alimentation"
  const question = state.posteId === 'loyer'
    ? `Ton loyer a-t-il suivi cette évolution ?`
    : state.posteId === 'carburant'
      ? `Tu constates la même chose à la pompe ?`
      : `Tu le ressens sur quels produits ?`
  const caveat = state.posteId === 'loyer'
    ? `L'IRL sert de référence aux révisions de loyer : il ne décrit pas l'évolution de chaque loyer.`
    : state.posteId === 'carburant'
      ? `L'indice Énergie inclut aussi le gaz et l'électricité : ce n'est pas l'évolution exacte du prix à la pompe.`
      : ''
  const provisional = poste.isPartialLatestYear
    ? `2026 : variation sur 12 mois glissants, l'année n'est pas terminée.`
    : `2026 : année en cours, comparaison indicative.`
  return [
    intro,
    `${fmtEUR(difference)} ${d.newAmount >= state.amount ? 'de plus' : 'de moins'} sur cette somme.`,
    `${indicator} a ${d.posteCumPct >= 0 ? 'augmenté' : 'baissé'} de ${change} % sur la période, contre ${generalChange} % pour les prix en général.`,
    [caveat, provisional].filter(Boolean).join(' '),
    question,
  ].join('\n\n')
}

// Tirage "Aléatoire" avec anti-répétition dans la session : évite de retirer la même combinaison
// tant que l'espace des combinaisons n'a pas quasiment tourné une fois (même logique que Tweet Midi,
// cf. tweet-midi/lib.js pickNext).
export function pickRandomState(history) {
  const years = []
  for (let y = 2010; y <= YEAR_MAX; y++) years.push(y)
  const modes = ['brut', 'par-poste']
  const postesIds = ['loyer', 'alimentation', 'carburant']
  const amounts = [100, 500, 1000, 5000]

  const combos = []
  for (const amount of amounts) {
    for (const startYear of years) {
      for (const mode of modes) {
        if (mode === 'brut') {
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
