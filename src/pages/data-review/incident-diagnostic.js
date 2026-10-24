export const INCIDENT_LABELS = { collection: 'Collecte échouée', publication: 'Publication échouée', overdue: 'Collecte en retard', unobserved: 'Contrôle indisponible', freshness: 'Donnée à revérifier', conflict: 'Sources contradictoires', checks: 'Contrôle en échec', review: 'Source modifiée, à valider', history: 'Historique incomplet', anomaly: 'Valeur suspecte' }
export const incidentAction = kind => ({
  collection: 'Vérifier l’accès à la source et la lecture du document, puis relancer la collecte concernée.',
  publication: 'Vérifier l’enregistrement, le déploiement et la présence de la nouvelle donnée dans l’application.',
  overdue: 'Vérifier que la collecte programmée s’exécute encore, puis consulter sa dernière exécution.',
  unobserved: 'Rétablir le suivi avant de conclure que les données sont à jour.',
  freshness: 'Comparer la période disponible dans la source avec celle conservée dans l’application.',
  conflict: 'Comparer les sources pour la même part, devise et période avant de retenir une valeur.',
  checks: 'Réparer le contrôle signalé puis vérifier séparément l’état de la publication.',
  review: 'Comparer le document officiel actuel à la version précédemment validée.',
  history: 'Vérifier les périodes manquantes ou invalides dans la source, puis réparer et relancer la collecte sans interpoler les valeurs.',
  anomaly: 'Vérifier la part, l’unité, la devise et la période avant d’accepter la nouvelle valeur.',
}[kind] ?? 'Examiner la source et le journal de collecte.')
export const incidentSuccessAt = row => Object.hasOwn(row, 'lastSuccessAt') ? row.lastSuccessAt : row.checkedAt
export function incidentDiagnostic(row, monitor) {
  const text = value => value == null || value === '' ? 'Non documenté' : String(value)
  return [
    `Diagnostic Épargnant Libre · ${INCIDENT_LABELS[row.kind] ?? row.kind}`,
    `Incident : ${text(row.id)}`, `Actif / collecte : ${text(row.name)}`, `Identifiant : ${text(row.dataId)}`,
    `Champ : ${text(row.field)}`, `Cause : ${text(row.cause)}`,
    `Outils : ${(row.tools ?? []).join(', ') || 'Raccordement non documenté'}`,
    `Détecté depuis : ${text(row.firstSeenAt)}`, `Dernier contrôle du suivi : ${text(monitor?.checkedAt)}`,
    `Dernier contrôle de collecte réussi : ${text(incidentSuccessAt(row))}`,
    `Dernière tentative de collecte : ${text(row.attemptedAt)}`,
    `Période de la donnée conservée : ${text(row.asOf)}`,
    `Devise : ${text(row.currency)}`, `Méthode : ${text(row.method)}`,
    `Sources : ${(row.sourceUrls ?? []).join(' ; ') || 'Non documentées'}`,
    `Exécution : ${text(row.runUrl)}`, `Action : ${incidentAction(row.kind)}`,
    'Conserver les dernières valeurs validées et leurs dates. Vérifier ensuite le résultat dans les outils concernés.',
  ].join('\n')
}
