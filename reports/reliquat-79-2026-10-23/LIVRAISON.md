# Reliquat des 79 divergences — 23 octobre 2026

Base : master `1892bdeec74b4ecc655f0e3a181bc02d4dcb4e6e`, après #887 et #889. Le site servait le code `31f3718` et les données `1892bde` ; les cinq empreintes des fichiers d’historiques/projections ont été rapprochées du manifeste public avant modification. Les corrections et identifiants déjà publiés sont conservés.

## Bilan financier, sans confusion de statuts

Les **79 cas, sur 50 parts**, sont tous conservés. **Aucune cause supplémentaire de l’ancienne divergence n’est déclarée expliquée.** La décomposition donne, cas par cas : clôtures brutes/ajustées et facteurs fournisseur, opérations déclarées, bornes NAV officielles et niveaux réinvestis, effet du calendrier, conversion BCE existante et résidu. Les facteurs fournisseur ne constituent pas une certification indépendante des opérations. Les rapports ne qualifient pas le résidu de prime/décote. Aucun seuil d’alerte n’a changé.

- Preuves quotidiennes : **68 → 72 / 79 cas**. Les exports officiels State Street découverts sur les pages exactes fournissent les quatre preuves manquantes USA Small Cap Value 2023/2024/2025 et Europe Small Cap Value 2019.
- Cas dont l’ancienne cotation est chargée et la fenêtre admise : **75 → 58 / 79**. La qualification porte sur les séries effectivement consommées, pas seulement sur leur présence dans une configuration.
- Cas utilisant une voie NAV exacte distincte : **4 → 21 / 79**, soit **17 cas supplémentaires sécurisés**, sur **11 parts existantes**. Cela ne répare ni n’explique les anciennes cotations.
- Il reste **7 cas sans preuve quotidienne qualifiée** : L&G Artificial Intelligence 2023, L&G Clean Energy 2025, Bitwise Bitcoin 2021/2023/2024, BNP S&P 500 FR0011550185 2021, HSBC Euro Stoxx 50 IE00B4K6B022 2024.

Les nouvelles voies couvrent neuf parts iShares capitalisantes et les deux parts State Street capitalisantes. Chaque identité/devise/politique de revenus est vérifiée ; les rendements reconstitués sont rapprochés des calendriers officiels sans modification de tolérance. Conversion EUR/USD conservée. Les configurations, séries et niveaux actuels des anciennes cotations sont archivés séparément. Les cours originaux ne sont pas réécrits.

## Raccordements

Les onze voies alimentent le calculateur (versement unique et DCA), Performance depuis, Il y a X ans et les deux formats mensuels de Qui a vraiment gagné selon les années complètes disponibles. Les calendriers annuels officiels et les recettes automatiques existantes gardent leurs propres conventions ; aucun univers IA ou automatique n’est élargi.

La projection des anciennes cotations vers les portefeuilles manuels/Duels est régénérée. Les cinq identifiants manuels concernés, ainsi que Mining précédemment livré, sont préservés lorsqu’ils passent au calendrier annuel NAV qualifié. Aucun identifiant de Duel ne disparaît dans la comparaison avant/après. Les cartes de composition ne sont pas modifiées par une substitution de série de performance.

## Réconciliation de #889 et limites indépendantes

**DWS : incident expliqué et correction conservée.** Les photographies doivent être compatibles ; le champ officiel Total AUM of fund peut être en GBP alors que la part et sa performance sont en USD. Le complément a corrigé aussi la devise de la cible de collecte. Les journaux et collectes GitHub prouvent cette correction ; l’archive volumineuse inaccessible reste une limite documentaire, pas une panne active.

**SCPI : déjà corrigé dans les lots précédents.** L’échéance de surveillance interne n’est pas une promesse de publication de l’émetteur. Une prochaine date non annoncée demeure une inconnue documentaire, pas une panne à réparer. Le statut P2-05 est réconcilié en « déjà résolue » sans inventer de nouvelle collecte ni date.

**WisdomTree/Copper : blocage externe non résolu.** Les voies officielles existantes restent en 403 dans GitHub pour Copper et les quatre compositions complètes. Le code publié de l’interface expose encore des routes sur le même domaine ; aucune nouvelle voie autorisée fonctionnelle n’est démontrée. Les mêmes sondes 403 ne sont pas relancées. Les faitsheets accessibles ne qualifient pas des positions complètes. Recouvrement maintenu bloqué lorsque l’identification est insuffisante.

