import { EXPENSE_CATEGORIES } from './data.js'
import { budgetPublicBasis, budgetQualification } from './presentation.js'
import { monthlyProvision } from './row-input.js'
import { blankBudget, budgetDisplayName, budgetPublicPresentation, budgetPublicIncomeRows, budgetPublicExpenseRows, budgetPublicSavingsRows, buildBudgetText } from './lib.js'
import { budgetFinancialReference } from './completion.js'

const copyRow = row => ({ label: row.label, amount: row.amount,
  ...(row.inKind && { inKind: true }), ...(row.transferStatus && { transferStatus: row.transferStatus }),
  ...(row.constraint && { constraint: row.constraint }),
  ...(row.category && { category: EXPENSE_CATEGORIES.some(c => c.id === row.category) ? row.category : 'other' }),
})
const copyExpenseRow = row => ({ ...copyRow(row),
  ...(row.annualProvision ? { annualProvision: structuredClone(row.annualProvision) } : Number.isFinite(row.annualAmount) && monthlyProvision(row.annualAmount) === row.amount ? { annualProvision: { amount: row.annualAmount } } : {}),
})
export function duplicateBudget(record, id, now = new Date().toISOString()) {
  const p = record.profile, person = budgetPublicPresentation(p), personal = p.kind === 'participant'
  const profile = { ...blankBudget(), id, name: budgetDisplayName(p), age: p.age, currency: p.currency || 'EUR',
    job: [person.job, !/budget prévu/i.test(person.job) && budgetQualification(p)].filter(Boolean).join(' · '), household: person.household, location: person.location, period: p.period,
    country: p.country || '', family: p.family || '', children: p.children || '', housing: p.housing || '',
    approximate: p.approximate, incomeBasis: budgetPublicBasis(p, person.basis), incomeNote: person.incomeNote, capacity: p.capacity,
    income: (personal ? p.income : budgetPublicIncomeRows(p)).map(copyRow), expenses: (personal ? p.expenses : budgetPublicExpenseRows(p)).map(copyExpenseRow), savings: (personal ? p.savings : budgetPublicSavingsRows(p)).map(copyRow),
    context: personal ? p.context : '', question: personal ? p.question : '',
    provenance: { nature: 'manual-copy', copiedAt: now, copiedFrom: { id: p.id, source: p.source, period: p.period },
      originalLines: structuredClone({ income: p.income, expenses: p.expenses, savings: p.savings }),
      note: 'Point de départ choisi manuellement. Les données saisies ensuite ne sont pas des déclarations de la source du modèle.' } }
  return { profile, text: personal && record.edited ? record.text : buildBudgetText(profile), edited: personal && record.edited,
    textFinance: personal && record.edited ? record.textFinance : budgetFinancialReference(profile) }
}
