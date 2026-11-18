import {
  analyzeBudget, budgetAdaptation, budgetExpenseSections, budgetPublicIncomeRows,
  budgetPublicPresentation, budgetTransferLabel, budgetTransferStatus, euro,
} from './lib.js'
import { budgetPublicBasis, budgetQualification, budgetRowSymbol } from './presentation.js'
import { budgetCompletions } from './budget-completions.js'

export const SOCIAL_SIZE = { width: 1080, height: 1350 }
export const SOCIAL_BODY_SIZE = 40
const colors = { ink: '#10182f', background: '#1c2127', cream: '#fff8e5', muted: '#c8ced9',
  income: '#dbd1ff', expense: '#ffc4ae', savings: '#c5f4cb', balance: '#f6e9c4', deficit: '#ffaaa8' }
const width = 1000
const margin = 40
const collator = new Intl.Collator('fr')
const cents = n => Math.round(n * 100)
const sum = rows => rows.reduce((total, row) => total + cents(row.amount), 0) / 100
const compactLabels = {
  housing: 'Logement', energy: 'Énergie et eau', insurance: 'Assurances', education: 'École et études', cantine: 'Cantine',
  health: 'Santé', tax: 'Impôts', bills: 'Télécoms', transport: 'Transports', food: 'Courses',
  pets: 'Animaux', childcare: 'Garde d’enfants', care: 'Hygiène', child: 'Activités enfants',
  debt: 'Crédits', clothing: 'Vêtements', gift: 'Cadeaux', dining: 'Restaurants', media: 'Streaming',
  music: 'Musique', digital: 'Équipement', leisure: 'Loisirs', hair: 'Coiffure',
}
const groupTitles = { fixed: 'Contraintes', flexible: 'Non contraintes', mixed: 'Mixtes et autres' }

function shortLabel(label) {
  return label.replace(/^(?:Sa |Leur )?Part (?:personnelle )?(?:du |de la |de l[’']|des |d[’'])?/i, '')
    .replace(/ \(\d[^)]*\b(?:CHF|EUR|€)[^)]*\)/gu, '')
    .replace(/^Provision (?:mensuelle )?(?:pour )?/i, '')
    .replace(/(?:Box )?internet et (?:forfaits? )?(?:téléphones?|mobiles?)/i, 'Télécoms')
    .replace(/téléphones? et internet/i, 'Télécoms')
    .replace(/^(?:Alimentation|Courses alimentaires)(?=\b)/i, 'Courses')
    .replace(/^Essence, train, assurances et abonnements$/i, 'Transport et divers')
    .replace(/^Transports, assurances, téléphone et abonnements$/i, 'Transport et divers')
    .replace(/^Santé, coiffeur, cantine et divers$/i, 'Santé et divers')
    .replace(/^Courses et (carburant|restaurants)$/i, (_, kind) => `Courses + ${kind === 'carburant' ? 'auto' : 'repas'}`)
    .replace(/^Assurance habitation$/i, 'Assur. logement')
    .replace(/^Restaurants et sorties$/i, 'Sorties + repas')
    .replace(/^(?:Vacances et cadeaux|Cadeaux et vacances)$/i, 'Congés + cadeaux')
    .replace(/^Frais professionnels non remboursés$/i, 'Frais de travail')
    .replace(/^Assurance automobile, essence et téléphone$/i, 'Auto + téléphone')
    .replace(/^Équipement et imprévus$/i, 'Achats et imprévus')
    .replace(/^(?:Entretien et (?:petits )?équipements?|Entretien et réparations|Équipement et réparations)$/i, 'Achats et entretien')
    .replace(/^Remplacement des appareils$/i, 'Appareils')
    .replace(/^Argent de poche (?:de l’enfant|des enfants)$/i, 'Argent de poche')
    .replace(/^Coiffeur, loisirs et argent de poche.*$/i, 'Loisirs et soins')
    .replace(/^Téléphone, santé et assurances personnelles$/i, 'Santé + factures')
    .replace(/^École et activités (?:de son enfant|des enfants)$/i, 'École et activités')
    .replace(/^Dépenses des enfants$/i, 'Enfants')
    .replace(/^Garderie, repas et activités$/i, 'Garde et activités')
    .replace(/^Dépenses annuelles$/i, 'Frais annuels')
    .replace(/^Mobile, assurances et abonnements personnels$/i, 'Assur. + forfaits')
    .replace(/^Télécoms, abonnements, sport$/i, 'Télécoms + loisirs')
    .replace(/^Équipement et dépenses occasionnelles$/i, 'Achats divers')
    .replace(/^Rentrée et équipements$/i, 'Rentrée et achats')
    .replace(/^Imprévus et remplacements$/i, 'Achats et imprévus')
    .replace(/^Entretien et appareils$/i, 'Entretien et achats')
    .replace(/^Téléphone et abonnements$/i, 'Télécoms + abos')
    .replace(/^Garde, cantine et enfant$/i, 'Garde et cantine')
    .replace(/^[\p{L}]/u, letter => letter.toLocaleUpperCase('fr')).trim()
}

