export function projectReviewCatalog(catalog) {
  return catalog.map(record => ({ ...record, fields: record.fields.map(({ value, ...field }) => ({
    ...field,
    // Only the final monthly date affects the next review deadline.
    ...(value?.points ? { value: { points: value.points.map(p => ({ date: p.date })).filter(p => /^\d{4}-\d{2}$/.test(p.date)).sort((a,b) => a.date.localeCompare(b.date)).slice(-1) } } : {}),
  })) }))
}
