const PRIORITIES = { expired:0, 'future-date':1, stale:2, reserve:3, undated:4, ending:5, soon:6, scheduled:7 }
export function groupReviews(items) {
  const groups = new Map()
  for (const item of items) {
    // Une source commune ne suffit pas à confondre deux contrats ou deux réserves.
    const key = [item.name, item.category, [...item.urls].sort().join('|')].join('::')
    const group = groups.get(key) ?? { id:key, name:item.name, category:item.category, items:[], tools:new Set(), urls:item.urls }
    group.items.push(item); item.tools.forEach(t=>group.tools.add(t)); groups.set(key,group)
  }
  return [...groups.values()].map(g=>({...g,tools:[...g.tools]})).sort((a,b)=>(PRIORITIES[a.category]??9)-(PRIORITIES[b.category]??9)||b.tools.length-a.tools.length||a.name.localeCompare(b.name,'fr'))
}
export function reviewAction(category) {
  if (category==='reserve') return 'Vérifier les clauses précises indiquées ci-dessous ; une page générale ne suffit pas à confirmer tous les champs.'
  if (category==='expired') return 'Retirer les conditions de l’offre expirée des publications qui la mentionnent.'
  if (['undated','future-date'].includes(category)) return 'Retrouver la date dans le document source, sans remplacer une date de photographie par la date du contrôle.'
  return 'Relire cette source une fois, puis vérifier les champs et les publications associés.'
}
