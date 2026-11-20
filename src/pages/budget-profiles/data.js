import scopeReview from './scope-review-2026-11-19.json' with { type: 'json' }
import plausibilityReview from './plausibility-review-2026-11-19.json' with { type: 'json' }
import coherenceReview from './coherence-review-2026-11-19.json' with { type: 'json' }
import publicationClosure from './publication-closure-2026-11-19.json' with { type: 'json' }
import publicationReview from './publication-review-1390.json' with { type: 'json' }
import noemieReference from './noemie-reference.json' with { type: 'json' }
import { budgetCompletions } from './budget-completions.js'
import studioEditorialProfiles from './editorial-profiles-studio-2026-11-16.json' with { type: 'json' }
import roadmapEditorialProfiles from './editorial-profiles-roadmap-2026-11-16.json' with { type: 'json' }
import publicationSelection from './publication-selection-2026-11-16.json' with { type: 'json' }
import previousEditorialLives from './editorial-lives-2026-11-06.json' with { type: 'json' }
import newEditorialProfiles from './editorial-profiles-2026-11-15.json' with { type: 'json' }
import complementaryEditorialProfiles from './editorial-profiles-complementary-2026-11-16.json' with { type: 'json' }
import qualifiedEditorialProfiles from './editorial-profiles-qualified-2026-11-15.json' with { type: 'json' }
import editorialCopy from './editorial-copy-2026-11-14.json' with { type: 'json' }
import { reviseEditorialCopy } from './editorial-copy.js'
import { createEditorialProfile, createEditorialContext } from './editorial-lives.js'
import bankProfiles from './qualified-profiles-bank-2026-11-02.json' with { type: 'json' }
import completeness from './completeness-2026-11-03.json' with { type: 'json' }
import reliability from './reliability-2026-11-06.json' with { type: 'json' }
import { prepareBudgetProfile, prepareBudgetContext, reviseCompletionReview } from './completion.js'
import publicationContext from './publication-context.json' with { type: 'json' }
import bankEditorial from './qualified-editorial-bank-2026-11-02.json' with { type: 'json' }
import newQualifiedProfiles from './qualified-profiles-2026-11-02.json' with { type: 'json' }
import newQualifiedEditorial from './qualified-editorial-2026-11-02.json' with { type: 'json' }
import qualifiedProfiles from './qualified-profiles-2026-11-01.json' with { type: 'json' }
import editorial from './editorial.json' with { type: 'json' }
import baseProfiles from './base-profiles.json' with { type: 'json' }
import profileEditorial from './profile-editorial.json' with { type: 'json' }
import preparedLotTwo from './prepared-profiles-lot-2-2026-10-30.json' with { type: 'json' }
import preparedProfiles from './prepared-profiles-2026-10-30.json' with { type: 'json' }
import additionalProfiles from './additional-profiles-2026-10-30.json' with { type: 'json' }

const editorialLives = Object.fromEntries(Object.entries(previousEditorialLives).map(([id, review]) => [id, reviseEditorialCopy(review, editorialCopy[id])]))

// Témoignages publics, contrôlés le 30/10/2026. Les dates décrivent les
// publications, pas une actualisation des budgets des personnes.
// Les blocs historiques conservent les données déclarées. Les imports prepared
// portent les compléments autorisés et leur provenance, séparés des observations.
// Les prénoms fictifs du texte sont déclarés dans BUDGET_EDITORIAL.
const sourceProfiles = [...baseProfiles, ...additionalProfiles, ...preparedProfiles, ...preparedLotTwo, ...qualifiedProfiles, ...newQualifiedProfiles, ...bankProfiles]

// Explicitly reviewed metadata and public labels; the original evidence stays intact.
export const BUDGET_ORIGINAL_PROFILES = sourceProfiles.map(profile => {
  const e = profileEditorial[profile.id] || {}
  const labels = e.rowLabels || {}
  return { ...profile, ...Object.fromEntries(['country', 'family', 'children', 'housing', 'budgetAsOf', 'period', 'preparedAt', 'editorialReviewedAt'].filter(key => key in e).map(key => [key, e[key]])),
    ...Object.fromEntries(['income', 'expenses', 'savings'].map(key => [key, profile[key].map(row => ({ ...row, label: labels[row.label] || row.label }))])) }
})
export const BUDGET_PREVIOUS_COMPLETENESS = completeness
export const BUDGET_PREVIOUS_PROFILES = BUDGET_ORIGINAL_PROFILES.map(profile => prepareBudgetProfile(profile, completeness[profile.id]))
export const BUDGET_COMPLETENESS = Object.fromEntries(sourceProfiles.map(p => [p.id, reviseCompletionReview(completeness[p.id], reliability[p.id])]))
export const BUDGET_RELIABLE_PROFILES = BUDGET_ORIGINAL_PROFILES.map(profile => prepareBudgetProfile(profile, BUDGET_COMPLETENESS[profile.id]))

