# Générateur de portefeuilles — Patrimoine & Compagnie

Générateur React (single-file, autonome) de portefeuilles d'investissement
illustratifs pour un compte X d'éducation financière. Chaque génération pioche
dans une **bibliothèque de thèses curatées** (pas de tirage aléatoire d'actifs
sans lien entre eux) : chaque combinaison a une logique narrative assumée
(Prudent, Défensif, Anti-Inflation, Rentier, Équilibré, Pro-Européen,
Dynamique, Offensif), avec un pourcentage validé pour respecter une borne de
« pire année » propre à son palier de risque.

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
- `src/theses.js` — bibliothèque de thèses de portefeuille : chaque thèse
  regroupe 1-3 combos (liste d'actifs + %), des accroches/sous-titres/CTA/
  avertissements (5 variantes chacun, jamais génériques), et un texte
  "💡 pourquoi" par actif qui explique son rôle dans **cette** combinaison
  précise. Un slot peut porter `idOptions` (liste d'émetteurs interchangeables,
  ex. `GOLD_OPTIONS`) plutôt qu'un `id` unique. Les bornes de pire année par
  palier (`TIER_WORST_BOUNDS`) y sont définies — `validate-combos.js` (non
  committé) revalide chaque combo pour **toutes** les combinaisons possibles
  d'`idOptions` avant tout changement.
- `src/engine.js` — moteur de génération : tire une thèse (filtrée par palier
  si l'utilisateur en choisit un) et un combo, tous deux pondérés vers les
  moins utilisés dans la session ; résout chaque slot `idOptions` en excluant
  d'abord les émetteurs qui dépasseraient 40% de fréquence puis en favorisant
  le moins utilisé ; applique un léger jitter de pourcentages toujours
  revalidé contre la borne de pire année ; rejette une combinaison trop
  proche de la précédente génération du même profil (même actif dominant
  >35%, ou même trio de tête) ; fait tourner accroche/sous-titre/CTA sans
  jamais répéter avant d'avoir épuisé les 5 variantes du profil ; calcule les
  6 performances annuelles, détecte une année exceptionnelle portée par un
  seul actif (ex. Bitcoin — marquée "non représentatif") ou une comparaison
  au MSCI World ; assemble le texte final selon le squelette strict du brief.
- `src/copy.js` — constantes fixes (séparateur, disclaimer, ligne de garantie).
- `src/App.jsx` / `src/index.jsx` — interface (carte imitant un post X,
  sélecteur de palier de risque, indicateur pire-année/objectif, répartition,
  graphique de performance, bouton copier).

Une suite de vérification (`verify.js`, non committée) contrôle automatiquement
à chaque changement : bornes de pire année par palier, présence d'un 💡 par
actif, ligne de garantie unique, absence de "meilleure année", CTA non
génériques — voir l'historique de conversation pour la méthode.

## Reconstruire le fichier autonome

```bash
cd portfolio-generator
npm install
npx esbuild src/index.jsx --bundle --minify --format=iife --loader:.jsx=jsx --outfile=dist/bundle.js
node build-html.js
```

`build-html.js` inline le bundle React et les deux polices (`fonts/*.woff2`,
Fraunces et IBM Plex Mono) en base64 dans `dist/index.html`.
