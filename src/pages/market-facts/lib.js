// Un récit : accroche, déroulement, fin. Pas de question ou de morale imposée.
// Les sources restent consultables dans les précisions de la fiche.

export function buildTweetText(fact) {
  if (typeof fact.text === 'string') return fact.text;
  const lines = [
    fact.hook,
    "",
    fact.context,
    "",
    ...(fact.twist ? [fact.twist, ""] : []),
    ...(fact.methodNote && !fact.methodInDetails ? ["", fact.methodNote] : []),
    ...(fact.question ? ["", fact.question] : []),
    "", "Pas un conseil financier.",
  ];
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Présentation locale de mesures, sans transformer une courbe en récit vécu.
// Les chiffres, bornes, devises et dates de contrôle restent ceux du registre partagé.
export function monthlyReference(fact, review) {
  const sourceUrls = review?.sourceUrls?.length
    ? review.sourceUrls : (fact.source.match(/https:\/\/\S+/g) || []);
  return {
    ...fact,
    kind: 'measured-reference',
    category: `Repère mensuel : ${fact.indices.join(' · ')}`,
    hook: fact.hook.replace(' C’est le passage de son historique mensuel qui retient mon attention.', ''),
    twist: null,
    question: null,
    methodInDetails: false,
    period: `${review?.periodStart || 'Début non précisé'} à ${review?.periodEnd || 'Fin non précisée'}`,
    reviewedAt: '2026-10-26',
    sources: sourceUrls.map((url, index) => ({
      url,
      title: index === 0 ? `Série source : ${fact.indices.join(' · ')}` : `Référence complémentaire : ${fact.indices.join(' · ')}`,
      organization: index === 0 ? fact.source.split(' · ')[0] : new URL(url).hostname,
      publishedAt: null,
      checkedAt: review?.checkedAt || null,
      facts: [index === 0 ? fact.fact : 'Référence conservée dans le dossier de contrôle du registre partagé.'],
    })),
    reserves: [
      fact.methodNote,
      'Mesure entre clôtures mensuelles : elle ne donne pas un creux quotidien et peut sous-estimer une baisse en cours de mois.',
      'Le retour à un niveau concerne cette série et ses conventions, pas la mise de chaque investisseur. Aucun récit humain ni cause de baisse ne sont déduits des cours.',
      'La date de relecture de la présentation ne remplace pas la date de contrôle de la série. Les données restent alimentées par le registre partagé.',
    ],
  };
}
