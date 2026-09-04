import { GENERAL_INFLATION, YEAR_MAX, POSTES, ENGAGEMENT_QUESTIONS, SMIC } from './data.js'

// Ligne de punchline volontairement laissée en placeholder — jamais générée automatiquement (cf.
// demande du 04/09/2026, même principe que le récap matin) : les punchlines automatiques sonnaient
// artificielles/répétitives à l'usage. L'utilisateur la remplace lui-même avant publication.
const PUNCHLINE_PLACEHOLDER = "[Ta punchline ici]"

// Année d'arrivée fixe : "aujourd'hui" au sens de la fraîcheur de données de l'app (cf. LATEST_YM
// dans investment-calculator/data.js, qui s'arrête à 2026-08) — jamais sélectionnable par
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

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)]
}

export function buildTweetText(state, rng = Math.random) {
  const punchline = PUNCHLINE_PLACEHOLDER
  const question = pick(ENGAGEMENT_QUESTIONS, rng)
  const years = CURRENT_YEAR - state.startYear
  const yearsLabel = `${years} an${years > 1 ? 's' : ''}`

  if (state.mode === 'brut') {
    const d = computeBrut(state.amount, state.startYear)
    const smicPct = computeSmicEvolution(state.startYear)
    const gapPts = smicPct - d.inflationCumPct
    const gapAbs = Math.abs(gapPts).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    const gapLabel = `${gapAbs} point${Math.abs(gapPts) >= 2 ? 's' : ''}`
    const suivi = gapPts >= 0
      ? `le SMIC a progressé un peu plus vite que les prix sur la période (écart de +${gapLabel})`
      : `le SMIC n'a pas suivi : il a progressé moins vite que les prix sur la période (écart de -${gapLabel})`
    return [
      `En ${state.startYear}, ${fmtEUR(state.amount)} avaient le même pouvoir d'achat que ${fmtEUR(d.newAmount)} aujourd'hui.`,
      ``,
      `Soit ${fmtPct(d.inflationCumPct)} de prix cumulés en ${yearsLabel} (inflation INSEE).`,
      ``,
      `À titre de comparaison, ${suivi}.`,
      ``,
      punchline,
      ``,
      question,
    ].join('\n')
  }

  const poste = POSTES[state.posteId]
  const d = computePoste(state.amount, state.startYear, state.posteId)
  const vsInflation = d.posteCumPct >= d.generalCumPct
    ? `plus vite que l'inflation générale (${fmtPct(d.generalCumPct)})`
    : `moins vite que l'inflation générale (${fmtPct(d.generalCumPct)})`
  const partialNote = poste.isPartialLatestYear
    ? ` (2026 : donnée sur 12 mois glissants, l'année n'étant pas terminée)`
    : ''
  return [
    `En ${state.startYear}, ${fmtEUR(state.amount)} de budget ${poste.tweetVerb} valaient ${fmtEUR(d.newAmount)} d'aujourd'hui.`,
    ``,
    `Soit ${fmtPct(d.posteCumPct)} sur ${poste.tweetNoun} en ${yearsLabel}${partialNote}.`,
    ``,
    `${poste.label} a augmenté ${vsInflation} sur la même période.`,
    ``,
    punchline,
    ``,
    question,
  ].join('\n')
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
