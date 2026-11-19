import { budgetScenarioText } from './closure-scenarios.js'
import { budgetRowSymbol, budgetPublicBasis, budgetSalaryLabel, budgetIntroduction, budgetTransfers, budgetGeneralQuestion, budgetPublicContext, budgetQualification } from './presentation.js'
import { budgetFinancialReference } from './completion.js'
import { reconcileBudgetDraftLines } from './draft-reconciliation.js'
import { expenseGroup } from './expense-groups.js'
import { budgetCompletions } from './budget-completions.js'
import { validAnnualProvision, provisionLabel } from './row-input.js'
import { BUDGET_EDITORIAL, BUDGET_NOEMIE_PREVIOUS_ENTRY, NOEMIE_ID, BUDGET_PROFILES, BUDGET_PUBLICATION_CONTEXT, EXPENSE_CATEGORIES } from './data.js'

export const MAX_BUDGET_LINES = 24
export const euro = (value, currency = 'EUR') => Number(value).toLocaleString('fr-FR', { style: 'currency', currency, minimumFractionDigits: Number.isInteger(Math.round(Number(value) * 100) / 100) ? 0 : 2, maximumFractionDigits: 2 })
export const dateLabel = date => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
export const budgetKind = profile => profile.kind === 'participant' ? 'Budget communiqué' : budgetQualification(profile) || 'Budget'
const cents = value => Math.round(value * 100)
const validAmount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10000000
const safeText = (value, max) => typeof value === 'string' && value.length <= max
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))

