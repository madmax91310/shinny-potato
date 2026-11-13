# Historiques et performances — bilan consolidé du 13 novembre 2026

Même suivi [#881](https://github.com/madmax91310/shinny-potato/issues/881#issuecomment-6776720896), mêmes matrices, aucune extension de catalogue. État public vérifié **2026-11-13T18:19:14.309138+00:00**, CODE **d715820a698c92bde94480e5c47056863f21d6b0**, DATA **ff7aa255e53d9d29687896050b629d4e4ee23af7**. Les 111 entrées communes sont reliées à leurs octets publics ; cette liaison ne certifie pas indépendamment chaque champ financier. Les anciens rapports sont conservés dans l’historique de la branche de rapports (état du matin : e7da7bc0b5d162954e8dbd1605d1a2eeefb29f88).

#1251/#1254, les 73 fenêtres utilisables, Bitwise Paris et les correctifs antérieurs sont préservés. PR1255 et les autres travaux concurrents relus ; #1253 S&P reste draft fournisseur, #1222 Radar et #1061 encours laissées à leur propriétaire. Aucun ancien outil restauré, aucun Radar réactivé, aucune modification de maquette ou publication sur X.

## Ce qui a été corrigé et ce qui a été prouvé

La panne mensuelle du cron43447157146 était située **avant l’acquisition** : un test dit isolé appelait Yahoo à travers le contrôle des unités anniversaires et recevait429. #1260 conserve ce vrai contrôle avec une réponse source originale hachée et vérifie l’URL exacte ; aucun appel réseau n’est nécessaire au test. La collecte financière de production reste inchangée. Son exécution ordinaire postcorrective et son état individuel figurent dans la preuve de chaîne, sans transformer un lancement sur push en cron.

Le cron **43454784772**, contrairement aux push précédents, est une exécution planifiée réellement observée :704 contrôles source réussis, plus la dérivation séparée de l’or. Pour Nasdaq100 : FRED NASDAQXNDX **34587,76 points**, **12Nov2026**, **USD Total Return**, contrôle13Nov15:41:07, résultat`unchanged-verified` avec`sourceAttempted=true`. Enregistrement7e3877a4 puis publication ; texte, valeur, aperçu/PNG simple et comparatif vérifiés à 1440 et 390 px. La nouvelle preuve de contrôle ne déplace pas la date du12Nov. [Rapport individuel](preuve-cron-anniversary-observation.json), [simple](preuve-Nasdaq-public-simple.json), [comparatif](preuve-Nasdaq-public-comparatif.json).

| Outil / voie | Disponibilité et actualisation | Restriction conservée |
|---|---|---|
| Il y a X ans, Nasdaq100 simple et comparatif | Chaîne ordinaire planifiée observée jusqu’aux valeurs publiques et PNG ; convention TR/USD conservée | Ce cours quotidien ne qualifie pas à lui seul une nouvelle période mensuelle |
| Performance depuis ; Et si tu avais investi ; Qui a gagné comparaison/classement | Historiques qualifiés, périodes communes, unités et conversions préservés ; dernière période mensuelle attendue close :octobre2026 | Chaque route possède ses propres profondeurs et exclusions ; série annuelle insuffisante pour le mensuel |
| DCA, générateur manuel/automatique et Duels | Utilisation des mêmes séries selon critères d’admission, rôle et fenêtre commune existants | Pas d’activation massive ; aucune concaténation automatique de cours/NAV/TR |
| Bitwise Paris DE000A27Z304 | Voie EUR indépendante opérationnelle dèsjuin2021 ;2023/2024 préservés. Contrôle quotidien planifié de la voie Paris individualisé dans le rapport anniversaire | Ancienne Xetra historique toujours défaillante ; ce n’est pas une absence générale de voie utilisable |
| WTI, Wheat, NGAS et autres matières premières | Voies historiques conservées ; derniers résultats ordinaires et dates dans la matrice / preuve de chaîne | Une période déjà disponible n’est pas une nouvelle acquisition ; les limites de continuité restent ciblées |
| Palladium | NAV2025 indépendante et cotation2014 préservées sur leurs périmètres propres | NAV décembre2014 non qualifiée ; cotation IPDM.L2025 refusée. Aucun raccord silencieux entre ces deux séries |

## Six refus conservés, sans déplacer les73 fenêtres qualifiées

Le dénominateur79 est l’ancien groupe litigieux, pas tout le catalogue. **73 utilisables, 6 refus, 0 nouvelle admission historique dans ce lot**. Les77 anciennes divergences et2résidus restent suivis séparément : une NAV indépendante ne les explique pas automatiquement.

| Part exacte | Fenêtre | Pièce toujours nécessaire |
|---|---|---|
| FR0013411998 | 2024-12 → 2025-12 | Confirmation explicite des flux/absence de coupons et opérations de la part exacte sur toute2025, ou signification qualifiée des cellules vides du semestriel. L’accessibilité d’un rapport couvrant décembre est maintenant démontrée, sans prouver zérodistribution. |
| FR0013412004 | 2024-12 → 2025-12 | Confirmation explicite des flux/absence de coupons et opérations de la part exacte sur toute2025, ou signification qualifiée des cellules vides du semestriel. L’accessibilité d’un rapport couvrant décembre est maintenant démontrée, sans prouver zérodistribution. |
| FR0010755611 | 2020-12 → 2021-12 | NAV et courbe ajustée déjà acquises. Couverture intégrale des distributions/opérations/réinvestissement2021 et2024 non démontrée. API officielle8nov : DISTRIBUTION_POLICY = Capitalisation and/or distribution ; Acc ne prouve pas zéro distribution. |
| FR0010755611 | 2023-12 → 2024-12 | NAV et courbe ajustée déjà acquises. Couverture intégrale des distributions/opérations/réinvestissement2021 et2024 non démontrée. API officielle8nov : DISTRIBUTION_POLICY = Capitalisation and/or distribution ; Acc ne prouve pas zéro distribution. |
| DE000A27Z304 | 2020-12 → 2021-12 | Bornes quotidiennes exactes EUR/Xetra, unités et continuité. NAVUSD16hCET et EURclôture restent distincts. Le contrôle Xetra10nov livre0ligne sur décembre2020–décembre2021 et un historique récent limité ; voie Xetra historique non réparée ; Paris2023/2024 qualifié indépendamment et préservé. |
| DE000A0H08P6 | 2018-12 → 2019-12 | Reconstruction NAV+cash et bornes homogènes : résidu −0.0095831184point (38.2409679375% contre38.2505510559%). Distributions avril/juillet et bornes de fin d’année compatibles encore à corroborer ; seuil inchangé. |

Nouvelles pièces réellement recherchées : trois KID Amundi exacts obtenus13Nov, confirmant une politique de capitalisation **ou distribution à la discrétion** du gestionnaire, donc aucune preuve de zéro coupon. Bitwise : lancement NAV officiel8juin2020 ; le`firstTradeDate`Yahoo n’est pas une date de création. Nouvelle route officielle déclarée par le JavaScript de l’émetteur,`/etc_info.json`, effectivement obtenue : elle porte9février2023 et des plages/perfs, pas un historique quotidien2020/2021. Son HTTP200 ne la rend ni actuelle ni admissible. [KID](preuves-Amundi-KID-13nov.json), [route Bitwise](preuve-Bitwise-endpoint-natif-ancien.json), [contenu daté](preuve-Bitwise-contenu-endpoint-ancien.json).

[774routes historiques](historiques-performances-2026-11-12.csv), [qualification79](windows79-requalified.json), [six fenêtres détaillées](six-fenetres-restantes-2026-11-12.csv), [alternatives indépendantes et capacités réelles](routes-restreintes-alternatives-qualifiees.json). Parmi29anciennes routes comportant des restrictions,18possèdent une alternative qualifiée pour chacun des intervalles adjacents refusés étudiés ; cela n’autorise ni une convention implicite ni la création d’une longue série en concaténant les voies. Les limites de lancement/profondeur ne sont pas des pannes.

## Réconciliation et limites des preuves

Les **1218 identités initiales** restent toutes présentes, sans remplacement de leurs identifiants : 1186 qualifications initiales,25 traces de rapports/artefacts,5 incidents de collecte et2 contrôles. Cycle final : **{"résolu sur preuve": 2, "qualification": 1186, "actif": 5, "historique": 25}**. La présence dans le registre courant et celle dans l’export public sont renseignées séparément. Les nouveaux incidents apparus ensuite restent dans la même liste de causes, hors de ce dénominateur initial.

Les résultats individuels actuels, leur liste exacte de champs et leur périmètre déclaré sont associés aux qualifications anciennes lorsque leur identité correspond. Cela apporte une preuve actuelle, **jamais un périmètre tenté ou un succès rétroactif** pour un ancien rapport incomplet. Les25 traces historiques, dont les deux anciens périmètres inconnus, ne deviennent pas des données réparées. Les qualifications peuvent être financières ou documentaires : elles ne sont ni toutes des pannes, ni toutes de simples formalités.

Réconciliation exploitable : [1218 identités](reconciliation-incidents-2026-11-13.csv), [causes et nouveaux incidents](reconciliation-causes-source-2026-11-13.json), [dénominateurs](reconciliation-perimetres-2026-11-13.json), [moniteur actuel](preuve-moniteur-financier-courant.json), [parcours et export public](preuve-boite-publique-finale.json). Les encours et autres familles hors priorité restent tracés, sans réparation revendiquée.

Contrôles CI requis, commits fusionnés, événements des producteurs, enregistrements et publications : [preuves CI](preuves-CI-correctifs-fusionnes.json), [chaînes réellement observées](preuves-fusions-collectes-et-publication.json), [entrées publiques](preuve-publication-courante.json). Les recettes ne valent pas réparation d’une source. Les photos partielles et les causes fournisseurs persistent dans les diagnostics ; aucune baisse de seuil.


## Chaînes ordinaires postcorrectives réellement enregistrées et publiées

| Run | Déclenchement réel | Enregistrement | Publication vérifiée UTC |
|---|---|---|---|
| 43467518507 | push | e744ac20 | 2026-11-13T17:48:16.648Z |
| 43475036962 | workflow_dispatch | 1f845e78 | 2026-11-13T18:05:38.012Z |
| 43475043183 | workflow_dispatch | 92ef010a | 2026-11-13T18:08:18.762Z |
| 43479483363 | push | ff7aa255 | 2026-11-13T18:18:56.839Z |

Les quatre acquisitions, validations, enregistrements et publications ont réussi. L’état global peut rester en échec pour une branche fournisseur individuelle conservée : Xetra pour le mensuel, erreurs primaires/qualifications pour les ETF, Uranium pour les livres. Les limites ne sont jamais clôturées par le seul succès du publisher.

La course ETF/INSEE réellement observée a été rejouée en isolation ; la branche conditionnelle de rebase des expositions a ses tests de propriété stricts. Les dernières chaînes ordinaires sont publiées, mais aucune course n’a été provoquée en production pour certifier ces branches conditionnelles après fusion. Les codes producteurs incluent #1263 ; les octets du client réutilisé restent identifiés par le CODE public, distinct du DATA.

Prochaines observations **nominales**, non réussites anticipées : 14NovUTC, LifeStrategy05:35, indices06:40, reprise mensuelle06:45, ETF07:10, Nasdaq07:40, expositions07:45, livres07:50 ; production mensuelle complète16Nov06:15. Les crons Nasdaq/compositions du13Nov déjà observés sont conservés comme preuves datées séparées. Le push après la qualification cash ne devient pas un cron.

## Propagation du moniteur encore en file

Dernier moniteur public contrôlé :13Nov18:21:09UTC ; son état du producteur de livres précède la dernière collecte effectivement publiée. L’observateur43479256343 est en cours ;43479683156 et43481467099 sont en attente. Le dernier a été déclenché par la fin de la collecte13Nov18:19:10. La résolution financière est prouvée par les observations/commits/octets publics et recettes, mais la propagation de ce dernier état dans « Données à revoir » reste **à observer**. Aucun incident n’est masqué, aucune relance destinée au seul voyant vert : [preuve de file](preuve-propagation-moniteur-en-attente.json).
