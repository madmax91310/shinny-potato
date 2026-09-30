# Bibliothèque commune des données

Les outils identifient une part par son ISIN et lisent ses données partagées ici.
Les contenus des fiches et formats communs résident aussi dans cette bibliothèque ;
les pages gardent leur logique d’affichage. Les chiffres partagés sont servis par :

| Donnée | Fichier commun | Outils consommateurs |
| --- | --- | --- |
| Identité et libellés | `instruments.js` | Fiches ETF, Comparatif ETF, Comparateur d’indices, Générateur |
| Frais | `etf-ter.js` | Fiches ETF, Comparatif ETF, Comparateur d’indices |
| Encours | `instrument-aum.js` | Fiches ETF, Comparateur d’indices |
| Cotations, ticker, place et devise | `instrument-listings.js` | Fiches ETF, Comparatifs ETF, Comparateur d’indices |
| Recherche et export communs | `catalog.js` | Bibliothèque de données et commande `data:search` |
| Métadonnées normalisées | `evidence.js`, `comparator-return-evidence.js`, `supporting-evidence.js` | Recherche, export JSON, audits |
| Séries historiques d’indices | `index-returns.js` | Coulisses des indices, Bibliothèque de données |
| Familles et variantes éditoriales | `index-comparisons.js`, `index-factsheets.js` | Comparateur, Coulisses, Bibliothèque de données |
| Composition des indices par photographie | `index-facts.js` | Coulisses des indices, Comparateur d’indices |
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


## Centralisation : les trois étapes réalisées

* Les 34 références d’indices sont dans `index-facts.js`, par identifiant stable et
  photographie. Les nombres exacts, objectifs nominaux de méthodologie et fourchettes
  restent distincts. Les descriptions des 13 familles sont générées depuis ce registre.
* La Bibliothèque de données (`/bibliotheque-donnees`) recherche 142 instruments,
  34 indices, 24 séries et 44 définitions par ISIN, ticker, nom et identifiant.
  Elle indique les registres, sources, dates, devises, périmètres et outils consommateurs.
  Chaque fiche propose un lien direct et un export JSON autonome, avec `schemaVersion: 1`.
* `normalizeEvidence` donne le même contrat de lecture et d’export aux différents
  registres : `sourceUrls`, `asOf`, `checkedAt`, `currency`, `scope`, `method`, `note`.
  Une source ou date non établie reste inconnue. Les métadonnées du comparateur, du
  lexique et des séries reprennent les notes existantes, sans nouvelle certification.

Les fichiers de chaque outil restent des façades de compatibilité ; les registres
communs n’importent pas les pages. Les valeurs des rendements et textes existants
ont été conservées, et leurs conventions distinctes n’ont pas été fusionnées.

### Rechercher ou partager depuis la ligne de commande

```sh
npm run data:search -- DCAM
npm run data:search -- msci-usa --type=index
node scripts/search-data.mjs FR001400U5Q4 --json
```

### Mettre à jour une donnée

1. Retrouver la fiche par la recherche et suivre son chemin de registre.
2. Modifier la valeur à cet emplacement, avec sa provenance. Pour une nouvelle date
   d’indice, ajouter une photographie ; conserver les anciennes. Ne pas transformer
   une date de consultation en date de valeur et ne pas confondre titre et société.
3. Actualiser ses métadonnées si une source, devise ou convention a réellement changé.
   Les cartes du catalogue sont dérivées des registres, sans copie de leurs chiffres.
4. Lancer `npm run audit:index-facts`, `npm run audit:data-catalog`, les audits du
   domaine modifié, `npm run build` et `npm run test:tools`. Les deux audits communs
   tournent aussi en CI. Ne pas modifier seulement le texte d’un outil pour corriger
   une donnée partagée.

Les courtiers (`src/pages/broker-comparator/data.js` et `evidence.js`), les faits de
marché et les cas concrets restent propres à leur outil. Leur déplacement vers
`src/data/` faciliterait le rangement, mais ne résoudrait à lui seul aucun doublon
identifié entre outils : à faire lorsqu’un second consommateur apparaît.
Les scénarios, exemples pédagogiques et textes éditoriaux restent distincts des faits.

Les compositions communes migrées le 30/09/2026 conservent les valeurs déjà sourcées
au dépôt. Le TOPIX d’avril et de juillet reste distinct ; les anciennes valeurs World
et ACWI sans date exacte sont archivées sous `legacy-undated`.
Contrôle : `npm run audit:index-facts`, vérification des fiches, build et Playwright.

## Statistiques de ménages

`household-statistics.js` centralise les neuf épisodes de **La France en 100 ménages** : valeurs, unités, population, passage source Insee, dates de publication et consultation, définitions et modèles de tweets. Les textes et les images utilisent les mêmes valeurs ; neuf fiches sont ajoutées au catalogue recherchable.

La référence « début 2024 » est conservée sans inventer de date précise (`asOf: null`). Les grilles de détention sont arrondies à l’entier et accompagnées du taux exact. La concentration du patrimoine sépare les 50 ménages et leur part de patrimoine (7 %). Les deux grilles Livret A / assurance-vie ne sont pas des groupes exclusifs.

`npm run audit:household-statistics` contrôle le registre ; le parcours Playwright vérifie les neuf images, les textes, les exports et la mise en page mobile. Pour ajouter un sujet, fournir d’abord une donnée publiée, son unité, son périmètre et sa source ; aucune distribution ne doit être déduite d’une simple moyenne.