export function validBudget(profile) {
  return !!profile && safeText(profile.id, 100) && profile.id.length > 0 && (profile.currency === undefined || ['EUR', 'CHF'].includes(profile.currency)) && safeText(profile.name, 70) &&
    (profile.age === null || Number.isInteger(profile.age) && profile.age >= 18 && profile.age <= 110) &&
    ['job', 'location', 'household', 'period', 'incomeBasis', 'incomeNote'].every(key => safeText(profile[key], 250)) &&
    ['declared', 'planned', 'participant', 'prepared'].includes(profile.kind) && typeof profile.approximate === 'boolean' &&
    ['income', 'expenses', 'savings'].every(key => Array.isArray(profile[key]) && profile[key].length <= MAX_BUDGET_LINES &&
      profile[key].every(row => row && safeText(row.label, 90) && (row.amount === null || validAmount(row.amount)) && validAnnualProvision(row) && (key === 'expenses' || row.annualProvision === undefined) &&
        (row.constraint === undefined || key === 'expenses' && ['fixed', 'flexible', 'mixed'].includes(row.constraint)) &&
        (row.inKind === undefined || key === 'income' && typeof row.inKind === 'boolean') &&
        (row.transferStatus === undefined || key === 'savings' && ['paid', 'planned'].includes(row.transferStatus)))) &&
    (profile.capacity === null || validAmount(profile.capacity)) &&
    ['context', 'caveat', 'hook', 'question'].every(key => safeText(profile[key], 3000)) &&
    (profile.source === null || typeof profile.source === 'object' && ['publisher', 'title', 'url'].every(key => safeText(profile.source[key], 1500)) && /^https:\/\//.test(profile.source.url)) &&
    (profile.publishedAt === null || validDate(profile.publishedAt)) &&
    (profile.checkedAt === null || validDate(profile.checkedAt)) &&
    (!profile.source || validDate(profile.checkedAt)) &&
    ['preparedAt', 'editorialReviewedAt'].every(key => profile[key] === undefined || validDate(profile[key])) &&
    (profile.country === undefined || safeText(profile.country, 100)) &&
    (profile.family === undefined || ['', 'single', 'couple', 'other'].includes(profile.family)) &&
    (profile.children === undefined || ['', 'yes', 'no'].includes(profile.children)) &&
    (profile.housing === undefined || ['', 'tenant', 'owner', 'other'].includes(profile.housing)) &&
    (profile.budgetAsOf === undefined || typeof profile.budgetAsOf === 'string' && (/^\d{4}$/.test(profile.budgetAsOf) || validDate(profile.budgetAsOf)))
}

export function analyzeBudget(profile) {
  const errors = []
  if (!validBudget(profile)) return { errors: ['Le budget contient des données invalides.'] }
  if (!profile.name.trim()) errors.push('Indique un prénom ou une description du profil.')
  for (const [key, label] of [['income', 'revenus'], ['expenses', 'dépenses'], ['savings', 'versements d’épargne']]) {
    if (profile[key].some(row => !row.label.trim() || !validAmount(row.amount))) errors.push(`Complète les ${label} : libellé et montant positif ou nul.`)
  }
  const total = key => profile[key].reduce((sum, row) => sum + (!row.inKind && validAmount(row.amount) ? cents(row.amount) : 0), 0)
  const income = total('income'), expenses = total('expenses'), savings = total('savings')
  if (!profile.income.length) errors.push('Indique les revenus du budget, y compris s’ils sont nuls.')
  if (!profile.expenses.length) errors.push('Ajoute les dépenses du budget.')
  const available = income - expenses, balance = available - savings
  return { errors, income: income / 100, expenses: expenses / 100, savings: savings / 100, available: available / 100, balance: balance / 100,
    expenseShare: income > 0 ? expenses * 100 / income : 0 }
}

export const editorialFor = profile => profile.kind === 'participant' ? null : BUDGET_EDITORIAL[profile.id]
export const publicationContextFor = profile => profile.kind === 'participant' ? null : BUDGET_PUBLICATION_CONTEXT[profile.id]
export const budgetDisplayName = profile => editorialFor(profile)?.alias || profile.name
const share = (amount, income) => income > 0 ? ` (${Math.round(cents(amount) * 100 / cents(income))} %)` : ''
const rowTotal = rows => rows.reduce((sum, row) => sum + cents(row.amount), 0) / 100

export function budgetExpenseSections(profile) {
  const e = editorialFor(profile)
  const groups = { fixed: { title: 'Dépenses contraintes', emoji: '🏠', rows: [] },
    flexible: { title: 'Dépenses non contraintes', emoji: '🎉', rows: [] },
    mixed: { title: 'Dépenses mixtes / non ventilées', emoji: '🧾', rows: [] } }
  budgetPublicExpenseRows(profile).forEach((row, index) => {
    const label = profile.expenses[index].label
    const explicit = row.constraint || (e?.essential?.includes(label) ? 'fixed' : e?.discretionary?.includes(label) ? 'flexible' : null)
    groups[explicit || expenseGroup(row)].rows.push(row)
  })
  return Object.entries(groups).filter(([, group]) => group.rows.length).map(([id, group]) => ({ id, ...group }))
}

export function budgetExpenseColumns(profile) {
  const sections = budgetExpenseSections(profile)
  const fixed = sections.find(group => group.id === 'fixed')?.rows || []
  const mixed = sections.find(group => group.id === 'mixed')?.rows || []
  const flexible = sections.find(group => group.id === 'flexible')?.rows || []
  return [
    { id: 'fixed', title: mixed.length ? fixed.length ? 'Dépenses contraintes et mixtes' : 'Dépenses mixtes' : 'Dépenses contraintes',
      emoji: '🏠', rows: [...fixed, ...mixed.map(row => ({ ...row, mixed: true }))], amount: (cents(rowTotal(fixed)) + cents(rowTotal(mixed))) / 100 },
    { id: 'flexible', title: 'Dépenses non contraintes', emoji: '🎉', rows: flexible, amount: rowTotal(flexible) },
  ]
}

export function budgetAdaptation(profile) {
  if (budgetCompletions[profile.id] && profile.kind !== 'participant') return 'Budget reconstitué'
  if (profile.provenance?.nature === 'editorial-character' || profile.kind !== 'participant' && profile.editorialCreation) return 'Profil adapté'
  return ''
}

const reviewedPaidTransfers = new Set([
  'editorial-studio-alternance-allocation-2026-11-16',
  'editorial-complementary-38357-2026-11-16',
  'editorial-cedric-intermittent-2026-11-15',
  'prepared-lot2-12-2026-10-30',
])

export function budgetTransferStatus(profile, row) {
  const reviewed = publicationContextFor(profile)?.budget?.transferDetails?.[row.label]?.status
  if (reviewed || row.transferStatus) return reviewed || row.transferStatus
  if (profile.kind === 'planned' || profile.completion?.forecast || ['source-projected', 'editorial-allocation'].includes(row.origin) ||
      (profile.kind !== 'participant' && profile.id === 'editorial-studio-alternance-demenagement-2026-11-16') ||
      /(?<![\p{L}])(?:prévues?|prévus?|envisagés?|envisagées?|pas encore versé)(?![\p{L}])/iu.test(row.label)) return 'planned'
  return profile.kind === 'declared' || (profile.kind !== 'participant' && reviewedPaidTransfers.has(profile.id)) ? 'paid' : 'budgeted'
}

export function budgetTransferPlan(profile) {
  const details = publicationContextFor(profile)?.budget?.transferDetails || {}
  const rows = budgetPublicSavingsRows(profile).map((row, index) => {
    const original = profile.savings[index]
    return { ...row, ...(Object.hasOwn(details, original.label) && details[original.label]), status: budgetTransferStatus(profile, original) }
  })
    .toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const statuses = new Set(rows.filter(row => row.amount > 0).map(row => row.status))
  const planned = statuses.has('planned')
  const distinct = statuses.size > 1
  const mixed = planned && distinct
  return { rows, planned, mixed, distinct, label: mixed ? 'Plan d’épargne' : planned ? 'Versements prévus' :
    statuses.size === 1 && statuses.has('paid') ? 'Versements effectués' : 'Versements' }
}

export function budgetTransferLabel(profile) {
  return budgetTransferPlan(profile).label
}

export function cleanTransferLabel(label, planned) {
  const clean = label.replace(/\s*\((?:prévus?|prévues?|effectués?|effectuées?)\)/giu, '')
    .replace(/\b(provisions?) prévues?\b/giu, '$1')
  if (!planned) return clean.trim()
  const goal = clean.replace(/,?\s+pas encore versé[es]*/giu, '')
    .replace(/\s+(?:prévus?|prévues?|envisagés?|envisagées?)(?![\p{L}])/giu, '').trim()
  return goal || 'Épargne'
}

export function budgetRemainingLabel(balance, planned) {
  if (planned) return balance < 0 ? 'Déficit si le plan est suivi' : 'Reste si le plan est suivi'
  return balance < 0 ? 'Déficit après versements' : 'Reste après versements'
}

export function budgetPublicPresentation(profile) {
  const e = editorialFor(profile)
  const copy = publicationContextFor(profile)?.budget
  return {
    name: budgetDisplayName(profile),
    averageBeforeInvestments: !!copy?.averageBeforeInvestments,
    projected: !!copy?.projected,
    balanceLabel: copy?.balanceLabel ?? e?.balanceLabel ?? 'Reste disponible après versements',
    job: e?.publicJob ?? profile.job,
    household: budgetPublicContext(copy?.household ?? e?.publicHousehold ?? (profile.household === 'Situation familiale non précisée' ? '' : profile.household)),
    incomeNote: budgetPublicContext(copy?.incomeNote ?? e?.publicIncomeNote ?? profile.incomeNote),
    location: copy?.location ?? profile.location,
    story: e?.publicStory ?? profile.context,
    basis: copy?.basis ?? (profile.kind === 'prepared' ? (e?.publicBasis || 'Montants mensuels') : profile.incomeBasis),
    question: e?.question ?? profile.question,
  }
}

export function budgetPublicIncomeRows(profile) {
  const labels = publicationContextFor(profile)?.budget?.incomeLabels || {}
  return profile.income.map(row => ({ ...row, label: budgetSalaryLabel((Object.hasOwn(labels, row.label) ? labels[row.label] : row.label).replace(/ au budget personnel$/i, ''), row.label) }))
}
export function budgetPublicExpenseRows(profile) {
  const labels = publicationContextFor(profile)?.budget?.expenseLabels || {}
  return profile.expenses.map(row => ({ ...row, label: provisionLabel({ ...row, label: Object.hasOwn(labels, row.label) ? labels[row.label] : row.label }) }))
}
export function budgetPublicSavingsRows(profile) {
  const labels = publicationContextFor(profile)?.budget?.savingsLabels || {}
  return profile.savings.map(row => ({ ...row, label: Object.hasOwn(labels, row.label) ? labels[row.label] : row.label }))
}

// A reported capacity is useful when it differs from the calculated remainder.
// Keeping the source value in the profile does not require printing it twice.
export const hasSeparateBudgetCapacity = (profile, a = analyzeBudget(profile)) => !publicationContextFor(profile)?.budget?.omitReportedCapacity && profile.capacity !== null &&
  cents(profile.capacity) !== cents(a.available) && cents(profile.capacity) !== cents(a.balance)

export const budgetPossessive = name => /^(?:[aàâäeéèêëiîïoôöuùûüyœ]|h(?:ugo|adrien))/i.test(name) ? `d’${name}` : `de ${name}`
export function budgetHeading(profile) {
  const name = budgetDisplayName(profile)
  const suffix = publicationContextFor(profile)?.budget?.headingSuffix || ''
  return `Budget ${budgetPossessive(name)}${profile.age && !name.includes(' et ') && !name.includes(String(profile.age)) ? `, ${profile.age} ans` : ''}${suffix}`
}

export function budgetCashIncome(profile) {
  const cash = budgetPublicIncomeRows(profile).filter(row => !row.inKind)
  const salary = cash.length === 1 && /^salaire\b[^,]*$/i.test(cash[0].label) ? cash[0] : null
  return { cash, salary, netSalary: salary && /\bnets?\b/i.test(salary.label) ? salary : null }
}

export function buildBudgetText(profile) {
  const a = analyzeBudget(profile)
  if (a.errors.length) return ''
  const e = editorialFor(profile), p = budgetPublicPresentation(profile), context = publicationContextFor(profile)
  const money = value => euro(value, profile.currency)
  const presentation = budgetIntroduction(profile, p)
  const expenses = budgetExpenseColumns(profile).map(section => {
    const rows = section.rows.map(row => {
      const mixed = row.mixed ? ' (enveloppe mixte)' : ''
      const annual = Number.isFinite(row.annualProvision?.amount) ? ` (${money(row.annualProvision.amount)} par an)` : ''
      return `• ${budgetRowSymbol(row).emoji} ${row.label} : ${money(row.amount)}${mixed}${annual}`
    })
    return [`${section.emoji} ${section.title} : ${money(section.amount)}${share(section.amount, a.income)}`, ...rows].join('\n')
  }).join('\n\n')
  const publicIncome = budgetPublicIncomeRows(profile)
  const publicBasis = budgetPublicBasis(profile, p.basis)
  const average = p.averageBeforeInvestments
  const textBasis = average ? context.budget.textBasis : publicBasis !== p.basis ? publicBasis : context?.budget?.textBasis ?? (p.basis === 'Montants mensuels' || publicIncome.length === 1 && publicIncome[0].label.toLocaleLowerCase('fr').includes(p.basis.toLocaleLowerCase('fr')) ? '' : budgetPublicBasis(profile, p.basis))
  const { cash, salary } = budgetCashIncome(profile)
  const benefits = publicIncome.filter(row => row.inKind).map(row =>
    /^titres-restaurant$/i.test(row.label) ? `Titres-restaurant : ${money(row.amount)} / mois, hors revenus encaissés.`
      : `${row.label} : ${money(row.amount)} / mois (avantage en nature).`)
  const incomeRows = cash.map(row => `• ${budgetRowSymbol(row, 'income').emoji} ${row.label} : ${money(row.amount)}`).join('\n')
  const incomeHeading = context?.budget?.imageIncomeLabel || salary?.label || 'Revenus mensuels'
  const periodUnit = context?.budget?.periodUnit ?? ' / mois'
  const incomeLine = `💰 ${incomeHeading} : ${profile.approximate ? 'environ ' : ''}${money(a.income)}${periodUnit}`
  const transfersHeading = context?.budget?.transfersHeading || 'Versements'
  const transfers = budgetTransfers(profile, transfersHeading)
  const plan = budgetTransferPlan(profile)
  const transferRows = plan.rows.map(row => {
    const label = cleanTransferLabel(row.label, plan.planned)
    const statement = row.statement || (plan.distinct && { planned: 'prévus par mois', paid: 'déjà versés par mois', budgeted: 'inscrits au budget' }[row.status])
    return `• ${row.emoji || budgetRowSymbol(row, 'savings').emoji} ${label} : ${money(row.amount)}${statement ? ' ' + statement : ''}`
  }).join('\n')
  const questions = context
    ? (context.questions.length ? context.questions.map(question => question.text) : [budgetGeneralQuestion({ ...profile, name: p.name }, context.budgetQuestion)])
    : p.question.split(/\r?\n/)
  return [
    `💰 ${budgetHeading(profile)}`,
    presentation,
    [incomeLine, textBasis, !salary && incomeRows, p.incomeNote].filter(Boolean).join('\n'),
    benefits.join('\n'),
    expenses,
    `🧾 Total des dépenses : ${money(a.expenses)}${periodUnit}`,
    `👉 ${average ? 'Solde moyen avant placements' : a.available < 0 ? 'Déficit avant versements' : 'Capacité d’épargne'} : ${money(Math.abs(a.available))}${periodUnit}${share(Math.abs(a.available), a.income)}`,
    average ? '🧾 Versements vers les placements : montants non isolés.' : transferRows ? `${plan.mixed ? '💰 Son plan d’épargne' : transfers.emoji + ' ' + plan.label} : ${money(a.savings)}${periodUnit}\n${transferRows}` : `🧾 Versements retenus : ${money(0)}${periodUnit}`,
    !average && `💳 ${budgetRemainingLabel(a.balance, plan.planned || p.projected)} : ${money(plan.planned || p.projected ? a.balance : Math.abs(a.balance))}${periodUnit}`,
    hasSeparateBudgetCapacity(profile, a) && `Capacité d’épargne ${profile.kind === 'planned' ? 'envisagée' : 'annoncée'} : environ ${money(profile.capacity)} / mois.`,
    ...(context ? context.paragraphs.map(({ text }) => text) : [
      e?.assets?.length && `🏦 Épargne déjà constituée :\n${e.assets.map(value => `• ${value}`).join('\n')}`,
      p.story,
    ]),
    context?.scenario && budgetScenarioText(context.scenario, a, money),
    questions.map(line => line.trim()).filter(Boolean).slice(0, 2).map(line => line.startsWith('💬') ? line : `💬 ${line}`).join('\n'),
  ].filter(Boolean).join('\n\n').replace(/\s*—\s*/g, ', ')
}

// Group only expense categories, once each, keeping mixed or unclassified rows
// visible verbatim. Financial transfers are deliberately never merged together.
export function budgetImageExpenses(profile, mode = 'detailed') {
  const rows = budgetPublicExpenseRows(profile)
  if (mode !== 'summary') return rows
  const groups = new Map(), result = []
  for (const [i, row] of profile.expenses.entries()) {
    if (row.annualProvision || !row.category || row.category === 'other' || /^Provision\b|mensualis|^Enveloppe.*vacances/i.test(row.label)) { result.push(rows[i]); continue }
    let group = groups.get(row.category)
    if (!group) {
      group = { label: EXPENSE_CATEGORIES.find(c => c.id === row.category)?.label || row.category, amount: 0, category: row.category, members: [] }
      groups.set(row.category, group); result.push(group)
    }
    group.amount += cents(row.amount); group.members.push(rows[i])
  }
  return result.map(group => group.members ? (group.members.length === 1 ? group.members[0] : { label: group.label, amount: group.amount / 100, category: group.category }) : group)
}

export function matchesBudgetFilters(profile, filters) {
  for (const key of ['country', 'family', 'children', 'housing']) {
    if (filters[key] && (profile[key] || 'unknown') !== filters[key]) return false
  }
  if (filters.income) {
    const [currency, min, max] = filters.income.split(':')
    const income = analyzeBudget(profile).income
    if ((profile.currency || 'EUR') !== currency || income < Number(min) || income >= Number(max)) return false
  }
  return true
}
export const compareBudgetRecency = (a, b) => (b.budgetAsOf || '').localeCompare(a.budgetAsOf || '') || a.id.localeCompare(b.id)

function reviseNoemieDraft(record, profile, textFinance) {
  const { profile: old, publication } = BUDGET_NOEMIE_PREVIOUS_ENTRY
  if (textFinance !== budgetFinancialReference(old)) return null
  const before = analyzeBudget(old), after = analyzeBudget(profile)
  const entries = new Map()
  const add = (labels, previous, current, percent) => labels.forEach(label => entries.set(label.toLocaleLowerCase('fr'), { before: previous, after: current, percent }))
  add(['Salaire net', 'Ressources mensuelles', 'Revenus mensuels'], before.income, after.income)
  add(['Total des dépenses'], before.expenses, after.expenses)
  add(['Capacité d’épargne', 'Reste avant épargne et investissements'], before.available, after.available, Math.round(after.available * 100 / after.income))
  add(['Versements', 'Épargne et investissements'], before.savings, after.savings)
  add(['Reste après versements', 'Reste après épargne et investissements', 'Reste disponible après versements'], before.balance, after.balance)
  for (const section of budgetExpenseSections(old)) {
    const current = budgetExpenseColumns(profile).find(group => group.id === section.id)
    if (current) add([section.title], rowTotal(section.rows), rowTotal(current.rows), Math.round(rowTotal(current.rows) * 100 / after.income))
  }
  const renamed = new Map([
    ['Courses payées sur le compte', 'Courses payées sur son compte'],
    ['Prochaine voiture', 'Compte d’épargne pour la prochaine voiture'],
  ])
  for (const key of ['expenses', 'savings']) {
    for (const row of old[key]) {
      const current = profile[key].find(item => item.label === (renamed.get(row.label) || row.label))
      if (current || row.label === 'Épargne retraite') add([row.label], row.amount, current?.amount)
    }
  }
  const [stocks, car] = profile.context.split('\n\n')
  const [partTime, nextInvestment] = profile.question.split('\n')
  const sections = [
    [publication.paragraphs[0].text, `${stocks} Noémie aimerait passer à temps partiel dans 25 ans.`, 'Patrimoine et horizon'],
    [publication.paragraphs[1].text, car, 'Crédit et compte auto'],
    [publication.paragraphs[2].text, '', 'Ancien projet lié au bonus et à la retraite'],
    [publication.questions[0].text, nextInvestment, 'Question sur le crédit auto'],
    [publication.questions[1].text, partTime, 'Question sur le temps partiel'],
  ]
  return reconcileBudgetDraftLines(record.text, entries, value => euro(value, profile.currency), sections)
}

// Generated drafts are refreshed. Personal prose is retained and only proven
// ledger changes for the specific reference migration are applied in place.
export function refreshBudgetDraft(record) {
  const profile = record.profile.kind === 'participant' ? record.profile : BUDGET_PROFILES.find(p => p.id === record.profile.id) || record.profile
  const currentFinance = budgetFinancialReference(profile)
  if (!record.edited) return { ...record, profile, text: buildBudgetText(profile), textFinance: currentFinance, textCorrections: undefined }
  const corrections = Array.isArray(record.textCorrections) ? record.textCorrections.filter(change =>
    change && ['label', 'before', 'after'].every(key => typeof change[key] === 'string')) : []
  const previousBadge = profile.id === NOEMIE_ID ? '' : budgetAdaptation(profile)
  const generatedBadge = [previousBadge, previousBadge === 'Budget reconstitué' && 'Dépenses ventilées à titre éditorial.'].filter(Boolean).join(' · ')
  const text = generatedBadge ? record.text.split(/(\r?\n)/).map((line, index, lines) => {
    if (line !== generatedBadge) return line
    if (index + 1 < lines.length) lines[index + 1] = ''
    return ''
  }).join('') : record.text
  const previousFinance = record.textFinance ?? budgetFinancialReference(record.profile)
  const revision = profile.kind !== 'participant' && profile.id === NOEMIE_ID && previousFinance !== currentFinance
    ? reviseNoemieDraft({ ...record, text }, profile, previousFinance) : null
  return { ...record, profile, text: revision?.text ?? text,
    textFinance: revision && !revision.unresolved ? currentFinance : previousFinance,
    textCorrections: corrections.length || revision?.changes.length ? [...corrections, ...(revision?.changes || [])] : undefined,
  }
}

export function sourceReply(profile) {
  if (!profile.source) return ''
  if (profile.provenance?.nature === 'editorial-character') return `Source d’inspiration : ${profile.source.publisher}\n${profile.source.url}`
  return `Source : ${profile.source.publisher}\n${profile.source.url}`
}

export function blankBudget() {
  return { id: 'participation', currency: 'EUR', name: '', age: null, job: '', location: '', household: '', kind: 'participant', approximate: false,
    publishedAt: null, checkedAt: null, period: '', source: null, incomeBasis: 'Montants mensuels', incomeNote: '',
    income: [{ label: '', amount: null }], expenses: [{ label: '', amount: null, category: 'other' }],
    savings: [], capacity: null, context: '', caveat: '', hook: '', question: '' }
}
