import { BUDGET_EDITORIAL, BUDGET_PROFILES, EXPENSE_CATEGORIES } from './data.js'

export const MAX_BUDGET_LINES = 24
export const euro = (value, currency = 'EUR') => Number(value).toLocaleString('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const dateLabel = date => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
export const budgetKind = profile => profile.kind === 'planned' ? 'Budget prévu' : profile.kind === 'participant' ? 'Budget communiqué' : 'Budget déclaré'
const cents = value => Math.round(value * 100)
const validAmount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10000000
const safeText = (value, max) => typeof value === 'string' && value.length <= max
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))

export function validBudget(profile) {
  return !!profile && safeText(profile.id, 100) && (profile.currency === undefined || ['EUR', 'CHF'].includes(profile.currency)) && safeText(profile.name, 70) &&
    (profile.age === null || Number.isInteger(profile.age) && profile.age >= 18 && profile.age <= 110) &&
    ['job', 'location', 'household', 'period', 'incomeBasis', 'incomeNote'].every(key => safeText(profile[key], 250)) &&
    ['declared', 'planned', 'participant'].includes(profile.kind) && typeof profile.approximate === 'boolean' &&
    ['income', 'expenses', 'savings'].every(key => Array.isArray(profile[key]) && profile[key].length <= MAX_BUDGET_LINES &&
      profile[key].every(row => row && safeText(row.label, 90) && (row.amount === null || validAmount(row.amount)))) &&
    (profile.capacity === null || validAmount(profile.capacity)) &&
    ['context', 'caveat', 'hook', 'question'].every(key => safeText(profile[key], 3000)) &&
    (profile.source === null || typeof profile.source === 'object' && ['publisher', 'title', 'url'].every(key => safeText(profile.source[key], 1500)) && /^https:\/\//.test(profile.source.url)) &&
    (profile.publishedAt === null || validDate(profile.publishedAt)) &&
    (profile.checkedAt === null || validDate(profile.checkedAt)) &&
    (!profile.source || validDate(profile.publishedAt) && validDate(profile.checkedAt))
}

export function analyzeBudget(profile) {
  const errors = []
  if (!validBudget(profile)) return { errors: ['Le budget contient des données invalides.'] }
  if (!profile.name.trim()) errors.push('Indique un prénom ou une description du profil.')
  for (const [key, label] of [['income', 'revenus'], ['expenses', 'dépenses'], ['savings', 'versements d’épargne']]) {
    if (profile[key].some(row => !row.label.trim() || !validAmount(row.amount))) errors.push(`Complète les ${label} : libellé et montant positif ou nul.`)
  }
  const total = key => profile[key].reduce((sum, row) => sum + (validAmount(row.amount) ? cents(row.amount) : 0), 0)
  const income = total('income'), expenses = total('expenses'), savings = total('savings')
  if (income <= 0) errors.push('Le total des revenus doit être supérieur à zéro.')
  if (!profile.expenses.length) errors.push('Ajoute les dépenses du budget.')
  const available = income - expenses, balance = available - savings
  return { errors, income: income / 100, expenses: expenses / 100, savings: savings / 100, available: available / 100, balance: balance / 100,
    expenseShare: income > 0 ? expenses / income * 100 : 0 }
}

const editorialFor = profile => profile.kind === 'participant' ? null : BUDGET_EDITORIAL[profile.id]
export const budgetDisplayName = profile => editorialFor(profile)?.alias || profile.name
const share = (amount, income) => `${Math.round(amount / income * 100)} %`
const rowTotal = rows => rows.reduce((sum, row) => sum + cents(row.amount), 0) / 100

// Never infer constraints from the broad categories: restaurants and groceries,
// for example, both use "food". Mixed or edited rows keep the unsplit version.
export function budgetExpenseSections(profile) {
  const e = editorialFor(profile)
  if (!e?.essential?.length || !e?.discretionary?.length ||
      !profile.expenses.every(row => Number(e.essential.includes(row.label)) + Number(e.discretionary.includes(row.label)) === 1)) {
    return [{ title: 'Dépenses', emoji: '🧾', rows: profile.expenses }]
  }
  return [
    { title: 'Dépenses contraintes', emoji: '🏠', rows: profile.expenses.filter(row => e.essential.includes(row.label)) },
    { title: 'Dépenses non contraintes', emoji: '🎉', rows: profile.expenses.filter(row => e.discretionary.includes(row.label)) },
  ]
}

export function buildBudgetText(profile) {
  const a = analyzeBudget(profile)
  if (a.errors.length) return ''
  const e = editorialFor(profile), name = budgetDisplayName(profile)
  const money = value => euro(value, profile.currency)
  const age = profile.age && !name.includes(String(profile.age)) ? `, ${profile.age} ans` : ''
  const household = profile.household === 'Situation familiale non précisée' ? '' : profile.household
  const presentation = [profile.job, household].filter(Boolean).join(' · ')
  const sections = budgetExpenseSections(profile)
  const expenses = sections.map(section => {
    const total = rowTotal(section.rows)
    const rows = section.rows.map(row => `• ${EXPENSE_CATEGORIES.find(category => category.id === row.category)?.emoji || '🧾'} ${row.label} : ${money(row.amount)}`).join('\n')
    return `${section.emoji} ${section.title} : ${money(total)} (${share(total, a.income)})\n${rows}`
  }).join('\n\n')
  const incomeRows = profile.income.length > 1 ? profile.income.map(row => `• ${row.label} : ${money(row.amount)}`).join('\n') : ''
  const incomeNote = e && 'incomeNote' in e ? e.incomeNote : profile.incomeNote
  const savings = profile.savings.map(row => `• ${row.label} : ${money(row.amount)}`).join('\n')
  return [
    `Budget de ${name}${age}${e ? '\n(prénom' + (name.includes(' et ') ? 's fictifs)' : ' fictif)') : ''}`,
    [presentation && `👤 ${presentation}`, profile.location && `📍 ${profile.location}`].filter(Boolean).join('\n'),
    profile.kind === 'planned' && 'Budget prévu',
    [`💰 Revenus mensuels : ${profile.approximate ? 'environ ' : ''}${money(a.income)}`, profile.incomeBasis, incomeRows, incomeNote].filter(Boolean).join('\n'),
    expenses,
    sections.length > 1 && `🧾 Total des dépenses : ${money(a.expenses)} / mois`,
    `👉 ${a.available < 0 ? 'Déficit avant épargne' : 'Reste avant épargne'} : ${money(a.available)} / mois (${share(a.available, a.income)})`,
    savings && `💰 Épargne et investissements ${profile.kind === 'planned' ? 'prévus' : 'au budget'} : ${money(a.savings)} / mois\n${savings}\n${a.balance < 0 ? 'Manque après ces versements' : 'Solde après ces versements'} : ${money(Math.abs(a.balance))}`,
    profile.capacity !== null && `Capacité d’épargne ${profile.kind === 'planned' ? 'envisagée' : 'annoncée'} : environ ${money(profile.capacity)} / mois.`,
    e?.note,
    e?.assets?.length && `🏦 Épargne déjà constituée :\n${e.assets.map(value => `• ${value}`).join('\n')}`,
    e ? e.story : profile.context,
    e?.goal && `🎯 Objectif : ${e.goal}`,
    profile.question && `💬 ${profile.question}`,
  ].filter(Boolean).join('\n\n')
}

// Refresh generated drafts after a text update, but never replace a personal text.
export function refreshBudgetDraft(record) {
  const profile = BUDGET_PROFILES.find(p => p.id === record.profile.id) || record.profile
  return { ...record, profile, text: record.edited ? record.text : buildBudgetText(profile) }
}

export function sourceReply(profile) {
  return profile.source ? `${profile.source.publisher} — ${profile.source.title}\n${profile.source.url}${profile.publishedAt ? `\nPublié le ${dateLabel(profile.publishedAt)}.` : ''}\nMontants déclarés par la personne, sans vérification de ses comptes bancaires.` : ''
}

export function blankBudget() {
  return { id: 'participation', currency: 'EUR', name: '', age: null, job: '', location: '', household: '', kind: 'participant', approximate: false,
    publishedAt: null, checkedAt: null, period: '', source: null, incomeBasis: 'Net après impôt', incomeNote: '',
    income: [{ label: 'Salaire net après impôt', amount: null }], expenses: [{ label: 'Loyer et charges', amount: null, category: 'housing' }],
    savings: [], capacity: null, context: '', caveat: '', hook: '', question: 'Quel poste pèse le plus dans ton budget ?' }
}
