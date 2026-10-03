import { fmtEUR } from './lib.js'

const COLORS = {
  bg: '#0B1622', ink: '#F7F3EA', muted: '#AAB8BC', grid: '#33404A',
  green: '#43D7A4', gold: '#E7B765', brand: '#B9A774',
}
const pct = value => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)
const crisp = value => Math.round(value * 10) / 10

export function drawFeeImpactImage(ctx, state, first, second, comparison) {
  const { amount, years, returnRate, fee1, fee2 } = state
  const { capital1, capital2, ecart } = comparison
  const c = ctx
  c.fillStyle = COLORS.bg
  c.fillRect(0, 0, 1600, 1200)
  c.textAlign = 'left'
  c.fillStyle = COLORS.brand
  c.font = 'bold 25px sans-serif'
  c.fillText('ÉPARGNANT LIBRE', 110, 100)
  c.fillStyle = COLORS.ink
  c.font = 'bold 84px sans-serif'
  c.fillText('Impact des frais', 110, 200)
  c.fillStyle = COLORS.muted
  c.font = '31px sans-serif'

  const left = 205, right = 1450, top = 330, bottom = 790
  const peak = Math.max(1, capital1, capital2)
  const rough = peak / 4
  const power = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map(n => n * power).find(n => n >= rough) || 10 * power
  const ceiling = Math.ceil(peak / step) * step
  const x = year => left + (right - left) * year / Math.max(years, 1 / 12)
  const y = capital => bottom - (bottom - top) * capital / ceiling

  c.font = '23px sans-serif'
  c.textAlign = 'right'
  for (let tick = 0; tick <= ceiling + step / 100; tick += step) {
    const py = y(tick)
    c.strokeStyle = COLORS.grid
    c.lineWidth = 2
    c.beginPath(); c.moveTo(left, py); c.lineTo(right, py); c.stroke()
    c.fillStyle = COLORS.muted
    c.fillText(tick === 0 ? '0' : fmtEUR(tick), left - 24, py + 8)
  }
  c.textAlign = 'center'
  const duration = Math.round(years * 12) / 12
  const ticks = [...new Set([0, 1, 2, 3, 4].map(i => crisp(duration * i / 4)))]
  for (const tick of ticks) c.fillText(String(tick).replace('.', ','), x(tick), bottom + 42)
  c.textAlign = 'left'
  c.font = 'bold 19px sans-serif'
  c.fillText('DURÉE (ANNÉES)', 110, bottom + 79)

  function curve(points, color) {
    c.beginPath()
    points.forEach(({ year, capital }, index) => {
      if (index === 0) c.moveTo(x(year), y(capital))
      else c.lineTo(x(year), y(capital))
    })
    c.strokeStyle = color
    c.lineWidth = 8
    c.lineCap = 'round'
    c.lineJoin = 'round'
    c.stroke()
    const last = points.at(-1)
    c.fillStyle = color
    c.beginPath(); c.arc(x(last.year), y(last.capital), 10, 0, Math.PI * 2); c.fill()
  }
  curve(first, COLORS.green)
  curve(second, COLORS.gold)

  c.font = 'bold 27px sans-serif'
  c.fillStyle = COLORS.green; c.fillText('●', 210, 925)
  c.fillStyle = COLORS.ink; c.fillText(`Scénario 1 · ${pct(fee1)} % / an`, 250, 925)
  c.fillStyle = COLORS.gold; c.fillText('●', 790, 925)
  c.fillStyle = COLORS.ink; c.fillText(`Scénario 2 · ${pct(fee2)} % / an`, 830, 925)

  for (const { x: col, label, value, color } of [
    { x: 110, label: state.isin1 ? `SCÉNARIO 1 · ${state.isin1}` : 'SCÉNARIO 1', value: capital1, color: COLORS.green },
    { x: 610, label: state.isin2 ? `SCÉNARIO 2 · ${state.isin2}` : 'SCÉNARIO 2', value: capital2, color: COLORS.gold },
    { x: 1110, label: 'ÉCART FINAL', value: ecart, color: COLORS.brand },
  ]) {
    c.fillStyle = color; c.font = 'bold 21px sans-serif'; c.fillText(label, col, 1000)
    c.fillStyle = COLORS.ink; c.font = 'bold 44px sans-serif'; c.fillText(fmtEUR(value), col, 1050)
  }
  c.fillStyle = COLORS.muted
  c.font = '23px sans-serif'
  c.fillText(`${fmtEUR(amount)} / mois · ${pct(years)} ans · rendement brut supposé : ${pct(returnRate)} % / an`, 110, 1110)
  c.font = '19px sans-serif'
  c.fillText('Versements en début de mois.', 110, 1145)
  c.fillText('Simulation illustrative · taux constants hypothétiques · hors fiscalité et inflation.', 110, 1175)
}
