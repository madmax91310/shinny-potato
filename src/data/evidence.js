// Contrat commun de provenance. Les inconnues restent null ; une consultation n’est pas une photographie.
export const EVIDENCE_FIELDS = ['sourceUrls', 'asOf', 'checkedAt', 'currency', 'scope', 'method', 'note', 'dateStatus', 'periodStart', 'periodEnd', 'sourceStatus', 'sourceReason', 'reviewedAt', 'modifiedAt'];
export function normalizeEvidence(input = {}) {
  const sourceUrls = [...new Set([...(input.sourceUrls ?? []), input.url, input.sourceUrl,
    typeof input.source === 'string' ? input.source : input.source?.url, input.corroboratingUrl].filter(Boolean))];
  for (const url of sourceUrls) if (!/^https:\/\//.test(url)) throw new Error(`URL de source invalide : ${url}`);
  for (const field of ['asOf', 'checkedAt', 'reviewedAt', 'modifiedAt']) {
    if (input[field] != null && !/^\d{4}-\d{2}-\d{2}$/.test(input[field])) throw new Error(`Date ${field} invalide : ${input[field]}`);
  }
  const dateStatus = input.dateStatus ?? (input.asOf ? 'dated' : 'unknown');
  if (!['dated', 'not-applicable', 'not-published', 'legacy-undated', 'month-only', 'unknown'].includes(dateStatus)) throw new Error(`Statut de date invalide : ${dateStatus}`);
  if ((dateStatus === 'dated') !== (input.asOf != null)) throw new Error('Statut de date incompatible avec asOf');
  for (const key of ['periodStart', 'periodEnd']) if (input[key] != null && !/^\d{4}-\d{2}(?:-\d{2})?$/.test(input[key])) throw new Error(`Période ${key} invalide`);
  const sourceStatus = input.sourceStatus ?? (sourceUrls.length ? 'documented' : 'unknown');
  if (!['documented', 'unknown', 'archive-unverifiable'].includes(sourceStatus)) throw new Error('Statut de source invalide');
  if (sourceStatus === 'documented' && !sourceUrls.length) throw new Error('Source documentée sans URL');
  if (sourceStatus === 'archive-unverifiable' && (!input.sourceReason?.trim() || !input.reviewedAt || input.checkedAt != null)) throw new Error('Archive non vérifiable : raison et revue requises, aucun contrôle certifié');
  return Object.freeze({ sourceUrls: Object.freeze(sourceUrls), asOf: input.asOf ?? null,
    checkedAt: input.checkedAt ?? null, currency: input.currency ?? null,
    scope: input.scope ?? 'Périmètre non documenté', method: input.method ?? null, note: input.note ?? null,
    dateStatus, periodStart: input.periodStart ?? null, periodEnd: input.periodEnd ?? null,
    sourceStatus, sourceReason: input.sourceReason ?? null, reviewedAt: input.reviewedAt ?? null, modifiedAt: input.modifiedAt ?? null });
}
