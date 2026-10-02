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
  return { id: definition.id, category: 'Diversification chiffrée', title: definition.title,
    text: `Tu ajoutes une ligne à ton World. Mais qu’est-ce que ça change réellement ? 🌍\n\nPhotographie des indices au ${dateA} 👇\n\n🇺🇸 World seul : ${fmt(usaA)} % d’actions américaines.\n⚖️ ${fmt((1 - definition.weight) * 100)} % World + ${fmt(definition.weight * 100)} % ${b.index} : ${fmt(blended(usaA, usaB))} %.${techA !== null && techB !== null ? `\n💻 Technologie : ${fmt(techA)} % dans le World seul, contre ${fmt(blended(techA, techB))} % dans cette allocation.` : ''}\n\nAjouter un ETF change les pondérations. Cela ne prouve pas que les entreprises détenues sont toutes différentes.\n\n📌 Calcul pondéré à partir des compositions des indices à cette date. Ce ne sont pas les positions exactes d’un ETF, ni une mesure du chevauchement complet.\n\n💬 Tu cherches à ajouter des entreprises ou à changer le poids de certaines zones ?`,
    sources: [a, b].map(facts => ({ label: `${facts.index} · ${dateA}`, url: facts.source.url })) }
}
export const ALLOCATION_CASES = ALLOCATION_CASE_DEFINITIONS.map(buildAllocationCase)
