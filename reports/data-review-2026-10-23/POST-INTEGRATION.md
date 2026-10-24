# Contrôle après fusion et publication

Capture du 24 octobre 2026, avant fin du producteur mensuel 40041331581 et du complément #908. Les résultats définitifs de ces exécutions figurent dans la [description de #908](https://github.com/madmax91310/shinny-potato/pull/908). Cette capture ne prétend pas clôturer les dépendances externes.

#898 a été fusionnée normalement dans b96074bf le 23/10 à 23:44 UTC. La validation de production [40041331416](https://github.com/madmax91310/shinny-potato/actions/runs/40041331416) est entièrement réussie : build, Python, exposition, smoke, quatre partitions navigateur, quatre partitions de publications, déploiement et vérification de l’artefact public. `post-integration/live-build-info.json` identifie le code servi fab8f801 et les données e44f669b, descendants de la fusion. Les corrections concurrentes #905/#906 sont conservées. Le livre réel IA conserve le blob `d96ba15bb2607b7306a401b1b7b2ed744c8dfe37`.

Le suivi actualisé contient **8 600 lignes** ; ses **8 573 lignes précédentes**, y compris leurs états avant intervention, sont conservées. Les vingt-sept ajouts comprennent les nouveaux incidents et les vérifications après publication. Les 4 274 lignes de couverture ont été rapprochées des fichiers réellement servis. `bilan.json` reprend le résumé de cet inventaire publié, sans assimiler 110 raccordements à traiter à 110 pannes identiques. Les pièces comprimées conservent les instantanés utilisés.

## Fonctionnement vérifié sur le site public

La recette a téléchargé **15 vrais PNG** : fiches or, courtiers TR/IBKR, DCA, arrêt de Tudigo, secteurs S&P 500, Copper récent, calendrier annuel VL Copper et Nasdaq au 23/10. Les parcours en formats ordinateur/mobile passent sans simulation de source, ainsi que le téléchargement exact des 90 comparaisons financières et le refus des identifiants inconnus. Le manifeste donne taille et empreinte des fichiers obtenus. L’export Nasdaq et l’écran IA mobile sont joints.

Les séries SWDA et CSPX chargées depuis les routes publiques ont été recoupées avec le moteur : clôture du 22/10 utilisable, 23/10 refusé, aucune interpolation. L’écran IA publié explique l’échec CSPX et sa dernière clôture valide. Le livre est effectivement vide ; aucun classement ou portefeuille n’est inventé pour cette recette. Les recettes propriétaires à trois/quatre participants, antérieures et archivées, utilisent leur dossier isolé.

La première comparaison locale utilisait une référence antérieure aux dernières URL de preuve VanEck. Elle a été recalculée depuis les données déployées avant le contrôle complet. Le contrôle Nasdaq attend désormais que le texte asynchrone contienne exactement la date prévue avant export ; aucune assertion financière ni seuil n’a été retiré. Le journal final réussi est conservé.

## Incidents et attentes maintenus

