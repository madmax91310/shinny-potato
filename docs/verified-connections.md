# Raccordements vérifiés — 21 octobre 2026

Le lot étend les consommateurs existants à partir des observations déjà collectées. Les formats de publication restent identiques. La PR part de `ed940b64c140d08c1880b9b293e90f88d8044fcc` (`master`, PR #866), puis est rebasé sur `7e0d486` (collecte mensuelle actualisée après #868). Le minimum de deux années du classement annuel et les profils temporaires de cette version sont conservés.

**735 identités financières uniques × 12 capacités = 8820 couples examinés. 6059 couples étaient déjà utilisables. 130 couples ont été ajoutés, concernant 57 identités uniques. 1491 couples restent bloqués ; 1140 sont hors périmètre.**

Une identité est une part ISIN exacte, une série d’indice avec sa convention et sa devise, ou une référence historique distincte dont l’identité n’est pas fusionnée sans preuve. Les sujets de composition sans cours restent des indices identifiés, sans leur attribuer de performances. Les catégories de nombres d’actifs se recouvrent : un actif déjà utilisable dans un outil peut recevoir un nouveau raccordement dans un autre. Les références génériques fonds euros/SCPI restent identifiées comme telles.

| Outil ou capacité | Déjà utilisables | Ajoutés | Bloqués |
|---|---:|---:|---:|
| Performance depuis | 648 | 46 | 41 |
| Et si tu avais investi ? | 674 | 5 | 56 |
| Qui a vraiment gagné — comparaison | 675 | 28 | 32 |
| Qui a vraiment gagné — classement annuel | 652 | 28 | 55 |
| Présentation d’ETF | 258 | 0 | 4 |
| Coulisses des indices | 55 | 0 | 13 |
| Actifs et exposition — pays | 607 | 3 | 125 |
| Actifs et exposition — secteurs | 607 | 3 | 125 |
| Actifs et exposition — recouvrement complet | 510 | 0 | 225 |
| Générateur — manuel | 615 | 8 | 112 |
| Duels — sélection manuelle | 615 | 6 | 114 |
| Générateur — automatique | 143 | 3 | 589 |

## Raccordements livrés

- **Performance depuis : 46 identités supplémentaires**, dont 13 parts exactes. Les calendriers annuels qualifiés et cinq séries mensuelles officielles alimentent la même façade ; les séries existantes enrichies ne sont pas comptées deux fois. Les données annuelles restent séparées des prix mensuels. Les alias mensuels sans année calculable disparaissent du sélecteur, leurs métadonnées et getters historiques restent disponibles. Les liens par ISIN pointent vers la série effectivement utilisable.
- **Calculateur : cinq historiques mensuels officiels supplémentaires**, World Net, émergents Net, Japon standard Net, ACWI Gross et FTSE All-World Gross, dans leur variante exacte en USD, avec conversion EUR aux deux bornes. Les quatre séries MSCI commencent en décembre 2005 ; FTSE commence en octobre 2024. Les dates antérieures sont bornées au premier point ; inflation et Livret A restent absents lorsque leur historique ne couvre pas la période. Les anniversaires ne reçoivent aucune nouvelle série non qualifiée pour ce format.
- **Classements : 35 calendriers d’indices ajoutés à la banque annuelle**, représentant 28 nouveaux couples dans chaque format. Les autres étaient déjà utilisables via la banque mensuelle. NET/GROSS, devises et fenêtres communes restent distincts ; TOTAL indéterminé ne devient pas automatiquement GROSS.
- **Aerospace & Defence : une capacité mensuelle rétablie** avec `aerospace-paris-eur`, même part `IE000U9ODG19`, cotation `DFND.PA`, EUR, août 2024–septembre 2026. La seule année civile complète est 2025. Cette cotation permet la comparaison mensuelle, mais le classement annuel actuel exige deux années et reste bloqué pour cette part. La cotation suisse USD existante reste exclue. Ce changement de capacité ne compte pas comme un nouveau couple actif × outil : la comparaison via le calendrier NAV annuel était déjà disponible. Le millésime NAV 2025 seul ne suffit pas non plus au classement annuel.
- **Actifs et exposition : trois ETF Vanguard supplémentaires** issus du collecteur commun des sous-jacents LifeStrategy. Pays, secteurs et positions sont raccordés sans nouvelle fiche parallèle. Les poids inconnus restent inconnus ; ces trois listes ne remplissent pas les critères du recouvrement complet. Les entreprises sont regroupées uniquement par le registre d’identités vérifiées ; les titres et leurs ISIN restent détaillés.
- **Manuel : huit parts ; Duels manuels : six parts.** Le même calendrier NAV alimente les deux outils et les rendements sont convertis en EUR aux deux bornes. Les nouvelles admissions annuelles n’entrent pas dans les tirages automatiques des Duels.
- **Automatique : trois facteurs européens** (Value, Momentum, Quality), uniquement en satellites du profil Pro-Européen, niveaux Équilibré/Dynamique/Offensif, de 5 à 20 %, un seul facteur par portefeuille, avec le cœur Europe existant. Les autres candidats restent manuels tant que leurs rôles ne sont pas qualifiés. Aucun statut PEA n’est déduit du nom.
- **Présentation ETF : 258 fiches déjà présentes ; Coulisses : 55 sujets déjà présents.** Aucun autre candidat ne remplit le gabarit existant avec ses observations exactes. Les trois ETF de composition sont signalés comme tels : l’absence de cours n’ajoute pas une obligation mensuelle dans le suivi des raccordements. Ils manquent notamment des caractéristiques nécessaires aux fiches ; un quatrième ISIN possède des positions mais pas une identité/fichier de présentation qualifiés.

Les huit parts manuelles sont `IE0008470928`, `LU0908500753`, `IE00BZ56SW52`, `IE00BD4TXV59`, `IE000QDFFK00`, `IE00B4556L06`, `IE00B4LHWP62`, `IE00BJ5JP659`. Les six admissions aux Duels sont les mêmes, hors palladium et platine déjà raccordés. Les trois compositions sont `IE00BFMXYX26`, `IE00BK5BQZ41`, `IE00BKX55R35`.

## Qualité, blocages et périmètre

Le classement annuel de `master` exige désormais deux années civiles complètes. Dix couples auparavant disponibles avec un seul millésime sont donc classés bloqués ; ce contrôle de #868 est conservé. Le bilan actuel distingue ces limites des 130 raccordements ajoutés.

- Les quatre exclusions ont été réexaminées : [preuves et décisions](verified-history-exclusions.json). SOXX reste en cours brut hors dividendes et sans identité ISIN qualifiée dans cette série ; Mining et Copper conservent leurs exclusions mensuelles pour prix figés. Aerospace dispose de la nouvelle cotation parisienne vérifiée. Aucun garde-fou sur les prix figés n’a été assoupli.
- Les calendriers réels ne fournissent aucun prix mensuel synthétique. Ni le calculateur d’investissement ni les anniversaires ne reçoivent les nouveaux calendriers annuels comme prix. Les périodes s’arrêtent au premier trou et ne commencent pas avant les années réellement publiées pour la part.
- Les positions partielles ou non identifiées ne deviennent pas un recouvrement complet. Un top 10 n’est jamais renormalisé. Le calcul par entreprises consolide les seules classes/identifiants recoupés ; les noms semblables et les ADR sans preuve restent distincts.
- L’indice Russell 1000 reste sans nouvelles Coulisses complètes : les poids des principales entreprises ne sont pas publiés dans l’observation disponible. Les ETF synthétiques ne fournissent pas leur panier de substitution comme composition de l’indice.
- Les blocages de la matrice couvrent tout le produit cartésien, dont des usages sans donnée admissible et des références génériques. Ils ne sont pas tous des anomalies à résoudre en activant un sélecteur.
- Les deux fichiers initiaux comptent 642 couples/574 références : 73 couples entrent dans ce périmètre, 569 en sont exclus. Tous les 73 ont été rapprochés d’une décision actuelle : [rapprochement de l’instantané](verified-connections-input-scope.json). Faits marquants, Analyse d’entreprise, frais d’assurance-vie et autres outils exclus ne sont pas modifiés.

## Matrice et méthode

- [Matrice CSV complète](verified-connections-matrix.csv) : une ligne par identité × capacité, sélecteur, moteur, convention, données observées, configuration sans observation, sources, fraîcheur et blocage.
- [Matrice JSON](verified-connections-matrix.json) : observations stockées une seule fois par identité, décisions et routes effectives. `raccordable` + `implementation: ajouté` désigne une admission vérifiée puis implémentée ; `addedRoutes` décrit aussi les nouvelles banques/fréquences d’un couple préexistant.
- [Référence initiale](verified-connections-baseline-2026-10-21.json) : inventaire des consommateurs du commit de départ, avec les projections DCA reconstruites depuis ce commit dans un checkout isolé (607 observations pays/secteurs déjà exploitables). La façade réelle de Coulisses comprend les 51 fiches et les quatre sujets de composition déjà livrés.
- Reproduction : `npm run build && npm run audit:connections`. Les sorties usuelles du build sans rapport avec cette PR restent hors commit, conformément à `CLAUDE.md`.

## Vérifications

- Build complet, budgets des routes et 4 211 certificats de données publiables : réussis.
- Tests ciblés : identité/part, dates invalides/futures, fraîcheur, proxy et cumul rejetés, années closes, source TOTAL ambiguë rejetée, anciens calculs mensuels inchangés, parité des projections Vite, change EUR/USD et égalité manuel/Duels.
- 13 203 combinaisons exhaustives et 2 790 générations déterministes ; stress sur 9 300 portefeuilles : aucune violation.
- Tests DCA complets : couverture partielle, synthétiques, méthodes, conservation des masses, entreprises/ISIN et positions non identifiées.
- Navigateur Chromium : suite des 19 outils réussie ; 39 téléchargements PNG réels sur les raccordements, sans erreur navigateur ; deux formats de classement, export sans chargement tardif, 30 maquettes annuelles et mobile vérifiés. Les artefacts dédiés sont joints par la CI.
- Les tests de DCA hérités ont été corrigés pour contrôler la poche actions et les poids inconnus du modèle déjà livré dans #866, au lieu d’exiger artificiellement 100 % de pays identifiés. Le helper navigateur sait rouvrir Réglages quand une sélection revient automatiquement à l’aperçu.
- Les admissions automatiques sont projetées au build : le navigateur reçoit les règles qualifiées, sans charger les observations émetteurs pour décider des rôles.

## Publication

Au dernier contrôle public du 21/10/2026, le site sert le code `96b8b3d0d49679e1dbb51be5cd551712cb2cfc26`, build du 21/10 à 17:43:42 UTC (`build-info.json`). Cette PR n’est pas annoncée en ligne.
