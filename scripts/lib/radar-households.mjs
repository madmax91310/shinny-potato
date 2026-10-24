import { HOUSEHOLD_STATISTICS } from '../../src/data/household-statistics.js'
const definitions = new Map(HOUSEHOLD_STATISTICS.map(row => [row.id, row]))
// Reuse the qualified shared definitions; never edit live financial registers.
export function householdMetadata(id, evidence) {
  const definition = definitions.get(id)
  if (!definition) return {}
  const salary = id.startsWith('salary-')
  return { label: salary ? id === 'salary-median' ? 'Salaire médian du privé' : 'Seuil des 10 % des salariés du privé les mieux payés' : definition.title,
    unit: salary ? '€ nets par mois' : definition.unit === 'EUR' ? '€' : definition.unit,
    publishedAt: evidence.publishedAt ?? null, publicationId: evidence.sourceUrl,
    population: evidence.population, populationScope: definition.scope ?? definition.metadata.scope,
    referencePeriod: evidence.referencePeriod ?? String(evidence.year),
    evidence: { sourceHash: evidence.sha256, excerpt: evidence.table, method: definition.note },
    topic: salary ? 'salaires' : definition.category,
    angle: salary ? 'Comparer le salaire médian et le seuil des 10 % : deux repères en équivalent temps plein, nets de cotisations et avant impôt sur le revenu.' : `${definition.metricLabel}. ${definition.note}`,
    reason: salary ? 'Un repère pour situer son salaire, sans confondre médiane et moyenne ni EQTP et temps partiel.' : `${definition.metricLabel}. ${definition.note}` }
}
export function migrateHouseholdEvents(events, observations) {
  for (const event of events) {
    if (event.family !== 'economie' || event.field !== 'value') continue
    const row = observations.find(row => row.family === event.family && row.entity === event.entity && row.period === event.period && row.sourceUrl === event.sourceUrl)
    if (!row?.evidence) continue
    const legacy = !event.unit || !event.evidence
    const fields = ['label', 'unit', 'publishedAt', 'publicationId', 'population', 'populationScope', 'referencePeriod', 'evidence', 'topic', 'angle', 'reason']
    for (const key of fields) event[key] = row[key]
    const format = value => typeof value === 'number' ? `${value.toLocaleString('fr-FR')} ${row.unit}` : value
    event.beforeText = event.before === null ? 'Pas encore suivi' : format(event.before)
    event.afterText = format(event.after)
    if (legacy) {
      event.migratedEditorial = true
      event.draft = `${row.label} : ${event.afterText} · ${event.period}\n\n${row.populationScope}\n${row.reason}\n\n${event.beforePeriod ? `${event.beforePeriod} : ${event.beforeText}. Comparaison en euros courants, sans mesure du pouvoir d’achat.\n` : ''}Source : ${event.sourceUrl} · publication : ${event.publishedAt}`
    }
  }
}
