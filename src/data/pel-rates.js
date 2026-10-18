// Taux réglementaire du plan d’épargne logement (PEL), fixé à l’ouverture et conservé toute la
// vie du plan. Taux bruts annuels, avant prélèvement forfaitaire ; le plafond de versement est
// commun à toutes les générations.
// Source officielle DILA F16140 collectée avec identité, date et générations exactes.
import REGULATORY from './automated-regulatory.json' with {type:'json'}
const evidence=REGULATORY.sources.pel
export const PEL_CEILING=evidence.values.pelCeiling
export const PEL_SOURCE_URL=evidence.sourceUrl
export const PEL_CHECKED_AT=evidence.checkedAt
export const PEL_GENERATIONS=Object.freeze(evidence.generations.map(row=>Object.freeze({...row})))

// Taux brut d’un plan ouvert à une date donnée (AAAA-MM-JJ ou AAAA). Une année seule prend la
// génération en vigueur au 31 décembre, sauf si l’année est en cours : génération actuelle.
export function pelRateFor(opened, today = new Date().toISOString().slice(0, 10)) {
  if (opened == null || opened === '') return null
  const text = String(opened)
  const date = /^\d{4}$/.test(text) ? (text === today.slice(0, 4) ? today : `${text}-12-31`) : text
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) return null
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
