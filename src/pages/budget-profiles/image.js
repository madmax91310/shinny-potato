import { analyzeBudget, budgetDisplayName, euro } from './lib.js'

// Model 3: fixed readable type, measured wrapping, cards and canvas grow together.
// No ellipsis or fixed line count: a participant may use all 24 rows per section.
const C = { ink: '#10182f', background: '#1c2127', ivory: '#fff8e5', muted: '#bdc5d4', income: '#dbd1ff', expenses: '#ffc4ae', savings: '#c5f4cb', balance: '#f6e9c4', deficit: '#ffaaa8' }
const W = 1200, X = 36, CW = W - X * 2, PAD = 38, GAP = 22
const font = (ctx, size, weight = 600) => { ctx.font = `${weight} ${size}px Arial, sans-serif` }
function lines(ctx, value, width, size, weight = 600) {
  font(ctx, size, weight)
  const result = []
  let line = ''
  for (const word of String(value).split(/\s+/).filter(Boolean)) {
    if (line && ctx.measureText(`${line} ${word}`).width > width) { result.push(line); line = '' }
    // Long unbroken participant labels must fit too, without losing characters.
    for (const char of word) {
      if (ctx.measureText(line + char).width > width) { result.push(line); line = '' }
      line += char
    }
    line += ' '
    line = line.trimEnd()
    // Insert the word separator only for the next word.
    line += ' '
  }
  if (line.trim()) result.push(line.trim())
  return result
}
function draw(ctx, value, x, y, size, color = C.ink, weight = 600, align = 'left') {
  font(ctx, size, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top'
  ctx.fillText(value, x, y)
}
function block(ctx, value, x, y, width, size, color, weight = 600) {
  const wrapped = lines(ctx, value, width, size, weight), step = Math.ceil(size * 1.23)
  wrapped.forEach((line, i) => draw(ctx, line, x, y + i * step, size, color, weight))
  return wrapped.length * step
}
// Small deterministic pictograms keep the image reproducible without emoji fonts.
const paths = {
  income: 'M4 6C4 2 28 2 28 6S4 10 4 6ZM4 6V14C4 18 28 18 28 14V6M4 14V22C4 26 28 26 28 22V14M4 22V28C4 32 28 32 28 28V22',
  expenses: 'M2 3H6L10 23H28L32 9H8M12 28H13M25 28H26',
  savings: 'M5 13C5 6 26 5 29 14L32 15V22L27 23L25 29H21L20 25H12L11 29H7L6 23L2 20V15H5ZM18 3V8M14 5H22M24 14H25',
  balance: 'M3 7H29V29H3ZM3 7L24 2V7M20 16H30V23H20Z',
  housing: 'M2 15L16 3L30 15M6 13V30H13V20H20V30H27V13',
  food: 'M3 4H7L11 23H28L31 10H9M13 29H14M25 29H26',
  transport: 'M4 20L7 9H26L30 20V27H4ZM4 20H30M8 27V30M26 27V30M9 23H11M24 23H26',
  bills: 'M9 2H25V31H9ZM14 27H20',
  leisure: 'M9 10H25L31 27H24L20 22H14L10 27H3ZM8 17H16M12 13V21M23 16H24M26 20H27',
  other: 'M7 2H26V31L22 28L18 31L14 28L10 31L7 28ZM12 10H22M12 16H22M12 22H19',
}
function icon(ctx, kind, x, y, size = 44) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 34, size / 34)
  ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.stroke(new Path2D(paths[kind] || paths.other)); ctx.restore()
}
function planCard(ctx, title, total, rows, color, kind, subtitle = 'PAR MOIS') {
  font(ctx, 76, 800)
  const value = euro(total), valueWidth = ctx.measureText(value).width
  const titleWidth = CW - PAD * 2 - 88 - valueWidth - 30
  const stacked = titleWidth < 380
  const titleLines = lines(ctx, title, stacked ? CW - PAD * 2 - 88 : titleWidth, 38, 800)
  const titleHeight = titleLines.length * 47
  const subtitleLines = lines(ctx, subtitle, stacked ? CW - PAD * 2 - 88 : titleWidth, 26, 500)
  const headerHeight = Math.max(104, titleHeight + subtitleLines.length * 33 + 12) + (stacked ? 94 : 0)
  const rowPlans = rows.map(row => {
    font(ctx, 40, 700)
    const amount = euro(row.amount), amountWidth = ctx.measureText(amount).width
    const label = lines(ctx, row.label, CW - PAD * 2 - 72 - amountWidth - 34, 36, 600)
    return { ...row, amount, label, height: Math.max(72, label.length * 45 + 28) }
  })
  return { titleLines, value, stacked, headerHeight, rows: rowPlans, color, kind, subtitleLines,
    height: PAD + headerHeight + rowPlans.reduce((h, r) => h + r.height, 0) + (rowPlans.length ? 15 : 0) + PAD }
}
function card(ctx, p, y) {
  ctx.fillStyle = p.color; ctx.beginPath(); ctx.roundRect(X, y, CW, p.height, 32); ctx.fill()
  icon(ctx, p.kind, X + PAD, y + PAD + 2, 60)
  p.titleLines.forEach((line, i) => draw(ctx, line, X + PAD + 88, y + PAD + i * 47, 38, C.ink, 800))
  p.subtitleLines.forEach((line, i) => draw(ctx, line, X + PAD + 88, y + PAD + p.titleLines.length * 47 + 2 + i * 33, 26, C.ink, 500))
  draw(ctx, p.value, X + CW - PAD, y + PAD + (p.stacked ? p.headerHeight - 90 : 0), 76, C.ink, 800, 'right')
  let top = y + PAD + p.headerHeight
  for (const row of p.rows) {
    ctx.fillStyle = '#ffffff80'; ctx.fillRect(X + PAD, top, CW - PAD * 2, 2)
    icon(ctx, row.category || 'other', X + PAD, top + 18, 38)
    row.label.forEach((line, i) => draw(ctx, line, X + PAD + 72, top + 19 + i * 45, 36))
    draw(ctx, row.amount, X + CW - PAD, top + 17, 40, C.ink, 700, 'right')
    top += row.height
  }
}
export async function renderBudgetImage(profile) {
  const a = analyzeBudget(profile)
  if (a.errors.length) throw new Error(a.errors.join(' '))
  const canvas = document.createElement('canvas'); canvas.width = W
  const ctx = canvas.getContext('2d')
  const name = budgetDisplayName(profile)
  const title = name + (profile.age && !name.includes(String(profile.age)) ? `, ${profile.age} ans` : '')
  const details = [profile.job, profile.location, profile.household === 'Situation familiale non précisée' ? '' : profile.household].filter(Boolean).join(' · ')
  const titleHeight = lines(ctx, title, W - 130, 112, 800).length * 138
  const detailsHeight = lines(ctx, details, W - 130, 38, 500).length * 47
  const plannedHeight = profile.kind === 'planned' ? 46 : 0
  const headerHeight = 146 + titleHeight + detailsHeight + plannedHeight + 24
  const cards = [
    planCard(ctx, 'RESSOURCES', a.income, profile.income, C.income, 'income', profile.incomeBasis || 'PAR MOIS'),
    planCard(ctx, 'DÉPENSES', a.expenses, profile.expenses, C.expenses, 'expenses'),
  ]
  if (profile.savings.length) cards.push(planCard(ctx, 'VERSEMENTS PRÉVUS', a.savings, profile.savings, C.savings, 'savings'))
  if (profile.capacity !== null) cards.push(planCard(ctx, profile.kind === 'planned' ? 'CAPACITÉ ENVISAGÉE' : 'CAPACITÉ ANNONCÉE', profile.capacity, [], C.savings, 'savings'))
  cards.push(planCard(ctx, a.balance < 0 ? (profile.savings.length ? 'MANQUE APRÈS VERSEMENTS' : 'DÉFICIT AVANT ÉPARGNE') : 'RESTE DISPONIBLE', Math.abs(a.balance), [], a.balance < 0 ? C.deficit : C.balance, 'balance'))
  canvas.height = headerHeight + cards.reduce((h, p) => h + p.height + GAP, 0) + 82
  ctx.fillStyle = C.background; ctx.fillRect(0, 0, W, canvas.height)
  draw(ctx, 'LE BUDGET DE', 65, 38, 66, C.ivory, 800)
  block(ctx, title, 65, 118, W - 130, 112, C.ivory, 800)
  block(ctx, details, 65, 126 + titleHeight, W - 130, 38, C.muted, 500)
  if (plannedHeight) draw(ctx, 'BUDGET PRÉVU', 65, 134 + titleHeight + detailsHeight, 30, C.ivory, 700)
  let y = headerHeight
  for (const p of cards) { card(ctx, p, y); y += p.height + GAP }
  draw(ctx, 'Épargnant Libre', W / 2, canvas.height - 56, 32, C.ivory, 500, 'center')
  return canvas
}
