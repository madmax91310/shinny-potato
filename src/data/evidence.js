// Contrat commun de provenance. Les inconnues restent null ; une consultation n’est pas une photographie.
export const EVIDENCE_FIELDS = ['sourceUrls', 'asOf', 'checkedAt', 'currency', 'scope', 'method', 'note'];
export function normalizeEvidence(input = {}) {
  const sourceUrls = [...new Set([...(input.sourceUrls ?? []), input.url, input.sourceUrl,
    typeof input.source === 'string' ? input.source : input.source?.url, input.corroboratingUrl].filter(Boolean))];
  for (const url of sourceUrls) if (!/^https:\/\//.test(url)) throw new Error(`URL de source invalide : ${url}`);
  for (const field of ['asOf', 'checkedAt']) {
    if (input[field] != null && !/^\d{4}-\d{2}-\d{2}$/.test(input[field])) throw new Error(`Date ${field} invalide : ${input[field]}`);
  }
  return Object.freeze({ sourceUrls: Object.freeze(sourceUrls), asOf: input.asOf ?? null,
    checkedAt: input.checkedAt ?? null, currency: input.currency ?? null,
    scope: input.scope ?? 'Périmètre non documenté', method: input.method ?? null, note: input.note ?? null });
}