**PEA :** IE00B0M62S72 reste en conflit et IE0003R87OG3 inconnu. Aucune nouvelle preuve explicite de la part exacte ne permet de trancher.

**FR0007054358 :** première VL 19/02/2001, lancement API 19/09/2018 et date de classe PDF 20/09/2018 restent des notions distinctes. Il manque l’avis officiel établissant juridiquement et financièrement la continuité/transformation de cette classe. Le factsheet seul ne démontre pas cette continuité ; aucun blocage universel ni historique prolongé n’est ajouté.

**Chiffres vivants :** les slots de frais déjà automatisés et les faits dérivés restent raccordés. Les archives, hypothèses, chiffres personnels et verrous éditoriaux sont conservés. Le reliquat non typé de P2-06 demande une qualification éditoriale, pas une collecte universelle ni une réécriture automatique.

**Fraîcheur :** la tolérance existante des NAV quotidiennes est centralisée et réellement lue dans `series.dailyNav`, séparément de la cadence mensuelle. Les NAV datées ne sont jamais prolongées artificiellement sur les jours non ouvrés. La requalification complète des calendriers de tous les autres fournisseurs reste hors preuve de ce lot.

**Modules :** les branches supplémentaires de lecture NAV State Street et de migration multi-producteurs sont testées. Les 115 modules initiaux et les limites des 81 branches du suivi précédent restent conservés ; ces 81 éléments ne sont pas 81 collecteurs en panne. Les tests locaux ne sont pas présentés comme une disponibilité fournisseur.

## Preuves et validation

Qualification réelle depuis GitHub : [39952009713](https://github.com/madmax91310/shinny-potato/actions/runs/39952009713) pour les neuf premières parts et [39952549373](https://github.com/madmax91310/shinny-potato/actions/runs/39952549373) pour les onze, avec réponses brutes et observations téléchargées. Ce sont des déclenchements push isolés ; ils ne prouvent pas encore un passage cron ultérieur. Les collecteurs normaux mensuel et quotidien utilisent les mêmes configurations.

Contrôles ciblés : identité/devise/colonne d’export, changement de structure, année incomplète, trou mensuel, borne de fin d’année non ouvrée ; contrôles existants de panne/reprise et de fenêtres qualifiées conservés. Calculs, conversions, sélecteurs et textes vérifiés sur les onze parts. **46 téléchargements PNG locaux** réussis (44 sur les onze parts, plus comparaison et classement annuel), plus mobile. Les 114 commandes de validation locales passent, y compris le stress des portefeuilles. Le build local et les audits des historiques, calendriers et raccordements passent. Une première suite Python a échoué sur trois tests OCR faute de configuration française locale ; le rejeu configuré passe les **930 tests** et son journal est conservé. Le bilan final de CI et la publication réellement servie sont ajoutés dans PUBLICATION.md après contrôle.

## Rapports séparés

- `reconciliation-79-ecarts.csv` : les 79 cas, usages avant/après, pièces et conclusions individuelles.
- `decomposition-79-cas.csv` : rapprochement quantitatif, sans attribution causale automatique.
- `consommateurs-79-cas.csv` : matrice des consommateurs avant/après ; les formats annuels et mensuels restent distincts.
- `series-suspectes-production.csv` : les 58 cas encore sur les anciennes cotations.
- `blocages-financiers.csv` : pièce exacte manquante par cas, même quand l’usage est sécurisé.
- `statut-19-actions.csv` : 12 corrigées, 1 déjà résolue, 5 partielles, 1 bloquée.
- `blocages-independants.csv`, `automatisations-github.csv`, `raccordements-retablis.csv`, `modules-verification.csv`, `restant-a-verifier.csv`, `bilan.json` et `preuves/`.

Les 175 périodes non comparables sont préservées à l’identique dans les rapports précédents. Cette livraison ne certifie pas indépendamment toutes les données du catalogue.

Recherche complémentaire des cotations : pages officielles Euronext LQQ/CL2 et Londres IUQA accessibles, sans preuve acquise des anciennes clôtures. Le gabarit Euronext documente deux années de téléchargement public (Milan : cinq jours) : cela limite les années anciennes, sans prouver l’indisponibilité de toute autre voie officielle. Les réponses et la découverte de l’interface sont conservées ; les seules clôtures courantes visibles ne réconcilient pas 2021/2023.
