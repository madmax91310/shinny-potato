import { normalizeSearch } from '../../data/search-text.js'
import { CATEGORIES } from './data.js'
// Pistes éditoriales à documenter, sans témoignage inventé ni partage des salaires en couple.
import PUBLIC_CATEGORIES from './public-ideas.json' with { type: 'json' }

export const IDEA_GROUPS = [
  ...CATEGORIES.map(group => ({ ...group, kind: 'rankings', ideas: group.ideas.map((title, index) => ({ id: `${group.id}-${index}`, title })) })),
  ...PUBLIC_CATEGORIES.map(group => ({ ...group, kind: 'everyday' })),
]

export function filterIdeas({ query = '', category = 'all', kind = 'all' } = {}) {
  const terms = normalizeSearch(query).split(' ').filter(Boolean)
  return IDEA_GROUPS.filter(group => (kind === 'all' || group.kind === kind) && (category === 'all' || category === group.id))
    .map(group => ({ ...group, ideas: group.ideas.filter(idea => {
      const text = normalizeSearch(`${group.title} ${idea.title} ${idea.angle ?? ''}`)
      return terms.every(term => text.includes(term))
    }) }))
    .filter(group => group.ideas.length)
}

export function ideaText(idea) {
  return idea.angle ? `${idea.title}\n\nAngle : ${idea.angle}` : idea.title
}
