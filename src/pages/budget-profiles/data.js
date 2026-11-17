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
export const BUDGET_NEW_EDITORIAL_PROFILES = newEditorialProfiles.map(entry => entry.profile)
export const BUDGET_QUALIFIED_EDITORIAL_PROFILES = qualifiedEditorialProfiles.map(entry => entry.profile)
export const BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES = complementaryEditorialProfiles.map(entry => entry.profile)
export const BUDGET_ROADMAP_EDITORIAL_PROFILES = roadmapEditorialProfiles.map(entry => entry.profile)
export const BUDGET_STUDIO_EDITORIAL_PROFILES = studioEditorialProfiles.map(entry => entry.profile)
export const BUDGET_PUBLICATION_SELECTION = publicationSelection
const currentEditorialProfiles = [...newEditorialProfiles, ...qualifiedEditorialProfiles, ...complementaryEditorialProfiles, ...roadmapEditorialProfiles, ...studioEditorialProfiles]
export const BUDGET_EDITORIAL_CREATIONS = { ...editorialLives, ...Object.fromEntries(currentEditorialProfiles.map(entry => [entry.profile.id, entry.creation])) }
export const BUDGET_PROFILES = [...BUDGET_REFERENCE_PROFILES, ...BUDGET_NEW_EDITORIAL_PROFILES, ...BUDGET_QUALIFIED_EDITORIAL_PROFILES, ...BUDGET_COMPLEMENTARY_EDITORIAL_PROFILES, ...BUDGET_ROADMAP_EDITORIAL_PROFILES, ...BUDGET_STUDIO_EDITORIAL_PROFILES]

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
