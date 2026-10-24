# Responsabilités du suivi commun

Reprise du 24 octobre 2026, après #923. Le suivi de référence reste `suivi-consolide.csv` et ses vues. Les rapports historiques et les 79 comparaisons sont conservés. Portefeuilles IA reste hors périmètre supprimé.

- Branche `fix/shared-data-autonomy-20261024` : sources, collecteurs, contrats de résultats, fraîcheur, enregistrement, projections, publication, preuves des consommateurs. Les tests de panne restent isolés.
- Conversation « Données à revoir » : ingestion des contrats et interface des incidents. Aucun fichier d’interface `src/pages/data-review/` n’est modifié ici.
- Avant toute modification partagée : contrôler master, les PR ouvertes et les worktrees ; garder les origines du suivi. Au départ, seule #903 est ouverte (banque de tweets), son fichier éditorial n’est pas touché.
- Fichiers communs à coordonner explicitement : `src/data/automation-workflows.json`, `scripts/build-monitoring-context.mjs`, `scripts/publish_automation_status.py`, `scripts/automation_monitoring.py`, le générateur et les vues du suivi. Aucun nouveau tableau financier concurrent.

Les limites d’une source restent du travail non résolu. Un résultat de collecte, sa publication et son usage sont trois preuves distinctes. Un retrait de périmètre ne répare pas une donnée.

Cette branche ajoute un contrat de lacunes nécessaires dans `scripts/required-data-gaps.mjs` et le branche à `fieldAlerts` dans le contexte serveur. Le calcul part des sources courantes ; aucune lecture d’un inventaire périmé n’est présentée comme contrôle source. Ces entrées sont des revues/qualifications, pas des pannes réseau. L’interface et le cycle de résolution des incidents restent propriété du chantier supervision.

Supervision #925 : voir `docs/data-operations-coordination.md` et `reports/data-review-product-2026-10-24/RAPPORT.md`. Master #924 intégré ; les lacunes nécessaires de `requiredDataGaps` et les preuves par champ/période sont conservées ensemble. Nouveau document consommateur compact généré après l’inventaire, contrôlé par empreinte publique ; aucun collecteur modifié par ce chantier. Contrats de résultats partagés dans `scripts/automation-report-contracts.json`.
À 15:49 UTC, PR #925 découverte sur `fix/data-review-product-20261024` (supervision, base initiale 216dd2b). Coordination déposée dans la PR : reprendre #924/master5606834, conserver ses contrats source et importer l’artefact or. Cette suite retire ses modifications locales supplémentaires à `build-monitoring-context.mjs` et `required-data-gaps.mjs` ; les versions déjà livrées par #924 restent intactes. Le chantier #925 possède leur ingestion et l’interface. Aucun changement concurrent des lecteurs/superviseurs n’est poursuivi ici.

Complément source coordonné dans #925 : les contrôles des clôtures anniversaire sont désormais persistés ; l’or projeté porte `derivedAt` et conserve le `checkedAt` Banque mondiale. Le contrat distingue `derived[]`, résultats réseau et attente normale XNDX. L’adaptateur supervision doit reconnaître `scope` sans transformer une projection/copie en réussite réseau. Le refus après changement du registre or demeure volontaire ; la reprise doit repartir de master.
