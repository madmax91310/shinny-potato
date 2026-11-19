import { analyzeBudget, budgetCashIncome, budgetExpenseColumns, budgetPublicPresentation,
  budgetTransferPlan, cleanTransferLabel, euro, publicationContextFor } from './lib.js'
import { budgetProfileHousehold, budgetRowSymbol } from './presentation.js'
import socialLabels from './social-labels.json' with { type: 'json' }

export const SOCIAL_SIZE = { width: 1080, height: 1350 }
export const SOCIAL_BODY_SIZE = 31

const colors = {
  cream: '#f4f1e8', ink: '#102d28', muted: '#4d6255', green: '#153d34',
  salmon: '#fa987d', mint: '#a6e5ca', gold: '#f4cc77', white: '#fcfaf1',
  fixed: '#fbe9e1', flexible: '#fdf0d4', savings: '#e3f1e2', capacity: '#e4ecd9',
}
const width = 980
const margin = 50
const gap = 20
const column = (width - gap) / 2
const detailsY = 635
const detailsHeight = 520
const sum = rows => rows.reduce((total, row) => total + Math.round(row.amount * 100), 0) / 100

// Keep the user's main rows. Aggregate the smaller ones only within the same
// public category and retain the original rows for reconciliation with the text.
function groupRows(rows, maximum, otherLabel = 'Autres postes', question = '', label = shortLabel) {
  const prepared = rows.map(row => ({ label: label(row), amount: row.amount, members: [row], order: row.order }))
  if (prepared.length > maximum && otherLabel === 'Autres postes') {
    const clothes = prepared.find(row => row.members[0].label === 'Vêtements')
    const gifts = prepared.find(row => /^(?:Provision )?cadeaux$/iu.test(row.members[0].label))
    if (clothes && gifts) {
      prepared.splice(prepared.indexOf(clothes), 1)
      prepared.splice(prepared.indexOf(gifts), 1)
      prepared.push({ label: 'Vêtements et cadeaux', amount: sum([clothes, gifts]), members: [...clothes.members, ...gifts.members] })
    }
  }
  const sorted = prepared.toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0) || b.amount - a.amount)
  const keep = sorted.length <= maximum ? sorted : sorted.slice(0, maximum - 1)
  if (keep.length > 2 && keep.length < sorted.length) {
    const relevant = sorted.find(row => row.members.some(member => mentionsRow(question, member)))
    if (relevant && !keep.includes(relevant)) keep[keep.length - 1] = relevant
  }
  if (keep.length !== sorted.length) {
    const rest = sorted.filter(row => !keep.includes(row))
    const pair = rest.map(row => row.label).join(' et ')
    const name = otherLabel === 'Autres postes' && rest.length === 2 && pair.length <= 22 ? pair : otherLabel
    keep.push({ label: name, amount: sum(rest), members: rest.flatMap(row => row.members) })
  }
  return keep
}

const compactLabels = [
  [/^Crédit à la consommation$/i, 'Crédit conso'],
  [/^Cantine des deux enfants$/i, 'Cantine'],
  [/^Centre de loisirs du mercredi$/i, 'Loisirs du mercredi'],
  [/^Loyer et charges locatives$/i, 'Loyer et charges'],
  [/^Courses, hygiène et trois chats$/i, 'Courses, hygiène, chats'],
  [/^Transports du quotidien$/i, 'Transports'],
  [/^Assurances habitation et auto$/i, 'Assur. logement et auto'],
  [/^Cadeaux et remplacements$/i, 'Cadeaux et achats'],
  [/^Provision trajets familiaux$/i, 'Trajets famille'],
  [/^Loyer, eau et chauffage$/i, 'Loyer et charges'],
  [/^Assurance maladie LAMal.*$/i, 'Assurance LAMal'],
  [/^Alimentation et boissons sans alcool$/i, 'Alim. et boissons'],
  [/^Téléphone, internet, télévision et redevance$/i, 'Télécoms + TV'],
  [/^Coiffeur, loisirs et argent de poche · adulte (.+)$/i, 'Loisirs et soins $1'],
  [/^Loisirs communs, école et camps$/i, 'École et loisirs'],
  [/^Assurances habitation et santé$/i, 'Assur. logement et santé'],
  [/^Abonnement de transport$/i, 'Abonnement transport'],
  [/^Livret A · précaution prévue$/i, 'Livret A · précaution'],
  [/^Enveloppe vacances prévue$/i, 'Vacances'],
  [/^Enveloppe rentrée scolaire prévue$/i, 'Rentrée scolaire'],
  [/^Épargne de sécurité prévue$/i, 'Épargne de sécurité'],
]
const normalizeMatch = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
function mentionsRow(question, row) {
  const label = normalizeMatch(row.label.replace(/^Provision /i, ''))
  return label.length > 5 && question.includes(label)
}

