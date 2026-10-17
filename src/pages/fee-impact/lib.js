import { annualAfterFees, monthlyEffective } from '../../lib/simulation-rates.js'
import { FEE_COMPARISON_ASSETS } from '../../data/fee-comparison-assets.js'
import { envelopeFeeOption } from '../../data/envelope-fees.js'
import { fmtEUR } from '../../lib/format-currency.js'
import { AMOUNT_PRESETS, DURATION_PRESETS, RETURN_PRESETS, FEE_LEVELS } from './data.js'

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
  return FEE_LEVELS.find((f) => f.value === value)?.label ?? `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
}

// Frais annuels réellement prélevés dans chaque scénario : frais du support plus, le cas échéant,
// frais d’enveloppe d’un contrat d’assurance-vie relevés par le collecteur.
export function effectiveFees(state) {
  const total = (fee, envelope) => Math.round((fee + envelopeFeeOption(envelope).fee) * 1000) / 1000
  return { fee1: total(state.fee1, state.envelope1), fee2: total(state.fee2, state.envelope2) }
}

// Même convention que le Simulateur de patrimoine : taux effectif, frais proportionnels, fin de mois.
export function simulateCapital(monthlyAmount, years, grossReturnPct, feePct) {
  return simulateCapitalSeries(monthlyAmount, years, grossReturnPct, feePct).at(-1).capital
}

// Un point par année, plus le dernier mois si la durée n'est pas entière.
// Les mêmes versements et le même taux mensuel servent au tweet et à l'image.
export function simulateCapitalSeries(monthlyAmount, years, grossReturnPct, feePct) {
  const months = Math.round(years * 12)
  const monthlyRate = monthlyEffective(annualAfterFees(grossReturnPct, feePct))
  let capital = 0
  const points = [{ year: 0, capital: 0 }]
  for (let i = 0; i < months; i++) {
    capital = capital * (1 + monthlyRate) + monthlyAmount
    if ((i + 1) % 12 === 0 || i + 1 === months) points.push({ year: (i + 1) / 12, capital })
  }
  return points
}

export function computeComparison(state) {
  const { amount, years, returnRate } = state
  const { fee1, fee2 } = effectiveFees(state)
  const capital1 = simulateCapital(amount, years, returnRate, fee1)
  const capital2 = simulateCapital(amount, years, returnRate, fee2)
  const higher = Math.max(capital1, capital2)
  const lower = Math.min(capital1, capital2)
  const ecart = higher - lower
  const ecartPct = higher > 0 ? (ecart / higher) * 100 : 0
  const totalInvested = amount * Math.round(years * 12)
  return { capital1, capital2, ecart, ecartPct, totalInvested }
}

export function buildTweetText(state) {
  const { amount, years, returnRate, punchline } = state
  const { fee1, fee2 } = effectiveFees(state)
  const envelopes = [envelopeFeeOption(state.envelope1), envelopeFeeOption(state.envelope2)]
  const d = computeComparison(state)
  const yearsLabel = `${years} an${years > 1 ? 's' : ''}`
  const sameFees = fee1 === fee2
  const lowFee = Math.min(fee1, fee2)
  const highFee = Math.max(fee1, fee2)
  const negligibleGap = d.ecart < 0.5
  const gapLabel = d.ecart < 1 ? 'moins de 1 €' : fmtEUR(d.ecart)
  let hook = `💸 ${gapLabel} de moins après ${yearsLabel}, en versant pourtant les mêmes ${fmtEUR(amount)} chaque mois.`
  if (highFee - lowFee <= 0.3 + 1e-9) hook = `💸 ${feeLabel(lowFee)} ou ${feeLabel(highFee)} de frais : ça semble presque pareil. Avec ${fmtEUR(amount)} investis chaque mois pendant ${yearsLabel}, cette simulation aboutit pourtant à ${gapLabel} d’écart.`
  else if (amount <= 100) hook = `💸 Tu investis ${fmtEUR(amount)} par mois. Après ${yearsLabel}, les frais font une différence de ${gapLabel} dans cette simulation.`
  if (negligibleGap) hook = sameFees
    ? `💸 ${feeLabel(fee1)} de frais dans les deux cas : avec ${fmtEUR(amount)} investis chaque mois pendant ${yearsLabel}, les capitaux simulés sont identiques.`
    : `💸 ${feeLabel(lowFee)} ou ${feeLabel(highFee)} de frais : après ${yearsLabel}, l’écart simulé reste inférieur à 1 € avec ${fmtEUR(amount)} investis chaque mois.`
  const selectedFunds = [state.isin1, state.isin2].map(isin => FEE_COMPARISON_ASSETS.find(asset => asset.isin === isin))
  const scenario = (fee, capital, fund, envelope, productFee) => `${sameFees ? '⚪' : fee === Math.min(fee1, fee2) ? '🟢' : '🔴'} ${fund ? `${fund.name} (${fund.isin}), avec` : 'Avec'} ${envelope.fee ? `${feeLabel(productFee)} de frais du support + ${feeLabel(envelope.fee)} de frais d’enveloppe (${envelope.contract}), soit ${feeLabel(fee)} par an` : `${feeLabel(fee)} de frais annuels`} : ${fmtEUR(capital)}`
  const returnLabel = returnRate.toLocaleString('fr-FR')

  return [
    hook,
    ``,
    sameFees ? 'Dans cette simulation, les deux scénarios ont les mêmes frais annuels 👇'
      : `Dans cette simulation, seule une chose change : les frais annuels, de ${feeLabel(lowFee)} à ${feeLabel(highFee)} 👇`,
    ``,
    `📊 Avec un rendement supposé de ${returnLabel} % par an avant frais :`,
    ``,
    scenario(fee1, d.capital1, selectedFunds[0], envelopes[0], state.fee1),
    scenario(fee2, d.capital2, selectedFunds[1], envelopes[1], state.fee2),
    ``,
    `Dans les deux cas, tu as versé ${fmtEUR(d.totalInvested)}.`,
    ``,
    ...(sameFees ? ['Les mêmes versements, les mêmes frais et le même rendement supposé donnent le même résultat.']
      : returnRate <= highFee ? ['Cet écart reflète les prélèvements de frais et leur effet cumulé sur le capital restant investi.']
      : ['Pourquoi cet écart ?', '', 'Les frais réduisent ton capital au fil du temps. Et l’argent prélevé ne peut plus produire de gains les années suivantes.', '', `${d.ecart < 1 ? 'Cet écart ne correspond' : `Les ${gapLabel} ne correspondent`} donc pas uniquement aux frais payés : ${d.ecart < 1 ? 'il comprend' : 'ils comprennent'} aussi ces gains manqués.`]),
    ...(punchline?.trim() ? ['', punchline.trim()] : []),
    ``,
    '💬 Tu connais le montant des frais annuels de tes placements ?',
    ``,
    ...(selectedFunds.some(Boolean) ? ['Frais des produits relevés dans la banque de données ; même rendement brut supposé, sans comparer leurs performances réelles.', ...selectedFunds.filter(Boolean).map(fund => `Source frais ${fund.isin} : ${fund.evidence.sourceUrls[0]}`), ''] : []),
    ...[...new Map(envelopes.filter(envelope => envelope.fee).map(envelope => [envelope.id, envelope])).values()].map(envelope => `Frais d’enveloppe ${envelope.contract} : ${envelope.sourceUrl} (contrôle du ${envelope.checkedAt}) ; ${envelope.scope ?? 'hors frais des supports'}`),
    'Hypothèse de rendement constant, versements en fin de mois. Hors fiscalité et inflation.',
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
