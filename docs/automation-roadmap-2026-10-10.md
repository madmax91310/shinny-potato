# Roadmap automatisation — 10 octobre 2026

| Étape | Résultat | État |
|---|---|---|
| A1 — Dates | Observation, dernier contrôle réussi, modification réelle et publication séparés ; aucune date de modification inventée pour les anciennes données. | Fusionné dans la PR 435 ; tests réussis. La publication effective est vérifiée au niveau de l’action Pages ; un job vert avec publication ignorée ne compte pas. |
| A2 — Collecte et publication | Relance de la collecte complète ; validation UBS IE00BD4TXV59 et iShares Gold IE00B4ND3602 ; application des données et déploiement réussis. | Vérifié en production, run 38063055223. |
| A3 — Radar | Contrôles plus anciens rejetés ; retour contradictoire sur une même période mis en réserve ; doublons push/workflow_run sur le même commit évités pendant 15 minutes, tout en retentant les notifications. Les contrôles quotidiens, manuels et après erreur restent actifs. | Actif en production ; tests réussis. |
| A4 — Sources restantes | Top dix trimestriel Russell 1000 récupéré dans le rapport officiel ESMA au 30 juin 2026, contrôlé et collecté automatiquement. Date indépendante de la fiche mensuelle. QYLD, six contrats AV et pistes courtiers réexaminés. | Poids trimestriels disponibles dans la Bibliothèque de données ; autres champs sans preuve qualifiable encore ouverts. |
| A5 — ETF récents et découverte | Liste des parts récentes dérivée du registre de lancement ; seules les années closes, complètes après lancement et numériques comptent comme intégrées. Veille quotidienne des communiqués Vanguard et Global X Europe. | Actif et testé ; qualification des nouveaux produits avant intégration. |

## Vérification production

https://github.com/madmax91310/shinny-potato/actions/runs/38063055223

La collecte, la construction et le déploiement ont tous réussi après relance. La réussite réseau d’une collecte n’atteste pas que chaque champ absent est publié.

## Champs restant ouverts

- QYLD distribuante IE00BM8R0J59 : calendrier annuel et composition de la part exacte. Fiche officielle testée le 10 octobre : HTTP 404 ; document FundAssist : HTTP 500. La page européenne indique encore une performance USD Accumulating. Le communiqué de distribution QYLD du 24 septembre constitue une piste de document, pas un calendrier de performance annuelle totale.
- Russell 1000 : la fiche mensuelle au 30 septembre 2026 ne chiffre pas les poids individuels. Le catalogue officiel Constituents and Weights propose toutefois le rapport ESMA du Russell 1000 exact (US1000), au 30 juin 2026 : 1 023 lignes, somme des poids imprimés 99,998 %. Le top dix est intégré séparément, avec date, empreinte et source ; il ne redonne pas une date de septembre à des poids de juin. Le collecteur quotidien retente cette URL trimestrielle, rejette une identité, une date, une ligne ou un total invalides et conserve le dernier relevé après erreur. Source : https://research.ftserussell.com/analytics/factsheets/Home/DownloadConstituentsWeights/?indexdetails=US1000 ; découverte : https://www.lseg.com/en/ftse-russell/index-resources/constituent-weights.
- Assurance-vie : documentation Placement-direct Vie téléchargée et examinée ; aucune quote-part maximale actuelle chiffrée et aucun plafond unique qualifiés. Les clauses conditionnelles et les garanties restent distinctes de ces champs. Les autres lacunes restent détaillées dans automation-gaps.md.
- Courtiers : les douze périmètres non résolus gardent leur qualification prudente et la recherche bornée de documents officiels déjà automatisée. Aucune absence de preuve ne devient une gratuité ou une indisponibilité supposée.

## Suivi des calendriers

Douze parts exactes suivies quotidiennement : neuf premières années complètes disponibles au plus tôt en 2027, trois au plus tôt en 2028. Ce sont des échéances minimales, sans garantie de publication immédiate. La qualification d’un nouveau lancement ajoute sa part au registre de dates ; le suivi ne dépend plus d’une deuxième liste maintenue à la main.

## Validation

Tests des dates et du statut de publication ; audits de provenance, catalogue et données à revoir ; construction de l’application. Tests du radar et des notifications, seuils cumulés, retour contradictoire, contrôles anciens, déduplication, réessai après erreur, indépendance des newsrooms et exclusion des années de lancement incomplètes.

Contrôle courtiers du 10 octobre : onze périmètres relus, toujours partiels ou non établis ; source compte-titres Bourse Direct en HTTP 502. Aucun des douze champs ouverts n’a été promu sans preuve.

Complément A4 : les six collecteurs de contrats AV ont réussi un nouveau contrôle sans écriture des données. Le rapport annuel officiel Global X publié pour l’exercice clos au 30 juin 2025 et le supplément QYLD ne qualifient ni un calendrier civil de la part distribuante ni son exposition économique actuelle. Les descriptions génériques de rémunération, droits de garde ou achats récurrents des courtiers ne suffisent pas à certifier une portée PEA/CTO différente. Les conditions d’Euro+ ne qualifient pas Placement-direct Vie.

## Reprise des points restants — contrôles réels du 10 octobre

### Historiques mensuels MSCI rétablis

