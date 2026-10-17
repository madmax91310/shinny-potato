// Calendrier validé le 17 octobre 2026. Les choix d’un même créneau alternent.
const slot = (path, note = '', title) => ({ path, note, ...(title ? { title } : {}) })
export const EDITORIAL_WEEK = [
  { day: 'Lundi', morning: [slot('/classements-performances')], evening: [slot('/comparatif-etf', '', 'Comparatif ETF / indices')] },
  { day: 'Mardi', morning: [slot('/calculateur-investissement')], evening: [slot('/le-dca-de', 'Le DCA de… / Allocation d’un abonné')] },
  { day: 'Mercredi', morning: [slot('/france-100-menages', 'En alternance'), slot('/pouvoir-achat', 'En alternance')], evening: [slot('/comparatif-courtiers')] },
  { day: 'Jeudi', morning: [slot('/classements-performances')], evening: [slot('/fiches-etf', 'En alternance'), slot('/tweets-factsheets', 'En alternance')] },
  { day: 'Vendredi', morning: [slot('/calculateur-investissement')], evening: [slot('/duels-portefeuilles', 'En alternance'), slot('/generateur-portefeuilles', 'Portefeuille expliqué · en alternance')] },
  { day: 'Samedi', morning: [], morningNote: 'Bilan hebdomadaire', evening: [slot('/performance-depuis', 'En alternance'), slot('/presentations', 'AV / SCPI · en alternance')] },
  { day: 'Dimanche', morning: [slot('/classements-performances', 'Facultatif'), slot('/fiches-pratiques', 'Alternative'), slot('/faits-marquants-marches', 'Alternative'), slot('/il-y-a-x-ans', 'Alternative')], evening: [slot('/portefeuilles-investisseurs')] },
]

export function publicationLabel(path) {
  return EDITORIAL_WEEK.flatMap(({ day, morning, evening }) =>
    [['matin · après le récap', morning], ['soir', evening]].flatMap(([period, entries]) =>
      entries.filter(entry => entry.path === path).map(entry =>
        `${day} ${period}${entry.note ? ` · ${entry.note.toLowerCase()}` : ''}`)))
    .join(' / ')
}
