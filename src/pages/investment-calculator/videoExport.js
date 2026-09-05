// Génération de la vidéo de résultat (canvas 2D animé + MediaRecorder) — 100% côté client, aucune
// dépendance externe. Rejoue exactement la série déjà calculée par derive() (lib.js) : mêmes points
// mois par mois que le Sparkline statique, même valeur finale, même performance. Aucune nouvelle
// donnée n'est produite ici — seule la manière de l'afficher (progressivement, dans le temps) est
// nouvelle. Le tracé de la courbe entre deux points connus (interpolation de POSITION à l'écran pour
// l'animation) est la même technique de rendu qu'un graphique classique (cf. Sparkline.jsx, qui relie
// déjà les points par des segments de droite) — jamais une valeur de série inventée : les nombres
// affichés en overlay (investi cumulé, valeur actuelle) sont toujours lus directement dans series[]/
// invested[] à un index entier, jamais interpolés.
import { fmtEUR, fmtPct } from './lib'

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
  period: "28px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  pill: "700 22px -apple-system, 'Segoe UI', Arial, sans-serif",
  legend: "22px -apple-system, 'Segoe UI', Arial, sans-serif",
  statLabel: "700 22px -apple-system, 'Segoe UI', Arial, sans-serif",
  statValue: "700 38px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  heroLabel: "700 26px -apple-system, 'Segoe UI', Arial, sans-serif",
  heroNumber: "700 72px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
  heroPct: "700 36px 'SF Mono', 'Cascadia Code', Menlo, Consolas, monospace",
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

function drawFrame(ctx, params, elapsedMs) {
  const { series, invested, assetLabel, periodLabel, modeLabel, totalInvested, finalValue, gainPct } = params
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
    ctx.fillText(fmtEUR(curInvested), chartX, statsY + 32)

    const rightX = chartX + chartW / 2 + 16
    ctx.font = FONTS.statLabel
    ctx.fillStyle = COLORS.inkFaint
    ctx.fillText('VALEUR ACTUELLE', rightX, statsY)
    ctx.font = FONTS.statValue
    ctx.fillStyle = COLORS.tealBright
    ctx.fillText(fmtEUR(curValue), rightX, statsY + 32)
  } else {
    const holdT = Math.min(1, (elapsedMs - DRAW_MS) / 600)
    ctx.save()
    ctx.globalAlpha = holdT
    ctx.font = FONTS.heroLabel
    ctx.fillStyle = COLORS.inkFaint
    ctx.fillText('VALEUR FINALE', chartX, statsY)
    ctx.font = FONTS.heroNumber
    ctx.fillStyle = COLORS.tealBright
    ctx.fillText(fmtEUR(finalValue), chartX, statsY + 34)
    ctx.font = FONTS.heroPct
    ctx.fillStyle = gainPct >= 0 ? COLORS.positive : COLORS.negative
    ctx.fillText(`${fmtPct(gainPct)}  ·  ${fmtEUR(totalInvested)} investis`, chartX, statsY + 128)
    ctx.restore()
  }

  ctx.font = FONTS.footer
  ctx.fillStyle = COLORS.inkFaint
  ctx.fillText('Éducation financière, pas un conseil en investissement.', PAD, H - 52)
}

// Anime et enregistre la même série déjà calculée par le Calculateur sur un canvas, capture via
// MediaRecorder (canvas.captureStream), résout avec le Blob .webm obtenu. `onProgress` reçoit une
// fraction 0-1 de la durée totale (20-30s réelles, indépendantes du nombre de points de la série).
export function renderResultVideo(params, onProgress) {
  return new Promise((resolve, reject) => {
    if (!isVideoExportSupported()) {
      reject(new Error('unsupported'))
      return
    }
    const { canvas } = params
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
      drawFrame(ctx, params, Math.min(elapsed, TOTAL_MS))
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
