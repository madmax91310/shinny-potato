// A control of another characteristic cannot renew a fee. This pure adapter is
// evaluated before light-registry serialization; it has no raw-registry imports.
export function buildFeeFieldEvidence(record, reference = {}, options = {}) {
  const proof = record?.characteristicChecks?.terPct;
  return {
    ...reference,
    sourceUrls: proof ? [proof.sourceUrl].filter(Boolean) : [record?.sourceUrl, options.primarySourceUrl, ...(reference.sourceUrls ?? [])].filter(Boolean),
    ...(proof ? {
      observationAsOf: proof.asOf ?? null, sourceAsOf: proof.sourceAsOf ?? proof.asOf ?? null,
      controlMethod: proof.controlMethod ?? null,
      ...(proof.observationEvidence ? { observationEvidence: proof.observationEvidence } : {}),
      ...(proof.sha256 ? { sha256: proof.sha256 } : {}),
      referenceSourceUrls: [...(reference.sourceUrls ?? []), options.primarySourceUrl].filter(Boolean),
      sourceStatus: proof.sourceUrl ? 'documented' : 'unknown',
    } : {}),
    checkedAt: proof ? (proof.sourceUrl ? proof.checkedAt ?? null : null) : record?.characteristics?.checkedAt ?? options.legacyCheckedAt ?? reference.checkedAt,
    // Neither the value's observation nor its control is a published effective date.
    asOf: null, dateStatus: 'not-published', method: options.method ?? null,
    note: options.note ?? 'Frais observés au contrôle ; aucune date d’entrée en vigueur déduite de la consultation.',
  };
}