| Cas | Preuve et état à cette capture | Conséquence |
|---|---|---|
| TWD | Le rapport individuel du producteur **de production** 40041331581 signale `crossFxFailed: true`, TWD rejeté : « Wrong H.10 daily-rates export ». BCE et les autres historiques réussissent ; révision de l’accès en cours. | Dernière série TWD qualifiée du 23/10 conservée, sans avancer son contrôle. Les données mensuelles déjà complètes restent utilisables selon leur contrat ; incident technique actif. |
| SWDA / CSPX, 23/10 | [40044984581](https://github.com/madmax91310/shinny-potato/actions/runs/40044984581) échoue pour les deux clôtures quotidiennes absentes ; BCE du 23 réussie. La collecte ordinaire 40043031088 échoue individuellement pour CSPX. | Derniers points du 22 conservés. Refus des calculs qui exigent le 23. L’ancien incident SWDA du 22 n’est pas confondu avec cette nouvelle séance. |
| Alternatives aux clôtures | Yahoo query1/query2, fenêtres datées et range=1mo : point quotidien du 23 vide. Les réponses hebdomadaires finissent par une observation au timestamp du dernier échange, insuffisante pour certifier une clôture quotidienne ajustée. Borsa Italiana indique une clôture SWDA 129,89 ; la page LSE charge les prix dynamiquement. | Aucun prix instantané, bar hebdomadaire, NAV ou autre part substitué à la série quotidienne ajustée. Une route alternative doit encore qualifier aussi ses conventions et opérations sur titres. |
| Encours WPEA/SPEA | Les pages FR officielles valident localement ISIN, EUR et encours du 22/10, mais [40045063700 sur macOS](https://github.com/madmax91310/shinny-potato/actions/runs/40045063700) confirme HTTP403 sur les routes officielles CH/FR. | Derniers encours du 15/10 conservés ; le document mensuel antérieur ne renouvelle pas leur contrôle quotidien. Aucune nouvelle branche macOS de production intégrée. |
| Bitwise DE000A27Z304 | Nouvelle contradiction d’encours au 23/10 : accepté 872 534 005,79 USD, proposition 871 207 918,97 USD. Pages EN/DE concordantes sur la proposition courante ; ancienne révision non attribuée faute de pièce datée suffisante. | Incident conservé ; aucun flux, NAV ou mouvement de marché déduit de la différence. |
| DWS | 11/11 documents recoupés dans GitHub à 23:04. Les 36 alertes restantes ont une nouvelle empreinte observée à 22:11 dans le radar : quatre heures encore non écoulées à cette capture. | Relecture indépendante distincte d’une clôture publiée ; délai non antidaté et historique conservé. |
| Fiches pratiques / présentations | Les tentatives sur entrées concurrentes ont refusé l’enregistrement. Reprises **40045211519** et **40045364366** : collecte, validation et enregistrement réussis, publication encore dans la file ordinaire. | La donnée or validée est déjà servie. Les anciens échecs ne disparaissent pas avant rapprochement par le moniteur. |

Le moniteur capturé à **00:37:09 UTC** contient **67 signaux** : 39 conflits, 14 contrôles échus, 13 collectes, une revue. Ce nombre comprend les doubles impacts conservés de quatre compositions WisdomTree et les anciens épisodes en attente du workflow complet. Il ne représente pas 67 fournisseurs distincts. L’inventaire publié distingue 30 compositions économiques d’indices manquantes, 26 connecteurs requis, 15 périmètres non qualifiés, deux conflits de champ et les attentes de publication. Les 24 réserves éditoriales et quatre contrôles non datés restent visibles. Les 747 échéances proches ne deviennent pas des pannes.

Les blocages détaillés dans `reprise/REPRISE.md` restent applicables : six portefeuilles WisdomTree, Copper quotidien, L&G/UBS/BNP, vingt identités dans quatorze fonds, deux statuts PEA inconnus/non conclusifs, conflit SSGA, pièces contractuelles et branches fournisseurs non qualifiées. Les 90 comparaisons originales restent **78 inexpliquées, une corrigée avec résidu WFNS, dix corrigées, une non comparable**. Leur affichage sûr ne constitue pas une résolution de leurs causes.

## Complément de rattrapage ordinaire

Le paramètre `assets` de `update-ai-portfolios.yml` transmet une liste d’identifiants exacts au collecteur existant. Les positions et références requises restent incluses. La valeur passe par une variable d’environnement et un argument shell cité ; le collecteur continue de refuser les identités absentes du registre. Aucun changement de convention, de qualification, de calendrier, de livre ou de gestion des échecs. Les 14 tests d’audit des workflows passent localement ; les résultats GitHub et le rattrapage ciblé après intégration sont à consulter dans #908.


## Rejeu TWD avec conservation de la réponse

[40046514558](https://github.com/madmax91310/shinny-potato/actions/runs/40046514558), collecteur réel Ubuntu : **TWD et BCE validés**, 333 mois. Les deux routes FRED expirent toujours ; Fed H.10 fournit les 1 312 261 octets d’empreinte `16f582fc5a1e502aad4cf69a7a132a9ada3094d9af5f13d66c8ce6ed464d47ad`, identiques au document indépendant déjà qualifié. Le contrôle commencé à 00:47 se termine à 00:50. Le rapport, le CSV brut et les registres sont archivés dans `post-integration/fx-40046514558.zip`.

Ce rejeu ne publie pas. Il démontre que le parseur inchangé fonctionne depuis Ubuntu quand il reçoit le document conforme. Le rejet de l’exécution ordinaire à 00:10 concernait l’en-tête du document reçu ; son corps n’avait pas été conservé, donc sa nature précise ne peut pas être attribuée rétrospectivement. Ne pas annoncer une route obsolète, une erreur de devise ou une page HTML sans ce corps. La production archive désormais chaque réponse brute et son empreinte, et garde URL, tentatives et empreinte après un rejet du parseur. Un nouveau producteur ordinaire reste nécessaire pour clôturer son incident technique.


## Cause précise du redémarrage de stabilité DWS

Les deux documents complets archivés de chaque fonds ont été comparés et leurs empreintes brutes vérifiées. Pour IE000L6ZMMC4, seule la valeur d’affichage `GlobalFoundries Inc` devient `GLOBALFOUNDRIES` (ISIN KYG393871085 inchangé). Pour IE00BGV5VN51, seul le nom `Procore Technologies Inc` devient `PROCORE TECHNOLOGIES INC` (US74275K1088 inchangé). Tous les autres champs des documents sont identiques, pas seulement leurs totaux. Les quatre sources et la comparaison sont conservées dans `post-integration/dws-financial-stability/`.

Le compteur reposait sur l’empreinte brute du document, donc ces libellés remettaient à zéro la stabilité de données financières et d’identités inchangées. Le contrôle dispose désormais d’une seconde empreinte versionnée qui conserve tout le document sauf le libellé d’une ligne portant un ISIN explicite à clé de contrôle valide. Les noms des lignes non identifiées restent inclus. Aucune identité n’est attribuée par nom. Dates, devises, ISIN, poids, valeurs de marché, pays, secteurs, classes et tout autre contenu restent contrôlés. Les empreintes brutes et les documents originaux sont toujours conservés.

Le délai de **quatre heures** reste inchangé. Un changement financier, d’identité ou un échec de contrôle interrompt toujours la stabilité. Les preuves trop anciennes, rejouées, partielles ou incompatibles restent refusées. La migration ne récupère un ancien compteur sans seconde empreinte que si le document brut entier est identique ; aucune date n’est antidatée. Les huit tests Python et les régressions Node couvrent noms seuls, données financières, identités inconnues, interruption, migration et preuves invalides. Les 36 alertes restent ouvertes à cette capture ; leur clôture doit être constatée dans le producteur ordinaire après le délai, pas déduite des tests.


## Intégration des corrections concurrentes #907

Master 22742a15, incluant #907 (3fde8896), est intégré sans conflit. Les douze distributions Amundi réparées et leurs preuves officielles restent intactes. Le registre courant comporte désormais **77 causes anciennes ouvertes, deux corrections avec résidu (WFNS et Amundi), dix corrections et une comparaison non pertinente**, soit toujours 90 comparaisons. Les 52 cas de cotation contestés restent refusés ; les 27 cas NAV indépendants restent préservés. Les 90 lignes financières du suivi sont rapprochées de ce registre actuel ; les captures précédentes à 78 + un résidu restent des preuves historiques, pas les compteurs courants.

40041331581 termine en **échec** : 665 historiques et 24 séries de classement validés, BCE réussie, TWD en échec individuel ; revalidation complète et build réussis, puis push refusé après la fusion concurrente #907 et conflits de données lors de la reprise. Aucune résolution automatique ni publication. Le nouveau producteur doit recollecter depuis ce master. Le journal d’échec est conservé séparément ; la publication ne sera affirmée qu’après une nouvelle exécution ordinaire.


## Build et rôles des nouveaux modules

Le build intégré à #907 a révélé un dépassement du budget Dilemme : 786 299 octets classés code pour 786 000 autorisés. Les montants/situations statiques sont désormais un JSON séparé, avec le moteur d’origine conservé. Les trois exports, vingt situations et **97 scénarios sont identiques** (SHA256 5a683095e12b063579b5833efbc920e2da4811ed354e9f26577e76720d88510b). Le build complet et les budgets stricts réussissent ; aucune limite n’a été augmentée. Les journaux avant/après sont conservés. Le code classé de la route passe à environ 770 ko ; cette séparation n’est pas annoncée comme une réduction du téléchargement.

Les rôles de trois modules précis sont examinés : configuration des liens de réparations financières, corpus éditorial de récits historiques, matrice de situations hypothétiques Dilemme. Ils ne sont pas des collecteurs. Leurs sources, revues éditoriales, conventions et restrictions financières restent inchangées. La projection locale comporte zéro module non classé ; ce résultat ne signifie pas zéro panne fournisseur. Les dates des autres règles de qualification restent conservées.

Le [rejeu DWS 40048479915](https://github.com/madmax91310/shinny-potato/actions/runs/40048479915) vérifie réellement 11/11 portefeuilles, zéro report et zéro erreur. Les deux empreintes de stabilité obtenues dans GitHub sont identiques à celles recalculées depuis les documents archivés. Le workflow de validation du radar 40048492421 réussit également ; ces contrôles ne publient ni ne clôturent encore les 36 alertes.


## Horloge de la recette des NAV courantes

Le build GitHub 40050143526 échoue avant compilation : la recette interroge les niveaux courants à la date de leur ancienne preuve archivée. Pour IE00BSPLC413, le registre possède désormais la NAV du 23/10, la preuve de référence date du 22/10 ; le consommateur la refuse correctement à cette ancienne date. Le test utilise désormais le registre courant des deux sources exactement comme le consommateur, contrôle sa non-régression et sa date non future, puis vérifie identité, devise et valeur à la date courante. Il vérifie aussi le refus avant observation et après le délai d’expiration existant. Aucun seuil ni garde-fou produit n’est modifié, aucune donnée n’est reculée. Les quatre scripts de consommateurs NAV/financiers passent localement après ce correctif ; rejeu GitHub encore requis. Le journal original est archivé.


## Production ordinaire et clôtures constatées à 02:16

Le producteur ordinaire **40048488254** valide TWD/BCE et les 333 mois via Fed H.10 ; FRED reste en timeout. Enregistrement eb4fd51f et publication vérifiée le 24/10 à 02:09 UTC, avec 571 fichiers publics contrôlés. Le reçu et le rapport individuel sont joints. Le moniteur confirme la clôture TWD ; ce résultat n’est pas déduit d’un workflow global vert : celui-ci est **en échec**, car treize séries de classement reçoivent HTTP429. Leurs données qualifiées de septembre 2026, contrôlées le 23/10, sont conservées sans nouvelle date de contrôle. Treize lignes distinctes sont ajoutées au suivi.

Le mode de reprise `--retry-failed`, déjà utilisé par le cron, devient sélectionnable au déclenchement manuel du même producteur. Il ne redemande pas les historiques sains, ne supprime aucun contrôle de qualification/publication et ne recertifie pas une source ignorée. Une exécution ordinaire de cette reprise est encore requise.

Le moniteur du **24/10 à 02:16:51 UTC** contient 56 signaux et **zéro alerte DWS active**. Les 36 épisodes restants sont retrouvés dans ses résolutions après le vrai délai de stabilité de quatre heures. Les états avant correction et les documents restent archivés. Cette clôture ordinaire est distinguée du correctif de compteur qui évitera les réinitialisations futures dues aux seuls libellés ; aucune empreinte normalisée n’est appliquée rétroactivement à la production antérieure à son intégration.