function shortLabel(row) {
  if (row.imageLabel) return row.imageLabel
  if (Object.hasOwn(socialLabels, row.label)) return socialLabels[row.label]
  const compact = compactLabels.find(([pattern]) => pattern.test(row.label))
  if (compact) return row.label.replace(...compact)

  return row.label.replace(/^(?:(?:Sa|Leur) )?Part (?:personnelle )?(?:du |de la |de l[’']|des |d[’'])?/i, '')
    .replace(/^Carburant, entretien et assurance auto$/i, 'Frais auto')
    .replace(/^(?:Courses|Alimentation)(?: alimentaires)? payées sur (?:le|son) compte$/i, 'Courses')
    .replace(/^Assurance habitation$/i, 'Assur. habitation')
    .replace(/^Provisions?(?: mensuelles?)? (?:pour )?(?=.{18,})/i, '')
    .replace(/(?:Box )?internet et (?:forfaits? )?(?:téléphones?|mobiles?)/i, 'Télécoms')
    .replace(/téléphones? et internet/i, 'Télécoms')
    .replace(/^(?:Remboursement du |Mensualité du )crédit /i, 'Crédit ')
    .replace(/^(?:Sa |Son |Leur )(?=\p{L})/iu, '')
    .replace(/^[\p{L}]/u, letter => letter.toLocaleUpperCase('fr')).trim()
}

export function planSocialBudget(profile) {
  const totals = analyzeBudget(profile)
  const presentation = budgetPublicPresentation(profile)
  const question = normalizeMatch(presentation.question || '')
  if (totals.errors.length) throw new Error(totals.errors.join(' '))
  const [left, right] = budgetExpenseColumns(profile)
  const fixed = left.rows.filter(row => !row.mixed), mixed = left.rows.filter(row => row.mixed)
  const plan = budgetTransferPlan(profile)
  const flexibleLimit = plan.rows.length ? 3 : 8
  const fixedRows = groupRows(fixed, mixed.length ? 7 : 8, 'Autres postes', question)
  if (mixed.length) fixedRows.push(...groupRows(mixed, 1, 'Autres frais mixtes'))
  const expenses = [
    [{ ...left, title: mixed.length && fixed.length ? 'Frais contraints et mixtes' : left.title, rows: fixedRows }],
    [{ ...right, rows: groupRows(right.rows, flexibleLimit, 'Autres postes', question) }],
  ]
  const transferRows = groupRows(plan.rows, 4, plan.mixed ? 'Autres du plan' : 'Autres versements', question, row => {
    if (row.imageLabel) return row.imageLabel
    const label = cleanTransferLabel(shortLabel(row), plan.planned)
    const status = plan.distinct && { planned: 'prévu', paid: 'versé', budgeted: 'budget' }[row.status]
    return status ? `${label} · ${status}` : label
  })
  const budget = publicationContextFor(profile)?.budget
  return { totals, presentation, expenses, transferRows, plan,
    incomeLabel: budget?.imageCaption || budget?.imageIncomeLabel,
    netSalary: budgetCashIncome(profile).netSalary, showAllocation: !presentation.averageBeforeInvestments && totals.income > 0 && totals.balance >= 0 }
}

let budgetFont
function loadBudgetFont() {
  if (!budgetFont) {
    const url = `${import.meta.env.BASE_URL}asset-art/investor-type/inter-latin.woff2`
    budgetFont = new FontFace('Budget Inter', `url("${url}")`, { weight: '100 900' }).load()
      .then(face => document.fonts.add(face)).catch(() => {})
  }
  return budgetFont
}

function type(ctx, size, weight = 500) {
  ctx.font = `${weight} ${size}px "Budget Inter", Arial, sans-serif`
}

function fit(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text
  const words = text.trim().split(/\s+/)
  while (words.length > 1 && ctx.measureText(words.join(' ') + '…').width > max) words.pop()
  const prefix = [...words.join(' ').replace(/[·,:]$/, '').trim()]
  while (prefix.length && ctx.measureText(prefix.join('') + '…').width > max) prefix.pop()
  return prefix.join('') + '…'
}

function draw(ctx, text, x, y, { size = SOCIAL_BODY_SIZE, weight = 500, color = colors.ink, align = 'left', max } = {}) {
  type(ctx, size, weight)
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  ctx.textAlign = align
  ctx.fillText(max === undefined ? text : fit(ctx, text, max), x, y)
}

function drawAmount(ctx, text, x, y, max, options) {
  const weight = options.weight || 800
  let size = options.size
  type(ctx, size, weight)
  while (ctx.measureText(text).width > max && size > 27) type(ctx, --size, weight)
  draw(ctx, text, x, y + (options.size - size) / 2, { ...options, weight, size })
}

