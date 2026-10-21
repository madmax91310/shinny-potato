// Calendrier validé le 20 octobre 2026 : un format par créneau, midi et soir.
// Les récaps du matin sont préparés en dehors de l’application.
const slot = (path, note = '', title) => ({ path, note, ...(title ? { title } : {}) })
export const EDITORIAL_WEEK = [
  { day: 'Lundi', midday: [slot('/performance-depuis')], evening: [slot('/tweets-factsheets', '', 'Coulisses des indices')] },
  { day: 'Mardi', midday: [slot('/calculateur-investissement')], evening: [slot('/le-dca-de', '', 'Le DCA d’un abonné')] },
  { day: 'Mercredi', midday: [slot('/classements-performances', '', 'Qui a vraiment gagné ?')], evening: [slot('/comparatif-courtiers')] },
  { day: 'Jeudi', midday: [slot('/classements-performances', '', 'Qui a vraiment gagné ?')], evening: [slot('/banque-tweets', '', 'Tweet de la banque')] },
  { day: 'Vendredi', midday: [slot('/fiches-etf')], evening: [], eveningNote: 'Réservé à ton tweet du vendredi' },
  { day: 'Samedi', midday: [], middayNote: 'Ton bilan de la semaine', evening: [], eveningNote: 'Quote de ton bilan' },
  { day: 'Dimanche', midday: [slot('/portefeuilles-investisseurs', '', 'Présentation d’un investisseur connu')], evening: [slot('/fiches-pratiques')] },
]

export function publicationLabel(path) {
  return EDITORIAL_WEEK.flatMap(({ day, midday, evening }) =>
    [['midi', midday], ['soir', evening]].flatMap(([period, entries]) =>
      entries.filter(entry => entry.path === path).map(entry =>
        `${day} ${period}${entry.note ? ` · ${entry.note.toLowerCase()}` : ''}`)))
    .join(' / ')
}
