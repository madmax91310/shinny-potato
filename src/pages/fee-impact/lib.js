import { fmtEUR } from '../investment-calculator/lib.js'
import { AMOUNT_PRESETS, DURATION_PRESETS, RETURN_PRESETS, FEE_LEVELS, PUNCHLINE_PLACEHOLDERS, ENGAGEMENT_QUESTIONS } from './data.js'

export { fmtEUR }

// Toutes les paires ORDONNÉES (bas, haut) de FEE_LEVELS avec un écart d'au moins 0,2 point — sert au
// tirage "Aléatoire", pour piocher une paire réaliste (ex. ETF pas cher vs fonds actif classique)
// plutôt que deux niveaux trop proches qui donneraient un tweet peu parlant. Dérivé de FEE_LEVELS,
// jamais une liste de paires redéfinie à la main.
//
// Seuil abaissé de 0,5 à 0,2 point le 14/09/2026 (retour utilisateur) : à 0,5, la paire 0,20 % vs
// 0,50 % (écart de 0,3 point) était exclue alors que c'est l'une des comparaisons les plus
// pédagogiques de la bibliothèque — un ETF indiciel pas cher contre un fonds indiciel/actif "light",
// un cas croisé en pratique. 0,2 plutôt qu'une valeur plus basse encore : c'est le plus petit écart
// qui reste possible entre deux valeurs de FEE_LEVELS distinctes de 0,20 % (0,10 vs 0,20 = 0,1 point,
// toujours exclu) — en dessous de 0,2, l'écart de capital final resterait trop faible pour produire
// un message marquant, l'objectif même de cet outil. Avec ce seuil, seules 0,10-0,20 % (0,1 point)
// restent hors du pool ; 0,10-0,50 % (0,4) et 0,20-0,50 % (0,3) rejoignent les 12 paires déjà
// présentes, soit 14 paires réalistes au total sur les 15 combinaisons possibles de FEE_LEVELS.
export const REALISTIC_FEE_PAIRS = []
for (let i = 0; i < FEE_LEVELS.length; i++) {
  for (let j = i + 1; j < FEE_LEVELS.length; j++) {
    const low = FEE_LEVELS[i].value
    const high = FEE_LEVELS[j].value
    if (high - low >= 0.2) REALISTIC_FEE_PAIRS.push({ low, high })
  }
}

export function feeLabel(value) {
  return FEE_LEVELS.find((f) => f.value === value)?.label ?? `${value} %`
}

// Simulation d'intérêts composés mensuels, versement en début de mois (convention "annuité due" :
// le versement du mois grossit avant le suivant, ce qui inclut le rendement du dernier mois versé —
// hypothèse de calcul standard, pas une donnée réelle) : rendement net = rendement brut - frais
// annuels, appliqué au taux mensuel équivalent chaque mois.
export function simulateCapital(monthlyAmount, years, grossReturnPct, feePct) {
  const months = Math.round(years * 12)
  const netAnnual = grossReturnPct - feePct
  const monthlyRate = netAnnual / 100 / 12
  let capital = 0
  for (let i = 0; i < months; i++) {
    capital = (capital + monthlyAmount) * (1 + monthlyRate)
  }
  return capital
}

export function computeComparison(state) {
  const { amount, years, returnRate, fee1, fee2 } = state
  const capital1 = simulateCapital(amount, years, returnRate, fee1)
  const capital2 = simulateCapital(amount, years, returnRate, fee2)
  const higher = Math.max(capital1, capital2)
  const lower = Math.min(capital1, capital2)
  const ecart = higher - lower
  const ecartPct = higher > 0 ? (ecart / higher) * 100 : 0
  const totalInvested = amount * Math.round(years * 12)
  return { capital1, capital2, ecart, ecartPct, totalInvested }
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)]
}

export function buildTweetText(state, rng = Math.random) {
  const { amount, years, returnRate, fee1, fee2 } = state
  const d = computeComparison(state)
  const punchline = pick(PUNCHLINE_PLACEHOLDERS, rng)
  const question = pick(ENGAGEMENT_QUESTIONS, rng)
  const yearsLabel = `${years} an${years > 1 ? 's' : ''}`
  const ecartPctLabel = d.ecartPct.toLocaleString('fr-FR', { maximumFractionDigits: 0 })

  return [
    `${fmtEUR(amount)}/mois pendant ${yearsLabel} à ${returnRate} % de rendement brut (hypothèse de simulation, pas une performance de marché réelle) :`,
    ``,
    `Avec ${feeLabel(fee1)} de frais → ${fmtEUR(d.capital1)}`,
    `Avec ${feeLabel(fee2)} de frais → ${fmtEUR(d.capital2)}`,
    ``,
    `Écart : ${fmtEUR(d.ecart)} (${ecartPctLabel} % du capital final) — juste à cause des frais.`,
    ``,
    punchline,
    ``,
    question,
  ].join('\n')
}

// Tirage "Aléatoire" avec anti-répétition dans la session : même logique que les autres outils de
// l'app (cf. purchasing-power/lib.js pickRandomState) — combinatoire montant × durée × rendement ×
// paire de frais RÉALISTE (jamais deux frais tirés indépendamment, qui pourraient donner un écart
// dérisoire, cf. REALISTIC_FEE_PAIRS ci-dessus).
export function pickRandomState(history) {
  const combos = []
  for (const amount of AMOUNT_PRESETS) {
    for (const years of DURATION_PRESETS) {
      for (const returnRate of RETURN_PRESETS) {
        for (const pair of REALISTIC_FEE_PAIRS) {
          combos.push({ amount, years, returnRate, fee1: pair.low, fee2: pair.high })
        }
      }
    }
  }
  const keyOf = (c) => `${c.amount}|${c.years}|${c.returnRate}|${c.fee1}|${c.fee2}`
  const seen = new Set(history)
  let pool = combos.filter((c) => !seen.has(keyOf(c)))
  if (pool.length === 0) pool = combos
  const picked = pool[Math.floor(Math.random() * pool.length)]
  return { ...picked, key: keyOf(picked) }
}
