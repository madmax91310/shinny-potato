// Génération de la vidéo de résultat (canvas 2D animé + MediaRecorder) — 100% côté client, aucune
// dépendance externe. Rejoue exactement la série déjà calculée par derive() (lib.js) : mêmes points
// mois par mois que le Sparkline statique, même valeur finale, même performance. Aucune nouvelle
// donnée n'est produite ici — seule la manière de l'afficher (progressivement, dans le temps) est
// nouvelle. Le tracé de la courbe entre deux points connus (interpolation de POSITION à l'écran pour
// l'animation) est la même technique de rendu qu'un graphique classique (cf. Sparkline.jsx, qui relie
// déjà les points par des segments de droite) — jamais une valeur de série inventée : les nombres
// affichés en overlay (investi cumulé, valeur actuelle) sont soit lus directement dans series[]/
// invested[] à un index entier (mode Simple, drawFrame), soit interpolés en ligne droite entre deux
// vrais points adjacents à l'instant t écoulé (mode Comparatif, drawComparativeFrame/revealSide) —
// jamais une troisième source de donnée inventée entre les deux.
import { fmtEUR, fmtPct, computeAssetSeries, sparseAssetSeries, indexAnchorPoints, applyPriceOverride, ymIndex } from './lib'
import { ASSETS, getAssetMinDate, SPARSE_MONTHLY_DATA_IDS, INCONSISTENT_MONTHLY_DATA_IDS, MONTHS_SHORT } from './data'

const W = 1080
const H = 1080
const PAD = 64
const DRAW_MS = 21000
const HOLD_MS = 3000
const TOTAL_MS = DRAW_MS + HOLD_MS
const CAPTURE_FPS = 30

const COLORS = {
  bgTop: '#0f1e3d',
  bgBottom: '#0a1122',
  border: 'rgba(45,212,191,0.35)',
  teal: '#2dd4bf',
  tealBright: '#5eead4',
  gold: '#fbbf24',
  goldBright: '#fde68a',
  ink: '#f1f5f9',
  inkDim: '#c7cde3',
  inkFaint: '#64748b',
  investedLine: '#5b6688',
  positive: '#34d399',
  negative: '#fb7185',
}