function groupExpenses(section, limit) {
  let rows = section.rows.map((row, index) => {
    const kind = /^assurances? habitation et auto/i.test(row.label) ? 'insurance' :
      /^cantine/i.test(row.label) ? 'cantine' : budgetRowSymbol(row).kind
    return { ...row, label: shortLabel(row.label), kind, members: [index] }
  })
  if (rows.length > limit) {
    const byLabel = new Map()
    for (const row of rows) {
      const label = row.annualProvision || row.periodicity === 'annual-provision' || /^provision/i.test(section.rows[row.members[0]].label)
        ? 'Provisions' : section.id === 'mixed' ? row.label : (compactLabels[row.kind] || row.label)
      byLabel.set(label, [...(byLabel.get(label) || []), row])
    }
    rows = [...byLabel.entries()].map(([label, items]) => items.length === 1 ? items[0] :
      { label, amount: sum(items), members: items.flatMap(row => row.members) })
  }
  rows.sort((a, b) => b.amount - a.amount || collator.compare(a.label, b.label))
  if (rows.length > limit) {
    const small = rows.splice(limit - 1)
    rows.push({ label: 'Autres postes', amount: sum(small), members: small.flatMap(row => row.members) })
  }
  return rows
}

export function planSocialBudget(profile) {
  const totals = analyzeBudget(profile)
  if (totals.errors.length) throw new Error(totals.errors.join(' '))
  const presentation = budgetPublicPresentation(profile)
  const groups = budgetExpenseSections(profile)
  const single = groups.length === 1
  const columns = single ? [groups] : [
    groups.filter(group => group.id === 'fixed'),
    groups.filter(group => group.id !== 'fixed'),
  ].filter(column => column.length)
  const expenses = columns.map(column => column.map(section => {
    const limit = column.length === 1 ? 7 : (section.id === 'mixed' ? 2 : 4)
    return { id: section.id, amount: sum(section.rows), rows: groupExpenses(section, limit) }
  }))
  const publishedHighlight = profile.kind === 'participant' ? null : budgetCompletions[profile.id]?.highlight
  const finance = profile.kind === 'participant' ? [] : profile.editorialCreation?.finance || []
  const stock = finance.find(item => item.type === 'financial-stock' && /sécurité|précaution|liquid|réserve|livret/i.test(item.label))
  const project = finance.find(item => item.type === 'project' && Number.isFinite(item.targetAmount))
  const highlight = publishedHighlight || stock || (project && { label: project.label, amount: project.targetAmount, target: true })
  const income = budgetPublicIncomeRows(profile)
  const perks = income.filter(row => row.inKind)
  const transfers = new Map()
  for (const row of profile.savings) {
    const status = budgetTransferStatus(profile, row)
    transfers.set(status, (transfers.get(status) || 0) + cents(row.amount))
  }
  return { totals, presentation, expenses, highlight, income: income.filter(row => !row.inKind), perks, transfers }
}

function type(ctx, size, weight) {
  ctx.font = `${weight} ${size}px Arial, sans-serif`
}

function fit(ctx, value, maxWidth) {
  if (ctx.measureText(value).width <= maxWidth) return value
  const words = value.trim().split(/\s+/)
  while (words.length > 1 && ctx.measureText(words.join(' ')).width > maxWidth) words.pop()
  const phrase = words.join(' ').replace(/(?:\s+(?:·|et|de|du|des|à|au|en)|[,:])$/i, '')
  if (ctx.measureText(phrase).width <= maxWidth) return phrase
  const letters = [...phrase]
  while (letters.length && ctx.measureText(letters.join('') + '…').width > maxWidth) letters.pop()
  return letters.join('') + '…'
}

function draw(ctx, value, x, y, { size = SOCIAL_BODY_SIZE, color = colors.ink, weight = 600, align = 'left', maxWidth } = {}) {
  type(ctx, size, weight)
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.fillText(maxWidth === undefined ? value : fit(ctx, value, maxWidth), x, y)
}

function panel(ctx, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 22)
  ctx.fill()
}

