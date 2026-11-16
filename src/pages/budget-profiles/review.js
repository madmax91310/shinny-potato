import { BUDGET_COMPLETENESS } from './data.js'
import { analyzeBudget, budgetPublicExpenseRows, budgetPublicIncomeRows, budgetPublicSavingsRows } from './lib.js'

// A label can establish the presence of a line, never complete insurance,
// tax or household coverage. Vague envelopes remain questions to review.
export const COVERAGE_AREAS = [
  ['logement', 'Logement', /loyer|logement|hypoth[ée]caire|cr[ée]dit immobilier/i],
  ['alimentation_hygiene', 'Alimentation et hygiène', /aliment|courses|hygi[èe]ne/i],
  ['energie_eau', 'Énergie et eau', /[ée]nergie|[ée]lectric|chauffage|\bgaz\b|\beau\b/i],
  ['telecoms', 'Téléphone et internet', /t[ée]l[ée]phone|internet|t[ée]l[ée]com|mobile/i],
  ['assurances_sante', 'Santé et couverture', /sant[ée]|soins|mutuelle|compl[ée]mentaire/i],
  ['transports', 'Transports', /transport|voiture|carburant|essence|automobile|leasing|v[ée]hicule/i],
  ['vetements', 'Vêtements', /v[êe]tement|habillement/i],
  ['loisirs', 'Loisirs et abonnements', /loisirs|sorties|sport|abonnement|plaisirs/i],
  ['cadeaux_vacances', 'Cadeaux et vacances', /cadeaux|vacances|voyages/i],
  ['enfants_garde', 'Enfants et garde', /garde|cr[èe]che|[ée]cole|scolarit[ée]|cantine|enfant/i],
  ['entretien_logement', 'Entretien du logement', /entretien.*logement|logement.*entretien/i],
  ['remplacements_annuels', 'Équipements et remplacements', /[ée]quipement|remplacement|[ée]lectrom[ée]nager/i],
]
export function reviewBudget(profile) {
  const rows = budgetPublicExpenseRows(profile), legacy = BUDGET_COMPLETENESS[profile.id]
  const coverage = COVERAGE_AREAS.map(([id, label, pattern]) => {
    const matched = rows.filter(row => pattern.test(row.label))
    const evidence = legacy?.coverageEvidence?.[id]
    const proven = rows.filter(row => evidence?.rows?.includes(row.label))
    const external = !matched.length && legacy?.coverage?.[id] === 'external' && evidence?.basis
    const nonApplicable = !matched.length && ['not_applicable', 'non_applicable'].includes(legacy?.coverage?.[id]) && evidence?.basis
    const status = matched.length ? matched.some(row => row.annualProvision || row.periodicity === 'annual-provision' || /^provision/i.test(row.label)) ? 'provision' : proven.length && legacy?.coverage?.[id] === 'grouped' ? 'grouped' : 'listed' : external ? 'external' : nonApplicable ? 'not-applicable' : 'unknown'
    return { id, label, status, rows: matched.map(row => row.label), basis: external || nonApplicable || (proven.length ? evidence.basis : ''), limits: evidence?.unknowns || [] }
  })
  const totals = analyzeBudget(profile), questions = profile.question.split('\n').filter(s => s.trim())
  const notes = []
  const labels = rows.map(row => row.label.trim().toLocaleLowerCase('fr'))
  const repeated = [...new Set(labels.filter((label, index) => labels.indexOf(label) !== index))]
  if (repeated.length) notes.push(`Plusieurs lignes portent le même libellé : ${repeated.join(', ')}. Vérifier qu’elles ne financent pas deux fois le même poste.`)
  if (totals.balance < 0) notes.push('Le solde est déficitaire. Les questions doivent porter sur la viabilité, les dépenses ou les priorités, pas sur un surplus à investir.')
  if (coverage.some(item => item.status === 'unknown')) notes.push('Des postes restent sans ligne explicite. Vérifier les enveloppes et prises en charge avant tout ajout ; une absence ne vaut pas zéro.')
  if (questions.length === 0) notes.push('Aucune question saisie. Ajoute une question concrète si tu le souhaites.')
  if (questions.length > 2) notes.push('Plus de deux questions : garder celles qui apportent un véritable choix.')
  if (profile.savings.length) notes.push('Les versements sont mensuels. Une réserve ou un placement déjà détenu se décrit dans le contexte, sans le déduire une deuxième fois du solde.')
  const projects = (profile.editorialCreation?.finance || []).filter(f => f.type === 'project').map(f => ({ label: f.label, initialFunding: f.initialFunding, monthlyFunding: f.monthlyFunding, horizonMonths: f.horizonMonths, targetAmount: f.targetAmount, fundedBeforeReturns: [f.initialFunding, f.monthlyFunding, f.horizonMonths].every(Number.isFinite) ? Math.round((f.initialFunding + f.monthlyFunding * f.horizonMonths) * 100) / 100 : null }))
  return { coverage, notes, projects, totals, questions, income: budgetPublicIncomeRows(profile), expenses: rows, savings: budgetPublicSavingsRows(profile) }
}
