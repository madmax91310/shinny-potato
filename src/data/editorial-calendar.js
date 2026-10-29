// Calendrier validé le 28 octobre 2026. Les récaps restent hors application.
const slot = (path, note = '', title) => ({ path, note, ...(title && { title }) })
const recap = () => ({ morning: [], morningNote: 'Récap marché · hors application' })
const alternating = (...paths) => paths.map((path, index) => slot(path, `Une semaine sur deux · semaine ${index ? 'B' : 'A'}`))
export const EDITORIAL_WEEK = [
  { day: 'Lundi', ...recap(), midday: [slot('/performance-depuis')], evening: alternating('/tweets-factsheets', '/generateur-portefeuilles') },
  { day: 'Mardi', ...recap(), midday: [slot('/classements-performances')], evening: [{ ...slot('/le-dca-de', '', 'Le DCA d’un abonné'), href: '/le-dca-de?mode=dca' }] },
  { day: 'Mercredi', ...recap(), midday: [slot('/calculateur-investissement')], evening: alternating('/comparatif-courtiers', '/hey-grok') },
  { day: 'Jeudi', ...recap(), midday: [slot('/classements-performances')], evening: [{ ...slot('/banque-tweets', 'Dans la Banque de tweets', 'Guide'), href: '/banque-tweets?category=Guide%20ETF' }] },
  { day: 'Vendredi', ...recap(), midday: [slot('/fiches-etf')], evening: [], eveningNote: 'Réservé à ton tweet du vendredi' },
  { day: 'Samedi', ...recap(), midday: [], middayNote: 'Ton bilan de la semaine', evening: [], eveningNote: 'Quote de ton bilan' },
  { day: 'Dimanche', morning: [slot('/il-y-a-x-ans')], midday: [slot('/portefeuilles-investisseurs')], evening: alternating('/fiches-pratiques', '/faits-marquants-marches') },
]

export function publicationLabel(path) {
  return EDITORIAL_WEEK.flatMap(({ day, morning, midday, evening }) =>
    [['matin', morning], ['midi', midday], ['soir', evening]].flatMap(([period, entries]) =>
      entries.filter(entry => entry.path === path).map(entry =>
        `${day} ${period}${entry.note ? ` · ${entry.note.toLowerCase()}` : ''}`)))
    .join(' / ')
}
