# Bibliothèque commune des instruments

Les outils identifient une part par son ISIN et lisent ses données partagées ici.
Les contenus des fiches et formats communs résident aussi dans cette bibliothèque ;
les pages gardent leur logique d’affichage. Les chiffres partagés sont servis par :

| Donnée | Fichier commun | Outils consommateurs |
| --- | --- | --- |
| Identité et libellés | `instruments.js` | Fiches ETF, Comparatif ETF, Comparateur d’indices, Générateur |
| Frais | `etf-ter.js` | Fiches ETF, Comparatif ETF, Comparateur d’indices |
| Encours | `instrument-aum.js` | Fiches ETF, Comparateur d’indices |
| Caractéristiques | `instrument-facts.js` | Fiches ETF, Comparateur d’indices |
| Éligibilité PEA documentée | `instrument-pea.js` | Fiches ETF, Comparatif ETF, Comparateur d’indices |
| Rendements 2020–2025 | `instrument-returns.js`, `verified-returns.js` | Générateur, Fiches ETF, Duels de portefeuilles, fiches de composition |
| Historique 2023–2025 propre au comparateur | `instrument-comparator-returns.js` | Comparateur d’indices, fiches de composition |
| Prix historiques, inflation et Livret A | `market-history.js` | Calculateur, Tweet Midi, pouvoir d’achat, Duels |
| Catalogue des 87 supports et catégories | `portfolio-assets.js` | Générateur de portefeuilles, Duels |
| Fiches ETF et textes de présentation | `etf-cards.js` | Fiches ETF, Duels, audits |
| Thèmes et textes des comparatifs ETF | `etf-themes.js` | Tweet Midi, audits |
| Définitions et catégories du lexique | `financial-lexicon.js` | Tweet Midi, audits |
| Séries et postes du pouvoir d’achat | `purchasing-power.js` | Tweet Midi, simulateur |

Les 85 lignes de produits du Générateur qui portent un ISIN utilisent
`getInstrumentReturnValues(isin)`. Une série du Comparateur utilise la même série
2020–2025 lorsqu’elle existe ; les 16 parts absentes du Générateur ont leur série
2023–2025 dans le registre du comparateur. Pour IE00BP3QZB59, le comparateur
conserve ses chiffres historiques distincts car sa note les présente en EUR et
le Générateur indique une série USD : cette migration ne tranche pas la méthode.

Les cours spot et taux d’épargne résident maintenant aussi dans `src/data/`, mais
restent distincts des rendements d’une part ETF : l'ISIN ne s'applique pas aux
indices, à l'inflation ou au Livret A. Les `data.js` du Calculateur et du
Générateur ne contiennent qu'un réexport de compatibilité, sans chiffres locaux.
Les anciens modules des fiches ETF, des thèmes, du lexique et du pouvoir d’achat
réexportent également leurs données communes. Les formats de Tweet Midi et les
fiches ETF importent directement les registres de `src/data/`.
Pour ajouter une part ou modifier un rendement, mettre d’abord à jour sa série
dans `src/data/`, puis lancer `npm run audit:instrument-catalog`,
`npm run audit:performance-consistency` et les vérifications des outils concernés.
