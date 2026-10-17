// Taux réglementaire du plan d’épargne logement (PEL), fixé à l’ouverture et conservé toute la
// vie du plan. Taux bruts annuels, avant prélèvement forfaitaire ; le plafond de versement est
// commun à toutes les générations.
// Sources contrôlées le 17/10/2026 : service-public.gouv.fr (actualité A16217 et fiche F16140),
// recoupées avec les tableaux Selectra et MoneyVox (générations 2003-2016). Le collecteur
// réglementaire ne lit pas encore cette fiche : toute modification du taux doit être reportée ici
// avec sa source.
export const PEL_CEILING = 61200
export const PEL_SOURCE_URL = 'https://www.service-public.gouv.fr/particuliers/vosdroits/F16140'
export const PEL_CHECKED_AT = '2026-10-17'
// Intervalles d’ouverture inclusifs ; `to` null = génération en cours.
export const PEL_GENERATIONS = Object.freeze([
  { from: '2026-01-01', to: null, rate: 2.0 },
  { from: '2025-01-01', to: '2025-12-31', rate: 1.75 },
  { from: '2024-01-01', to: '2024-12-31', rate: 2.25 },
  { from: '2023-01-01', to: '2023-12-31', rate: 2.0 },
  { from: '2016-08-01', to: '2022-12-31', rate: 1.0 },
  { from: '2016-02-01', to: '2016-07-31', rate: 1.5 },
  { from: '2015-02-01', to: '2016-01-31', rate: 2.0 },
  { from: '2003-08-01', to: '2015-01-31', rate: 2.5 },
])

// Taux brut d’un plan ouvert à une date donnée (AAAA-MM-JJ ou AAAA). Une année seule prend la
// génération en vigueur au 31 décembre, sauf si l’année est en cours : génération actuelle.
export function pelRateFor(opened, today = new Date().toISOString().slice(0, 10)) {
  if (opened == null || opened === '') return null
  const text = String(opened)
  const date = /^\d{4}$/.test(text) ? (text === today.slice(0, 4) ? today : `${text}-12-31`) : text
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const generation = PEL_GENERATIONS.find(row => date >= row.from && (row.to == null || date <= row.to))
  return generation ? generation.rate : null
}

// Choix proposés dans un sélecteur : une ligne par génération, libellée par ses dates.
export const PEL_GENERATION_OPTIONS = PEL_GENERATIONS.map(row => {
  const year = row.from.slice(0, 4)
  const label = row.to == null ? `Depuis ${fr(row.from)}` : row.from.endsWith('-01-01') && row.to === `${year}-12-31` ? `Ouvert en ${year}` : `Du ${fr(row.from)} au ${fr(row.to)}`
  return { value: row.from, label: `${label} · ${row.rate.toLocaleString('fr-FR')} %`, rate: row.rate }
})
function fr(date) { return new Date(`${date}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) }