ACWI IMI `664204 NETR USD` et World ex USA `991000 NETR USD` ont chacun été recollectés et validés sur 141 mois de janvier 2015 à septembre 2026. Les deux fréquences officielles, DAILY et END_OF_MONTH, concordent pour chaque dernière séance. Les points correspondent exactement aux historiques actifs : aucun rendement, proxy ni date de modification n’est remplacé artificiellement. La preuve de ce nouveau contrôle figure dans `scripts/source-snapshots/automation-recovery-2026-10-10.json`.

Le défaut observé est une page HTML `503 Service Temporarily Unavailable` livrée avec HTTP 200 et `application/json`. Le transport reconnaît seulement les pages explicites d’erreur temporaire et les retente au maximum trois fois pour les collecteurs génériques, cinq fois pour MSCI, avec attente progressive bornée. Une erreur persistante de transport MSCI déclenche une reprise par années civiles sur le même endpoint, le même indice, la même devise et la même variante. Chaque fenêtre et la série réunie sont contrôlées ; toute fenêtre manquante, identité erronée ou discordance quotidienne/mensuelle bloque le remplacement et conserve l’historique actif. Une erreur de validation ou un HTTP 403 ne déclenche pas cette reprise. Le workflow programme ces contrôles et les tests de transport.

### QYLD : vérification faite, quatre champs toujours bloqués

La page européenne actuelle identifie la part distribuante IE00BM8R0J59, mais sa section Performance History est intitulée USD Accumulating et son calendrier discret est vide. Les tables Reference Index restent contradictoires. La fiche historique renvoie HTTP 404 ; l’URL FundAssist redécouverte et sa variante avec un seul slash renvoient HTTP 500 après réessais. Le profil pédagogique officiel et la présentation de lancement du 22 novembre 2022 sont accessibles, mais aucun ne publie les années civiles complètes de la part distribuante. Le panier de substitution et l’exposition Nasdaq autonome ne sont pas certifiés comme composition économique exacte du fonds.

### Assurance-vie : six collecteurs contrôlés avec succès

Linxea Zen, Vie, Spirit 2, Avenir 2, Lucya Cardif et Placement-direct Vie ont tous réussi la collecte réelle sans modifier les observations actives. Les plafonds propres aux supports et la quote-part SwissLife restent ouverts lorsque la documentation ne les chiffre pas. Les offres Euro+ et les annonces génériques d’absence de plafond légal de l’assurance-vie ne qualifient pas les conditions contractuelles de ces fonds.

Ces réserves concernent des données non publiées ou non qualifiables, pas des branchements désactivés. Elles restent visibles dans l’inventaire et soumises aux contrôles quotidiens existants.

### Courtiers : contrôle réel terminé

Sept barèmes sur huit ont réussi ; Bourse Direct reste en HTTP 502 sur les domaines .fr/.com et les pages CTO/tarifs. Ses dernières valeurs sont conservées. Les douze champs partiels ou non établis gardent le même statut : cash CTO BoursoBank/Fortuneo/Crédit Agricole/Bourse Direct ; achats programmés PEA Fortuneo/IBKR ; PEA-PME IBKR/Trade Republic ; PEA Jeune IBKR ; frais de change régionaux Crédit Agricole ; portée PEA du change et de la garde Trade Republic. Aucune nouvelle clause officielle ne permet leur certification intégrale. Les résultats de collecte et périmètres exacts sont ajoutés à l’instantané de contrôle.


## Qualification supplémentaire des sources manquantes

Les deux plafonds de Linxea Zen sont désormais qualifiés comme **sans limite de montant** pour les souscriptions, versements complémentaires et programmés. La page exacte de chacun des fonds publie cette condition. Le collecteur la vérifie à chaque exécution et conserve la preuve (périmètre, URL, date de contrôle et empreinte HTML) ; un téléchargement ou une clause en échec conserve les observations précédentes. Une limite inconnue reste distincte d’une absence de limite explicitement publiée. L’inventaire retire ces deux faux manques et le tweet affiche la condition au lieu de demander confirmation d’un plafond.

Contrôle réel : les six collecteurs AV réussissent. Page source qualifiée : https://www.linxea.com/assurance-vie/linxea-zen/supports-disponibles-sur-linxea-zen/fonds-euro/ . Aucun rendement ni date de rendement n’est modifié par cette qualification.

QYLD IE00BM8R0J59 reste bloqué : le nouvel examen du HTML officiel et de ses données embarquées retrouve une performance USD Accumulating, un calendrier discret vide, deux tables de positions divergentes et un panier explicitement sans exposition économique résiduelle. La fiche historique répond encore HTTP 404. Le panier et la part capitalisante ne sont pas substitués à la part distribuante.

Contrôle courtiers complet : sept barèmes sur huit et 49 champs de profil recontrôlés ; aucun des douze périmètres non établis/partiels n’a gagné de preuve. Bourse Direct : HTTP 502 sur la brochure principale, le catalogue officiel et le domaine bourse-direct.fr ; l’ancien chemin bundles/prospect ne répond pas dans le délai. Les douze périmètres courtiers restent à qualifier ; aucune absence de mention ne devient une réponse négative. Les reprises automatiques et les dernières données qualifiées sont conservées.

Validation ciblée : neuf tests Python assurance-vie, tests des tweets et de l’inventaire des lacunes, audits de provenance et des preuves courtiers, build et lint réussis. Le parcours navigateur assurance-vie a réussi avec Chromium headless : sélection, édition, copie, réinitialisation, allocations et aperçu mobile. La CI GitHub complète reste requise avant fusion.
