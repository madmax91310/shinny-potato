# Données à revoir — situations actuelles et réserves historiques

Capture publique du 2 novembre 2026, 05:48 UTC. Base master `9eee74c43926ef2af6f454cc376491020ec9e1db`. Le code public est `28745bf`, les données publiques `9eee74c`, construction à 05:45:52 UTC. Les quatre lecteurs/projections examinés sont identiques entre code livré et master : il s’agit bien d’un défaut livré, pas d’un correctif déjà en attente de publication. Empreintes dans `preuves/code-comparison.json`.

Le moniteur réellement reçu est daté 05:46:19 UTC, valide au relevé. Son transport correspond exactement au blob Git `c9be659d2dc2563ba3d881d543751783c030e274`, commit `3c5808c30409d7c74efdb6bd746b9536eaeb39b5` de la branche automation-status. Le contrôle indépendant GitHub et les documents réellement chargés sont relevés dans `preuves/browser-before.json`. Les empreintes de l’inventaire complet (44 085 467 octets) et du transport sont conservées ; projection et manifeste concordent.

## Comparaison sur les mêmes données

Les nombres suivants proviennent du rejeu de cette capture, jamais d’un ancien bilan. Un point distingue instrument/champ, période, convention, étape et état. Les inconnues restent séparées ; une échéance et une tentative échouée conservent deux diagnostics. Les contrats d’outils utilisant le même champ peuvent produire plusieurs signalements pour un point de consommation.

| Catégorie | Avant | Après |
| --- | ---: | ---: |
| Incidents opérationnels | 48, avec échéances mélangées | 46 |
| Données/raccordements manquants | 30, après rapprochements trop larges | 175 |
| Qualifications | 6 288, dont réserves historiques | 2 489 actuelles |
| Contrôles dus | mêlés aux pannes/revues | 11 |
| Archives et preuves historiques à qualifier | mêlées aux qualifications/sans objet | 4 294 |
| Supervision à vérifier | 496 | 496 |
| Revue documentaire actuelle | 832, avec calendrier futur | 28 |
| Attentes normales | 18 | 818 |
| Retraits et sans objet | 431, avec archives | 430 |
| Résolutions prouvées | 850 | 850 |
| Points répertoriés | 8 993 | 9 637 |
| Signalements conservés | **13 541** | **13 541** |

La vue initiale passe de l’ambigu « 6 862 à traiter » à **717 points : 46 incidents, 175 données/raccordements manquants et 496 preuves de supervision à vérifier**. Les 2 489 qualifications et 11 contrôles dus restent nommés et directement sélectionnables. Aucun signalement supprimé, aucun champ financier modifié, aucune résolution nouvelle déclarée.

Les unités complémentaires sont **1 129 exécutions/tentatives GitHub identifiées**, **5 588 contrats consommateurs affectés ou à confirmer** sur 30 232 requis (1 293 bloqués, 1 008 qualifications et 3 287 cycles à confirmer) et **0 intervention commune démontrée** sur ce relevé. Zéro signifie que la preuve typée exigée manque, pas que les causes sont toutes indépendantes. Le test synthétique de même tentative/étape vérifie le cas positif du regroupement.

## Explication de toutes les baisses

La matrice par signalement, les identités de chaque séparation et les sept rapprochements sont dans `preuves/before-after.json`. Elle permet de vérifier les déplacements sans confondre signalements et points.

- Qualifications : 4 294 signalements anciennement rattachés à cette classe deviennent réserves historiques explicites ; les diagnostics de consommation/missing, d’attente et de retrait précédemment absorbés sont restitués dans leur classe. Les réserves ne sont pas résolues.
- Pannes : 21 signalements auparavant rattachés à une panne deviennent contrôles dus ; 7 deviennent données manquantes et 8 qualifications distinctes. Les 51 signalements d’échec réel restants portent 46 points. Le détail ne présente pas une échéance comme une tentative HTTP échouée.
- Revue documentaire : 797 signalements de calendrier futur deviennent attentes normales et 7 deviennent contrôles dus. Les 28 réserves/revues actuelles restent distinctes.
- Sans objet : trois archives passent dans leur catégorie ; deux signalements de retrait auparavant absorbés par une qualification retrouvent leur classe. Les résolutions prouvées restent exactement 850.
- Sept échéances du moniteur sont rapprochées du calendrier par identité canonique exacte et dimensions concordantes. Les 14 preuves restent présentes dans sept points. Aucun rapprochement fondé sur fournisseur ou message similaire.
- À l’inverse, 580 anciens points comportaient des signaux dont la période, convention, étape ou nature ne permettait pas le rapprochement. Leur séparation ajoute 651 points ; les sept rapprochements retirent sept doublons : **+644 points**, intégralement expliqués. Ce correctif augmente donc le total répertorié.

