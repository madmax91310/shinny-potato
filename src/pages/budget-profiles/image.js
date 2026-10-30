import { analyzeBudget, budgetKind, euro } from './lib.js'

const C = { navy: '#071d36', ivory: '#fff4df', yellow: '#ffd342', muted: '#9eb7d2', panel: '#0d263e', teal: '#63dfbd', red: '#ff9b90' }
const colors = ['#ffd342', '#3899ff', '#63dfbd', '#bd9eff', '#ff9b70', '#b7ce6e', '#ec99cd', '#aec8df']
let fontReady
async function loadFont() {
  if (!fontReady) fontReady = new FontFace('BudgetEditorial', `url("${import.meta.env.BASE_URL}asset-art/editorial.woff2")`, { weight: '500' }).load()
    .then(font => document.fonts.add(font)).catch(() => { fontReady = undefined })
  await fontReady
}
function text(ctx, value, x, y, width, size = 32, color = C.ivory, weight = 500, family = 'Arial') {
  ctx.font = `${weight} ${size}px ${family}`
  while (ctx.measureText(value).width > width && size > 26) ctx.font = `${weight} ${--size}px ${family}`
  if (ctx.measureText(value).width > width) {
    let shortened = String(value)
    while (shortened.length && ctx.measureText(`${shortened}…`).width > width) shortened = shortened.slice(0, -1)
    value = `${shortened}…`
  }
  ctx.fillStyle = color
  ctx.fillText(value, x, y)
}
function panel(ctx, x, y, width, height) {
  ctx.fillStyle = C.panel; ctx.strokeStyle = '#23425e'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect(x, y, width, height, 24); ctx.fill(); ctx.stroke()
}
function lines(ctx, value, x, y, width, size = 32) {
  ctx.font = `400 ${size}px Arial`
  const words = value.split(' '); let line = '', count = 0
  for (const word of words) {
    const next = [line, word].filter(Boolean).join(' ')
    if (line && ctx.measureText(next).width > width) { text(ctx, line, x, y + count * (size + 12), width, size, C.muted, 400); count++; line = word }
    else line = next
  }
  if (line) { text(ctx, line, x, y + count * (size + 12), width, size, C.muted, 400); count++ }
  return count * (size + 12)
}

export async function renderBudgetImage(profile) {
  const a = analyzeBudget(profile)
  if (a.errors.length) throw new Error(a.errors.join(' '))
  await loadFont()
  const rows = profile.expenses
  // One wide list keeps labels legible when X displays the PNG at phone width.
  const height = 790 + rows.length * 92
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = height
  const ctx = canvas.getContext('2d')
  const bg = ctx.createLinearGradient(0, 0, 1200, height)
  bg.addColorStop(0, '#071b36'); bg.addColorStop(.5, '#03152c'); bg.addColorStop(1, '#092952')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1200, height)
  text(ctx, 'LE BUDGET DE', 55, 64, 1090, 30, C.muted, 700)
  text(ctx, profile.name, 50, 148, 1100, 68, C.ivory, 500, 'BudgetEditorial')
  text(ctx, [budgetKind(profile), profile.period].filter(Boolean).join(' · '), 55, 202, 1090, 34, C.muted, 400)
  const details = [profile.job, profile.location, profile.household === 'Situation familiale non précisée' ? '' : profile.household].filter(Boolean).join(' · ')
  lines(ctx, details, 55, 248, 1090, 30)
  const metrics = [
    { label: 'Revenus', value: a.income, color: C.yellow },
    { label: 'Dépenses', value: a.expenses, color: C.ivory },
    { label: a.available < 0 ? 'Déficit avant épargne' : 'Reste avant épargne', value: a.available, color: a.available < 0 ? C.red : C.teal },
  ]
  metrics.forEach((metric, i) => {
    const x = 40 + i * 380
    panel(ctx, x, 295, 360, 150)
    text(ctx, metric.label, x + 24, 342, 315, 32, C.muted)
    text(ctx, euro(metric.value), x + 22, 411, 315, 58, metric.color, 500, 'BudgetEditorial')
  })
  panel(ctx, 40, 475, 1120, 100 + rows.length * 92)
  text(ctx, 'Les dépenses du mois', 70, 534, 1060, 40, C.ivory, 500, 'BudgetEditorial')
  rows.forEach((row, index) => {
    const y = 608 + index * 92
    ctx.fillStyle = colors[index % colors.length]; ctx.beginPath(); ctx.arc(77, y - 12, 7, 0, Math.PI * 2); ctx.fill()
    text(ctx, row.label, 100, y, 780, 40)
    ctx.save(); ctx.textAlign = 'right'; text(ctx, euro(row.amount), 1125, y, 220, 44); ctx.restore()
    ctx.fillStyle = '#213c53'; ctx.beginPath(); ctx.roundRect(100, y + 20, 1025, 7, 3); ctx.fill()
    ctx.fillStyle = colors[index % colors.length]; ctx.fillRect(100, y + 20, 1025 * Math.min(1, row.amount / a.income), 7)
  })
  const footer = height - 130
  if (profile.capacity !== null) text(ctx, `Capacité d’épargne annoncée : ≈ ${euro(profile.capacity)}`, 55, footer, 1090, 37, C.teal)
  else if (profile.savings.length) text(ctx, `Épargne prévue : ${euro(a.savings)} · Solde : ${euro(a.balance)}`, 55, footer, 1090, 37, C.teal)
  else text(ctx, profile.incomeBasis, 55, footer, 1090, 32, C.muted)
  if (profile.approximate) text(ctx, 'Montants approximatifs', 55, footer + 45, 1090, 30, C.muted, 400)
  ctx.save(); ctx.textAlign = 'center'; text(ctx, 'Épargnant Libre', 600, height - 26, 1090, 32, C.ivory, 500, 'BudgetEditorial'); ctx.restore()
  return canvas
}
