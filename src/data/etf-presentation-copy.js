import groups from './etf-presentation-copy.json' with { type: 'json' }

// Les parts qui suivent la même exposition peuvent partager leur rédaction.
// Les caractéristiques et observations restent rattachées à chaque ISIN.
export const REVIEWED_EXPOSURE_COPY = Object.fromEntries(
  groups.flatMap(([ids, copy]) => ids.map(id => [id, copy])),
)
