# Enrichissement des expositions — roadmap du 5 octobre 2026

Ordre retenu : monde et diversification, obligations, géographie, thématiques. Chaque lot enrichit d’abord les registres communs, puis les formats concernés. Les éléments déjà présents sont réutilisés ; aucune nouvelle exposition ne justifie de recopier une fiche ou un historique.

## Lot 1 — Monde et diversification

Statut : implémenté sur `codex/world-diversification-lot-1`, en validation avant fusion et déploiement.

### Données ajoutées

* ETF State Street SPDR MSCI All Country World Investable Market UCITS ETF (Acc), IE00B3YLTY66 : nom officiel, MSCI ACWI IMI net, TER, capitalisation, réplication physique par échantillonnage, domicile, statut PEA, cotation IMIE à Paris en EUR, devise de rendement USD, encours de la part et nombre de positions avec leurs dates propres.
* Rendements nets du fonds pour 2020–2025 : conservés séparément des rendements de l’indice.
* Composition MSCI ACWI IMI du 30/09/2026 : comptage réel, pays, onze secteurs et dix premières lignes avec pondérations.
* Séries mensuelles MSCI ACWI IMI, MSCI ACWI et MSCI World ex USA Net Return USD, de janvier 2015 à septembre 2026 : 423 observations recoupées avec les dernières séances quotidiennes. Chaque série est confrontée aux onze rendements annuels 2015–2025 des fiches MSCI.
* World Small Cap réutilise son historique mensuel existant. World hors États-Unis et petites capitalisations conservent leurs fiches et comparatifs déjà disponibles.

### Ajouts par outil

| Outil | Ajout précis |
|---|---|
| Présentation d’ETF | Fiche ACWI IMI complète, performances propres au fonds, visuel mondial approuvé |
| Comparatif ETF | World / ACWI / ACWI IMI ; World avec / sans États-Unis ; World / World Small Cap |
| Comparateur d’indices | Nouvelle comparaison World / ACWI / ACWI IMI, performances homogènes nettes USD, compositions et ETF associés |
| Coulisses des indices | Fiche ACWI IMI, sélection, pondération, pays, secteurs, principales lignes et rendements |
| Générateur de portefeuilles | ACWI IMI en sélection manuelle ; recettes Généraliste équilibré (60 % IMI + 40 % obligations), dynamique (80 % IMI + 20 % or), offensif (60 % IMI + 25 % hors USA + 15 % petites développées) ; recette équilibrée World + hors USA + supports courts |
| Duel de portefeuilles | 85 % World + 15 % émergents / 100 % ACWI IMI ; World seul / 80 % World + 20 % petites mondiales |
| Et si tu avais investi ? | Trois nouvelles séries mensuelles, versement unique et DCA ; devise et variante explicites |
| Performance depuis… | Les trois séries et leurs années calendaires complètes, dans le visuel stylisé existant |
| Il y a X ans | Niveaux des trois indices ; variante Net Return USD affichée, sans les présenter comme des cours d’ETF |
| Faits marquants | Baisse maximale entre clôtures mensuelles et récupération ; comparaison achats mensuels / placement unique, pour les trois nouveaux indices et World Small Cap |
| Impact des frais | ACWI IMI accessible dans la sélection commune ; même rendement brut hypothétique entre supports, sans comparer les performances réelles |
| Cas concrets | 70 % World + 30 % hors USA ; 80 % World + 20 % petites mondiales ; 50 % World + 50 % ACWI IMI. Poids américains et technologiques calculés sur une photographie commune |
| Bibliothèque / suivi | Identités, compositions, rendements, historiques et consommateurs consultables avec preuves et dates ; contrôles de fraîcheur existants |

Les recettes ne traitent pas les compléments d’ACWI IMI comme des marchés absents : elles expliquent les surpondérations. Les bornes historiques de risque sont vérifiées pour toutes les combinaisons de supports et pour les portefeuilles réellement générés.

## Lot 2 — Obligations par maturité et couverture

Statut : à faire. Confirmer les supports existants avant tout ajout.

1. Documenter trois expositions aux emprunts d’État américains : 1–3 ans, 7–10 ans et 20 ans et plus. Choisir une part UCITS exacte par exposition.
2. Pour la maturité longue, documenter une part non couverte et une part couverte en EUR afin de séparer le risque de taux du risque de change.
3. Raccorder les expositions euro courtes et longues déjà présentes aux mêmes formats ; ajouter l’intermédiaire si aucun support documenté ne la couvre.
4. Compléter les fiches : indice, maturité, duration à date publiée, crédit souverain, devise, couverture, distribution, frais, pays émetteurs, encours et performances de chaque part. Les secteurs actions ne sont pas substitués à la composition obligataire.

