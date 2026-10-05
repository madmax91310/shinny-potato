import { fmtEUR } from './lib.js'

// Modèle crème validé : deux courbes, écart centré, sans titre de série ni accolade.
const COLORS = {
  bg: '#F3EEE4', ink: '#122D27', muted: '#6C786F',
  green: '#168160', gold: '#B27B30', greenLight: '#65BD91', goldLight: '#D5AD67',
}
const pct = value => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)

export function drawFeeImpactImage(ctx, state, first, second, comparison) {
  const c = ctx
  const { amount, years, returnRate, fee1, fee2 } = state
  const { capital1, capital2, ecart, totalInvested = amount * Math.round(years * 12) } = comparison
  c.save()
  c.fillStyle = COLORS.bg
  c.fillRect(0, 0, 1600, 1600)

  // Grain papier reproductible : aucun effet aléatoire à chaque régénération.
  let seed = 18
  c.fillStyle = 'rgba(92,79,56,0.025)'
  for (let i = 0; i < 26000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const gx = seed % 1600
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    c.fillRect(gx, seed % 1600, 1, 1)
  }

  function text(value, x, y, size, color, { align = 'center', bold = false, serif = false, width = 1420 } = {}) {
    c.fillStyle = color
    c.textAlign = align
    let fontSize = size
    const font = () => `${bold ? 'bold ' : ''}${fontSize}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`
    c.font = font()
    while (c.measureText(value).width > width && fontSize > 18) { fontSize--; c.font = font() }
    c.fillText(value, x, y)
  }

  text(fmtEUR(ecart), 800, 205, 142, COLORS.ink, { bold: true, serif: true })
  text(`d’écart de capital après ${pct(years)} an${years > 1 ? 's' : ''}`, 800, 270, 45, COLORS.ink)
  text(`${pct(fee1)} % contre ${pct(fee2)} % de frais annuels`, 800, 335, 31, COLORS.muted)

  const left = 168, right = 1218, top = 430, bottom = 1285
  const peak = Math.max(1, capital1, capital2)
  const ceiling = peak * 1.14
  const duration = Math.max(first.at(-1)?.year || 0, second.at(-1)?.year || 0, 1 / 12)
  const x = year => left + (right - left) * year / duration
  const y = capital => bottom - (bottom - top) * capital / ceiling
  const rough = peak / 2
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map(n => n * power).find(n => n >= rough) || 10 * power
  const tickValues = [0, step, 2 * step].filter(v => v <= ceiling)
  const axisEUR = value => value >= 1e6 ? `${pct(value / 1e6)} M€`
    : value >= 1000 ? `${pct(value / 1000)} k€` : fmtEUR(value)
  for (const value of tickValues) {
    const py = y(value)
    c.strokeStyle = 'rgba(108,120,111,0.13)'
    c.lineWidth = 1.3
    c.beginPath(); c.moveTo(left, py); c.lineTo(1460, py); c.stroke()
    text(value === 0 ? '0' : axisEUR(value), left - 28, py + 9, 28, COLORS.muted, { align: 'right', width: 135 })
  }
  const timeStep = duration < 1 ? duration / 3
    : [1, 2, 5, 10, 20, 25, 50, 100].find(v => v >= duration / 3) || duration / 3
  const timeTicks = [0]
  for (let tick = timeStep; tick < duration - 1e-8; tick += timeStep) timeTicks.push(tick)
  if (duration - timeTicks.at(-1) < timeStep * .5 && timeTicks.length > 1) timeTicks.pop()
  timeTicks.push(duration)
  for (const year of timeTicks) {
    text(year === 0 ? '0' : `${pct(year)} an${year > 1 ? 's' : ''}`, x(year), bottom + 49, 28, COLORS.muted, { width: 250 })
  }

  function path(points) {
    points.forEach(({ year, capital }, index) => {
      if (index === 0) c.moveTo(x(year), y(capital))
      else c.lineTo(x(year), y(capital))
    })
  }
  c.beginPath()
  path(first)
  second.slice().reverse().forEach(({ year, capital }) => c.lineTo(x(year), y(capital)))
  c.closePath()
  const gradient = c.createLinearGradient(0, bottom, 0, top)
  gradient.addColorStop(0, 'rgba(22,129,96,0.03)')
  gradient.addColorStop(1, 'rgba(22,129,96,0.16)')
  c.fillStyle = gradient
  c.fill()

  // Les couleurs suivent les frais, y compris quand l’utilisateur inverse les scénarios.
  const scenarios = [
    { points: first, capital: capital1, fee: fee1, isin: state.isin1 },
    { points: second, capital: capital2, fee: fee2, isin: state.isin2 },
  ].map((s, index) => ({ ...s, color: s.fee === Math.min(fee1, fee2) && (fee1 !== fee2 || index === 0) ? COLORS.green : COLORS.gold,
    light: s.fee === Math.min(fee1, fee2) && (fee1 !== fee2 || index === 0) ? COLORS.greenLight : COLORS.goldLight }))
  function curve(s) {
    for (const [width, color] of [[20, `${s.color}17`], [11, s.color], [3, s.light]]) {
      c.beginPath(); path(s.points)
      c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke()
    }
    c.fillStyle = s.color
    c.beginPath(); c.arc(right, y(s.capital), 11, 0, Math.PI * 2); c.fill()
  }
  scenarios.forEach(curve)
  const ordered = scenarios.slice().sort((a, b) => b.capital - a.capital)
  const close = Math.abs(y(capital1) - y(capital2)) < 160
  ordered.forEach((s, index) => {
    let tx, ty, align, labelWidth
    if (close) {
      // Deux résultats proches/égaux : étiquettes séparées, reliées à leur vrai point.
      tx = right + 24; align = 'left'; labelWidth = 285
      ty = Math.max(top + 20, y(ordered[0].capital) - 85) + index * 145
      c.strokeStyle = s.color; c.lineWidth = 1.5
      c.beginPath(); c.moveTo(right + 12, y(s.capital)); c.lineTo(tx - 8, ty + 12); c.stroke()
    } else {
      tx = index === 0 ? right - 22 : right + 24
      ty = index === 0 ? y(s.capital) - 90 : y(s.capital) + 42
      align = index === 0 ? 'right' : 'left'
      labelWidth = index === 0 ? 410 : 285
    }
    text(`${pct(s.fee)} % / an`, tx, ty, 34, s.color, { align, bold: true, width: labelWidth })
    text(fmtEUR(s.capital), tx, ty + 55, 47, COLORS.ink, { align, bold: true, width: labelWidth })
    if (s.isin) text(s.isin, tx, ty + 86, 20, COLORS.muted, { align, width: labelWidth })
  })

  text(`${fmtEUR(amount)} / mois  ·  ${pct(years)} an${years > 1 ? 's' : ''}  ·  ${pct(returnRate)} % brut supposé / an`, 800, 1415, 35, COLORS.ink, { bold: true })
  text(`Pour les mêmes ${fmtEUR(totalInvested)} versés`, 800, 1470, 31, COLORS.muted)
  text('Épargnant Libre', 800, 1560, 27, COLORS.ink)
  c.restore()
}
