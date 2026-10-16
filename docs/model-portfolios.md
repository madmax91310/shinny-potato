# Portefeuilles modèles

Le générateur regroupe les préréglages dans **Portefeuilles modèles**. Choisir une
famille génère immédiatement son allocation, son texte et son image. Les familles
avec plusieurs variantes disposent d’un second sélecteur. Les poids restent fixes.

| Famille | Variantes disponibles | Répartition |
| --- | --- | --- |
| All Weather | Euro, obligations indexées, durée réduite | Trois adaptations existantes conservées |
| Permanent Portfolio | Adaptation euro | 25 % World, 25 % États euro 15–30 ans, 25 % monétaire EUR, 25 % or |
| Golden Butterfly | Obligations euro | 20 % S&P 500, 20 % small value USA, 20 % États euro 15–30 ans, 20 % États euro 1–3 ans, 20 % or |
| Actions / obligations | 40/60, 60/40, 80/20 | World et obligations mondiales couvertes en euros |

L’interface explique le principe de chaque famille, les adaptations retenues et le
rôle de chaque poche. Le texte publiable comporte une explication courte du modèle
et une limite propre à sa construction. Le rendu de l’image existant est conservé.

Le Permanent Portfolio d’origine utilise des actions américaines, des Treasuries
longs, des T-bills et de l’or. L’adaptation utilise un World, des obligations euro
et XEON. Le Golden Butterfly conserve ses deux poches actions américaines, avec
remplacement des Treasuries par des obligations d’État en euros. Les variantes
actions/obligations sont des exemples éditoriaux, sans attribution à un auteur.

Sources des définitions et pondérations, contrôlées le 16/10/2026 :

- https://portfoliocharts.com/portfolios/permanent-portfolio/
- https://portfoliocharts.com/portfolios/golden-butterfly-portfolio/
- https://www.bridgewater.com/research-and-insights/the-all-weather-story

Les rendements et produits sont importés du catalogue commun sans nouveau
collecteur ni duplication de séries. Le moteur conserve sa conversion BCE en EUR,
la période annuelle commune et le rééquilibrage annuel. Une période commune
insuffisante produit une erreur visible sans changer la sélection active.

« Modifier cette allocation » copie les supports et pourcentages en composition
manuelle. La nouvelle génération manuelle ne conserve pas l’identité du modèle.

Validation : `test-all-weather.mjs`, `test-model-portfolios.mjs`, tests éditoriaux,
build Vite et `playwright-model-portfolios.mjs` sur mobile et ordinateur. Le test
navigateur couvre les huit allocations, les explications dans l’interface et le
texte, les huit images distinctes et l’édition avec poids décimaux. Il est exécuté
dans GitHub Actions, le navigateur local étant bloqué par l’environnement.