const FONTS = {
  kicker: "700 26px -apple-system, 'Segoe UI', Arial, sans-serif",
  title: "700 54px -apple-system, 'Segoe UI', Arial, sans-serif",
  titleSmall: "700 34px -apple-system, 'Segoe UI', Arial, sans-serif",
  period: "28px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  pill: "700 22px -apple-system, 'Segoe UI', Arial, sans-serif",
  legend: "22px -apple-system, 'Segoe UI', Arial, sans-serif",
  statLabel: "700 22px -apple-system, 'Segoe UI', Arial, sans-serif",
  statValue: "700 38px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  heroLabel: "700 26px -apple-system, 'Segoe UI', Arial, sans-serif",
  heroNumber: "700 72px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  heroPct: "700 36px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  compHeroNumber: "700 46px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  compHeroPct: "700 24px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  footer: "22px -apple-system, 'Segoe UI', Arial, sans-serif",
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function isVideoExportSupported() {
  return (
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  )
}

function pickMimeType() {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  for (const c of candidates) {
    if (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported(c)) return c
  }
  return 'video/webm'
}

// Garde-fous du mode Comparatif — réutilisent tels quels les mécanismes déjà en place dans data.js
// (VERIFIED_MIN_DATE_OVERRIDES / getAssetMinDate, SPARSE_MONTHLY_DATA_IDS) plutôt que d'en recréer :
// mêmes règles que celles qui protègent déjà LVMH/Ethereum/CAC40 ailleurs dans le Calculateur et
// Tweet Midi. Contrairement à l'avertissement (non bloquant) du formulaire principal pour le DCA sur
// actif "sparse", ici on BLOQUE la génération vidéo pour cet actif — juxtaposer deux courbes dont
// l'une est presque entièrement interpolée serait trompeur dans un format comparatif.
// Retourne un message d'erreur précis (nommant l'actif) ou null si l'actif est utilisable tel quel.
export function getComparativeAssetIssue(assetId, startYm, mode, endYm) {
  const asset = ASSETS[assetId]
  const minDate = getAssetMinDate(assetId)
  if (ymIndex(startYm) < ymIndex(minDate)) {
    const [y, m] = minDate.split('-')
    const label = `${MONTHS_SHORT[parseInt(m, 10) - 1]} ${y}`
    return `${asset.label} : données disponibles à partir de ${label} seulement`
  }
  if (endYm && ymIndex(endYm) > ymIndex(asset.points.at(-1).date)) {
    return `${asset.label} : la dernière donnée s'arrête en ${asset.points.at(-1).date}`
  }
  if (INCONSISTENT_MONTHLY_DATA_IDS.has(assetId)) {
    if (!startYm.endsWith('-12')) return `${asset.label} : sélectionne un départ en décembre`
    if (mode === 'dca') return `DCA non disponible pour ${asset.label} — série mensuelle à revérifier`
  }
  if (mode === 'dca' && SPARSE_MONTHLY_DATA_IDS.has(assetId)) {
    return `DCA non disponible pour ${asset.label} — données mensuelles insuffisantes sur cette période`
  }
  return null
}

// Simule la série d'un actif pour le mode Comparatif — appelle directement computeAssetSeries
// (lib.js), la même fonction que le formulaire principal utilise pour l'aperçu statique. Aucun
// calcul distinct, aucune donnée nouvelle : à appeler seulement après getComparativeAssetIssue.
// overridePriceRaw (optionnel) : le "prix à jour" saisi à la main dans le formulaire Simple ne
// concerne qu'un seul actif à la fois — le caller (VideoExport.jsx) ne le transmet donc que si
// assetId correspond bien à l'actif pour lequel il a été saisi, sinon il reste vide et cette
// fonction se comporte comme avant (aucun override).
// Actif à grain annuel (SPARSE_MONTHLY_DATA_IDS) : sparseAssetSeries (lib.js) plutôt que la grille
// mensuelle complète — cf. son commentaire pour le pourquoi (rendu vidéo "hyper mal" sur ces actifs,
// retour utilisateur du 14/09/2026). Mode toujours 'lump' pour ces actifs (DCA bloqué en amont par
// getComparativeAssetIssue), donc pas de branche DCA à gérer ici.
export function computeComparativeSeries(assetId, startYm, endYm, amount, mode, overridePriceRaw = '') {
  const points = ASSETS[assetId].points
  const result = INCONSISTENT_MONTHLY_DATA_IDS.has(assetId)
    ? sparseAssetSeries(indexAnchorPoints(assetId, endYm), startYm, endYm, amount)
    : SPARSE_MONTHLY_DATA_IDS.has(assetId) && mode !== 'dca'
      ? sparseAssetSeries(points, startYm, endYm, amount)
    : computeAssetSeries(points, startYm, endYm, amount, mode)
  return applyPriceOverride(result, points, overridePriceRaw, endYm)
}

// Trace la courbe (valeur de l'actif + capital investi) jusqu'à l'index `upToIndex`, avec un segment
// partiel vers le point suivant à hauteur de `partialFrac` (0-1) pour une animation fluide — ce
// segment relie deux points RÉELS de la série déjà calculée, il n'invente aucune valeur.
function drawChart(ctx, x0, y0, w, h, series, invested, upToIndex, partialFrac) {
  const n = series.length
  const allVals = series.concat(invested)
  let min = Math.min(...allVals)
  let max = Math.max(...allVals)
  if (min > 0) min = 0
  let range = max - min || 1
  max += range * 0.1
  range = max - min || 1

  const xStep = n > 1 ? w / (n - 1) : 0
  const xy = (i, v) => [x0 + i * xStep, y0 + (1 - (v - min) / range) * h]

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 6])
  ;[0.25, 0.5, 0.75].forEach((f) => {
    const gy = y0 + f * h
    ctx.beginPath()
    ctx.moveTo(x0, gy)
    ctx.lineTo(x0 + w, gy)
    ctx.stroke()
  })
  ctx.setLineDash([])

  const lastIdx = Math.min(upToIndex, n - 1)
  const buildPts = (arr) => {
    const pts = []
    for (let i = 0; i <= lastIdx; i++) pts.push(xy(i, arr[i]))
    if (lastIdx < n - 1 && partialFrac > 0) {
      const a = xy(lastIdx, arr[lastIdx])
      const b = xy(lastIdx + 1, arr[lastIdx + 1])
      pts.push([a[0] + (b[0] - a[0]) * partialFrac, a[1] + (b[1] - a[1]) * partialFrac])
    }
    return pts
  }
  const pts = buildPts(series)
  const investedPts = buildPts(invested)
  if (pts.length < 2) return pts[0] || xy(0, series[0])

  const grad = ctx.createLinearGradient(0, y0, 0, y0 + h)
  grad.addColorStop(0, 'rgba(45,212,191,0.38)')
  grad.addColorStop(1, 'rgba(45,212,191,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  pts.forEach((p) => ctx.lineTo(p[0], p[1]))
  ctx.lineTo(pts[pts.length - 1][0], y0 + h)
  ctx.lineTo(pts[0][0], y0 + h)
  ctx.closePath()
  ctx.fill()

  ctx.strokeStyle = COLORS.investedLine
  ctx.lineWidth = 3
  ctx.setLineDash([8, 8])
  ctx.beginPath()
  investedPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])))
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = COLORS.teal
  ctx.lineWidth = 5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])))
  ctx.stroke()

  const tip = pts[pts.length - 1]
  ctx.beginPath()
  ctx.fillStyle = 'rgba(45,212,191,0.28)'
  ctx.arc(tip[0], tip[1], 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.fillStyle = COLORS.tealBright
  ctx.strokeStyle = '#0a1122'
  ctx.lineWidth = 3
  ctx.arc(tip[0], tip[1], 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  return tip
}

// Révèle une série (valeur ET capital investi) jusqu'à l'instant t (0-1, fraction du temps
// CALENDAIRE écoulé dans [globalStartYm, globalEndYm]) — chaque point est placé à sa vraie position
// chronologique, jamais à une position d'index uniforme (contrairement à buildPts dans drawChart,
// mode Simple à une seule série, où ça ne pose pas de problème). Indispensable dès qu'un duel
// Comparatif mélange un actif à grain annuel (peu de points réels, cf. sparseAssetSeries dans
// lib.js) et un actif à données mensuelles (beaucoup de points) : les deux séries n'ont alors PLUS
// le même nombre de points, donc plus le même "nombre de mois" implicite qu'avant l'ajout de
// sparseAssetSeries — sans ce calibrage par le temps réel plutôt que par l'index, la série la plus
// courte se retrouverait comprimée sur une fraction de la largeur du graphique au lieu de couvrir
// toute la période comme l'autre, et les deux courbes avanceraient hors-sync pendant l'animation.
function revealSide(months, seriesArr, investedArr, t, globalStartYm, globalEndYm) {
  const totalSpan = ymIndex(globalEndYm) - ymIndex(globalStartYm) || 1
  const frac = (ym) => (ymIndex(ym) - ymIndex(globalStartYm)) / totalSpan
  const seriesFracs = []
  const investedFracs = []
  let lastF = 0
  let lastV = seriesArr[0]
  let lastI = investedArr[0]
  for (let idx = 0; idx < months.length; idx++) {
    const f = frac(months[idx])
    if (f <= t) {
      seriesFracs.push([f, seriesArr[idx]])
      investedFracs.push([f, investedArr[idx]])
      lastF = f
      lastV = seriesArr[idx]
      lastI = investedArr[idx]
    } else {
      if (t > lastF) {
        const segT = (t - lastF) / (f - lastF || 1)
        lastV = lastV + (seriesArr[idx] - lastV) * segT
        lastI = lastI + (investedArr[idx] - lastI) * segT
        seriesFracs.push([t, lastV])
        investedFracs.push([t, lastI])
      }
      break
    }
  }
  return { seriesFracs, investedFracs, currentValue: lastV, currentInvested: lastI }
}

function xyFromFracs(x0, y0, w, h, fracs, min, max) {
  const range = max - min || 1
  return fracs.map(([f, v]) => [x0 + f * w, y0 + (1 - (v - min) / range) * h])
}

function strokeSeriesLine(ctx, pts, color) {
  if (pts.length < 2) return pts[0]
  ctx.strokeStyle = color
  ctx.lineWidth = 5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.beginPath()
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])))
  ctx.stroke()

  const tip = pts[pts.length - 1]
  ctx.beginPath()
  ctx.globalAlpha = 0.28
  ctx.fillStyle = color
  ctx.arc(tip[0], tip[1], 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.beginPath()
  ctx.fillStyle = color
  ctx.strokeStyle = '#0a1122'
  ctx.lineWidth = 3
  ctx.arc(tip[0], tip[1], 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  return tip
}

// Grille commune + deux courbes de VALEUR (€) partageant le même axe — corrige le double-échelle
// indépendant d'origine (chaque actif sur sa propre plage de valeurs en €, chacune auto-cadrée sur
// SON propre min/max), qui pouvait faire paraître deux courbes proches ou croisées alors que leurs
// écarts réels divergeaient déjà fortement. Avec un axe unique partagé, l'écart visuel entre les deux
// courbes à un instant T reflète fidèlement l'écart réel de valeur à ce moment précis — et comme les
// deux côtés investissent désormais toujours la MÊME somme totale (cf. handleGenerateComparative dans
// VideoExport.jsx), comparer la valeur absolue plutôt que la performance (%) répond directement à la
// question "quelle stratégie rapporte le plus d'argent pour la même somme investie" — demande
// utilisateur du 14/09/2026, après un premier essai en % qui masquait totalement l'effet du montant
// (une courbe de performance est par construction invariante à l'échelle du montant investi, donc
// inchangée qu'on matche les totaux ou non — ce n'était pas le bon indicateur pour ce cas d'usage).
// `invested1`/`invested2` sont tracés en pointillé (même code couleur que la courbe de valeur
// correspondante) pour montrer COMMENT le capital s'est constitué : une ligne qui grimpe pour un DCA,
// plate dès le premier mois pour un versement unique — visuellement, c'est ce qui explique l'écart
// entre les deux courbes de valeur quand le mode diffère sur un même actif. `min`/`max` (plage
// commune) sont calculés une seule fois par appelant (drawComparativeFrame) pour rester stables
// d'une frame à l'autre. `seriesFracsN`/`investedFracsN` sont déjà des paires [fraction de temps
// écoulé 0-1, valeur] — cf. revealSide, qui place chaque point à sa vraie position CHRONOLOGIQUE
// plutôt qu'à une position d'index uniforme : les deux séries d'un duel n'ont plus forcément le
// même nombre de points depuis l'ajout de sparseAssetSeries (un actif à grain annuel comparé à un
// actif à données mensuelles n'a pas le même nombre de vrais points sur la même période), donc
// cette fonction ne fait plus aucune hypothèse sur leur longueur — juste dessiner les points déjà
// positionnés qu'on lui donne.
function drawDualChart(ctx, x0, y0, w, h, seriesFracs1, seriesFracs2, investedFracs1, investedFracs2, color1, color2, min, max) {
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 6])
  ;[0.25, 0.5, 0.75].forEach((f) => {
    const gy = y0 + f * h
    ctx.beginPath()
    ctx.moveTo(x0, gy)
    ctx.lineTo(x0 + w, gy)
    ctx.stroke()
  })
  ctx.setLineDash([])

  const investedPts1 = xyFromFracs(x0, y0, w, h, investedFracs1, min, max)
  const investedPts2 = xyFromFracs(x0, y0, w, h, investedFracs2, min, max)
  ;[[investedPts1, color1], [investedPts2, color2]].forEach(([pts, color]) => {
    if (pts.length < 2) return
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.55
    ctx.lineWidth = 3
    ctx.setLineDash([8, 8])
    ctx.beginPath()
    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])))
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
  })

  const pts1 = xyFromFracs(x0, y0, w, h, seriesFracs1, min, max)
  const pts2 = xyFromFracs(x0, y0, w, h, seriesFracs2, min, max)
  strokeSeriesLine(ctx, pts1, color1)
  strokeSeriesLine(ctx, pts2, color2)
}

