// Keep only fields consumed by review deadlines, filters and source links.
// Full evidence remains in the searchable catalog and its per-record files.
export function projectReviewCatalog(catalog) {
  return catalog.map(({ id, name, type, aliases, consumers, fields }) => ({
    id, name, type, aliases, consumers: consumers.map(({tool}) => ({tool})),
    fields: fields.map(({ label, registry, qualificationMissing, metadata, value }) => ({
      label, registry, qualificationMissing,
      metadata: Object.fromEntries(['checkedAt','modifiedAt','asOf','dateStatus','sourceStatus','sourceUrls'].filter(key => key in metadata).map(key => [key, metadata[key]])),
      ...(value?.points ? { value: { points: value.points.map(p => ({ date: p.date })).filter(p => /^\d{4}-\d{2}$/.test(p.date)).sort((a,b) => a.date.localeCompare(b.date)).slice(-1) } } : {}),
    })),
  }))
}
