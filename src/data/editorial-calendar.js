// Calendrier validé le 1er novembre 2026. Les récaps restent hors application.
const slot = (path, note = '', title) => ({ path, note, ...(title && { title }) })
const recap = () => ({ morning: [], morningNote: 'Récap marché · hors application' })
const alternating = (...paths) => paths.map((path, index) => slot(path, `Une semaine sur deux · semaine ${index ? 'B' : 'A'}`))
export const EDITORIAL_WEEK = [
  { day: 'Lundi', ...recap(), midday: [slot('/performance-depuis')], evening: alternating('/tweets-factsheets', '/generateur-portefeuilles') },
  { day: 'Mardi', ...recap(), midday: [slot('/classements-performances')], evening: [{ ...slot('/le-dca-de', 'Au choix avec Le budget de…', 'Le DCA d’un abonné'), href: '/le-dca-de?mode=dca' }, slot('/le-budget-de', 'À la place du DCA · selon tes publications')], eveningNote: 'DCA ou budget : choisis un seul format selon tes publications. Le budget peut aussi passer le vendredi soir.' },
  { day: 'Mercredi', ...recap(), midday: [slot('/calculateur-investissement')], evening: alternating('/comparatif-courtiers', '/hey-grok') },
  { day: 'Jeudi', ...recap(), midday: [slot('/classements-performances')], evening: [{ ...slot('/banque-tweets', 'Dans la Banque de tweets', 'Guide'), href: '/banque-tweets?category=Guide%20ETF' }] },
  { day: 'Vendredi', ...recap(), midday: alternating('/fiches-etf', '/comparatif-etf'), evening: [slot('/le-budget-de', 'À la place de ton tweet personnel · selon tes publications')], eveningNote: 'Ton tweet personnel ou Le budget de… si tu ne l’as pas publié mardi.' },
  { day: 'Samedi', ...recap(), midday: [], middayNote: 'Ton bilan de la semaine', evening: [], eveningNote: 'Quote de ton bilan' },
  { day: 'Dimanche', morning: [{ ...slot('/banque-tweets', 'Dans la Banque de tweets', 'Question du dimanche'), href: '/banque-tweets?category=Question%20dimanche' }], midday: [slot('/portefeuilles-investisseurs')], evening: ['/fiches-pratiques', '/faits-marquants-marches', '/il-y-a-x-ans'].map(path => slot(path, 'En rotation · une fois sur trois')) },
]

export function publicationLabel(path) {
  return EDITORIAL_WEEK.flatMap(({ day, morning, midday, evening }) =>
    [['matin', morning], ['midi', midday], ['soir', evening]].flatMap(([period, entries]) =>
      entries.filter(entry => entry.path === path).map(entry =>
        `${day} ${period}${entry.note ? ` · ${entry.note.toLowerCase()}` : ''}`)))
    .join(' / ')
}
