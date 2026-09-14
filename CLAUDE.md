# Patrimoine & Compagnie

SPA React (Vite, Tailwind v4, react-router-dom v7) : une suite d'outils qui génèrent du contenu
financier pédagogique prêt à publier (texte + parfois image/vidéo), pour un compte dédié à
l'investissement. Déployé sur GitHub Pages (`.github/workflows/deploy-pages.yml`, push sur
`master`), live sur `https://madmax91310.github.io/shinny-potato/`.

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

Quand un outil a besoin d'une donnée qu'un autre outil possède déjà et a déjà vérifiée, il
l'importe directement plutôt que de la recopier. Exemples : 3 des 7 formats de Tweet Midi
(Fiche lexique, Comparatif ETF, Pouvoir d'achat) sont des façades qui appellent directement les
`data.js`/`lib.js` de lexique-financier, etf-tweets et purchasing-power ; purchasing-power
réutilise la série d'inflation générale de investment-calculator plutôt que de la redéfinir.
Une correction en amont se propage alors automatiquement — mais ça crée aussi un angle mort :
penser à revérifier les outils qui dépendent d'un fichier qu'on modifie.

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