function drawFrame(ctx, params, elapsedMs) {
  const { series, invested, assetLabel, periodLabel, modeLabel, totalInvested, finalValue, gainPct, currency = 'EUR' } = params
  const n = series.length

  ctx.clearRect(0, 0, W, H)
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, COLORS.bgTop)
  bg.addColorStop(1, COLORS.bgBottom)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, W - 3, H - 3)

  ctx.textBaseline = 'top'

  ctx.font = FONTS.kicker
  ctx.fillStyle = COLORS.teal
  ctx.fillText('SIMULATION D’INVESTISSEMENT', PAD, PAD)

  ctx.font = FONTS.title
  ctx.fillStyle = COLORS.ink
  ctx.fillText(assetLabel, PAD, PAD + 44)

  ctx.font = FONTS.period
  ctx.fillStyle = COLORS.inkFaint
  ctx.fillText(periodLabel, PAD, PAD + 116)

  ctx.font = FONTS.pill
  const pillPadX = 16
  const pillW = ctx.measureText(modeLabel).width + pillPadX * 2
  const pillH = 40
  const pillX = W - PAD - pillW
  const pillY = PAD + 4
  ctx.strokeStyle = 'rgba(148,163,184,.35)'
  ctx.lineWidth = 2
  roundRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2)
  ctx.stroke()
  ctx.textBaseline = 'middle'
  ctx.fillStyle = COLORS.tealBright
  ctx.fillText(modeLabel, pillX + pillPadX, pillY + pillH / 2 + 1)
  ctx.textBaseline = 'top'

  const drawPhase = elapsedMs < DRAW_MS
  const drawT = Math.min(1, elapsedMs / DRAW_MS)
  const posFloat = drawT * (n - 1)
  const idx = Math.min(n - 1, Math.floor(posFloat))
  const frac = drawPhase ? posFloat - idx : 0

  const chartX = PAD
  const chartY = 290
  const chartW = W - PAD * 2
  const chartH = 400
  drawChart(ctx, chartX, chartY, chartW, chartH, series, invested, idx, frac)

  const legendY = chartY + chartH + 26
  ctx.font = FONTS.legend
  ctx.fillStyle = COLORS.teal
  ctx.fillRect(chartX, legendY + 8, 22, 4)
  ctx.fillStyle = COLORS.inkDim
  ctx.fillText(assetLabel, chartX + 32, legendY)
  const investedLegendX = chartX + 32 + ctx.measureText(assetLabel).width + 40
  ctx.fillStyle = COLORS.investedLine
  ctx.fillRect(investedLegendX - 32, legendY + 8, 22, 4)
  ctx.fillStyle = COLORS.inkDim
  ctx.fillText('Capital investi', investedLegendX, legendY)

  const statsY = legendY + 56

  if (drawPhase) {
    // Valeurs lues directement dans series[]/invested[] à l'index entier atteint — jamais interpolées.
    const curInvested = invested[idx]
    const curValue = series[idx]
    ctx.font = FONTS.statLabel
    ctx.fillStyle = COLORS.inkFaint
    ctx.fillText('INVESTI CUMULÉ', chartX, statsY)
    ctx.font = FONTS.statValue
    ctx.fillStyle = COLORS.ink
    ctx.fillText(fmtEUR(curInvested, currency), chartX, statsY + 32)

    const rightX = chartX + chartW / 2 + 16
    ctx.font = FONTS.statLabel
    ctx.fillStyle = COLORS.inkFaint
    ctx.fillText('VALEUR ACTUELLE', rightX, statsY)
    ctx.font = FONTS.statValue
    ctx.fillStyle = COLORS.tealBright
    ctx.fillText(fmtEUR(curValue, currency), rightX, statsY + 32)
  } else {
    const holdT = Math.min(1, (elapsedMs - DRAW_MS) / 600)
    ctx.save()
    ctx.globalAlpha = holdT
    ctx.font = FONTS.heroLabel
    ctx.fillStyle = COLORS.inkFaint
    ctx.fillText('VALEUR FINALE', chartX, statsY)
    ctx.font = FONTS.heroNumber
    ctx.fillStyle = COLORS.tealBright
    ctx.fillText(fmtEUR(finalValue, currency), chartX, statsY + 34)
    ctx.font = FONTS.heroPct
    ctx.fillStyle = gainPct >= 0 ? COLORS.positive : COLORS.negative
    ctx.fillText(`${fmtPct(gainPct)}  ·  ${fmtEUR(totalInvested, currency)} investis`, chartX, statsY + 128)
    ctx.restore()
  }

  ctx.font = FONTS.footer
  ctx.fillStyle = COLORS.inkFaint
  ctx.fillText('Éducation financière, pas un conseil en investissement.', PAD, H - 52)
}

