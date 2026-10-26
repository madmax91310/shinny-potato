// Shared placement series. Prices and rates must already be qualified by the caller.
// End-of-month contributions; interpolation is explicit and never an observed price.
export { fmtEUR, fmtPct } from './format-currency.js'
import { INFLATION_MONTHLY } from '../data/inflation-monthly.js'
import { LIVRET_A, INFLATION } from '../data/history-parameters.js'
export function ymIndex(ym) {
  const [y, m] = ym.split('-')
  return parseInt(y, 10) * 12 + (parseInt(m, 10) - 1)
}

export function indexToYm(idx) {
  const y = Math.floor(idx / 12)
  const m = (idx % 12) + 1
  return y + '-' + (m < 10 ? '0' + m : m)
}

export function monthsBetween(startYm, endYm) {
  const a = ymIndex(startYm)
  const b = ymIndex(endYm)
  const out = []
  for (let i = a; i <= b; i++) out.push(indexToYm(i))
  return out
}

export function clampYm(ym, maxYm) {
  return ymIndex(ym) > ymIndex(maxYm) ? maxYm : ym
}

export function interpolatePrice(points, ym) {
  const idx = ymIndex(ym)
  const first = points[0]
  const last = points[points.length - 1]
  if (idx <= ymIndex(first.date)) return first.price
  if (idx >= ymIndex(last.date)) return last.price
  for (let i = 0; i < points.length - 1; i++) {
    const i0 = ymIndex(points[i].date)
    const i1 = ymIndex(points[i + 1].date)
    if (idx >= i0 && idx <= i1) {
      if (i1 === i0) return points[i].price
      const t = (idx - i0) / (i1 - i0)
      return points[i].price + (points[i + 1].price - points[i].price) * t
    }
  }
  return last.price
}

export function computeAssetSeries(points, startYm, endYm, amount, mode) {
  const months = monthsBetween(startYm, endYm)
  const series = []
  const invested = []
  if (mode === 'dca') {
    let units = 0
    let totalInvested = 0
    for (const month of months) {
      const price = interpolatePrice(points, month)
      units += amount / price
      totalInvested += amount
      series.push(units * price)
      invested.push(totalInvested)
    }
  } else {
    const p0 = interpolatePrice(points, startYm)
    const u = amount / p0
    for (const month of months) {
      series.push(u * interpolatePrice(points, month))
      invested.push(amount)
    }
  }
  return { months, series, invested, finalValue: series[series.length - 1], totalInvested: invested[invested.length - 1] }
}

// Série réduite aux VRAIS points de données (+ point de départ/fin, interpolés comme le reste de
// l'app) pour les actifs à grain annuel (SPARSE_MONTHLY_DATA_IDS) — dédiée à l'affichage vidéo.
// computeAssetSeries ci-dessus produit un point par mois même pour ces actifs, mais interpolatePrice
// étant une interpolation LINÉAIRE entre deux vrais points, tous les mois intermédiaires d'une même
// année tombent exactement sur le segment de droite reliant les deux points réels qui l'entourent —
// le tracé obtenu est donc rigoureusement identique à celui-ci, mais son ANIMATION ne l'était pas :
// le curseur passait ~11 mois sur 12 dans un segment sans aucun vrai mouvement visible, avant un
// unique décrochage à chaque point réel (retour utilisateur du 14/09/2026 : "ça rend hyper mal à la
// vidéo"). En animant uniquement sur les vrais points (mode versement unique uniquement — le seul
// disponible pour ces actifs, DCA étant bloqué), chaque segment réel reçoit un temps d'écran égal
// plutôt que proportionnel à sa durée calendaire, sans jamais afficher une seule valeur inventée :
// mêmes points, mêmes prix, juste moins de mois vides entre deux vrais points.
export function sparseAssetSeries(points, startYm, endYm, amount) {
  const p0 = interpolatePrice(points, startYm)
  const u = amount / p0
  const between = points.filter((p) => ymIndex(p.date) > ymIndex(startYm) && ymIndex(p.date) < ymIndex(endYm))
  const months = [startYm, ...between.map((p) => p.date), endYm]
  const series = months.map((ym) => u * interpolatePrice(points, ym))
  const invested = months.map(() => amount)
  return { months, series, invested, finalValue: series[series.length - 1], totalInvested: amount }
}

