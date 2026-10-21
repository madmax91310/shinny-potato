import { isStock } from '../../lib/is-stock.js'
import { normalizeSearch } from '../../data/search-text.js'

export const COMPARISON_FAMILIES = [
  { id: 'etfs', label: 'ETF vs ETF' },
  { id: 'mixed', label: 'ETF vs actions' },
  { id: 'stocks', label: 'Actions vs actions' },
  { id: 'general', label: 'Comparaisons généralistes' },
]

// Use the instrument's identity, never its ISIN domicile, to distinguish funds,
// stocks and indices. ETC, crypto and index selections belong to general comparisons.
export function comparisonFamily(category, sources) {
  const assets = category.ids.map(id => sources[id])
  const stocks = assets.filter(isStock).length
  const funds = assets.filter(a => a && !isStock(a) && a.isin && (!a.instrumentType || a.instrumentType === 'ETF') && !a.id?.startsWith('etc_')).length
  if (stocks === assets.length) return 'stocks'
  if (funds === assets.length) return 'etfs'
  if (stocks && funds && stocks + funds === assets.length) return 'mixed'
  return 'general'
}

export function comparisonTags(category, sources) {
  const label = normalizeSearch(`${category.label} ${category.group ?? ''}`)
  const tags = []
  for (const [pattern, tag] of [
    [/franc|luxe · hermes/, 'France'], [/americ|etats-unis|\busa\b|\bus\b|s&p|nasdaq/, 'États-Unis'],
    [/europ|zone euro|euro stoxx|stoxx europe/, 'Europe'], [/britann/, 'Royaume-Uni'],
    [/suiss/, 'Suisse'], [/japon/, 'Japon'], [/chino|chine|hong kong/, 'Chine'],
    [/indien|inde\b/, 'Inde'], [/canad/, 'Canada'], [/austral/, 'Australie'],
    [/allemand/, 'Allemagne'], [/italien/, 'Italie'], [/coreen/, 'Corée'], [/singapour/, 'Singapour'],
    [/mond|world|acwi|international|global/, 'Monde / international'],
    [/emerg/, 'Émergents'], [/facteur|momentum|quality|value|volatil/, 'Facteurs'],
    [/secteur|tech|sante|banqu|finance|industrie|puces|cyber|defense|consommation|energie|logiciel/, 'Secteurs et thématiques'],
    [/dividende/, 'Dividendes'], [/small|petites capitalisations/, 'Petites capitalisations'],
    [/oblig|bond/, 'Obligations'], [/lifestrategy/, 'Multi-actifs'],
  ]) if (pattern.test(label)) tags.push(tag)
  const assets = category.ids.map(id => sources[id])
  if (assets.some(a => /index-/.test(a?.basis) || a?.priceUnit === 'points')) tags.push('Indices')
  if (assets.some(a => /gold|^or$/.test(a?.id))) tags.push('Or')
  if (assets.some(a => ['bitcoin', 'ethereum'].includes(a?.id)) || /crypto/.test(label)) tags.push('Cryptomonnaies')
  if (/matieres premieres/.test(label)) tags.push('Matières premières')
  if (category.id === 'multi-asset') tags.push('Multi-actifs', 'Obligations')
  if (!tags.length) tags.push('Monde / international')
  return [...new Set(tags)]
}

export function filterComparisons(categories, sources, { family, tag = '', query = '' }) {
  const search = normalizeSearch(query)
  return categories.filter(c => comparisonFamily(c, sources) === family &&
    (!tag || comparisonTags(c, sources).includes(tag)) &&
    normalizeSearch([c.label, ...c.ids.map(id => `${sources[id]?.shortLabel ?? ''} ${sources[id]?.label ?? ''} ${sources[id]?.isin ?? ''}`)].join(' ')).includes(search))
}
