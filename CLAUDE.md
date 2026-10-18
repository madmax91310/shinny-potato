# Patrimoine & Compagnie

SPA React (Vite, Tailwind v4, react-router-dom v7) : une suite d'outils qui génèrent du contenu
financier pédagogique prêt à publier (texte + parfois image/vidéo), pour un compte dédié à
l'investissement. Déployé sur GitHub Pages (`.github/workflows/deploy-pages.yml`, push sur
`master`), live sur `https://madmax91310.github.io/shinny-potato/`.

## Référence d'audit obligatoire (18/10/2026)

Avant toute modification, appliquer la référence de travail fournie par l'utilisateur :
contrat de chaque outil, règles de données, règles éditoriales et visuelles, calendrier,
recette avant livraison. Elle est chargée automatiquement ci-dessous. En cas de contradiction,
une nouvelle instruction de l'utilisateur prime, puis le code actuel ; requalifier l'état
courant avant d'affirmer qu'un constat de l'audit est toujours vrai.

@docs/claude/audit-application-2026-10-18.md

## Architecture

Chaque outil vit dans `src/pages/<outil>/` avec le même découpage :
- `data.js` — données brutes (actifs, fiches, textes), aucune logique.
- `lib.js` — fonctions pures (calculs, génération de texte), testables sans React.
- `App.jsx` (+ `.css`) — l'UI, ne contient jamais de données en dur.
- `theses.js`/`engine.js` en plus pour le Générateur de portefeuilles (moteur génératif).

`src/tools.js` est le registre central (source unique pour dashboard, nav et routes) ;
`src/App.jsx` mappe chaque route vers son composant. Un outil listé dans `tools.js` sans entrée
dans `TOOL_ELEMENTS` retombe sur `ComingSoon`.

## Philosophie de sélection — pas de ligne "parce qu'il en fallait une de plus"

Chaque entrée d'une bibliothèque de données (actif du Générateur de portefeuilles, fiche ETF,
courtier, terme de lexique...) doit avoir un rôle identifié dans au moins un usage réel de
l'outil. Quand ce n'est plus le cas, elle est retirée plutôt que laissée traîner :
- 8 actifs sans rôle identifié ont été retirés du roster du Générateur de portefeuilles en août
  2026 (cf. `src/pages/portfolio-generator/data.js`).
