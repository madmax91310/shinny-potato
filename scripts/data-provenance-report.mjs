import { DATA_CATALOG } from '../src/data/catalog.js';
import { INDEX_FACTS } from '../src/data/index-facts.js';
import { ARCHIVE_SOURCE_REVIEW } from '../src/data/archive-source-review.js';
import { FAMILIES } from '../src/data/index-comparisons.js';
import { SHEETS } from '../src/data/index-factsheets.js';
import { REVIEWED_PERFORMANCE_META } from '../src/data/instrument-performance-review.js';
import { getInstrumentAnnualPerformance } from '../src/data/instrument-returns.js';

// Les consommateurs sont définis au niveau de la fiche dans le catalogue.
// L'exclusion d'une archive doit donc être vérifiée sur la photographie exacte.
export function getDataProvenanceReport(catalog = DATA_CATALOG, families = FAMILIES, sheets = SHEETS) {
  const activeFacts = new Set([
    ...families.flatMap(f => f.indices.map(index => index.indexFacts)),
    ...sheets.map(sheet => sheet.indexFacts),
  ].filter(Boolean));
  const activeSourceGaps = [];
  const unverifiableArchives = [];
  const invalidArchives = [];
  for (const record of catalog) for (const field of record.fields) {
    const entry = { id: record.id, field };
    if (field.metadata.sourceStatus === 'archive-unverifiable') {
      const review = ARCHIVE_SOURCE_REVIEW.find(r => r.id === record.id && r.key
        && r.sourceStatus === 'archive-unverifiable' && INDEX_FACTS[r.id]?.[r.key] === field.value);
      const isActive = activeFacts.has(field.value);
      const validIndex = record.type === 'index' && field.registry === 'src/data/index-facts.js'
        && review && field.metadata.sourceReason === review.sourceReason
        && field.metadata.reviewedAt === review.reviewedAt && field.metadata.checkedAt === null
        && field.metadata.sourceUrls.length === 0 && !isActive;
      const performance = REVIEWED_PERFORMANCE_META[record.id];
      const hold = performance?.qualificationHold;
      const validPerformance = record.type === 'instrument' && field.registry === 'src/data/instrument-performance-review.js'
        && field.label === `Archive performance · ${field.value?.label}`
        && performance?.archivedObservations?.includes(field.value)
        && /^[a-f0-9]{64}$/.test(hold?.sha256 ?? '')
        && field.metadata.sourceReason === hold.reason
        && field.metadata.reviewedAt === hold.checkedAt.slice(0,10)
        && field.metadata.checkedAt === null
        && field.metadata.sourceUrls.includes(performance.source)
        && !isActive && !getInstrumentAnnualPerformance(record.id)?.observations?.includes(field.value);
      if (validIndex || validPerformance) unverifiableArchives.push({ ...entry, key: review?.key ?? field.value.label });
      else {
        invalidArchives.push(entry);
        // Un statut d'archive seul ne dispense jamais une donnée active de source.
        if (!field.metadata.sourceUrls.length) activeSourceGaps.push(entry);
      }
    } else if (!field.metadata.sourceUrls.length) activeSourceGaps.push(entry);
  }
  return { activeSourceGaps, unverifiableArchives, invalidArchives };
}

export function formatDataProvenanceReport(report) {
  return `Provenance : ${report.activeSourceGaps.length} manque actif de source ; ${report.unverifiableArchives.length} archives non recertifiables ; ${report.invalidArchives.length} classement d’archive invalide.`;
}