// Prior audit snapshots retain exactly their original scope. New characters do
// not become source photographs or inherit a fictitious historical review.
export const BUDGET_REFERENCE_PROFILES = BUDGET_RELIABLE_PROFILES.map(p => createEditorialProfile(p, editorialLives[p.id]))
export const NOEMIE_ID = noemieReference.profile.id
export const BUDGET_NOEMIE_PREVIOUS_ENTRY = newEditorialProfiles.find(entry => entry.profile.id === NOEMIE_ID)
export const BUDGET_NOEMIE_PREVIOUS = BUDGET_NOEMIE_PREVIOUS_ENTRY.profile
const recentEditorialProfiles = newEditorialProfiles.map(entry => entry.profile.id !== NOEMIE_ID ? entry : {
  ...entry, ...noemieReference, profile: { ...entry.profile, ...noemieReference.profile },
  display: { ...entry.display, ...noemieReference.display },
  publication: { ...entry.publication, ...noemieReference.publication },
  creation: { ...entry.creation, ...noemieReference.creation },
})
export const BUDGET_NEW_EDITORIAL_PROFILES = recentEditorialProfiles.map(entry => entry.profile)
export const BUDGET_QUALIFIED_EDITORIAL_PROFILES = qualifiedEditorialProfiles.map(entry => entry.profile)
export const BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES = complementaryEditorialProfiles.map(entry => entry.profile)
export const BUDGET_ROADMAP_EDITORIAL_PROFILES = roadmapEditorialProfiles.map(entry => entry.profile)
export const BUDGET_STUDIO_EDITORIAL_PROFILES = studioEditorialProfiles.map(entry => entry.profile)
export const BUDGET_PUBLICATION_SELECTION = publicationSelection
const currentEditorialProfiles = [...recentEditorialProfiles, ...qualifiedEditorialProfiles, ...complementaryEditorialProfiles, ...roadmapEditorialProfiles, ...studioEditorialProfiles]
export const BUDGET_EDITORIAL_CREATIONS = { ...editorialLives, ...Object.fromEntries(currentEditorialProfiles.map(entry => [entry.profile.id, entry.creation])) }
export const BUDGET_BEFORE_COHERENCE = [...BUDGET_REFERENCE_PROFILES, ...BUDGET_NEW_EDITORIAL_PROFILES, ...BUDGET_QUALIFIED_EDITORIAL_PROFILES, ...BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES, ...BUDGET_ROADMAP_EDITORIAL_PROFILES, ...BUDGET_STUDIO_EDITORIAL_PROFILES].map(profile => {
  const review = budgetCompletions[profile.id]
  if (!review) return profile
  return { ...profile, approximate: true,
    expenses: profile.expenses.flatMap(row => row.label === review.replace ? review.rows : [row]),
  }
})

export const BUDGET_COHERENCE_REVIEW = coherenceReview
export const BUDGET_PLAUSIBILITY_REVIEW = plausibilityReview
export const BUDGET_BEFORE_SCOPE = BUDGET_BEFORE_COHERENCE.map(profile => {
  const amounts = plausibilityReview[profile.id]?.amounts ?? coherenceReview[profile.id]?.amounts
  return amounts ? { ...profile,
    expenses: profile.expenses.map(row => Object.hasOwn(amounts, row.label) ? { ...row, amount: amounts[row.label] } : row),
  } : profile
})

