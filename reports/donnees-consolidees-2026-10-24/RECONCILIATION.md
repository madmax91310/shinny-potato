# Rapprochement avant modification — 24 octobre 2026

Référence examinée : master `7724bdc59156d971e9abd1fecf5f7d936e2c2878`. Site observé : code #908 `d9e55c1b`, données `7724bdc5`. Ce document précède les nouvelles corrections de fonctionnement. Les rapports datés de #887/#889/#898/#907/#908 restent des instantanés ; les descriptions de PR et les reçus de production complètent leur état.

## Déjà livré, à préserver

- #884 et raccordements ultérieurs ; #892/#895/#899/#900/#905/#906/#907, puis #898/#908 : inclus dans master. Les corrections de distributions WFNS/Amundi, voies NAV exactes, identifiants, minima historiques, comptabilité et maquettes ne sont pas réimplémentés.
- Les 90 comparaisons restent : 77 causes ouvertes, deux corrections avec résidu, dix corrections antérieures, une non comparable. 52 fenêtres de cotation contestées restent refusées, 27 cas sur NAV mensuelle indépendante. Aucune nouvelle égalité cours/NAV ni tolérance.
- #908 : stabilité DWS sémantique, quatre heures conservées ; 36 épisodes résolus normalement et 11 empreintes publiées dans radar-data. Pas de nouvelle modification de cette mécanique.
- Reprise mensuelle ordinaire 40056377824 : 13/13 HTTP429 réellement résolus, source/validation/enregistrement/publication réussis ; 333 mois TWD/BCE déjà publiés. Les anciens échecs sont archivés, pas présentés comme pannes courantes.
- Contrôle de revue éditoriale, publication concurrente, reprises ciblées, données statiques Dilemme et archive documentaire des 43 rapports : conservés.

## Reliquat identifié avant correction

| Axe | État réel | Suite |
|---|---|---|
| Collecte et actualisation | SWDA/CSPX ajustés au 23/10 absents dans les dernières preuves ; points du 22 conservés. | Rattrapage ordinaire ciblé après correction de stockage ; pas de collecte de tout l’univers. Un échec fournisseur reste un échec. |
| Fiabilité / stockage IA | Le workflow planifié 40062245637 échoue sur le certificat UBS. Reproduction hors réseau : l’hydratation Python écrase 21 séries en mémoire correctement certifiées par des fragments plus anciens. | Corriger hydratation et persistance, conserver les points, dates et preuves authentiques. Tester toutes les séries touchées ; aucune nouvelle preuve inventée. |
| Raccordements | Le calendrier NAV annuel Amundi manuel/Duels est déjà livré ; les autres usages ont leurs capacités et périodes propres. | Contrôler les usages concernés par le stockage et les incidents, sans extension du catalogue. |
| Supervision | 43 signaux dans la capture. L’incident SWDA mentionne encore le 22 malgré une série qualifiée au 22. Les erreurs IA sont attribuées à des outils ETF qui utilisent d’autres voies. | Synchroniser via le producteur, qualifier les impacts par chaîne ; distinguer panne fournisseur, défaut de stockage et défaut du tableau. Ne pas éditer le moniteur manuellement. |

Copper/WisdomTree, deux PEA non conclusifs, continuité juridique FR0007054358, sept preuves quotidiennes, compositions/identités et contrats non qualifiés : blocages conservés, sans répétition des mêmes essais 403 ni déclaration de résolution.

## Coordination des fichiers et PR

À cette capture, seule #903 reste ouverte (`codex/guide-etf-sectoriels-pea`) : elle modifie `src/pages/tweet-bank/data.js`. Ce fichier et ce guide sont hors de notre lot ; aucune fusion de cette PR n’est demandée ici. #908 est fusionnée ; sa branche de travail n’est plus présente sur le distant et aucun complément ouvert de ce lot n’est à fusionner. Les anciennes branches de qualification et sondes sont conservées ; absence de PR ouverte ne vaut pas autorisation de les écraser.

Une seule branche de continuation : `fix/suivi-donnees-consolide-20261024`. Périmètre réservé : stockage des séries IA, régressions correspondantes, contexte des incidents IA et suivi consolidé. Pas de retouche des collecteurs DWS/VanEck, calendriers financiers, seuils, textes ou données du guide #903. Vérification de master avant intégration et de toute nouvelle PR avant fusion.

Le suivi consolidé associera chaque entrée héritée à sa provenance, son axe, son état courant, son niveau de preuve et sa pièce manquante. Les défauts de données et de supervision seront séparés, avec un lien lorsqu’ils ont une cause commune. Les 8 600 lignes héritées et les 79 cas financiers seront réconciliés sans additionner leurs chevauchements comme de nouvelles pannes.

## Complément de coordination — #913

PR #913 apparue pendant la validation : reprise du catalogue IA côté interface. Ses fichiers App/lib/runtime/request-transport, projections et scénarios navigateur restent réservés à cette PR. Le seul fichier commun est `update-ai-portfolios.yml` : #913 ajoute deux appels de tests, ce lot sépare les contrôles ultérieurs et les déclare dans la supervision. Les hunks sont distincts ; conserver les deux séries de changements à l’intégration. La demande utilisateur enregistrée sur master `3f729f9b` est reprise intacte ; les recettes utilisent des livres isolés.
