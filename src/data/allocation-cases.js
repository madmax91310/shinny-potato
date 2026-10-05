import { INDEX_FACTS } from './index-facts.js'
// Pondérations d’indices, pas inventaire de positions d’un ETF précis.
export const ALLOCATION_CASE_DEFINITIONS = [
  { id:'world-ex-usa-chiffre', title:'World + hors États-Unis : fixer le poids américain',left:'world',right:'world-ex-usa',weight:.3,
    situation:'🌍 Tu gardes 70 % de World et tu ajoutes 30 % de World hors États-Unis. Combien d’actions américaines reste-t-il ? 👇',
    conclusion:'La ligne hors États-Unis réduit leur poids, sans ajouter les émergents ni les petites entreprises. Beaucoup de ses sociétés sont déjà présentes dans le World.',question:'Tu laisserais le marché fixer le poids américain, ou tu le réduirais toi-même ?' },
  { id:'world-small-chiffre', title:'World + petites entreprises : changer de taille',left:'world',right:'world-small-cap',weight:.2,
    situation:'🔎 Tu ajoutes 20 % de petites capitalisations mondiales à ton World. Est-ce aussi une façon de sortir des États-Unis ? 👇',
    conclusion:'Tu ajoutes une tranche de taille absente du World, mais les petites entreprises américaines restent présentes. Diversifier les tailles ne revient pas à exclure un pays.',question:'Tu ajouterais des petites entreprises pour changer la taille des sociétés ou la géographie ?' },
  { id:'world-acwi-imi-chiffre',title:'World + ACWI IMI : ce qui s’ajoute',left:'world',right:'acwi-imi',weight:.5,
    situation:'🌍 World et ACWI IMI à parts égales : deux lignes mondiales, mais qu’est-ce que tu ajoutes vraiment ? 👇',
    conclusion:'L’ACWI IMI apporte les émergents et petites capitalisations. Il détient aussi les grandes et moyennes entreprises développées déjà présentes dans le World : les deux lignes se recouvrent en partie.',question:'Tu garderais ces deux lignes, ou un ACWI IMI seul pour ta poche mondiale ?' },
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
  const usaB = ['mscieurope','world-ex-usa'].includes(definition.right) ? 0 : weightOf(b, 'countries', 'États-Unis')
  if (usaA === null || usaB === null) throw new Error('Poids géographique absent')
  const techA = weightOf(a, 'sectors', 'Technologie')
  const techB = weightOf(b, 'sectors', 'Technologie')
  const blended = (x, y) => weightedExposure(x, y, definition.weight)
  // Revue éditoriale 04/10/2026 : même photographie et mêmes calculs pondérés.
  const addingEurope = definition.right === 'mscieurope'
  const situation = definition.situation ?? (addingEurope
    ? `🌍 Tu as un ETF MSCI World et tu veux mettre ${fmt(definition.weight * 100)} % de ton portefeuille sur l’Europe. Ça change quoi pour la place des États-Unis ? 👇`
    : `🌍 Tu as un ETF MSCI World et tu envisages de partager ton portefeuille à parts égales avec un ACWI. Deux lignes, mais combien d’actions américaines au total ? 👇`)
  return { id: definition.id, category: 'Diversification chiffrée', title: definition.title,
    text: `${situation}\n\nPrenons les compositions des indices à la même date.\nPhotographie des indices au ${dateA}.\n\n🇺🇸 World seul : ${fmt(usaA)} % d’actions américaines.\n⚖️ ${fmt((1 - definition.weight) * 100)} % World + ${fmt(definition.weight * 100)} % ${b.index} : ${fmt(blended(usaA, usaB))} %.${techA !== null && techB !== null ? `\n💻 Technologie : ${fmt(techA)} % dans le World seul, contre ${fmt(blended(techA, techB))} % dans cette allocation.` : ''}\n\n${definition.conclusion ?? (addingEurope ? 'Tu donnes davantage de place à l’Europe et moins aux États-Unis. Tu renforces aussi des entreprises européennes déjà présentes dans le World.' : 'L’ACWI apporte notamment des marchés émergents, mais il contient aussi des entreprises déjà présentes dans ton World. Les poids changent ; les deux lignes ne sont pas deux paniers entièrement différents.')}\n\n📌 Ces chiffres décrivent une allocation calculée à partir des indices. Ce ne sont pas les positions exactes de tes ETF, ni une mesure complète de leurs entreprises communes.\n\n💬 ${definition.question ?? (addingEurope ? 'Tu ajouterais de l’Europe pour réduire le poids américain, ou tu garderais ton World seul ?' : 'Avec un World en portefeuille, qu’est-ce qui te ferait ajouter un ACWI ?')}`,
    sources: [a, b].map(facts => ({ label: `${facts.index} · ${dateA}`, url: facts.source.url })) }
}
export const ALLOCATION_CASES = ALLOCATION_CASE_DEFINITIONS.map(buildAllocationCase)
