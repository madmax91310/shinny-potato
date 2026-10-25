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

## Reprise du 25 octobre

#936/#937/#938 sont fusionnées ; leurs contrôles et contrats sont préservés. #939 (Amundi, conservation des niveaux quotidiens, classement des lacunes de preuve) et #943 (cinq voies iShares, prix anniversaire distincts, qualification partielle) sont fusionnées. Le suivi reste celui de ce dossier. #940/#941/#942/#944 sont conservées ; #945, contrôlée à l’ouverture, touche les règles de reprises presse du Radar et son rapport, sans concurrence sur les historiques ou leurs registres.

Ce chantier possède les adaptateurs de source, historiques, horloges et preuves des consommateurs. L’interface et les cycles d’incidents restent au chantier « Données à revoir » : aucun fichier `src/pages/data-review/` ni mécanisme de résolution n’est modifié. L’adaptateur `scripts/history-alerts.mjs` transmet les restrictions financières explicitement issues des composants officiels ; un succès de collecte ne les répare pas. Le générateur de matrice regroupe les preuves au niveau du producteur, sans déduire les champs non déclarés ni compter chaque B comme panne.

Les versions remplacées des validations de notre PR sont annulées uniquement pour les événements `pull_request` de notre branche. Aucun run de production ni d’autre chantier n’est annulé. Les corrections de données, les voies indépendantes qualifiées, les compléments documentaires et les corrections de supervision restent distingués.

Contrôle public du 25 octobre : le signal `scope:update-publication-observations.yml:anniversary-observation.json` conserve le run 40110829062 malgré `scope.expectedIds/requestedIds` présents dans le rapport réel 40178244236. Rapprochement consigné dans le suivi ; il relève de l’ingestion/résolution des incidents, pas d’une nouvelle panne des huit valeurs NAV. Ne pas confondre ce cas avec les deux autres rapports de périmètre encore incomplets. Aucune modification du moteur d’ingestion n’est faite ici.
#946 traite l’enregistrement refusé après #945 et l’attribution précise des qualifications mensuelles (profil et périodes), en conservant les contrôles financiers et les outils annuels indépendants.

### Clôture du lot de reprise du 25 octobre
- #939 et #943 fusionnés : huit voies NAV qualifiées, dix fenêtres des 79 rétablies ; 42 restent refusées. Causes des 79 anciennes divergences conservées ouvertes.
- #946 fusionné en 52f59a8 : autorisation limitée aux quatre lecteurs Radar indépendants dans le garde mensuel ; 30 tests Git et CI verte. Collision post-correctif non provoquée en production.
- Reprise mensuelle ordinaire 40181551320 effectivement réussie et enregistrée en 0f44f94 avant #946 ; aucune nouvelle collecte massive relancée.
- #947 appartient au chantier Radar ; ses fichiers ne recoupent pas ce lot documentaire. Aucun mécanisme de supervision partagé modifié ici.
- Publication financière vérifiée, preuves publiques et périmètres mutualisés enregistrés. Les crons post-correctif non observés restent explicitement non démontrés.