- Le scope des Fiches ETF est fixé explicitement par consigne utilisateur (ex. "Cœur de
  portefeuille" restreint à World/ACWI/All-World) plutôt qu'étendu par ajout arbitraire.

Ce principe s'étend au code : un fichier ou un composant qui n'est plus routé/importé nulle part
est du code mort à supprimer, pas à laisser "au cas où" (cf. suppression des `App.jsx` orphelins
d'etf-tweets/lexique-financier/purchasing-power le 14/09/2026, une fois vérifié qu'aucun import
résiduel n'y pointait).

## Pas de duplication de données entre outils

Les produits identifiés par ISIN sont référencés dans `src/data/instruments.js` :
nom commun, variantes de libellé par outil et éligibilité PEA lorsqu'elle est documentée
dans les Fiches ETF. Les frais sont dans `src/data/etf-ter.js`. Ajouter un produit à ces
répertoires avant de l'utiliser dans Fiches ETF, Comparatif ETF, Comparateur d'indices ou
Générateur de portefeuilles ; `npm run audit:instrument-catalog` vérifie les références.
Une absence de statut PEA signifie « non documenté », jamais « non éligible ».
Les caractéristiques statiques des 41 parts des Fiches ETF sont dans
`src/data/instrument-facts.js` : indice exact, politique de distribution, méthode de
réplication, domicile et source datée par ISIN. Le champ `reviewedAt` hérité date la revue
de la fiche, tandis que `characteristicsSource.checkedAt` date le contrôle de ces quatre
champs ; aucun des deux ne date implicitement l'encours. Les cotations sourcées sont dans `src/data/instrument-listings.js` : ticker, MIC, place,
devise de négociation, source et date de contrôle. Les outils utilisent une référence
`listing` sélectionnée par `getPreferredInstrumentListing`, avec préférence EUR et Paris.
Les tickers ne doivent pas être recopiés dans les outils ou dans les caractéristiques.
Les libellés éditoriaux ne sont pas certifiés par le contrôle des caractéristiques.
`getInstrumentPeaStatus` retourne `null` quand le statut est inconnu.
Les contrôles PEA individuels faits après la revue des fiches sont consignés dans
`src/data/instrument-pea.js` (ISIN, source, date, valeur `true`/`false`/`null`).
Ils priment sur le statut historique des fiches. Les comparatifs peuvent utiliser
`affirmInstrumentPea` pour empêcher la publication d'un libellé éditorial PEA
contradictoire ou non documenté. Les groupes d'indices peuvent contenir à la fois
une part PEA et d'autres parts dont le statut est inconnu.
Les performances et encours gardent leur propre part, devise, méthode, date et source dans
les données de l'outil : un rendement d'indice ne remplace pas celui d'un fonds.
Les libellés de convention (devise, dividendes, conversion, période, note de méthode d'un indice)
se composent via `src/lib/performance-conventions.js`, jamais en texte libre dans un outil.
Les paramètres réglementaires viennent de `automated-regulatory.json` et `automated-economic.json` ;
les taux du PEL par génération d'ouverture sont collectés dans la fiche DILA F16140, stockés dans
`automated-regulatory.json` et exposés par `src/data/pel-rates.js`. Le taux d'épargne et le taux
du prêt ne sont jamais interchangeables ; une ouverture future reste non qualifiée.

Quand un outil a besoin d'une donnée qu'un autre outil possède déjà et a déjà vérifiée, il
l'importe directement plutôt que de la recopier. Exemples : 3 des 6 formats de Tweet Midi
(Fiche lexique, Comparatif ETF, Pouvoir d'achat) sont des façades qui appellent directement les
`data.js`/`lib.js` de lexique-financier, etf-tweets et purchasing-power ; purchasing-power
importe les niveaux mensuels INSEE automatisés pour comparer une moyenne annuelle et une
observation datée dans la même base. Le calculateur conserve ses variations mensuelles,
qui répondent à une autre convention.
Une correction en amont se propage alors automatiquement — mais ça crée aussi un angle mort :
penser à revérifier les outils qui dépendent d'un fichier qu'on modifie.

La recherche commune et l’export JSON sont dans `src/data/catalog.js` et accessibles
via `/bibliotheque-donnees` ou `npm run data:search -- <requête>`. Le catalogue dérive
les valeurs de leurs registres ; il ne doit pas les recopier. `normalizeEvidence`
(`src/data/evidence.js`) distingue toujours asOf (photographie), checkedAt (contrôle),
sourceUrls, currency, scope, method et note ; les inconnues restent null ou une liste vide.
`audit:data-catalog` contrôle la couverture, les métadonnées et les consommateurs.
Les familles et fiches d’indices sont dans `index-comparisons.js` et `index-factsheets.js` ;
leurs anciens data.js sont des façades. Les séries d’indices restent dans `index-returns.js`,
distinctes des séries de fonds par ISIN. Les registres communs n’importent pas les pages.

Les compositions d’indices sont dans `src/data/index-facts.js`, par identifiant et date
explicite de photographie (source, comptage de titres, pays, secteurs, principales lignes).
Les Fiches d’indices et le Comparateur d’indices consomment ce registre. Une nouvelle date
ajoute une photographie ; elle ne remplace pas les anciennes. `legacy-undated` conserve
les anciens comptages dont la date exacte manque, sans les utiliser comme valeurs actuelles.
Les nombres nominaux de sociétés (S&P 500, Nasdaq 100) ne sont pas des comptages de titres.
`npm run audit:index-facts` contrôle les références, sources, dates et divergences et tourne en CI.

## Méthode de sourcing

- WebFetch est bloqué dans ce sandbox — seul WebSearch (résumé par IA) est disponible, et ses
  résultats sont parfois internellement incohérents d'une requête à l'autre.
- Toute donnée de marché incertaine se recoupe sur **une deuxième requête indépendante**,
  reformulée plutôt que répétée à l'identique, avant d'être retenue.
- Chaque donnée sourcée porte un commentaire inline : source, date, niveau de confiance. Jamais
  une correction silencieuse sans laisser de trace de ce qui a changé et pourquoi.
- Une contradiction non résolue entre sources ne se tranche jamais au hasard : elle est
  documentée comme telle dans le commentaire (cf. `NON VÉRIFIÉ`, `à corriger si...` dans
  `investment-calculator/data.js` et `portfolio-generator/data.js`), pas remplacée par une
  valeur choisie arbitrairement.
- Les ISIN et TER sont revérifiés en cas de doublon apparent entre outils (Fiches ETF, Tweet
  Midi, Comparateur d'indices, Générateur de portefeuilles décrivent parfois le même fonds) —
  un audit croisé a trouvé et corrigé une vraie erreur de TER le 13/09/2026.

## Générateur de portefeuilles — bornes de risque

Toute modification du poids d'une ligne à risque (ETF à levier, Bitcoin...) dans un `riskCombo`
de `theses.js` doit être revalidée avec `scripts/stress-test-portfolios.mjs` (mode `combo`) avant
d'être committée — jamais un ajustement au jugé. Voir `scripts/README.md`.

## Discipline de test

- Après toute modification de données ou de logique : `npm run build`, puis un test en
  navigateur réel (Playwright, Chromium à `/opt/pw-browsers/chromium`) qui exerce le
  changement — pas seulement une vérification par script.
- Un changement qui touche une donnée partagée entre outils (cf. section duplication
  ci-dessus) se teste dans les DEUX outils, pas seulement celui qu'on modifie directement.

## Déploiement

Le travail se committe et se pousse librement sur la branche de travail. Le déploiement en
production (push sur `master`, qui déclenche `deploy-pages.yml`) demande toujours une
confirmation explicite et séparée — jamais déduit d'une simple approbation du changement.

## Automatisations et portail de déploiement

Les collecteurs programmés (`.github/workflows/update-*.yml`) committent leurs données validées
via `scripts/commit-validated-data.sh`, puis appellent `deploy-pages.yml`. Pour que l'appli
s'alimente seule sans qu'un test sans rapport retienne les données :
- **Voie « données »** : `scripts/classify-deploy-scope.mjs` compare le commit au commit en ligne
  (lu dans `build-info.json` publié avec le site). Si seuls des chemins de données
  d'automatisation ont changé, le code est celui d'un instantané déjà validé : les contrôles
  navigateur éditoriaux deviennent consultatifs (job `advisory-checks`, incident « Publiée,
  contrôle à réparer »). Build, tests Python et `smoke-data-routes.mjs` restent bloquants.
  Code modifié, PR ou doute : portail complet.
- **Un test ne fige jamais une donnée actualisée par un collecteur** (performance, encours,
  date de dernière observation, année de fin de période) : il lit sa valeur attendue dans le
  registre de données. Sinon chaque collecte légitime casse le portail.
- **Un collecteur isole ses échecs** : une source en panne garde sa dernière valeur validée,
  les autres sont enregistrées et publiées, et l'échec reste visible (`report-failures`,
  issue « Fiabilité des données », écran « Données à revoir »).
- **Voie de secours** : si le portail complet échoue sur un instantané dont le code a changé,
  `fallback-build` recompose le dernier code publié + les nouvelles données
  (`scripts/compose-fallback-snapshot.mjs`), rebuild, smoke test, puis publie
  (`build-info.json` porte `sha` du code et `dataSha` des données). Les contrôles en échec restent rouges.
  Un fichier de données qui nomme un actif inconnu du code publié (ISIN valide ou clé absente
  de tout l'arbre publié) garde sa version publiée : ces actifs attendent le nouveau code.
- **Règles de fraîcheur** : un seul registre, `src/data/freshness-policy.json` (seuils par
  famille de champs et calendriers de sources). Ne jamais réécrire un seuil en dur.
- **Voies d'accès émetteurs** : `scripts/issuer-access-routes.json` (portails VanEck, API
  WisdomTree, composants BlackRock, miroir BNP), lu par les collecteurs.
- **Répétition mensuelle** : `rehearse-refresh.yml` rejoue le mois suivant, une panne BCE et le
  passage d'année (`scripts/simulate-refresh.mjs`) ; un échec y annonce une collecte future bloquée.
- **Textes officiels modifiés** : la surveillance ouvre une PR qui ajoute le nouveau texte à
  `scripts/accepted-source-wording.json` ; la fusionner vaut validation humaine.
- **PR et fichiers régénérés** : une PR ne committe pas les rapports et projections que le build
  ou les collecteurs régénèrent (`docs/*-coverage*`, `docs/asset-tool-routing.*`, `docs/automation-gaps.*`,
  `src/data/ranking-annual.json`, projections `src/pages/dca-profiles/*.json`…), sauf si elle modifie
  leur générateur. Les tests qui les lisent les régénèrent avant. Sinon chaque collecte ou PR parallèle
  crée un faux conflit et oblige à relancer la CI.