function box(ctx, x, y, w, h, color, radius = 24) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.fill()
}

function drawIdentity(ctx, profile, presentation) {
  const { name, job, location } = presentation
  const age = profile.age && !/ ans\b| et /i.test(name) ? `, ${profile.age} ans` : ''
  type(ctx, 78, 800)
  const long = ctx.measureText(name + age).width > width
  if (long) {
    type(ctx, 47, 800)
    const words = name.trim().split(/\s+/), first = []
    while (words.length > 1 && ctx.measureText([...first, words[0]].join(' ')).width <= width) first.push(words.shift())
    if (first.length) draw(ctx, first.join(' '), 540, 25, { size: 47, weight: 800, align: 'center' })
    type(ctx, 47, 800)
    draw(ctx, fit(ctx, words.join(' '), width - ctx.measureText(age).width) + age,
      540, first.length ? 79 : 52, { size: 47, weight: 800, align: 'center' })
  } else draw(ctx, name + age, 540, 47, { size: 78, weight: 800, align: 'center' })

  const household = budgetProfileHousehold(presentation.household)
    .replace(/^Couple de (\d+) et (\d+) ans/, '$1 et $2 ans')
    .replace(/ · sans enfant/i, ' sans enfant')
    .replace(/un enfant de (\d+) ans pendant les vacances/i, '1 enfant')
    .replace(/deux enfants de (\d+) et (\d+) ans/i, '2 enfants ($1 et $2 ans)')
    .replace('trois enfants de 5, 8 et 11 ans · relais familial après l’école', '3 enfants · relais familial')
    .replace('Sylvie, 62 ans · couple marié · maison payée · enfants indépendants', 'Sylvie, 62 ans · maison payée · couple')
  const compactJob = job?.includes(' · ') ? job
    .replace(/(?:^| · )[^:·]+ : /g, part => part.startsWith(' · ') ? ' · ' : '')
    .replace(/assistante administrative/i, 'assistante admin.')
    .replace(/technicien de maintenance/i, 'technicien maintenance')
    .replace(/agente d’entretien à temps partiel/i, 'agente d’entretien (temps partiel)')
    .replace('Assistante dentaire et préparateur de commandes · tous deux à 60 %', 'Assistante dentaire et préparateur · 60 %')
    .replace(/préparateur de commandes/i, 'préparateur commandes') : job
  const context = [location?.replace(/^Agglomération lilloise$/i, 'Région lilloise'), household].filter(Boolean).join(' · ')
  if (compactJob) draw(ctx, compactJob, 540, 140, { size: 35, weight: 650, align: 'center', max: width })
  if (context) draw(ctx, context, 540, job ? 193 : 158, { size: 31, color: colors.muted, align: 'center', max: width })
}

function drawIncome(ctx, profile, plan, money) {
  const { totals, netSalary, showAllocation } = plan
  box(ctx, margin, 250, width, 207, colors.green, 30)
  draw(ctx, plan.incomeLabel?.toUpperCase() || (netSalary ? 'SALAIRE NET MENSUEL' : 'REVENUS MENSUELS'), 540, showAllocation ? 271 : 290,
    { size: 25, weight: 750, color: colors.mint, align: 'center' })
  drawAmount(ctx, (profile.approximate ? '≈ ' : '') + money(totals.income), 540, showAllocation ? 305 : 325, width - 60,
    { size: 78, color: colors.white, align: 'center' })
  if (!showAllocation) return
  const x = margin + 28, y = 413, w = width - 56, h = 20
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, h / 2)
  ctx.clip()
  let cursor = x
  for (const [amount, color] of [[totals.expenses, colors.salmon], [totals.savings, colors.mint], [totals.balance, colors.gold]]) {
    const segment = amount / totals.income * w
    ctx.fillStyle = color
    ctx.fillRect(cursor, y, segment, h)
    cursor += segment
  }
  ctx.restore()
}

function drawTotals(ctx, plan, money) {
  const { totals: a } = plan
  const average = plan.presentation.averageBeforeInvestments
  const card = (width - 2 * 15) / 3
  const data = [
    ['Dépenses', a.expenses, colors.salmon],
    [plan.plan.planned ? plan.plan.label : 'Versements', a.savings, colors.mint],
    [average ? 'Solde moyen' : (plan.plan.planned || plan.presentation.projected) ? (a.balance < 0 ? 'Déficit prévu' : 'Reste prévu') : a.balance < 0 ? 'Reste négatif' : 'Reste disponible', a.balance, colors.gold],
  ]
  data.forEach(([label, amount, color], index) => {
    const x = margin + index * (card + 15), center = x + card / 2
    box(ctx, x, 480, card, 130, color)
    drawAmount(ctx, average && index === 1 ? 'Non isolés' : money(amount), center, 491, card - 22, { size: 47, align: 'center' })
    draw(ctx, label, center, 555, { align: 'center', size: 29, weight: 600 })
  })
}

