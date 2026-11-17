// Calendar slots are static metadata; keep their growth outside every tool's code budget.
import week from './editorial-week.json' with {type:'json'};
export const EDITORIAL_WEEK = week;

export function publicationLabel(path) {
  if (EDITORIAL_WEEK.every(day => day.midday.some(e => e.path === path))
    && EDITORIAL_WEEK.every(day => ![...day.morning, ...day.evening].some(e => e.path === path))) return 'Chaque midi'
  return EDITORIAL_WEEK.flatMap(({ day, morning, midday, evening }) =>
    [['matin', morning], ['midi', midday], ['soir', evening]].flatMap(([period, entries]) =>
      entries.filter(e => e.path === path).map(e =>
        `${day} ${period}${e.note ? ` · ${e.note.toLowerCase()}` : ''}`)))
    .join(' / ')
}