function drawIdentity(ctx, profile, presentation) {
  const { name, job, household } = presentation
  const age = profile.age && !/ ans\b| et /i.test(name) ? `, ${profile.age} ans` : ''
  const tag = [budgetAdaptation(profile), budgetQualification(profile)].filter(Boolean).join(' · ')
  draw(ctx, 'LE BUDGET DE', margin, 32, { size: 32, color: colors.cream, weight: 800 })
  if (tag) draw(ctx, tag, 1040, 34, { size: 32, color: colors.muted, align: 'right' })
  type(ctx, 64, 800)
  const singleLine = ctx.measureText(name + age).width <= width
  if (singleLine) {
    draw(ctx, name + age, margin, 83, { size: 64, color: colors.cream, weight: 800 })
  } else {
    type(ctx, 48, 800)
    const words = name.trim().split(/\s+/)
    const first = []
    while (words.length > 1 && ctx.measureText([...first, words[0]].join(' ')).width <= width) first.push(words.shift())
    if (first.length) {
      draw(ctx, first.join(' '), margin, 80, { size: 48, color: colors.cream, weight: 800 })
      const second = fit(ctx, words.join(' '), width - ctx.measureText(age).width)
      draw(ctx, second + age, margin, 132, { size: 48, color: colors.cream, weight: 800 })
    } else {
      const shortened = fit(ctx, name, width - ctx.measureText(age).width)
      draw(ctx, shortened + age, margin, 80, { size: 48, color: colors.cream, weight: 800 })
    }
  }
  const occupations = job.replace(/(?:^| · )[\p{L}’-]+\s*:\s*/gu, match => match.startsWith(' · ') ? ' · ' : '')
    .replace(/assistante administrative/gi, 'Assistante admin.').replace(/préparateur de commandes/gi, 'Préparateur logistique')
    .replace(/ · budget prévu/i, '').replace(/ · (?:première|deuxième|troisième) année/i, '')
  const family = household.replace(/\b(un|deux|trois) enfants?(?: de [\d, et]+ ans)?/gi,
    (_, count) => ({ un: '1 enfant', deux: '2 enfants', trois: '3 enfants' })[count.toLowerCase()])
    .replace(/ · sa part du logement et ses dépenses.*| · sa part du budget du couple/i, ' · Sa part')
    .replace(/ · factures réglées sur son compte/i, '').replace(/ · installation dans son logement/i, '')
  const contextTop = singleLine ? 165 : 188
  if (occupations) draw(ctx, occupations, margin, contextTop, { color: colors.muted, maxWidth: width })
  if (family) draw(ctx, family, margin, occupations ? (singleLine ? 217 : 232) : contextTop, { color: colors.muted, maxWidth: width })
}

function incomeLabel(label) {
  if (/salaire|rémunération/i.test(label)) return /net/.test(label.toLowerCase()) ? 'Salaire net' : 'Salaire'
  if (/CAF|Mobili.jeune|\bAPL\b/i.test(label)) return 'Aides logement'
  if (/allocation/i.test(label)) return 'Allocations'
  if (/aide/i.test(label)) return 'Aides'
  if (/prime|pécule/i.test(label)) return 'Primes'
  if (/pension/i.test(label)) return 'Pension'
  if (/chômage/i.test(label)) return 'Chômage'
  return shortLabel(label)
}

function drawIncome(ctx, profile, plan, money) {
  const { totals, income, perks, presentation } = plan
  const basis = budgetPublicBasis(profile, presentation.basis)
  const average = /moyen|liss[ée]/i.test([basis, presentation.incomeNote, ...income.map(row => row.label)].join(' '))
  const heading = perks.length ? 'Revenus disponibles' : average ? 'Revenus moyens' : 'Revenus mensuels'
  panel(ctx, margin, 278, width, 164, colors.income)
  draw(ctx, heading, 62, 301, { weight: 800 })
  draw(ctx, money(totals.income), 1018, 293, { size: 54, weight: 800, align: 'right' })
  if (income.length > 1) {
    const second = income.length === 2 ? income[1] : { label: 'Autres revenus', amount: sum(income.slice(1)) }
    for (const [index, row] of [income[0], second].entries()) {
      const x = 62 + index * 498
      const amount = money(row.amount)
      type(ctx, 38, 700)
      const maxWidth = 458 - ctx.measureText(amount).width - 14
      draw(ctx, incomeLabel(row.label), x, 358, { size: 38, maxWidth })
      draw(ctx, amount, x + 458, 358, { size: 38, weight: 700, align: 'right' })
    }
  } else {
    const detail = (/^Montants mensuels$/i.test(basis) ? income[0]?.label || '' : basis).split(' · ')[0]
    draw(ctx, detail, 62, 358, { size: 38, maxWidth: 952 })
  }
  if (perks.length) draw(ctx, `Avantages hors total : ${money(sum(perks))}`, 62, 400, { size: 34 })
}

