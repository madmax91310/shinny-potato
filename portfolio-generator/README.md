# Générateur de portefeuilles — Patrimoine & Compagnie

Générateur React (single-file, autonome) de portefeuilles d'investissement
illustratifs pour un compte X d'éducation financière. Chaque génération pioche
dans une **bibliothèque de combinaisons curatées** (pas de tirage aléatoire
d'actifs sans lien entre eux), organisée selon **deux axes indépendants** :

- **Le niveau de risque** (5 paliers : Prudent, Défensif, Équilibré,
  Dynamique, Offensif) — défini uniquement par une borne de perte max
  acceptable sur la pire année simulée (ex. Prudent < 5%, Défensif < 10%...).
- **Le profil d'investisseur** (7 thèses : Le Généraliste, Le Rentier, Le
  Pro-Européen, L'Anti-Inflation, Le Bouclier, Le Crypto-Curieux, Le
  Thématique) — défini par une conviction narrative, indépendante du risque.

Seules certaines combinaisons (profil, risque) sont valides (ex. L'Anti-
Inflation n'existe pas en Offensif ; Le Crypto-Curieux n'existe pas en
Prudent) : voir `isCompatible` / `compatibleRisksFor` / `compatibleProfilesFor`
dans `src/theses.js`. Pour chaque paire valide, une seule combinaison
d'actifs est définie, avec un pourcentage validé pour respecter la borne de
« pire année » du palier choisi.

## Utiliser le générateur

Ouvrir `dist/index.html` dans un navigateur — c'est un fichier HTML unique et
autonome (React + polices embarquées en base64, aucune dépendance réseau).

## Structure du code source

- `src/data.js` — bibliothèque d'une cinquantaine d'actifs (fonds réels :
  Amundi, iShares, WisdomTree, CoinShares, Vanguard, SPDR...), chacun avec
  l'émoji de sa classe (🔵 obligataire, 🟢 actions développées, 🟡 or,
  🟠 crypto, 🛢️ autres matières premières, ⚪ immobilier, 🟣 dividendes,
  🟤 émergents), ses rendements annuels 2020-2025 et des descriptions courtes
  variantes. Inclut des "jumeaux de marque" (même sous-jacent, même
  performance : or physique, bitcoin physique, obligations corporate € IG
  chez plusieurs émetteurs) pour varier les noms affichés sans jamais
  inventer un chiffre de performance. Chiffres illustratifs, éditables à la
  main.
- `src/theses.js` — les deux axes :
  - `RISK_ORDER` / `RISK_LABELS` / `RISK_BOUNDS` : les 5 paliers de risque et
    leur borne de pire année (plancher uniquement — Offensif n'a pas de
    plafond).
  - `PROFILES` : les 7 profils, chacun avec `accroches` / `sousTitres` /
    `ctas` / `warnings` (5 variantes chacun, jamais génériques), un texte
    "💡 pourquoi" par actif expliquant son rôle dans **cette** combinaison
    précise, et `riskCombos` — un objet qui ne contient une entrée que pour
    les paliers de risque compatibles avec ce profil (c'est ce qui pilote la
    matrice de compatibilité). Un slot peut porter `idOptions` (liste
    d'émetteurs ou d'alternatives interchangeables, ex. `GOLD_OPTIONS`,
    `WORLD_OPTIONS`) plutôt qu'un `id` unique. Certains profils portent une
    règle toujours ajoutée en plus du tirage aléatoire d'avertissement :
    `capitalNote` (Le Rentier — note de baisse de capital) ou
    `mandatoryWarning` (Le Pro-Européen — sous-performance de l'Europe vs
    les US, jamais optionnelle).
  - `validate-combos.js` (non committé) revalide chaque combinaison (profil,
    risque) pour **toutes** les combinaisons possibles d'`idOptions` — 1188
    sous-combinaisons vérifiées pour les 29 paires valides.
- `src/engine.js` — moteur de génération : tire une paire (profil, risque)
  compatible (filtrée si l'utilisateur a fixé l'un des deux axes), pondérée
  vers les paires les moins utilisées dans la session ; résout chaque slot
  `idOptions` en excluant d'abord les émetteurs qui dépasseraient 40% de
  fréquence puis en favorisant le moins utilisé ; applique un léger jitter de
  pourcentages toujours revalidé à la fois contre la borne de pire année et
  contre les invariantes propres à un profil (ex. Pro-Européen : jamais moins
  de 70% Europe, même après jitter) ; rejette une combinaison trop proche de
  la précédente génération du même profil (même actif dominant >35%, ou même
  trio de tête — best-effort : certains profils ont un actif "ancre"
  narrativement dominant à quasi tous les tirages, ex. le fonds euros à 50%
  du Rentier Prudent ou le JEPQ à 65% du Rentier Offensif, auquel cas la
  règle ne peut pas toujours s'appliquer) ; fait tourner accroche/sous-titre/
  CTA sans jamais répéter avant d'avoir épuisé les 5 variantes du profil ;
  ajoute l'avertissement JEPQ (> 30% du portefeuille) quand il se déclenche
  réellement sur le tirage ; calcule les 6 performances annuelles, détecte
  une année exceptionnelle portée par un seul actif (ex. Bitcoin — marquée
  "non représentatif") ou une comparaison au MSCI World ; assemble le texte
  final selon le squelette strict du brief, avec le titre
  `[Profil] [Niveau de risque]` (ex. "Le Rentier Prudent").
- `src/copy.js` — constantes fixes (séparateur, disclaimer, ligne de garantie).
- `src/App.jsx` / `src/index.jsx` — interface (carte imitant un post X,
  sélecteur en deux étapes — niveau de risque puis profil, chaque rangée
  grisant les puces incompatibles avec la sélection de l'autre axe —
  indicateur pire-année/objectif, répartition, graphique de performance,
  bouton copier).

Une suite de vérification (`verify-two-axis.js`, `verify-pct-and-variety.js`,
non committées) contrôle automatiquement à chaque changement, sur les 29
paires (profil, risque) valides : bornes de pire année, titre correct,
absence de Bitcoin/REIT en Anti-Inflation, plafond Bitcoin 10% en
Crypto-Curieux Défensif, minimum 70% Europe en Pro-Européen avec
avertissement obligatoire, présence et plafonds JEPQ en Rentier Dynamique/
Offensif avec avertissement >30%, présence d'un 💡 par actif sans
placeholder résiduel, ligne de garantie unique, absence de "meilleure
année", plafond de fréquence 40% par actif, rotation accroche/CTA sans
répétition prématurée — voir l'historique de conversation pour la méthode.

## Reconstruire le fichier autonome

```bash
cd portfolio-generator
npm install
npx esbuild src/index.jsx --bundle --minify --format=iife --loader:.jsx=jsx --outfile=dist/bundle.js
node build-html.js
```

`build-html.js` inline le bundle React et les deux polices (`fonts/*.woff2`,
Fraunces et IBM Plex Mono) en base64 dans `dist/index.html`.