// Frame du mode Comparatif — même squelette que drawFrame (fond, kicker, période, pastille de mode,
// disclaimer), mais deux courbes/deux libellés au lieu d'un. Toutes les valeurs affichées viennent de
// series1[]/series2[] (computeComparativeSeries, donc computeAssetSeries/sparseAssetSeries de lib.js)
// via revealSide, à l'instant t — soit un vrai point de la série, soit une interpolation en ligne
// droite entre deux vrais points adjacents quand t tombe entre les deux (cf. revealSide) : jamais une
// valeur inventée, juste la même technique d'interpolation de POSITION déjà utilisée pour l'animation
// de la courbe, appliquée aussi aux nombres affichés en overlay.
function drawComparativeFrame(ctx, params, elapsedMs) {
  const {
    series1, series2, invested1, invested2, months1, months2, startYm, endYm, asset1Label, asset2Label,
    periodLabel, mode1Label, mode2Label, finalValue1, finalValue2, gainPct1, gainPct2,
    currency1 = 'EUR', currency2 = 'EUR',
  } = params
  const color1 = COLORS.tealBright
  const color2 = COLORS.goldBright

  // Courbes tracées en valeur absolue plutôt qu'en performance (%) — cf. drawDualChart pour le
  // raisonnement complet. Min/max partagé calculé sur l'intégralité des 4 séries (valeur ET capital
  // investi des deux côtés, pas seulement jusqu'à l'index atteint) pour que l'échelle affichée reste
  // stable tout au long de l'animation plutôt que de "respirer" au fur et à mesure que la courbe se
  // dessine — même technique que drawChart (mode Simple) sur une seule série.
  //
  // Limite connue (demande utilisateur du 22/09/2026, réglée pour les libellés/chiffres ci-dessous
  // via currency1/currency2, PAS pour ce graphique) : quand les deux actifs comparés n'ont pas la
  // même devise (ex. Bitcoin en $ vs LVMH en €), les deux courbes partagent quand même cette même
  // échelle visuelle — une simplification déjà présente avant cette correction, qui compare des
  // TRAJECTOIRES de croissance plutôt que des montants strictement superposables. Les callouts
  // texte (valeur actuelle, valeur finale) restent corrects et affichent chacun leur vraie devise.
  const allVals = series1.concat(series2, invested1, invested2)
  let valMin = Math.min(...allVals)
  let valMax = Math.max(...allVals)
  if (valMin > 0) valMin = 0
  const valRange = valMax - valMin || 1
  valMax += valRange * 0.1

  ctx.clearRect(0, 0, W, H)
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, COLORS.bgTop)
  bg.addColorStop(1, COLORS.bgBottom)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, W - 3, H - 3)

  ctx.textBaseline = 'top'

  ctx.font = FONTS.kicker
  ctx.fillStyle = COLORS.teal
  ctx.fillText('SIMULATION COMPARATIVE', PAD, PAD)

  const dot = (x, y, color) => {
    ctx.beginPath()
    ctx.fillStyle = color
    ctx.arc(x, y, 9, 0, Math.PI * 2)
    ctx.fill()
  }
  // Mode affiché en suffixe de chaque libellé d'actif (plutôt qu'une seule pastille de mode partagée
  // en haut à droite, comme avant l'ajout du duel "même actif, DCA vs versement unique") : les deux
  // séries peuvent désormais avoir un mode différent, une pastille unique serait donc trompeuse dès
  // que mode1Label ≠ mode2Label. Fonctionne identiquement quand les deux modes sont égaux (cas
  // classique de duel entre deux actifs différents) — juste un peu plus verbeux dans ce cas.
  ctx.font = FONTS.titleSmall
  dot(PAD + 9, PAD + 40 + 17, color1)
  ctx.fillStyle = COLORS.ink
  ctx.fillText(asset1Label, PAD + 30, PAD + 40)
  const asset1LabelW = ctx.measureText(asset1Label).width
  dot(PAD + 9, PAD + 84 + 17, color2)
  ctx.fillStyle = COLORS.ink
  ctx.fillText(asset2Label, PAD + 30, PAD + 84)
  const asset2LabelW = ctx.measureText(asset2Label).width

  ctx.font = FONTS.legend
  ctx.fillStyle = COLORS.inkFaint
  ctx.fillText(`· ${mode1Label}`, PAD + 30 + asset1LabelW + 14, PAD + 48)
  ctx.fillText(`· ${mode2Label}`, PAD + 30 + asset2LabelW + 14, PAD + 92)

  ctx.font = FONTS.period
  ctx.fillStyle = COLORS.inkFaint
  ctx.fillText(periodLabel, PAD, PAD + 156)

  // Légende trait plein / pointillé — indispensable une fois la courbe passée en valeur absolue
  // (contrairement au %, où seules les deux courbes de performance étaient affichées) : sans elle,
  // rien ne dit que le pointillé est le capital investi et pas une 3e série de valeur.
  ctx.font = FONTS.legend
  ctx.fillStyle = COLORS.inkDim
  ctx.fillRect(PAD, PAD + 190, 22, 4)
  ctx.fillText('Valeur du portefeuille', PAD + 32, PAD + 182)
  const investedLegendX = PAD + 32 + ctx.measureText('Valeur du portefeuille').width + 40
  ctx.save()
  ctx.setLineDash([5, 5])
  ctx.strokeStyle = COLORS.inkDim
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(investedLegendX - 32, PAD + 192)
  ctx.lineTo(investedLegendX - 10, PAD + 192)
  ctx.stroke()
  ctx.restore()
  ctx.fillText('Capital investi', investedLegendX, PAD + 182)

  const drawPhase = elapsedMs < DRAW_MS
  const drawT = Math.min(1, elapsedMs / DRAW_MS)

  const chartX = PAD
  const chartY = 356
  const chartW = W - PAD * 2
  const chartH = 344
  const side1 = revealSide(months1, series1, invested1, drawT, startYm, endYm)
  const side2 = revealSide(months2, series2, invested2, drawT, startYm, endYm)
  drawDualChart(ctx, chartX, chartY, chartW, chartH, side1.seriesFracs, side2.seriesFracs, side1.investedFracs, side2.investedFracs, color1, color2, valMin, valMax)

  const statsY = chartY + chartH + 40

  if (drawPhase) {
    // Valeurs lues à l'instant t (fraction de temps calendaire écoulée, cf. revealSide) — toujours
    // une valeur RÉELLE de series1[]/series2[] à un point réel, ou une interpolation en ligne droite
    // entre deux points réels adjacents si t tombe entre les deux, jamais une donnée inventée.
    ctx.font = FONTS.statLabel
    ctx.fillStyle = COLORS.inkFaint
    ctx.fillText(asset1Label.toUpperCase(), chartX, statsY)
    ctx.font = FONTS.statValue
    ctx.fillStyle = color1
    ctx.fillText(fmtEUR(side1.currentValue, currency1), chartX, statsY + 32)

    const rightX = chartX + chartW / 2 + 16
    ctx.font = FONTS.statLabel
    ctx.fillStyle = COLORS.inkFaint
    ctx.fillText(asset2Label.toUpperCase(), rightX, statsY)
    ctx.font = FONTS.statValue
    ctx.fillStyle = color2
    ctx.fillText(fmtEUR(side2.currentValue, currency2), rightX, statsY + 32)
  } else {
    const holdT = Math.min(1, (elapsedMs - DRAW_MS) / 600)
    ctx.save()
    ctx.globalAlpha = holdT
    ctx.font = FONTS.heroLabel
    ctx.fillStyle = COLORS.inkFaint
    ctx.fillText('VALEURS FINALES', chartX, statsY)

    ctx.font = FONTS.compHeroNumber
    ctx.fillStyle = color1
    ctx.fillText(fmtEUR(finalValue1, currency1), chartX, statsY + 38)
    ctx.font = FONTS.compHeroPct
    ctx.fillStyle = gainPct1 >= 0 ? COLORS.positive : COLORS.negative
    ctx.fillText(`${fmtPct(gainPct1)} · ${asset1Label}`, chartX, statsY + 92)

    ctx.font = FONTS.compHeroNumber
    ctx.fillStyle = color2
    ctx.fillText(fmtEUR(finalValue2, currency2), chartX, statsY + 132)
    ctx.font = FONTS.compHeroPct
    ctx.fillStyle = gainPct2 >= 0 ? COLORS.positive : COLORS.negative
    ctx.fillText(`${fmtPct(gainPct2)} · ${asset2Label}`, chartX, statsY + 186)
    ctx.restore()
  }

  ctx.font = FONTS.footer
  ctx.fillStyle = COLORS.inkFaint
  ctx.fillText('Éducation financière, pas un conseil en investissement.', PAD, H - 52)
}

