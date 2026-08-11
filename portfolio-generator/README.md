# Générateur de portefeuilles — Patrimoine & Compagnie

Générateur React (single-file, autonome) de portefeuilles d'investissement
illustratifs pour un compte X d'éducation financière. Reproduit à chaque
génération le squelette de tweet fixe (titre, sous-titre, liste d'actifs,
performances 2020-2025, avertissement, disclaimer, question d'engagement),
avec un moteur anti-répétition qui garde en mémoire (state React, session
uniquement) les combinaisons déjà générées.

## Utiliser le générateur

Ouvrir `dist/index.html` dans un navigateur — c'est un fichier HTML unique et
autonome (React + polices embarquées en base64, aucune dépendance réseau).

## Structure du code source

- `src/data.js` — bibliothèque de 40+ actifs (obligataire, actions larges,
  sectoriel, ETF stratégiques, matières premières, crypto, immobilier,
  actions individuelles), chacun avec son risque (1-5), ses rendements
  annuels 2020-2025 et 3-5 descriptions pédagogiques variantes. Les chiffres
  sont des approximations historiques illustratives, éditables à la main.
- `src/copy.js` — textes variantes (intros, accroches par profil de risque,
  avertissements ⚠️, questions d'engagement, profils thématiques).
- `src/engine.js` — moteur de génération : sélection d'actifs diversifiés
  (catégories distinctes), pourcentages cohérents, calcul de performance
  annuelle pondérée, détection de la pire année et d'un fait marquant,
  nommage du profil (risque pondéré + détection thématique), anti-répétition.
- `src/App.jsx` / `src/index.jsx` — interface (carte imitant un post X,
  panneau de contrôle, jauge de risque, répartition, graphique de
  performance, bouton copier).

## Reconstruire le fichier autonome

```bash
cd portfolio-generator
npm install
npx esbuild src/index.jsx --bundle --minify --format=iife --loader:.jsx=jsx --outfile=dist/bundle.js
node build-html.js
```

`build-html.js` inline le bundle React et les deux polices (`fonts/*.woff2`,
Fraunces et IBM Plex Mono) en base64 dans `dist/index.html`.
