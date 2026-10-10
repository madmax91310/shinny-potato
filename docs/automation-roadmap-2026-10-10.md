# Roadmap automatisation — 10 octobre 2026

| Étape | Résultat | État |
|---|---|---|
| A1 — Dates | Observation, dernier contrôle réussi, modification réelle et publication séparés ; aucune date de modification inventée pour les anciennes données. | Fusionné dans la PR 435 ; tests réussis. La publication effective est vérifiée au niveau de l’action Pages ; un job vert avec publication ignorée ne compte pas. |
| A2 — Collecte et publication | Relance de la collecte complète ; validation UBS IE00BD4TXV59 et iShares Gold IE00B4ND3602 ; application des données et déploiement réussis. | Vérifié en production, run 38063055223. |
| A3 — Radar | Contrôles plus anciens rejetés ; retour contradictoire sur une même période mis en réserve ; doublons push/workflow_run sur le même commit évités pendant 15 minutes, tout en retentant les notifications. Les contrôles quotidiens, manuels et après erreur restent actifs. | Actif en production ; tests réussis. |
| A4 — Sources restantes | Sources officielles QYLD, Russell 1000 et conditions Placement-direct Vie réexaminées. Les collecteurs de qualification existants conservent les données validées. | Ouvert pour les champs sans preuve qualifiable. |
| A5 — ETF récents et découverte | Liste des parts récentes dérivée du registre de lancement ; seules les années closes, complètes après lancement et numériques comptent comme intégrées. Veille quotidienne des communiqués Vanguard et Global X Europe. | Actif et testé ; qualification des nouveaux produits avant intégration. |

## Vérification production

https://github.com/madmax91310/shinny-potato/actions/runs/38063055223

La collecte, la construction et le déploiement ont tous réussi après relance. La réussite réseau d’une collecte n’atteste pas que chaque champ absent est publié.

## Champs restant ouverts

- QYLD distribuante IE00BM8R0J59 : calendrier annuel et composition de la part exacte. Fiche officielle testée le 10 octobre : HTTP 404 ; document FundAssist : HTTP 500. La page européenne indique encore une performance USD Accumulating. Le communiqué de distribution QYLD du 24 septembre constitue une piste de document, pas un calendrier de performance annuelle totale.
- Russell 1000 : la fiche officielle au 30 septembre 2026 contient les dix noms et leurs secteurs, sans poids individuels. Les poids d’un ETF répliquant l’indice ne sont pas substitués.
- Assurance-vie : documentation Placement-direct Vie téléchargée et examinée ; aucune quote-part maximale actuelle chiffrée et aucun plafond unique qualifiés. Les clauses conditionnelles et les garanties restent distinctes de ces champs. Les autres lacunes restent détaillées dans automation-gaps.md.
- Courtiers : les douze périmètres non résolus gardent leur qualification prudente et la recherche bornée de documents officiels déjà automatisée. Aucune absence de preuve ne devient une gratuité ou une indisponibilité supposée.

## Suivi des calendriers

Douze parts exactes suivies quotidiennement : neuf premières années complètes disponibles au plus tôt en 2027, trois au plus tôt en 2028. Ce sont des échéances minimales, sans garantie de publication immédiate. La qualification d’un nouveau lancement ajoute sa part au registre de dates ; le suivi ne dépend plus d’une deuxième liste maintenue à la main.

## Validation

Tests des dates et du statut de publication ; audits de provenance, catalogue et données à revoir ; construction de l’application. Tests du radar et des notifications, seuils cumulés, retour contradictoire, contrôles anciens, déduplication, réessai après erreur, indépendance des newsrooms et exclusion des années de lancement incomplètes.

Contrôle courtiers du 10 octobre : onze périmètres relus, toujours partiels ou non établis ; source compte-titres Bourse Direct en HTTP 502. Aucun des douze champs ouverts n’a été promu sans preuve.
