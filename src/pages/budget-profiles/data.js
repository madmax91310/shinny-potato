import bankProfiles from './qualified-profiles-bank-2026-11-02.json' with { type: 'json' }
import completeness from './completeness-2026-11-03.json' with { type: 'json' }
import { prepareBudgetProfile, prepareBudgetContext } from './completion.js'
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
export const BUDGET_COMPLETENESS = completeness
export const BUDGET_PROFILES = BUDGET_ORIGINAL_PROFILES.map(profile => prepareBudgetProfile(profile, completeness[profile.id]))

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
export const BUDGET_EDITORIAL = Object.fromEntries(sourceProfiles.map(p => [p.id, { ...BUDGET_ORIGINAL_EDITORIAL[p.id], ...completeness[p.id].public?.display }]))

// Publication copy and its evidence; public labels may be shared by text and image.
// The original photographs stay intact; prepared views explicitly carry the completion audit.
export const BUDGET_ORIGINAL_PUBLICATION_CONTEXT = publicationContext
export const BUDGET_PUBLICATION_CONTEXT = Object.fromEntries(sourceProfiles.map(p => [p.id, prepareBudgetContext(publicationContext[p.id], completeness[p.id])]))
