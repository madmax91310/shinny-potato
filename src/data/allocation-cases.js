import { INDEX_FACTS } from './index-facts.js'
// Pondérations d’indices, pas inventaire de positions d’un ETF précis.
export const ALLOCATION_CASE_DEFINITIONS = [
  { id: 'world-acwi-chiffre', title: 'World + ACWI : poids des États-Unis', left: 'world', right: 'acwi', weight: .5 },
  { id: 'world-europe-chiffre', title: 'World + Europe : ce que change une ligne', left: 'world', right: 'mscieurope', weight: .2 },
]
const datedKeys = id => Object.keys(INDEX_FACTS[id]).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
export const weightedExposure = (a, b, weight) => (1 - weight) * a + weight * b
const weightOf = (facts, field, label) => facts[field]?.find(([name]) => name.includes(label))?.[1] ?? null
const fmt = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
export function buildAllocationCase(definition) {
  const dateA = datedKeys(definition.left).filter(date => datedKeys(definition.right).includes(date)).sort().at(-1)
  if (!dateA) throw new Error('Aucune photographie commune aux deux indices')
  const a = INDEX_FACTS[definition.left][dateA]
  const b = INDEX_FACTS[definition.right][dateA]
  const usaA = weightOf(a, 'countries', 'États-Unis')
  // MSCI Europe : son périmètre exclut les États-Unis ; ne pas interpréter un pays omis comme 0.
  const usaB = definition.right === 'mscieurope' ? 0 : weightOf(b, 'countries', 'États-Unis')
  if (usaA === null || usaB === null) throw new Error('Poids géographique absent')
  const techA = weightOf(a, 'sectors', 'Technologie')
  const techB = weightOf(b, 'sectors', 'Technologie')
  const blended = (x, y) => weightedExposure(x, y, definition.weight)
  // Revue éditoriale 04/10/2026 : même photographie et mêmes calculs pondérés.
  const addingEurope = definition.right === 'mscieurope'
  const situation = addingEurope
    ? `🌍 Tu as un ETF MSCI World et tu veux mettre ${fmt(definition.weight * 100)} % de ton portefeuille sur l’Europe. Ça change quoi pour la place des États-Unis ? 👇`
    : `🌍 Tu as un ETF MSCI World et tu envisages de partager ton portefeuille à parts égales avec un ACWI. Deux lignes, mais combien d’actions américaines au total ? 👇`
  return { id: definition.id, category: 'Diversification chiffrée', title: definition.title,
    text: `${situation}\n\nPrenons les compositions des indices à la même date.\nPhotographie des indices au ${dateA}.\n\n🇺🇸 World seul : ${fmt(usaA)} % d’actions américaines.\n⚖️ ${fmt((1 - definition.weight) * 100)} % World + ${fmt(definition.weight * 100)} % ${b.index} : ${fmt(blended(usaA, usaB))} %.${techA !== null && techB !== null ? `\n💻 Technologie : ${fmt(techA)} % dans le World seul, contre ${fmt(blended(techA, techB))} % dans cette allocation.` : ''}\n\n${addingEurope ? 'Tu donnes davantage de place à l’Europe et moins aux États-Unis. Tu renforces aussi des entreprises européennes déjà présentes dans le World.' : 'L’ACWI apporte notamment des marchés émergents, mais il contient aussi des entreprises déjà présentes dans ton World. Les poids changent ; les deux lignes ne sont pas deux paniers entièrement différents.'}\n\n📌 Ces chiffres décrivent une allocation calculée à partir des indices. Ce ne sont pas les positions exactes de tes ETF, ni une mesure complète de leurs entreprises communes.\n\n💬 ${addingEurope ? 'Tu ajouterais de l’Europe pour réduire le poids américain, ou tu garderais ton World seul ?' : 'Avec un World en portefeuille, qu’est-ce qui te ferait ajouter un ACWI ?'}`,
    sources: [a, b].map(facts => ({ label: `${facts.index} · ${dateA}`, url: facts.source.url })) }
}
export const ALLOCATION_CASES = ALLOCATION_CASE_DEFINITIONS.map(buildAllocationCase)