function drawExpenses(ctx, plan, money, number) {
  const { totals, expenses } = plan
  panel(ctx, margin, 460, width, 506, colors.expense)
  draw(ctx, 'Dépenses mensuelles', 62, 479, { weight: 800 })
  draw(ctx, money(totals.expenses), 1018, 473, { size: 50, weight: 800, align: 'right' })
  const columnWidth = expenses.length === 1 ? 956 : 458
  for (const [index, column] of expenses.entries()) {
    const x = 62 + index * 498
    let y = 549
    for (const { id, amount, rows } of column) {
      draw(ctx, groupTitles[id], x, y, { size: 36, weight: 800 })
      const subtotal = number(amount)
      if (rows.length > 1 && ctx.measureText(groupTitles[id]).width + ctx.measureText(subtotal).width + 12 <= columnWidth) {
        draw(ctx, subtotal, x + columnWidth, y, { size: 36, weight: 800, align: 'right' })
      }
      y += 49
      for (const row of rows) {
        const value = number(row.amount)
        type(ctx, SOCIAL_BODY_SIZE, 700)
        const maxWidth = columnWidth - ctx.measureText(value).width - 16
        const kindLabel = id === 'mixed' ? 'Poste mixte' : compactLabels[row.kind]
        const label = ctx.measureText(row.label).width > maxWidth && kindLabel ? kindLabel : row.label
        draw(ctx, maxWidth < 130 ? 'Divers' : label, x, y, { maxWidth })
        draw(ctx, value, x + columnWidth, y, { weight: 700, align: 'right' })
        y += 47
      }
      y += 9
    }
  }
}

function drawSaving(ctx, profile, plan, money, number) {
  const { totals: a, transfers, highlight } = plan
  const metrics = [[a.available < 0 ? (profile.savings.length ? 'Déficit avant' : 'Déficit') : 'Capacité d’épargne', a.available, a.available < 0 ? colors.deficit : colors.savings]]
  if (profile.savings.length) metrics.push([budgetTransferLabel(profile), a.savings, colors.savings],
    [a.balance < 0 ? 'Déficit' : 'Solde', a.balance, a.balance < 0 ? colors.deficit : colors.balance])
  const mixed = transfers.size > 1
  const gap = 14
  const cardWidth = (width - gap * (metrics.length - 1)) / metrics.length
  metrics.forEach(([label, value, color], index) => {
    const x = margin + index * (cardWidth + gap)
    panel(ctx, x, 986, cardWidth, 176, color)
    const transferCard = index === 1
    draw(ctx, transferCard ? 'Versements' : label, x + 16, 1006, { size: 32, weight: 800 })
    draw(ctx, number(value), x + 16, 1051, { size: 42, weight: 800 })
    if (transferCard && label !== 'Versements mixtes') {
      const qualifier = label === 'Versements' ? 'Au budget' : label.replace('Versements ', '')
      draw(ctx, qualifier[0].toUpperCase() + qualifier.slice(1), x + 16, 1113, { size: 32 })
    }
    if (index === 2) draw(ctx, 'Après versements', x + 16, 1113, { size: 32 })
  })
  if (mixed) {
    const statusLabels = { paid: 'Effectués', planned: 'Prévus', budgeted: 'Au budget' }
    let x = margin
    for (const [status, amount] of transfers) {
      draw(ctx, statusLabels[status], x, 1179, { size: 34, color: colors.muted })
      draw(ctx, number(amount / 100), x, 1218, { size: 38, color: colors.cream })
      x += (width + gap) / transfers.size
    }
  } else if (highlight) {
    const label = highlight.label.split(' : ')[0]
    const amount = money(highlight.amount, highlight.currency)
    type(ctx, 40, 600)
    const space = width - ctx.measureText(amount).width - 18
    const subject = fit(ctx, `${highlight.target ? 'Objectif · ' : ''}${label}`, space)
    draw(ctx, `${subject} : ${amount}`, margin, 1208, { color: colors.cream })
  }

}

export async function renderSocialBudgetImage(profile) {
  if (document.fonts?.ready) await document.fonts.ready
  const plan = planSocialBudget(profile)
  const canvas = document.createElement('canvas')
  Object.assign(canvas, SOCIAL_SIZE)
  const ctx = canvas.getContext('2d')
  const currency = profile.currency || 'EUR'
  const symbol = currency === 'CHF' ? 'CHF' : '€'
  const money = (n, unit = currency) => euro(n, unit)
  const number = n => money(n).replace(/\s*(?:€|CHF)$/, '')
  ctx.fillStyle = colors.background
  ctx.fillRect(0, 0, SOCIAL_SIZE.width, SOCIAL_SIZE.height)
  drawIdentity(ctx, profile, plan.presentation)
  drawIncome(ctx, profile, plan, money)
  drawExpenses(ctx, plan, money, number)
  drawSaving(ctx, profile, plan, money, number)
  draw(ctx, `${profile.approximate ? 'Budget mensuel indicatif' : 'Budget mensuel'} en ${symbol} · Épargnant Libre`, 540, 1300,
    { size: 34, color: colors.cream, align: 'center' })
  return canvas
}
