// Logique de calcul — reprise telle quelle de la session d'origine (vanilla JS),
// juste modernisée en syntaxe ES / modules, aucune formule modifiée.
import { ASSETS, LATEST_YM, MONTHS_FULL, LIVRET_A, INFLATION, INCONSISTENT_MONTHLY_DATA_IDS } from './data'

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
export function indexAnchorPoints(assetId, endYm) {
  return ASSETS[assetId].points.filter((point) => point.date.endsWith('-12') || point.date === endYm)
}

export function computeBenchmarkSeries(rateTable, startYm, endYm, amount, mode) {
  const months = monthsBetween(startYm, endYm)
  const series = []
  const invested = []
  let value = 0
  let totalInvested = 0
  for (let i = 0; i < months.length; i++) {
    if (i > 0) {
      const year = parseInt(months[i].split('-')[0], 10)
      const annual = rateTable[year] !== undefined ? rateTable[year] : 0
      const factor = Math.pow(1 + annual / 100, 1 / 12)
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

export function fmtEUR(n, currency = 'EUR') {
  try {
    // currencyDisplay: 'narrowSymbol' — sans ça, l'Intl fr-FR affiche "$US" pour le dollar (retour
    // utilisateur du 22/09/2026 : juste "$" attendu, comme "€" pour l'euro, déjà narrow par défaut).
    return n.toLocaleString('fr-FR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 })
  } catch {
    return Math.round(n).toLocaleString('fr-FR') + ' €'
  }
}

// Symbole nu (pas de formatage de montant) — utilisé pour le suffixe du champ de saisie, où
// afficher "1000 $US" via fmtEUR serait redondant avec le chiffre déjà tapé par l'utilisateur.
export function currencySymbol(currency) {
  return currency === 'USD' ? '$' : '€'
}

export function fmtPct(n) {
  const s = n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return (n >= 0 ? '+' : '') + s + ' %'
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

export function derive(state) {
  const amount = parseFloat(state.amountRaw) || 0
  const isCustom = state.assetId === 'custom'
  const effectiveMode = isCustom || INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId) ? 'lump' : state.mode
  const startYm = clampYm(state.startYear + '-' + (state.startMonth < 10 ? '0' + state.startMonth : state.startMonth), LATEST_YM)
  // Sans prix saisi, on s'arrête au dernier mois réellement renseigné pour cet actif.
  // Sinon le DCA achète des mois supplémentaires au dernier prix, sans donnée de marché.
  const lastAssetYm = isCustom ? LATEST_YM : ASSETS[state.assetId].points.at(-1).date
  // Le prix facultatif revalorise les parts au terme de cette série, sans inventer
  // de nouveaux versements mensuels entre la dernière clôture et la saisie.
  const endYm = clampYm(lastAssetYm, LATEST_YM)
  const safeStartYm = ymIndex(startYm) > ymIndex(endYm) ? endYm : startYm

  let result = isCustom
    ? computeCustomSeries(safeStartYm, endYm, amount, state.customStart, state.customEnd)
    : INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId)
      ? sparseAssetSeries(indexAnchorPoints(state.assetId, endYm), safeStartYm, endYm, amount)
      : computeAssetSeries(ASSETS[state.assetId].points, safeStartYm, endYm, amount, effectiveMode)

  if (!isCustom) {
    result = applyPriceOverride(result, ASSETS[state.assetId].points, state.overridePriceRaw, endYm)
  }

  const livretA = computeBenchmarkSeries(LIVRET_A, safeStartYm, endYm, amount, effectiveMode)
  const inflation = computeBenchmarkSeries(INFLATION, safeStartYm, endYm, amount, effectiveMode)

  return { amount, isCustom, effectiveMode, startYm: safeStartYm, endYm, result, livretA, inflation }
}

// Ligne de "morale" : jamais un ton figé "j'aurais dû investir" qui sonnerait faux si l'actif a en
// réalité perdu de l'argent sur la période choisie, ou si un simple Livret A a fait aussi bien sans
// aucun risque — le texte s'ajuste au résultat réel plutôt que de supposer que l'actif a toujours
// gagné (demande utilisateur du 22/09/2026, nouveau format de tweet plus direct/meme que l'ancien
// "Si tu avais investi...").
function moraleLine(assetLabel, gainPct, hasLivretCompare, livretValue, assetValue) {
  if (hasLivretCompare && livretValue > assetValue) {
    return gainPct < 0
      ? `Sur cette période, ${assetLabel} a baissé. Le Livret A termine devant, avec une trajectoire bien différente.`
      : gainPct === 0
        ? `${assetLabel} revient à la somme investie. Le Livret A termine devant sur cette période.`
      : `Même avec une hausse de ${assetLabel}, le Livret A termine devant sur cette période.`
  }
  if (hasLivretCompare && livretValue === assetValue) return `${assetLabel} et le Livret A arrivent au même montant sur cette période.`
  if (gainPct < 0) return `${assetLabel} termine sous la somme investie sur cette période. C'est aussi une issue possible.`
  if (gainPct === 0) return `${assetLabel} revient à la somme investie, sans gain sur cette période.`
  if (hasLivretCompare) return `${assetLabel} termine devant le Livret A sur cette période. Sur une autre période, le résultat peut changer.`
  return `${assetLabel} progresse sur cette période, dans sa devise de cotation.`
}

export function buildTweetText(state, d) {
  const asset = d.isCustom ? null : ASSETS[state.assetId]
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

  const endLabel = `${MONTHS_FULL[Number(d.endYm.split('-')[1]) - 1]} ${d.endYm.split('-')[0]}`
  const gainAbs = d.result.finalValue - d.result.totalInvested
  const hookLine = d.effectiveMode === 'dca'
    ? `Et si tu avais investi ${amountFmt} par mois sur ${assetLabel} depuis ${monthLabel} ${yearLabel} ? 🫢`
    : `Et si tu avais investi ${amountFmt} sur ${assetLabel} en ${monthLabel} ${yearLabel} ? 🫢`

  const lines = [
    hookLine,
    '',
    `${d.isCustom ? 'Avec les deux prix saisis' : state.overridePriceRaw !== '' ? `Au prix saisi, avec des versements jusqu'en ${endLabel}` : `Au dernier point disponible (${endLabel})`} : ${finalFmt} 💸`,
    `Somme investie : ${fmtEUR(d.result.totalInvested, currency)}`,
    `${gainAbs < 0 ? 'Perte' : 'Gain'} : ${fmtEUR(Math.abs(gainAbs), currency)} (${fmtPct(gainPct)} de la somme investie)`,
  ]
  if (INCONSISTENT_MONTHLY_DATA_IDS.has(state.assetId)) {
    lines.push('Indice théorique dividendes réinvestis, hors frais ; ce n’est pas la performance d’un ETF précis.')
  }
  if (state.assetId === 'silver') {
    lines.push('Série de prix de futures COMEX continus en dollars : frais et renouvellement des contrats non simulés. Ce résultat ne représente pas le rendement d’un placement réel en argent.')
  }

  // Comparaison Livret A : uniquement pour les actifs en euros, jamais un montant en dollars
  // comparé à un Livret A en euros sans taux de change — même règle que ResultCard côté UI
  // (demande utilisateur du 22/09/2026, le mélange de devises corrigé plus tôt dans la session).
  const hasLivretCompare = currency === 'EUR'
  if (hasLivretCompare) {
    lines.push('', `Avec les mêmes versements sur un Livret A : ${fmtEUR(d.livretA.finalValue, 'EUR')} (simulation indicative)`)
  }
  lines.push('', `📌 ${moraleLine(assetLabel, gainPct, hasLivretCompare, d.livretA.finalValue, d.result.finalValue)}`)
  lines.push('', `💬 Tu aurais gardé ce placement jusqu'en ${endLabel} ?`)

  return lines.join('\n')
}
