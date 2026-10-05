import { getIndexFacts } from './index-facts.js'
// Cas issus exclusivement des photographies d’indices déjà vérifiées au 30/09/2026.
// Les chiffres ne décrivent jamais les positions exactes des parts ETF.
export const INDEX_DECISION_CASE_DEFINITIONS = [
 { id: 'emergents-retirer-chine', title: 'Retirer la Chine des émergents',
  left: 'msci-em-imi', right: 'msci-em-ex-china', match: /Taïwan/,
  situation: '🌏 Tu veux retirer la Chine de tes émergents. Quelle place prend alors Taïwan ?',
  explanation: 'Le retrait de la Chine augmente la place relative des autres pays. Attention : EM IMI comprend aussi les petites capitalisations, tandis que EM ex-China couvre les grandes et moyennes. L’écart ne vient donc pas seulement de la Chine.',
  question: 'Tu accepterais ce nouveau poids de Taïwan pour exclure la Chine ?' },
 { id: 'world-quality-pays', title: 'World + Quality : un filtre, pas de nouveaux pays',
  left: 'world', right: 'msci-world-sector-neutral-quality', match: /États-Unis/,
  situation: '🔎 Tu ajoutes 20 % de World Sector Neutral Quality à ton World. Tu élargis les pays couverts ?',
  explanation: 'Ces deux indices partent des pays développés. Quality sélectionne des entreprises selon leurs fondamentaux ; il change les poids et renforce des titres déjà présents dans le World. Un filtre sectoriellement neutre ne garantit pas une neutralité géographique.',
  question: 'Tu ajoutes Quality pour son filtre ou pour chercher de nouveaux marchés ?', weight: .2 },
]
const format = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
export const INDEX_DECISION_CASES = INDEX_DECISION_CASE_DEFINITIONS.map(definition => {
 const a = getIndexFacts(definition.left, '2026-09-30')
 const b = getIndexFacts(definition.right, '2026-09-30')
 const entry = facts => {
  const row = facts.countries.find(([name]) => definition.match.test(name))
  if (!row) throw new Error(`Pays absent dans le cas ${definition.id}`)
  return row
 }
 const [country, wa] = entry(a), [, wb] = entry(b)
 const illustration = definition.weight == null
  ? `${country} : ${format(wa)} % dans ${a.index}, contre ${format(wb)} % dans ${b.index}.`
  : `${country} : ${format(wa)} % dans le World seul ; ${format(wa * (1 - definition.weight) + wb * definition.weight)} % dans une allocation de 80 % World et 20 % World Sector Neutral Quality.`
 return { id: definition.id, title: definition.title, category: 'Diversification',
  text: `${definition.situation} 👇\n\nPhotographie des indices au 30/09/2026.\n\n${illustration}\n\n${definition.explanation}\n\n📌 Ces poids décrivent les indices ; ils ne représentent ni les positions exactes des ETF ni une mesure exhaustive de leur chevauchement.\n\n💬 ${definition.question}`,
  sources: [a, b].map(facts => ({ label: `${facts.index} · 30/09/2026`, url: facts.source.url })) }
})
