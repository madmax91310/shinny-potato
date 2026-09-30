# Bibliothèque commune des instruments

Les outils identifient une part par son ISIN et lisent ses données partagées ici.
Les tableaux dans `src/pages/` gardent le choix des produits, le texte et la mise en page
propres à chaque outil ; ils ne contiennent plus de copie des chiffres communs suivants :

| Donnée | Fichier commun | Outils consommateurs |
| --- | --- | --- |
| Identité et libellés | `instruments.js` | Fiches ETF, Comparatif ETF, Comparateur d’indices, Générateur |
| Frais | `etf-ter.js` | Fiches ETF, Comparatif ETF, Comparateur d’indices |
| Encours | `instrument-aum.js` | Fiches ETF, Comparateur d’indices |
| Caractéristiques | `instrument-facts.js` | Fiches ETF, Comparateur d’indices |
| Éligibilité PEA documentée | `instrument-pea.js` | Fiches ETF, Comparatif ETF, Comparateur d’indices |
| Rendements 2020–2025 | `instrument-returns.js`, `verified-returns.js` | Générateur, Fiches ETF, Duels de portefeuilles, fiches de composition |
| Historique 2023–2025 propre au comparateur | `instrument-comparator-returns.js` | Comparateur d’indices, fiches de composition |

Les 85 lignes de produits du Générateur qui portent un ISIN utilisent
`getInstrumentReturnValues(isin)`. Une série du Comparateur utilise la même série
2020–2025 lorsqu’elle existe ; les 16 parts absentes du Générateur ont leur série
2023–2025 dans le registre du comparateur. Pour IE00BP3QZB59, le comparateur
conserve ses chiffres historiques distincts car sa note les présente en EUR et
le Générateur indique une série USD : cette migration ne tranche pas la méthode.

Les compositions d’indice, cours spot, taux d’épargne et textes éditoriaux
désignent des objets différents d’une part ETF et ne sont pas fusionnés par ISIN.
Pour ajouter une part ou modifier un rendement, mettre d’abord à jour sa série
dans `src/data/`, puis lancer `npm run audit:instrument-catalog`,
`npm run audit:performance-consistency` et les vérifications des outils concernés.
