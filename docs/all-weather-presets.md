# All Weather dans le générateur

La famille **All Weather**, dans **Portefeuilles modèles**, propose trois allocations fixes et modifiables. Elle ne passe
pas par le tirage aléatoire ni par les seuils historiques du mode Auto.

| Poche | Adaptation euro | Obligations indexées | Durée obligataire réduite |
| --- | ---: | ---: | ---: |
| Actions mondiales développées | 30 % | 30 % | 30 % |
| États euro 15–30 ans | 40 % | 25 % | 20 % |
| États euro 5–7 ans | 15 % | 15 % | 25 % |
| États euro indexés sur l’inflation | — | 15 % | — |
| États euro 1–3 ans | — | — | 10 % |
| Or physique | 7,5 % | 7,5 % | 7,5 % |
| Matières premières diversifiées | 7,5 % | 7,5 % | 7,5 % |

Ces choix éditoriaux sont des adaptations pédagogiques sans levier avec obligations
en euros, pas une réplication du portefeuille propriétaire de Bridgewater ni du
modèle américain en Treasuries. Le cadre croissance/inflation est décrit dans
[The All Weather Story](https://www.bridgewater.com/research-and-insights/the-all-weather-story).
Les variantes indexée et à durée réduite sont des choix propres à l’application.

Les supports et rendements viennent du registre commun : aucun historique ou
collecteur supplémentaire. Les mises à jour suivent donc les automatisations
existantes des parts exactes. Les calculs utilisent la période annuelle commune,
le rééquilibrage annuel et la conversion BCE en euros du moteur partagé.
Le préréglage refuse de générer si cette période ne permet pas une annualisation.

« Modifier cette allocation » copie les lignes en composition manuelle. Une fois
modifiée, elle ne conserve pas le libellé All Weather prédéfini. Les pondérations
décimales sont conservées dans la saisie, les calculs et l’image.

Validation : `node scripts/test-all-weather.mjs`, `node scripts/test-model-portfolios.mjs`,
`node scripts/playwright-model-portfolios.mjs`, tests du générateur et build Vite.