## Exemples et limites explicitement visibles

- Les deux encours iShares PEA datés du 15 octobre ont un contrôle en retard ; ce retard n’est pas une panne HTTP. Un éventuel incident d’accès conserve son signalement propre, sa source et son exécution. Aucun succès PDF ou local n’est transformé en réparation primaire.
- Le palladium garde un mois 2014-12 non rapproché, qui bloque les fenêtres le consommant : le suivi reste actuel malgré l’année ancienne.
- Sur les 79 enquêtes financières ouvertes, 38 ont une voie actuelle qualifiée sans fenêtre refusée dans le rapport et deviennent réserves historiques. Les 41 autres ont une fenêtre refusée : 32 disposent d’une autre fenêtre mensuelle qualifiée, 9 seulement d’une voie annuelle distincte. Leur impact reste partiel, avec le calcul mensuel refusé explicitement affiché. Aucun résidu ni rendement d’origine modifié.
- Les six réparations mensuelles ciblées déjà attestées restent reconnues. Les deux anciens conflits Bitwise conservés sans preuve exploitable passent en archive, sans clôture ; une réobservation réelle redevient panne. Les 138 variantes de mauvaises identités/conventions/périodes/dates/preuves sont refusées.
- Les outils d’un collecteur restent dans les preuves comme périmètre déclaré ; ils ne sont plus présentés collectivement comme affectés. Le lien par champ consommateur doit être démontré. La valeur chiffrée n’étant pas fournie dans certains rapports de supervision, l’écran le dit explicitement et conserve période, contrôle et lien vers la donnée ; aucune valeur n’est fabriquée.

## Vérification et reproduction

`node scripts/audit-review-situations.mjs` rejoue les entrées du lecteur et vérifie l’égalité exacte des 13 541 identifiants de signalements avant/après. `monitor-reader-input.json.gz` contient toutes les clés lues par ce réducteur ; les champs sans rapport avec ce lecteur ne sont pas recopiés. Le transport original complet reste vérifiable à l’URL immuable indiquée dans `monitor-origin.json`. Le ledger avant préserve chaque point, sa classe et ses signalements.

Tests : `test-review-inbox.mjs` (inclut situations et réparations ciblées), contexte de supervision, rapprochements financiers, 22 tests Python du moniteur, build et budgets inchangés, couverture publiée et manifeste. Recette Playwright 1440/390 : pagination exhaustive, recherche d’une archive depuis la vue initiale, accès direct à la catégorie, copie avec refus du presse-papiers, export filtré de 181 points, export complet indépendant des filtres, scopes/preuves, moniteur absent/invalide/périmé/indisponible, erreur isolée de document et projection désynchronisée. Recettes existantes consommateurs, retrait IA et reprises financières conservées.

Les documents moniteur/producteurs/couverture sont dans un détail explicitement nommé ; l’inventaire et les rapprochements expliquent leurs dénominateurs et leur recouvrement avec le centre. Les historiques, recherches, exports complets et preuves restent accessibles. Aucun plafond de lignes. La taille de projection est mesurée, jamais utilisée pour exclure une preuve. Les seuils de fraîcheur, contrats de collecte et circuits de publication sont inchangés.

## Coordination

Périmètre : interface/lecteur/compteurs de supervision, projection de revue et tests correspondants. PR #1061 (sources iShares) et #1042 (éditorial) préservées, ainsi que #1139 (image du générateur). Aucun collecteur, source, raccordement, garde financier, observation ou donnée financière inclus dans la différence. Les dérivations locales du build sont restaurées et ne sont pas enregistrées dans la PR. La publication utilise le portail normal de validation, sans assouplissement de ses contrôles.