export const BUDGET_SCOPE_REVIEW = scopeReview
export const BUDGET_PROFILES = BUDGET_BEFORE_SCOPE.map(profile => {
  const review = scopeReview[profile.id]
  if (!review) return profile
  const { incomeExclude, housing, additionalExpenses, rows } = review
  const result = { ...profile }
  if (housing) result.housing = housing
  if (incomeExclude) result.income = profile.income.filter(row => row.label !== incomeExclude)
  for (const [key, changes] of Object.entries(rows ?? {})) {
    result[key] = profile[key].map(row => Object.hasOwn(changes, row.label) ? { ...row, ...changes[row.label] } : row)
  }
  if (additionalExpenses) result.expenses = [...result.expenses, ...additionalExpenses]
  return result
})

export const EXPENSE_CATEGORIES = [
  { id: 'housing', label: 'Logement', emoji: '🏠' },
  { id: 'food', label: 'Alimentation et repas', emoji: '🛒' },
  { id: 'transport', label: 'Mobilité', emoji: '🚗' },
  { id: 'bills', label: 'Factures, assurances et abonnements', emoji: '📱' },
  { id: 'health', label: 'Santé', emoji: '🩺' },
  { id: 'credit', label: 'Remboursements de crédits', emoji: '💳' },
  { id: 'leisure', label: 'Loisirs', emoji: '🍿' },
  { id: 'other', label: 'Autres dépenses', emoji: '🧾' },
]

export const BUDGET_ORIGINAL_EDITORIAL = Object.fromEntries(sourceProfiles.map(p => [p.id, { ...editorial[p.id], ...profileEditorial[p.id], ...newQualifiedEditorial[p.id], ...bankEditorial[p.id] }]))
export const BUDGET_RELIABLE_EDITORIAL = Object.fromEntries(sourceProfiles.map(p => [p.id, { ...BUDGET_ORIGINAL_EDITORIAL[p.id], ...BUDGET_COMPLETENESS[p.id].public?.display }]))

export const BUDGET_EDITORIAL = { ...Object.fromEntries(sourceProfiles.map(p => [p.id, { ...BUDGET_RELIABLE_EDITORIAL[p.id], ...editorialLives[p.id].display }])),
  ...Object.fromEntries(currentEditorialProfiles.map(entry => [entry.profile.id, entry.display])) }

// Publication copy and its evidence; public labels may be shared by text and image.
// The original photographs stay intact; prepared views explicitly carry the completion audit.
export const BUDGET_ORIGINAL_PUBLICATION_CONTEXT = publicationContext
export const BUDGET_PREVIOUS_PUBLICATION_CONTEXT = Object.fromEntries(sourceProfiles.map(p => [p.id, prepareBudgetContext(publicationContext[p.id], completeness[p.id])]))
export const BUDGET_RELIABLE_PUBLICATION_CONTEXT = Object.fromEntries(sourceProfiles.map(p => [p.id, reliability[p.id]?.public ? prepareBudgetContext(BUDGET_PREVIOUS_PUBLICATION_CONTEXT[p.id], { ...BUDGET_COMPLETENESS[p.id], public: reliability[p.id].public }) : BUDGET_PREVIOUS_PUBLICATION_CONTEXT[p.id]]))

export const BUDGET_REFERENCE_PUBLICATION_CONTEXT = Object.fromEntries(sourceProfiles.map(p => [p.id, createEditorialContext(BUDGET_RELIABLE_PUBLICATION_CONTEXT[p.id], editorialLives[p.id])]))
export const BUDGET_PUBLICATION_CONTEXT = { ...BUDGET_REFERENCE_PUBLICATION_CONTEXT,
  ...Object.fromEntries(currentEditorialProfiles.map(entry => [entry.profile.id, entry.publication])) }


// The profile-keyed review adds explicit evidence to the generated copy without
// changing the historical survey or assigning assumptions to a participant.
export const BUDGET_PUBLICATION_REVIEW = publicationReview
for (const [id, changes] of Object.entries(publicationReview)) {
  const base = BUDGET_PUBLICATION_CONTEXT[id]
  const context = { ...base, budget: { ...base.budget }, evidence: [...base.evidence],
    paragraphs: [...base.paragraphs], questions: [...base.questions] }
  for (const { field, index, after, basis, reason } of changes) {
    const entry = context.evidence.push({ basis: basis === 'assumption' ? 'editorial-preparation' : 'verified-repository-record', reviewKind: basis, note: reason }) - 1
    if (index === null) context.budget[field] = after
    else {
      const old = context[field][index]
      context[field][index] = { ...old, text: after, evidence: [...(old?.evidence || []), entry], ...(field === 'questions' && { origin: 'editorial', adaptedFrom: old?.origin === 'expressed' ? [old] : old?.adaptedFrom }) }
    }
  }
  BUDGET_PUBLICATION_CONTEXT[id] = context
}


