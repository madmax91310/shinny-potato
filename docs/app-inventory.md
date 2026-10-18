# Inventaire automatique de l’application

Généré depuis les routes, le catalogue et les observations actives. Régénéré à chaque build ; copie versionnée renouvelée par la collecte ETF quotidienne. Les effectifs ne certifient ni la fraîcheur ni la disponibilité de chaque champ.

## Outils accessibles

| Outil | Route |
|---|---|
| Qui a vraiment gagné ? | /classements-performances |
| Portefeuille & DCA | /le-dca-de |
| Fiches pratiques | /fiches-pratiques |
| Radar éditorial | /radar-editorial |
| Simulateur de patrimoine | /simulateur-patrimoine |
| Présentations | /presentations |
| Analyse d’entreprise | /analyse-entreprise |
| Portefeuille d’investisseur | /portefeuilles-investisseurs |
| La France en 100 ménages | /france-100-menages |
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
| Calculateur d'impact des frais | /impact-frais |
| Faits marquants des marchés | /faits-marquants-marches |
| Banque de tweets à recycler | /banque-tweets |
| Dans les coulisses des indices | /tweets-factsheets |

## Catalogue

| Type | Nombre |
|---|---:|
| actor | 11 |
| broker | 8 |
| company | 157 |
| household | 29 |
| index | 52 |
| instrument | 646 |
| insurance | 7 |
| lexicon | 44 |
| reference | 11 |
| scpi | 8 |
| series | 671 |

## Champs des instruments

| Champ | Présents / instruments |
|---|---:|
| ter | 258/258 |
| aum | 258/258 |
| performance | 238/258 |
| countries | 229/258 |
| sectors | 229/258 |
| holdings | 232/258 |

Les raisons des absences figurent dans [l’inventaire des lacunes](automation-gaps.md).

## Moteurs internes et compatibilité

- Comparateur d’indices (`src/pages/index-comparator/`) : moteur et tests conservés, aucune route publique déclarée. Ne pas le présenter comme un outil accessible ; une réouverture exige une décision produit.
- `/tweet-midi` : route de compatibilité conservée ; les formats disposent des routes dédiées ci-dessus.
- `/presentation-assurance-vie` et `/presentation-scpi` : redirections vers Présentations.