const labelBySymbol = {
  housing: 'Logement', energy: 'Énergie', food: 'Alimentation', transport: 'Transport',
  education: 'École', child: 'Enfants', bills: 'Factures', health: 'Santé', clothing: 'Vêtements',
  insurance: 'Assurance', childcare: 'Garde', care: 'Entretien', tax: 'Impôts', gift: 'Cadeaux',
  dining: 'Repas', leisure: 'Loisirs', investment: 'Placement', savings: 'Épargne', debt: 'Crédit',
}
function detailLabel(ctx, row, room, index, transfer) {
  for (const size of [SOCIAL_BODY_SIZE, 29, 27]) {
    type(ctx, size)
    if (ctx.measureText(row.label).width <= room) return { text: row.label, size }
  }
  const { kind } = budgetRowSymbol(row.members[0], transfer ? 'savings' : 'expenses')
  const status = transfer && row.label.match(/ · (prévu|versé|budget)$/u)?.[1]
  const name = labelBySymbol[kind] || (transfer ? 'Versement' : 'Dépense')
  const number = index + 1
  const fallback = `${name} ${number}${status ? ' · ' + status : ''}`
  const compact = status ? `${status[0].toUpperCase() + status.slice(1)} ${number}` : `Poste ${number}`
  return { text: ctx.measureText(fallback).width <= room ? fallback : compact, size: 27 }
}

function detailCard(ctx, x, y, height, title, total, rows, background, money) {
  box(ctx, x, y, column, height, background)
  draw(ctx, title, x + column / 2, y + 20, { size: 28, weight: 750, align: 'center' })
  if (total !== undefined) drawAmount(ctx, money(total), x + column / 2, y + 59, column - 45, { size: 32, align: 'center' })
  if (!rows.length) return
  const start = total === undefined ? 80 : 107
  const step = Math.min(total === undefined ? 46 : 51, (height - start - 13) / rows.length)
  for (const [index, row] of rows.entries()) {
    const yy = y + start + step * index
    const amount = money(row.amount)
    type(ctx, SOCIAL_BODY_SIZE, 650)
    const room = column - 58 - ctx.measureText(amount).width
    const label = detailLabel(ctx, row, room, index, total === undefined)
    draw(ctx, label.text, x + 23, yy, { size: label.size })
    draw(ctx, amount, x + column - 23, yy, { align: 'right', weight: 650 })
  }
}

export async function renderSocialBudgetImage(profile) {
  await loadBudgetFont()
  const plan = planSocialBudget(profile)
  const canvas = document.createElement('canvas')
  Object.assign(canvas, SOCIAL_SIZE)
  const ctx = canvas.getContext('2d')
  const money = value => euro(value, profile.currency)
  ctx.fillStyle = colors.cream
  ctx.fillRect(0, 0, SOCIAL_SIZE.width, SOCIAL_SIZE.height)
  drawIdentity(ctx, profile, plan.presentation)
  drawIncome(ctx, profile, plan, money)
  drawTotals(ctx, plan, money)

  const [[fixed], [flexible]] = plan.expenses
  const x = margin + column + gap
  detailCard(ctx, margin, detailsY, detailsHeight, fixed.title,
    fixed.amount, fixed.rows, colors.fixed, money)
  const flexibleHeight = plan.transferRows.length ? Math.max(156, 110 + 37 * flexible.rows.length) : detailsHeight
  detailCard(ctx, x, detailsY, flexibleHeight, flexible.title, flexible.amount, flexible.rows, colors.flexible, money)
  if (plan.transferRows.length) {
    detailCard(ctx, x, detailsY + flexibleHeight + 18, detailsHeight - flexibleHeight - 18, plan.plan.label,
      undefined, plan.transferRows, colors.savings, money)
  }

  box(ctx, margin, 1180, width, 85, colors.capacity)
  draw(ctx, plan.presentation.averageBeforeInvestments ? 'Solde moyen avant placements' : plan.totals.available < 0 ? 'Déficit avant versements' : 'Capacité d’épargne',
    margin + 28, 1202, { size: 35, weight: 750 })
  drawAmount(ctx, money(plan.totals.available), width + margin - 28, 1195, 410, { size: 43, align: 'right' })
  draw(ctx, 'ÉPARGNANT LIBRE', 540, 1302, { size: 23, weight: 800, color: colors.green, align: 'center' })
  return canvas
}
