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
const sourceProfiles = [...baseProfiles, ...additionalProfiles, ...preparedProfiles, ...preparedLotTwo, ...qualifiedProfiles]

// Explicitly reviewed metadata and public labels; the original evidence stays intact.
export const BUDGET_PROFILES = sourceProfiles.map(profile => {
  const e = profileEditorial[profile.id] || {}
  const labels = e.rowLabels || {}
  return { ...profile, ...Object.fromEntries(['country', 'family', 'children', 'housing', 'budgetAsOf', 'period', 'preparedAt', 'editorialReviewedAt'].filter(key => key in e).map(key => [key, e[key]])),
    ...Object.fromEntries(['income', 'expenses', 'savings'].map(key => [key, profile[key].map(row => ({ ...row, label: labels[row.label] || row.label }))])) }
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

export const BUDGET_EDITORIAL = Object.fromEntries(sourceProfiles.map(p => [p.id, { ...editorial[p.id], ...profileEditorial[p.id] }]))
