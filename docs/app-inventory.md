# Inventaire automatique de l’application

Généré depuis les routes, le catalogue et les observations actives. Régénéré à chaque build ; copie versionnée renouvelée par la collecte ETF quotidienne. Les effectifs ne certifient ni la fraîcheur ni la disponibilité de chaque champ.

## Outils accessibles

| Outil | Route |
|---|---|
| Idées de publications | /idees-classements |
| Hey @Grok | /hey-grok |
| Qui a vraiment gagné ? | /classements-performances |
| Portefeuille & DCA | /le-dca-de |
| Le budget de… | /le-budget-de |
| Fiches pratiques | /fiches-pratiques |
| Radar éditorial | /radar-editorial |
| Simulateur de patrimoine | /simulateur-patrimoine |
| Présentations | /presentations |
| Présentation d’un investisseur connu | /portefeuilles-investisseurs |
| France en 100 ménages | /france-100-menages |
| Données à revoir | /donnees-a-revoir |
| Bibliothèque de données | /bibliotheque-donnees |
| Et si tu avais investi ? | /calculateur-investissement |
| Générateur de portefeuilles | /generateur-portefeuilles |
| Duel de portefeuilles | /duels-portefeuilles |
| Présentation d'ETF | /fiches-etf |
| Comparatif courtiers | /comparatif-courtiers |
| Fiche lexique | /fiche-lexique |
| Comparatif ETF | /comparatif-etf |
| Il y a X ans | /il-y-a-x-ans |
| Performance depuis | /performance-depuis |
| Pouvoir d’achat | /pouvoir-achat |
| Dilemme | /dilemme |
| Impact des frais | /impact-frais |
| Histoires de marchés | /faits-marquants-marches |
| Banque de tweets | /banque-tweets |
| Coulisses des indices | /tweets-factsheets |

## Catalogue

| Type | Nombre |
|---|---:|
| actor | 11 |
| broker | 8 |
| household | 29 |
| index | 56 |
| instrument | 672 |
| insurance | 7 |
| lexicon | 44 |
| reference | 11 |
| scpi | 8 |
| series | 745 |

## Champs des instruments

| Champ | Présents / instruments |
|---|---:|
| ter | 259/262 |
| aum | 259/262 |
| performance | 239/262 |
| countries | 230/262 |
| sectors | 230/262 |
| holdings | 235/262 |

Les raisons des absences figurent dans [l’inventaire des lacunes](automation-gaps.md).

## Moteurs internes et compatibilité

- Comparateur d’indices (`src/pages/index-comparator/`) : moteur et tests conservés, aucune route publique déclarée. Ne pas le présenter comme un outil accessible ; une réouverture exige une décision produit.
- `/tweet-midi` : route de compatibilité conservée ; les formats disposent des routes dédiées ci-dessus.
- `/presentation-assurance-vie` et `/presentation-scpi` : redirections vers Présentations.
