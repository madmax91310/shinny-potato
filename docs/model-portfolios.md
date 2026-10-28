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

## Extension du 28 octobre 2026 : Ivy statique et Swensen 2005

Deux familles s’ajoutent aux quatre précédentes : **dix allocations au total**.
Les huit allocations existantes restent identiques. Aucun actif, collecteur,
profil automatique, `riskCombo`, seuil de risque ou moteur de calcul n’est ajouté
ou modifié. Les sources, allocations de référence, règles de rééquilibrage,
limites, différences et supports exacts sont consultables dans le même panneau
« Portefeuilles modèles ». L’édition retire toujours l’identité du modèle.

### Définitions retenues et choix

- **Ivy statique**, Mebane Faber et Eric Richardson, *The Ivy Portfolio* (2009).
  La version retenue est celle des cinq classes à 20 % illustrée par Faber dans
  [Global Asset Allocation, chapitre 9, figure 37, page PDF 67](https://mebfaber.com/wp-content/uploads/2016/04/GAA-Book-1.pdf#page=67) :
  grandes actions américaines, développés étrangers, Treasuries à 10 ans,
  immobilier coté et matières premières. Le
  [papier QTAA, page PDF 15](https://mebfaber.com/wp-content/uploads/2016/05/SSRN-id962461.pdf#page=15)
  précise les références S&P 500, MSCI EAFE, Treasuries 10 ans, NAREIT et GSCI.
  Le filtre tactique mensuel n’est pas implémenté : la version statique reste
  investie. Le rééquilibrage annuel correspond à la recommandation statique en
  compte défiscalisé de la [FAQ de Faber](https://mebfaber.com/2013/06/14/qtaa-update-conclustions-and-faqs/).
  Les comptes imposables et la fiscalité réelle demandent une autre analyse.
- **Swensen 2005**, David Swensen, *Unconventional Success*. L’
  [entretien de Yale, mars-avril 2009](https://www.yalealumnimagazine.com/articles/2398)
  reproduit l’allocation initiale : 30 % actions américaines, 15 % développés
  étrangers, 5 % émergents, 20 % REIT, 15 % Treasuries et 15 % TIPS. Le même
  entretien évoque une révision à 15 % REIT/10 % émergents : elle n’est pas retenue.
  Swensen recommande le retour régulier aux cibles, sans calendrier annuel fixé
  dans cet entretien. **L’annualité est notre convention de simulation**. Ce
  portefeuille pour particuliers ne reproduit pas la dotation de Yale.
- **Coffeehouse**, Bill Schultheis : étudié, non ajouté. La publication de référence
  [Bogleheads, bilan 2021](https://www.bogleheads.org/blog/2022/01/10/the-coffeehouse-portfolio-2021-update/)
  décrit 40 % d’obligations américaines agrégées et six poches actions de 10 % :
  grandes, grandes value, petites, petites value, immobilier, international total.
  Le catalogue contient des fonds proches, mais le facteur MSCI USA Value n’est
  pas un simple indice de grandes capitalisations value, et les obligations
  mondiales couvertes EUR ne sont pas un agrégat américain. Avec la reconstruction
  supplémentaire de l’international total, ces changements demanderaient une
  adaptation plus étendue. Aucun remplacement implicite par World, dividendes,
  Treasuries ou obligations mondiales n’est effectué. Le livre et sa règle précise
  de rééquilibrage n’ont pas été consultés directement.

Les deux modèles retenus apportent des constructions distinctes : Ivy réserve
40 % au couple immobilier/matières premières, tandis que Swensen conserve
70 % d’actions et foncières et sépare les obligations nominales/indexées.
Les portefeuilles déjà présents ne combinent pas ces poches à ces poids.
Ces choix ne constituent pas une recommandation d’investissement.

### Adaptations nommées « euro et régions »

Les poids des grandes poches sont conservés, avec les écarts suivants :

- La poche développée étrangère est divisée **50 % Europe, 30 % Japon IMI,
  20 % Pacifique hors Japon**. Ce partage fixe est éditorial, indépendant des
  performances ; ce n’est pas la pondération de MSCI EAFE ou World ex USA. Canada
  et Israël sont exclus, et Japan IMI inclut les petites capitalisations. Pour Ivy,
  les émergents restent exclus comme dans la référence développée retenue.
  Pour Swensen, la poche émergente de 5 % reste séparée. Le proxy historique de
  `world_ex_usa` (fonds lancé en 2024) n’est utilisé dans aucun nouveau modèle.
- Pour Swensen, S&P 500 remplace le marché américain total : les petites et une
  partie des moyennes capitalisations ne sont pas représentées.
- États euro 5–7 ans à la place des Treasuries : monnaie, émetteurs, durée et
  sensibilité aux taux changent. Les obligations indexées euro remplacent les TIPS
  de Swensen : autre inflation de référence, autres émetteurs et durées. L’indexation
  ne garantit ni le cours ni le pouvoir d’achat global ; le risque souverain euro
  diffère du risque américain.
- Immobilier coté des pays développés avec filtre de rendement en dividendes à
  la place des REIT américains : exposition géographique et sélection différentes.
  Il reste sensible aux taux et peut chuter avec les actions.
- Ivy utilise Bloomberg Commodity au lieu du GSCI : composition et poids sectoriels
  différents. Les contrats à terme et leur renouvellement ne suivent pas simplement
  les prix au comptant. Aucun or ou titre minier ne remplace cette poche.

Les détails et les risques de change sont également présents dans l’interface ;
le texte publié nomme l’adaptation, ses supports et son rééquilibrage annuel.
La cotation en EUR ne signifie pas couverture du change des actions sous-jacentes.

### Correspondance exacte des supports réutilisés

| Support du catalogue | ISIN | Ivy | Swensen |
| --- | --- | --- | --- |
| iShares Core S&P 500 UCITS ETF (`sp500_ishares`) | IE00B5BMR087 | 20 % | 30 % |
| iShares Core MSCI Europe UCITS ETF (`msci_europe`) | IE00B4K48X80 | 10 % | 7,5 % |
| iShares Core MSCI Japan IMI UCITS ETF (`actions_japon`) | IE00B4L5YX21 | 6 % | 4,5 % |
| iShares Core MSCI Pacific ex-Japan UCITS ETF USD (Acc) (`manual-IE00B52MJY50`) | IE00B52MJY50 | 4 % | 3 % |
| iShares € Govt Bond 5-7yr UCITS ETF EUR (Dist) (`euro-govt-5-7`) | IE00B4WXJG34 | 20 % | 15 % |
| iShares Developed Markets Property Yield UCITS ETF (`immo_ishares_yield`) | IE00B1FZS350 | 20 % | 20 % |
| Invesco Bloomberg Commodity UCITS ETF (`mp_large`) | IE00BD6FTQ80 | 20 % | — |
| SPDR MSCI Emerging Markets UCITS ETF (`msci_em_spdr`) | IE00B469F816 | — | 5 % |
| iShares € Inflation Linked Govt Bond UCITS ETF (`oblig_inflation`) | IE00B0M62X26 | — | 15 % |

### Performance, sources et contrôles

Les nouveaux modèles réutilisent `buildManualPortfolio`, `computeYearlyPerf`, les
registres de rendements et le canvas commun. Fenêtre observée au contrôle :
**2020–2025**, six années civiles communes complètes ; elle n’est pas figée dans
un test et suivra la qualification du moteur. Retour aux poids au début de chaque
année, somme pondérée des rendements annuels puis capitalisation géométrique.
Tous les rendements sont totaux, revenus réinvestis, en EUR : séries NAV des parts
exactes sauf le Pacifique, dont la voie existante utilise les cours ajustés EUR
`CPXJ.AS`, identité `IE00B52MJY50-XAMS-CPXJ-EUR`. La différence cours/NAV est
explicitée dans l’interface. Aucun chiffre de l’indice avant création d’un fonds,
aucune conversion au taux actuel, aucun prolongement ni frais du fonds retranchés
une seconde fois. Courtage et fiscalité exclus. Les chiffres sont ceux des
adaptations, pas ceux des modèles américains ni des dotations universitaires.

Les preuves financières restent dans les registres partagés :
`instrument-returns.js`, `monthly-duel-returns.json`, `monthly-fx.json` et les
sources émetteurs qu’ils référencent. Aucune copie de série dans les modèles.
Les séries USD sont converties aux fixings BCE de décembre ; le Pacifique déjà
en EUR n’est pas reconverti.

Les tests du modèle recoupent les identités et poids, les séries NAV/cours
séparées, les taux de change bruts et la capitalisation ; une poche sans historique
refuse la construction. Les recettes navigateur existantes couvrent les dix
allocations, les sources et adaptations, les poids décimaux, les exports téléchargés
et la suppression du nom du modèle après édition. Le contrôle Canvas couvre les
noms exacts, valeurs, années, échelles et absence de chevauchement des deux nouveaux
PNG. Le statut et les commandes de validation sont consignés dans le rapport de
livraison associé à la PR ; aucune publication en production n’est autorisée par
cette extension.