export const BUDGET_BEFORE_CLOSURE = { ...BUDGET_PUBLICATION_CONTEXT }
export const BUDGET_PUBLICATION_CLOSURE = publicationClosure
for (const [id, { budget, paragraphs, questions, scenario, reason }] of Object.entries(publicationClosure)) {
  const base = BUDGET_PUBLICATION_CONTEXT[id]
  const evidence = [...base.evidence, { basis: scenario ? 'editorial-preparation' : 'verified-repository-record', note: reason, scenario }]
  const reference = [evidence.length - 1]
  BUDGET_PUBLICATION_CONTEXT[id] = {
    ...base,
    budget: { ...base.budget, ...budget },
    evidence,
    paragraphs: base.paragraphs.map((old, index) => Object.hasOwn(paragraphs || {}, index)
      ? { ...old, text: paragraphs[index], evidence: [...old.evidence, ...reference] } : old),
    questions: questions.map(text => ({ text, origin: 'editorial', evidence: reference,
      adaptedFrom: base.questions.flatMap(question => question.origin === 'expressed' ? [question] : question.adaptedFrom || []) })),
    scenario,
  }
}


for (const [id, { budget, paragraphs, questions, reason }] of Object.entries(coherenceReview)) {
  const base = BUDGET_PUBLICATION_CONTEXT[id]
  const evidence = [...base.evidence, { basis: 'editorial-preparation', note: reason }]
  const reference = [evidence.length - 1]
  BUDGET_PUBLICATION_CONTEXT[id] = {
    ...base, evidence,
    budget: { ...base.budget, ...budget, expenseLabels: { ...base.budget.expenseLabels, ...budget?.expenseLabels } },
    paragraphs: paragraphs ? paragraphs.map(text => ({ text, evidence: reference })) : base.paragraphs,
    questions: questions ? questions.map(text => ({ text, origin: 'editorial', evidence: reference,
      adaptedFrom: base.questions.flatMap(question => question.origin === 'expressed' ? [question] : question.adaptedFrom || []) })) : base.questions,
  }
}

for (const [id, { basis, expenseLabels, paragraphs, append, scenario, reason }] of Object.entries(plausibilityReview)) {
  const base = BUDGET_PUBLICATION_CONTEXT[id]
  const reference = [base.evidence.length]
  const updatedScenario = scenario ? { ...base.scenario, ...scenario } : base.scenario
  const copy = base.paragraphs.map((entry, index) => Object.hasOwn(paragraphs || {}, index)
    ? { text: paragraphs[index], evidence: reference } : entry)
  if (append) copy.push({ text: append, evidence: reference })
  BUDGET_PUBLICATION_CONTEXT[id] = {
    ...base,
    paragraphs: copy,
    evidence: [...base.evidence, { basis, note: reason, ...(scenario && { scenario: updatedScenario }) }],
    budget: { ...base.budget, expenseLabels: { ...base.budget.expenseLabels, ...expenseLabels } },
    scenario: updatedScenario,
  }
}


for (const [id, { budget, paragraphs, questions, projected, household, assumption, reason }] of Object.entries(scopeReview)) {
  const base = BUDGET_PUBLICATION_CONTEXT[id]
  const references = [base.evidence.length]
  BUDGET_PUBLICATION_CONTEXT[id] = {
    ...base,
    evidence: [...base.evidence, { basis: assumption ? 'editorial-preparation' : 'verified-repository-record', note: reason }],
    paragraphs: base.paragraphs.map((entry, index) => Object.hasOwn(paragraphs || {}, index)
      ? { text: paragraphs[index], evidence: references } : entry),
    questions: questions ? base.questions.map((entry, index) => ({ ...entry, text: questions[index] ?? entry.text, evidence: [...entry.evidence, ...references] })) : base.questions,
    budget: { ...base.budget, ...budget, ...(household && { household }), ...(projected && { projected }),
      expenseLabels: { ...base.budget.expenseLabels, ...budget?.expenseLabels } },
  }
}
