import { budgetRowSymbol, budgetQualification, budgetPublicBasis } from './presentation.js'
import { analyzeBudget, budgetPublicPresentation, budgetPublicIncomeRows, budgetImageExpenses, euro, hasSeparateBudgetCapacity } from './lib.js'

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
  pets: 'M9 19Q17 9 25 19Q32 31 17 28Q2 31 9 19ZM6 5V10M16 2V7M26 5V10',
  childcare: 'M12 2A4 4 0 1 0 12 10A4 4 0 1 0 12 2M23 10A3 3 0 1 0 23 16A3 3 0 1 0 23 10M4 31V20Q4 12 12 12Q20 12 20 20V31M20 31V23Q20 18 25 18Q30 18 30 23V31',
  care: 'M4 14H30V30H4ZM10 4A3 3 0 1 0 10 10A3 3 0 1 0 10 4M24 2V8M21 5H27M9 20H24',
  hair: 'M4 25A5 5 0 1 0 14 25A5 5 0 1 0 4 25M20 25A5 5 0 1 0 30 25A5 5 0 1 0 20 25M12 21L29 2M22 21L5 2',
  media: 'M3 10H31V31H3ZM3 10V3H31V10M8 3L12 10M18 3L22 10M15 16L24 21L15 27Z',
  music: 'M12 24V6L29 2V20M4 25A4 4 0 1 0 12 25A4 4 0 1 0 4 25M21 21A4 4 0 1 0 29 21A4 4 0 1 0 21 21',
  digital: 'M6 2H28V24H6ZM6 24L1 31H33L28 24',
  gift: 'M3 11H31V18H3ZM6 18V31H28V18M17 4V31M9 3L17 11L25 3Z',
  dining: 'M4 2V12Q9 18 14 12V2M9 2V32M25 2V32M25 2Q15 14 25 16',
  energy: 'M19 2L5 19H15L12 32L29 13H18Z',
  education: 'M2 5Q9 2 16 6Q23 2 31 5V28Q23 25 16 29Q9 25 2 28ZM16 6V29',
  health: 'M11 3H23V12H32V23H23V32H11V23H2V12H11Z',
  clothing: 'M11 3L3 7L0 16L7 19V31H27V19L34 16L31 7L23 3Q17 12 11 3Z',
  business: 'M3 10H31V30H3ZM11 10V3H23V10M3 18Q17 25 31 18M14 19V24H20V19',
  investment: 'M3 3V31H32M7 24L15 15L21 20L31 6M23 6H31V14',
  insurance: 'M17 2L30 7V18Q28 27 17 32Q6 27 4 18V7ZM10 17L15 22L24 12',
  tax: 'M2 11L17 2L32 11ZM3 30H31M8 15V26M17 15V26M26 15V26',
  child: 'M30 17C30 3 4 0 3 17S21 34 19 26Q16 20 24 22Q31 24 30 17ZM10 10H11M18 7H19M25 12H26M8 19H9',
  debt: 'M2 6H32V28H2ZM2 13H32M7 22H14',
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
function planCard(ctx, money, title, total, rows, color, kind, subtitle = 'PAR MOIS', compact = false, approximate = false) {
  font(ctx, 76, 800)
  const value = `${approximate ? '≈ ' : ''}${money(total)}`, valueWidth = ctx.measureText(value).width
  const titleWidth = CW - PAD * 2 - 88 - valueWidth - 30
  const stacked = titleWidth < 380
  const titleLines = lines(ctx, title, stacked ? CW - PAD * 2 - 88 : titleWidth, 38, 800)
  const titleHeight = titleLines.length * 47
  const subtitleSize = compact ? 26 : 36, subtitleStep = compact ? 33 : 45
  const subtitleLines = lines(ctx, subtitle, stacked ? CW - PAD * 2 - 88 : titleWidth, subtitleSize, 500)
  const headerHeight = Math.max(104, titleHeight + subtitleLines.length * subtitleStep + 12) + (stacked ? 94 : 0)
  // Two fixed type scales, never progressively shrink to fit. The editor's
  // exceptional 37–72 rows retain the previously validated 36px minimum.
  const labelSize = compact ? 36 : 52, amountSize = compact ? 40 : 54, rowStep = compact ? 45 : 64
  const rowPlans = rows.map(row => {
    font(ctx, amountSize, 700)
    const amount = money(row.amount), amountWidth = ctx.measureText(amount).width
    let label = lines(ctx, row.label, CW - PAD * 2 - 72 - amountWidth - 34, labelSize, 600)
    const stacked = label.length >= 3
    if (stacked) label = lines(ctx, row.label, CW - PAD * 2 - 72, labelSize, 600)
    return { ...row, amount, label, stacked, labelSize, amountSize, rowStep, height: Math.max(72, label.length * rowStep + (compact ? 20 : 28) + (stacked ? amountSize + 10 : 0)) }
  })
  return { titleLines, value, stacked, headerHeight, rows: rowPlans, color, kind, subtitleLines,
    subtitleSize, subtitleStep, height: PAD + headerHeight + rowPlans.reduce((h, r) => h + r.height, 0) + (rowPlans.length ? 15 : 0) + PAD }
}
function card(ctx, p, y) {
  ctx.fillStyle = p.color; ctx.beginPath(); ctx.roundRect(X, y, CW, p.height, 32); ctx.fill()
  icon(ctx, p.kind, X + PAD, y + PAD + 2, 60)
  p.titleLines.forEach((line, i) => draw(ctx, line, X + PAD + 88, y + PAD + i * 47, 38, C.ink, 800))
  p.subtitleLines.forEach((line, i) => draw(ctx, line, X + PAD + 88, y + PAD + p.titleLines.length * 47 + 2 + i * p.subtitleStep, p.subtitleSize, C.ink, 500))
  draw(ctx, p.value, X + CW - PAD, y + PAD + (p.stacked ? p.headerHeight - 90 : 0), 76, C.ink, 800, 'right')
  let top = y + PAD + p.headerHeight
  for (const row of p.rows) {
    ctx.fillStyle = '#ffffff80'; ctx.fillRect(X + PAD, top, CW - PAD * 2, 2)
    icon(ctx, budgetRowSymbol(row, p.kind === 'income' ? 'income' : p.kind === 'savings' || p.kind === 'business' ? 'savings' : 'expenses').kind, X + PAD, top + 18, 38)
    row.label.forEach((line, i) => draw(ctx, line, X + PAD + 72, top + 19 + i * row.rowStep, row.labelSize))
    draw(ctx, row.amount, X + CW - PAD, top + 17 + (row.stacked ? row.label.length * row.rowStep + 6 : 0), row.amountSize, C.ink, 700, 'right')
    top += row.height
  }
}
export async function renderBudgetImage(profile, mode = 'detailed') {
  const a = analyzeBudget(profile)
  const money = value => euro(value, profile.currency)
  if (a.errors.length) throw new Error(a.errors.join(' '))
  const canvas = document.createElement('canvas'); canvas.width = W
  const ctx = canvas.getContext('2d')
  const compact = profile.income.length + profile.expenses.length + profile.savings.length > 36
  const detailsSize = compact ? 38 : 46, detailsStep = compact ? 47 : 57
  const presentation = budgetPublicPresentation(profile)
  const name = presentation.name
  const title = name + (profile.age && !name.includes(' et ') && !name.includes(String(profile.age)) ? `, ${profile.age} ans` : '')
  const contextDetails = [presentation.job, presentation.household, presentation.location].filter(Boolean).join(' · ')
  const qualification = budgetQualification(profile)
  const details = [qualification, contextDetails, profile.period && `Période : ${profile.period}`, presentation.incomeNote].filter(Boolean).join(' · ')
  const titleHeight = lines(ctx, title, W - 130, 112, 800).length * 138
  const detailsHeight = lines(ctx, details, W - 130, detailsSize, 500).length * detailsStep
  const headerHeight = 146 + titleHeight + detailsHeight + 24
  const cards = [
    planCard(ctx, money, 'RESSOURCES', a.income, budgetPublicIncomeRows(profile), C.income, 'income', budgetPublicBasis(profile, presentation.basis) || 'PAR MOIS', compact, profile.approximate),
    planCard(ctx, money, 'DÉPENSES', a.expenses, budgetImageExpenses(profile, mode), C.expenses, 'expenses', 'PAR MOIS', compact, profile.approximate),
  ]
  if (profile.savings.length) cards.push(planCard(ctx, money, 'VERSEMENTS', a.savings, profile.savings, C.savings, profile.savings.every(row => budgetRowSymbol(row, 'savings').kind === 'business') ? 'business' : 'savings', 'PAR MOIS', compact, profile.approximate))
  if (hasSeparateBudgetCapacity(profile, a)) cards.push(planCard(ctx, money, profile.kind === 'planned' ? 'CAPACITÉ ENVISAGÉE' : 'CAPACITÉ ANNONCÉE', profile.capacity, [], C.savings, 'savings', 'PAR MOIS', compact, profile.approximate))
  cards.push(planCard(ctx, money, a.balance < 0 ? (profile.savings.length ? 'MANQUE APRÈS VERSEMENTS' : 'DÉFICIT AVANT VERSEMENTS') : (presentation.balanceLabel === 'Reste disponible après versements' ? 'RESTE DISPONIBLE' : presentation.balanceLabel.toLocaleUpperCase('fr')), Math.abs(a.balance), [], a.balance < 0 ? C.deficit : C.balance, 'balance', 'PAR MOIS', compact, profile.approximate))
  canvas.height = headerHeight + cards.reduce((h, p) => h + p.height + GAP, 0) + 82
  ctx.fillStyle = C.background; ctx.fillRect(0, 0, W, canvas.height)
  draw(ctx, 'LE BUDGET DE', 65, 38, 66, C.ivory, 800)
  block(ctx, title, 65, 118, W - 130, 112, C.ivory, 800)
  block(ctx, details, 65, 126 + titleHeight, W - 130, detailsSize, C.muted, 500)
  let y = headerHeight
  for (const p of cards) { card(ctx, p, y); y += p.height + GAP }
  draw(ctx, 'Épargnant Libre', W / 2, canvas.height - 56, 32, C.ivory, 500, 'center')
  return canvas
}
