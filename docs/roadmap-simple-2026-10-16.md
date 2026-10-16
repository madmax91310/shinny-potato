# Expositions simples et suite des raccordements — 16 octobre 2026

## Parcours

L’entrée de Portefeuille & DCA affiche les actifs, leurs pourcentages et le choix des donuts. Quatre formats : répartition + géographie + secteurs, géographie + secteurs, géographie seule et secteurs seuls. L’image est générée à la demande ; toute modification invalide l’ancien aperçu. Un total différent de 100 %, une ligne vide ou un poids invalide bloque la génération. Les profils DCA restent dans un onglet distinct, monté seulement à sa première ouverture. La navigation conserve les deux compositions.

## Données et limites

Les cinq compositions déjà préparées dans le lot de pages mais non publiées sont reprises et leur collecte officielle a été rejouée : 5/5 réussies. Total : 85 compositions complètes. Les contrôles de réplication, de part exacte et de poids restent actifs.

440 supports : 404 ont une ventilation géographique et sectorielle individuellement suffisante ; 20 sont hors classification (métaux, crypto et matières premières) ; 16 restent incomplets ou incompatibles avec un donut. Les actifs hors classification ne sont pas comptés comme des pays/secteurs couverts. Les matières premières à terme ne sont pas présentées comme des actions de producteurs.

Les 16 cas comprennent les quatre LifeStrategy sans ventilation intégrale, QYLD contradictoire, Silver Miners sans secteurs complets, Avantis sans pays complets, cinq ETF avec poids signés non représentables en donut, deux ADR sans identité qualifiée, le cuivre et le monétaire sans ventilation qualifiée. Les poids négatifs ne sont ni supprimés ni renormalisés. Les derniers contrôles des sources sont documentés dans etf-gap-followup-2026-10-16.md. Aucun gain de couverture ne provient de données inventées.

## Historiques et automatisation

Quatre parts déjà présentes sont raccordées aux trois outils historiques : Amundi Water FR0010527275 (WAT Paris EUR), Amundi Global Luxury LU1681048630 (GLUX Paris EUR), L&G Artificial Intelligence IE00BK5BCD43 (AIAI Londres USD), L&G Battery Value-Chain IE00BF0M2Z96 (BATT Londres USD). Les 81 mois de janvier 2020 à septembre 2026 sont recoupés entre cours quotidiens et mensuels ; les cours datés bruts sont également collectés. Les configurations rejoignent les mises à jour existantes. Ni substitution d’indice ni conversion de devise.

75 historiques ETF/ETC et 89 historiques actions automatisés sont suivis par l’audit de raccordement. Celui-ci vérifie désormais les deux catégories, leurs dates finales et leurs destinations réelles. Les anniversaires volontairement désactivés (LifeStrategy) restent distincts d’un raccordement manquant. L’audit est ajouté aux deux workflows mensuels avant publication ; le test de propagation vérifie 225 séries et leurs consommateurs au mois suivant.

## Générateur

La rotation des recettes reste prioritaire. À fréquence égale, les familles les moins utilisées dans le couple profil/risque sont favorisées ; plusieurs émetteurs d’une même exposition n’apportent pas de poids supplémentaire. La part PEA de technologie européenne devient une alternative dans deux recettes Pro-Europe existantes. Les 407 constructions et les limites de risque restent conservées.

Comparaison reproductible de 9 300 tirages par version contre 68007abb : structures moyennes 18,59 → 18,67 ; allocations proches d’une des 20 précédentes 15,10 % → 14,61 %. Pas de répétition exacte consécutive. Les voisins immédiats augmentent de 0,42 % à 0,61 % : amélioration modeste, non universelle, sans promesse de diversification économique. Résumé par profil dans roadmap-simple-generator-validation.json.

## Validation

Suites DCA, 10 tests Python des compositions, 75 historiques ETF/ETC, propagation de 225 séries, 372 tirages verrouillés, 347 remplacements et cohérence de 634 rendements validés localement. Budget de recherche ajusté de 536 à 537 ko pour les quatre identités supplémentaires (536,9 ko mesurés) ; plafonds 300 ko initiaux et 500 ko par fichier conservés. Tests navigateur simples sur mobile/ordinateur et tests DCA existants requis en CI, le navigateur local étant bloqué par l’environnement.
