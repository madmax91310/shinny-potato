import { EXPENSE_CATEGORIES } from './data.js'

export const MAX_BUDGET_LINES = 24
export const euro = value => Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 })
export const dateLabel = date => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`))
export const budgetKind = profile => profile.kind === 'planned' ? 'Budget prévu' : profile.kind === 'participant' ? 'Budget communiqué' : 'Budget déclaré'
const cents = value => Math.round(value * 100)
const validAmount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10000000
const safeText = (value, max) => typeof value === 'string' && value.length <= max
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))

export function validBudget(profile) {
  return !!profile && safeText(profile.id, 100) && safeText(profile.name, 70) &&
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

export function buildBudgetText(profile) {
  const a = analyzeBudget(profile)
  if (a.errors.length) return ''
  const age = profile.age && !profile.name.includes(String(profile.age)) ? `${profile.age} ans` : ''
  const intro = [profile.name, age, profile.job, profile.location, profile.household === 'Situation familiale non précisée' ? '' : profile.household].filter(Boolean).join(' · ')
  const expenses = profile.expenses.map(row => `${EXPENSE_CATEGORIES.find(category => category.id === row.category)?.emoji || '🧾'} ${row.label} : ${euro(row.amount)}`).join('\n')
  const savings = profile.savings.map(row => `💰 ${row.label} : ${euro(row.amount)}`).join('\n')
  return [profile.hook || `${euro(a.income)} de revenus mensuels : comment se répartit ce budget ? 👇`,
    `👤 ${intro}`, `${budgetKind(profile)}${profile.period ? ` · ${profile.period}` : ''}${profile.approximate ? ' · montants approximatifs' : ''}`,
    `💸 Revenus : ${euro(a.income)} / mois\n${profile.incomeBasis}${profile.incomeNote ? `\n${profile.incomeNote}` : ''}`,
    expenses, `🧾 Total des dépenses : ${euro(a.expenses)} / mois`,
    `🧮 ${a.available < 0 ? 'Déficit avant épargne' : 'Reste calculé avant épargne'} : ${euro(a.available)}`,
    savings && `Épargne prévue au budget :\n${savings}\nSolde après ces versements : ${euro(a.balance)}`,
    profile.capacity !== null && `💰 Capacité d’épargne annoncée : environ ${euro(profile.capacity)} / mois.`,
    profile.context, profile.question,
    profile.source && `Source : ${profile.source.publisher}${profile.publishedAt ? `, témoignage du ${dateLabel(profile.publishedAt)}` : ''}.`,
  ].filter(Boolean).join('\n\n')
}

export function sourceReply(profile) {
  return profile.source ? `${profile.source.publisher} — ${profile.source.title}\n${profile.source.url}${profile.publishedAt ? `\nPublié le ${dateLabel(profile.publishedAt)}.` : ''}\nMontants déclarés par la personne, sans vérification de ses comptes bancaires.` : ''
}

export function blankBudget() {
  return { id: 'participation', name: '', age: null, job: '', location: '', household: '', kind: 'participant', approximate: false,
    publishedAt: null, checkedAt: null, period: '', source: null, incomeBasis: 'Net après impôt', incomeNote: '',
    income: [{ label: 'Salaire net après impôt', amount: null }], expenses: [{ label: 'Loyer et charges', amount: null, category: 'housing' }],
    savings: [], capacity: null, context: '', caveat: '', hook: '', question: 'Quel poste pèse le plus dans ton budget ?' }
}
