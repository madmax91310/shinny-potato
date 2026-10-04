import sources from '../../../public/asset-art/investors/sources.json'

// Explicit person → portrait mapping. Entities remain labelled as entities.
const people = {
  tepper: 'David Tepper', ackman: 'Bill Ackman', berkshire: 'Warren Buffett',
  'cathie-wood': 'Cathie Wood', thiel: 'Peter Thiel', druckenmiller: 'Stanley Druckenmiller',
  loeb: 'Daniel Loeb', aschenbrenner: 'Leopold Aschenbrenner', 'li-lu': 'Li Lu',
  'gates-trust': 'Bill Gates', klarman: 'Seth Klarman',
  'terry-smith': 'Terry Smith', pabrai: 'Mohnish Pabrai', hohn: 'Christopher Hohn',
}
export const INVESTOR_PORTRAITS = Object.freeze(Object.fromEntries(Object.entries(people).map(([slug, person]) => [slug, { ...sources[slug], person }])))
export function investorPortrait(slug) {
  const portrait = INVESTOR_PORTRAITS[slug]
  if (!portrait?.file) throw new Error(`Aucun portrait vérifié pour cet investisseur : ${slug}.`)
  return portrait
}