// Boucle d'enregistrement partagée par les deux modes : dessine `drawFn(ctx, elapsedMs)` sur le
// canvas à chaque frame pendant TOTAL_MS de temps réel, capture via MediaRecorder
// (canvas.captureStream), résout avec le Blob .webm obtenu. `onProgress` reçoit une fraction 0-1.
function recordCanvas(canvas, drawFn, onProgress) {
  return new Promise((resolve, reject) => {
    if (!isVideoExportSupported()) {
      reject(new Error('unsupported'))
      return
    }
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    let stream
    try {
      stream = canvas.captureStream(CAPTURE_FPS)
    } catch (err) {
      reject(err)
      return
    }

    let recorder
    try {
      recorder = new window.MediaRecorder(stream, { mimeType: pickMimeType(), videoBitsPerSecond: 6_000_000 })
    } catch (err) {
      reject(err)
      return
    }

    const chunks = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    recorder.onerror = (e) => reject(e.error || new Error('recording failed'))
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }))
    }

    let startTime = null
    let stopped = false

    function loop(now) {
      if (stopped) return
      if (startTime === null) startTime = now
      const elapsed = now - startTime
      drawFn(ctx, Math.min(elapsed, TOTAL_MS))
      if (onProgress) onProgress(Math.min(1, elapsed / TOTAL_MS))
      if (elapsed >= TOTAL_MS) {
        stopped = true
        recorder.stop()
        return
      }
      requestAnimationFrame(loop)
    }

    recorder.start()
    requestAnimationFrame(loop)
  })
}

// Anime et enregistre la même série déjà calculée par le Calculateur (mode Simple, un seul actif).
export function renderResultVideo(params, onProgress) {
  return recordCanvas(params.canvas, (ctx, elapsedMs) => drawFrame(ctx, params, elapsedMs), onProgress)
}

// Anime et enregistre les deux séries déjà calculées (mode Comparatif, deux actifs). `params` doit
// contenir series1/series2 ET invested1/invested2 (les 4 déjà produites par computeComparativeSeries,
// pour des actifs ayant passé getComparativeAssetIssue — aucune validation refaite ici). series1/2
// tracent la valeur du portefeuille (trait plein), invested1/2 le capital investi (pointillé) — cf.
// drawDualChart.
export function renderComparativeVideo(params, onProgress) {
  return recordCanvas(params.canvas, (ctx, elapsedMs) => drawComparativeFrame(ctx, params, elapsedMs), onProgress)
}
