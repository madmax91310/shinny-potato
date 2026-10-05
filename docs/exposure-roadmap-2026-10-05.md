# Enrichissement des expositions — roadmap du 5 octobre 2026

Ordre retenu après ajustement : monde et diversification, jeux vidéo et innovation médicale, puis réutilisation utile du catalogue. Aucun nouvel ajout obligataire ni nouvelle fiche pays dans cette roadmap. Agriculture et terres rares retirées. Or, argent et cuivre sont déjà présents. Chaque lot enrichit d’abord les registres communs, puis les formats concernés. Les éléments déjà présents sont réutilisés ; aucune nouvelle exposition ne justifie de recopier une fiche ou un historique.

## Lot 1 — Monde et diversification

Statut : livré avec la PR #290, fusionnée et déployée.

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

## Lot 2 — Jeux vidéo et innovation médicale

Statut : implémenté sur `codex/gaming-medical-catalog-reuse`, en validation avant publication.

| Outil | Ajout précis |
|---|---|
| Présentation d’ETF | VanEck Video Gaming and eSports, IE00BYWQWR46 ; iShares Healthcare Innovation USD (Acc), IE00BYZK4776. Identités, indices exacts, frais 0,55 % / 0,40 %, capitalisation, réplication, encours et comptages avec dates propres, cotations EUR, performances NAV USD 2020–2025 et sources individuelles. Statut PEA conservé inconnu tant qu’une source ciblée ne le tranche pas. |
| Comparatif ETF | Sélection dédiée jeux vidéo ; santé mondiale Advanced / innovation médicale / Nasdaq Biotechnology. Les différences d’univers et les possibles recouvrements sont expliqués. |
| Générateur de portefeuilles | Deux supports en sélection manuelle et dans les options thématiques Équilibré, Dynamique et Offensif. Les pondérations des recettes restent celles du profil existant, avec contrôle exhaustif des combinaisons et des générations. |
| Duel de portefeuilles | 100 % World / 90 % World + 10 % jeux vidéo ; 100 % World / 90 % World + 10 % innovation médicale ; même socle World à 90 %, innovation médicale ou biotech à 10 %. |
| Impact des frais | Deux supports dans la sélection commune : comparaison de frais sous rendement brut hypothétique identique, sans prétendre qu’ils suivent la même exposition. |
| Bibliothèque | Identités, caractéristiques, rendements, frais, cotations, dates et consommateurs dérivés des registres. |

Les performances jeux vidéo décrivent la part du fonds : son changement d’indice en décembre 2022 est indiqué. Les années antérieures ne sont pas attribuées rétrospectivement au nouvel indice. La cotation EUR est distincte des rendements USD ; le duel applique le change explicite déjà utilisé dans l’outil.

## Lot 3 — Réutilisation du catalogue

Statut : implémenté lorsque les données nécessaires existent déjà.

| Outil | Ajout précis |
|---|---|
| Comparatif ETF | EM IMI / EM ex-China, avec différence de tailles explicitée ; immobilier coté des pays développés / infrastructures mondiales. |
| Coulisses des indices | World Sector Neutral Quality, World Enhanced Value, MSCI EM ex-China : photographies du 30/09/2026, pays, secteurs, dix premières lignes, règles de sélection, performances nettes USD 2023–2025. Les compositions et performances gardent leurs sources et dates distinctes. |
| Duel de portefeuilles | 70 % World + 30 % EM IMI / 70 % World + 30 % EM ex-China, sur les seules années communes 2022–2025 ; 80 % World + 20 % immobilier / 80 % World + 20 % infrastructures. |
| Cas concrets | Retirer la Chine et observer le poids relatif de Taïwan ; ajouter 20 % Quality au World et calculer le poids américain sur la même photographie. Aucun poids ETF inventé. |
| Comparateur d’indices | Réutilisation des familles existantes `style` et `emergents-cto` : les comparaisons Quality / Value / Growth et EM IMI / FTSE EM / ex-China sont déjà disponibles, sans ajouter de doublon. |

## Étapes conditionnées aux données

| Liste / outil | Ajouts potentiels | Condition avant raccordement |
|---|---|---|
| Coulisses | World Momentum et World Minimum Volatility | Méthodologie exacte de l’indice retenu, composition d’indice complète et datée, comptage et rendements d’indice sourcés. Les seuls rendements ETF ne suffisent pas. |
| Coulisses | Indices immobilier et infrastructures | Composition de l’indice FTSE exact, règles et historique distincts de ceux du fonds. |
| Et si tu avais investi ? / Performance depuis… | Japon, Inde, Quality, Momentum, immobilier, infrastructures ; puis jeux vidéo et innovation médicale | Série mensuelle longue, homogène, devise et méthode explicites, dividendes et changements de référence documentés, contrôles indépendants. Les tableaux annuels ne sont pas interpolés. |
| Il y a X ans | Parts ETF anciennes sur ces mêmes expositions | Prix historiques réellement comparables, traitement des distributions et divisions de parts. Un niveau d’indice ne devient pas un cours d’ETF. |
| Faits marquants | Baisses et récupérations de ces expositions | Observations suffisamment fréquentes et continues ; préciser la fréquence du drawdown. |
| Générateur | Émergents hors Chine | Six années calendaires complètes pour la part exacte, ou un proxy explicitement documenté. Les quatre années actuelles ne sont pas complétées artificiellement. |
| Impact des frais | Plusieurs supports suivant le même indice jeux vidéo ou innovation médicale | Autre part réellement comparable, même univers et couverture, frais sourcés. La biotech ne sert pas de faux équivalent. |

Chaque raccordement est décidé outil par outil. Aucun nouvel ETF n’est introduit dans un format qui demande des données encore absentes.
