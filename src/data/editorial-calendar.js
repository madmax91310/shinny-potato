import config from './editorial-calendar-config.json' with { type: 'json' }
// Shared raw calendar configuration; presentation and scheduling remain unchanged.
export const MIDDAY_SELECTIONS = config.middaySelections
export const EDITORIAL_WEEK = config.week.map(day => {
  const selections = MIDDAY_SELECTIONS[day.day] || []
  const midday = [...day.midday, ...selections.filter(choice => !day.midday.some(entry => entry.path === choice.path))]
  return {
    ...day,
    ...(day.day === 'Samedi' ? { middayPreferred: true } : {}),
    midday: [...midday.map(entry => {
      const choice = selections.find(item => item.path === entry.path)
      return choice ? { ...entry, ...choice, preferred: true } : entry
    }), { path: '/idees-classements', note: '' }],
  }
})

export function publicationLabel(path) {
  if (EDITORIAL_WEEK.every(day => day.midday.some(entry => entry.path === path))
    && EDITORIAL_WEEK.every(day => ![...day.morning, ...day.evening].some(entry => entry.path === path))) return 'Chaque midi'
  return EDITORIAL_WEEK.flatMap(({ day, morning, midday, evening }) =>
    [['matin', morning], ['midi', midday], ['soir', evening]].flatMap(([period, entries]) =>
      entries.filter(entry => entry.path === path).map(entry =>
        `${day} ${period}${entry.note ? ` · ${entry.note.toLowerCase()}` : ''}`)))
    .join(' / ')
}