// Pour les trois indices rebasés, seules les clôtures de décembre ont été recalées
// sur des rendements annuels comparables. La dernière clôture est conservée pour la
// valorisation, sans tracer les mois intermédiaires non vérifiés comme des faits.
export function computeBenchmarkSeries(rateTable, startYm, endYm, amount, mode) {
  if (rateTable === LIVRET_A) return computeLivretSeries(startYm, endYm, amount, mode)
  const months = monthsBetween(startYm, endYm)
  const series = []
  const invested = []
  let value = 0
  let totalInvested = 0
  for (let i = 0; i < months.length; i++) {
    if (i > 0) {
      const year = parseInt(months[i].split('-')[0], 10)
      const annual = rateTable[year] !== undefined ? rateTable[year] : 0
      const observedMonthly = rateTable === INFLATION ? INFLATION_MONTHLY[months[i]] : undefined
      if (rateTable === INFLATION && months[i] >= '2017-01' && observedMonthly === undefined) {
        throw new Error(`Variation mensuelle INSEE absente pour ${months[i]}`)
      }
      const factor = observedMonthly !== undefined
        ? 1 + observedMonthly / 100
        : Math.pow(1 + annual / 100, 1 / 12)
      value *= factor
    }
    if (mode === 'dca') {
      value += amount
      totalInvested += amount
    } else if (i === 0) {
      value = amount
      totalInvested = amount
    }
    series.push(value)
    invested.push(totalInvested)
  }
  return { months, series, invested, finalValue: series[series.length - 1], totalInvested: invested[invested.length - 1] }
}

// Convention commune aux séries : versements en fin de mois, intérêts à partir du mois suivant.
// Deux quinzaines complètes par mois sur le capital, capitalisation au 31 décembre uniquement.
// La valeur affichée inclut les intérêts courus ; simulation sans plafond, sans retrait.
export function computeLivretSeries(startYm, endYm, amount, mode) {
  const months = monthsBetween(startYm, endYm)
  const series = [], invested = []
  const changes = Object.entries(LIVRET_A)
  let capital = 0, accrued = 0, totalInvested = 0
  for (let i = 0; i < months.length; i++) {
    if (i > 0) {
      const rate = changes.findLast(([since]) => since <= months[i])?.[1]
      if (rate === undefined) throw new Error(`Taux Livret A absent pour ${months[i]}`)
      accrued += capital * rate / 100 / 12
      if (months[i].endsWith('-12')) { capital += accrued; accrued = 0 }
    }
    if (mode === 'dca' || i === 0) { capital += amount; totalInvested += amount }
    series.push(capital + accrued)
    invested.push(totalInvested)
  }
  return { months, series, invested, finalValue: series.at(-1), totalInvested }
}

export function computeCustomSeries(startYm, endYm, amount, customStart, customEnd) {
  const p0 = parseFloat(customStart)
  const p1 = parseFloat(customEnd)
  const ratio = Number.isFinite(p0) && p0 > 0 && Number.isFinite(p1) ? p1 / p0 : 1
  const months = monthsBetween(startYm, endYm)
  const series = months.map((_, i) => {
    const t = months.length > 1 ? i / (months.length - 1) : 1
    return amount * (1 + (ratio - 1) * t)
  })
  const invested = months.map(() => amount)
  return { months, series, invested, finalValue: amount * ratio, totalInvested: amount }
}



// Symbole nu (pas de formatage de montant) — utilisé pour le suffixe du champ de saisie, où
// afficher "1000 $US" via fmtEUR serait redondant avec le chiffre déjà tapé par l'utilisateur.
export function currencySymbol(currency) {
  if (currency === 'GBp') return 'GBp'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).formatToParts(0).find(part => part.type === 'currency').value
}


export function pct(final, invested) {
  return invested > 0 ? ((final - invested) / invested) * 100 : 0
}

// Prix actualisé saisi à la main (plus récent que le dernier point réel de data.js) : jamais
// interpolé ni recalculé mois par mois (ça inventerait des points entre le dernier réel et ce
// prix) — seul le point final est remplacé. finalValue = unités totales × prix au dernier mois
// dans tous les cas (lump ou DCA, cf. computeAssetSeries), donc le mettre à l'échelle du ratio
// prix saisi / prix qu'il remplace reste exact sans reconstituer la série entière.
// Extrait de derive() pour être réutilisé tel quel par le mode Comparatif de la vidéo (cf.
// videoExport.js) — sans ça, un prix à jour saisi pour l'aperçu Simple n'était jamais reporté dans
// la vidéo Comparatif, qui recalculait le même actif à partir du seul dernier point de data.js et
// affichait donc une valeur finale différente pour le même actif sur la même période.
export function applyPriceOverride(result, points, overridePriceRaw, endYm) {
  const overridePrice = parseFloat(overridePriceRaw)
  if (overridePriceRaw === '' || overridePriceRaw === undefined || !Number.isFinite(overridePrice) || overridePrice <= 0) {
    return result
  }
  const priceReplaced = interpolatePrice(points, endYm)
  const scale = overridePrice / priceReplaced
  const finalValue = result.finalValue * scale
  return { ...result, finalValue, series: [...result.series.slice(0, -1), finalValue] }
}