| Outil | Ajout précis |
|---|---|
| Présentation d’ETF | Trois maturités US et variante longue couverte EUR |
| Comparatif ETF / indices | Courts / intermédiaires / longs dans une même zone et devise ; longues US avec / sans couverture |
| Coulisses | Règles de sélection des emprunts, renouvellement du panier et sensibilité aux taux |
| Générateur / duels | Même poche actions, complément obligataire court ou long ; couverture identifiée |
| Historiques / anniversaires | Supports anciens et périodes communes attestées ; aucun historique avant lancement attribué à une nouvelle part |
| Faits marquants | Baisses et récupérations obligataires sur observations vérifiées |
| Frais | Supports suivant une exposition proche, couverture identique |
| Cas concrets | Raccourcir la maturité ; couvrir en EUR ; expliquer pourquoi un ETF ne rembourse pas automatiquement à une date choisie |

## Lot 3 — Géographie

Statut : à faire.

1. Sélectionner et documenter un ETF UCITS large pour chacun : Canada, Australie, Suisse, Royaume-Uni. Confirmer l’indice exact et les tailles d’entreprises couvertes.
2. Remplir les quatre fiches avec secteurs, principales positions, devise, frais, PEA vérifié, distribution, réplication, encours et performances sourcées.
3. Réutiliser les nouvelles expositions dans les formats ci-dessous.

| Outil | Ajout précis |
|---|---|
| Présentation d’ETF | Quatre fiches pays |
| Comparatif ETF / indices | Canada / Australie ; Suisse / Royaume-Uni ; distinction pays / région européenne |
| Coulisses | Une fiche par indice retenu, règles et concentrations sectorielles propres |
| Générateur | Canada et Australie en compléments ; Suisse et Royaume-Uni en sélection manuelle avec rôle explicite |
| Duels | Même World, complément Canada ou Australie ; montrer le pays renforcé plutôt que promettre une diversification nouvelle |
| Historiques / anniversaires | Chaque exposition dont les prix ou niveaux sont suffisamment documentés |
| Faits marquants | Baisses et récupérations propres aux quatre marchés |
| Frais | Fonds comparables sur le même pays et le même univers |
| Cas concrets | Renforcer un pays déjà présent dans World ou Europe ; effet sur le poids géographique et les secteurs |

## Lot 4 — Agriculture et métaux stratégiques

Statut : à faire.

1. Documenter une exposition UCITS aux entreprises agricoles.
2. Documenter une exposition UCITS aux entreprises de terres rares et métaux stratégiques.
3. Confirmer les supports VanEck envisagés et leurs indices exacts. Distinguer actions d’entreprises, produits agricoles et métaux physiques.
4. Remplir les fiches avec pays, secteurs, principales lignes, frais, PEA, devises, distribution, réplication, encours et performances.

| Outil | Ajout précis |
|---|---|
| Présentation d’ETF | Agriculture ; terres rares et métaux stratégiques |
| Comparatif | Agriculture : entreprises / matières premières, si deux supports documentés ; métaux stratégiques / ressources naturelles avec différence d’univers expliquée |
| Coulisses | Sélection thématique, seuils de revenus si documentés, exclusions et concentration |
| Générateur / duels | Deux poches thématiques ; même World avec l’une ou l’autre, poids et risque vérifiés |
| Historiques / anniversaires | Dates et séries propres aux supports ; proxies séparés et explicitement identifiés si nécessaires |
| Faits marquants | Baisse et récupération des expositions, sans les confondre avec les prix physiques |
| Frais | Plusieurs fonds sur une même exposition seulement s’ils sont réellement comparables |
| Cas concrets | Investir dans un producteur ne revient pas à détenir sa matière première |

## Conditions de clôture de chaque lot

* Données communes uniquement ; sources consultées et dates de photographie distinctes.
* Aucun rendement, poids, ticker ou statut PEA inventé. Une absence reste visible et bloque les usages incompatibles.
* Historiques : même devise, même variante de rendement, observations réelles, années partielles exclues des performances calendaires.
* Les nouveaux identifiants ont une illustration explicite dans chaque format, avec contrôle des exports PNG et de leur lisibilité.
* Audits de catalogue, indices, performances et provenance ; contrôles des bornes du générateur ; navigation et export en navigateur réel ; validation CI.
* Fusion et déploiement après l’autorisation explicite prévue dans `CLAUDE.md`.
