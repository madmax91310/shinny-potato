# Épargnant Libre — outils éditoriaux

Application React + Vite pour préparer des contenus pédagogiques sur l'investissement. Elle est publiée sur [GitHub Pages](https://madmax91310.github.io/shinny-potato/). Les textes et graphiques produits restent à relire avant publication : les données financières et les offres commerciales peuvent changer.

## Outils disponibles

| Outil | Usage |
| --- | --- |
| Calculateur « Et si tu avais investi ? » | Comparer un placement historique au Livret A et à l'inflation. |
| Générateur de portefeuilles | Construire des allocations illustratives selon un profil et un risque. |
| Fiches ETF | Préparer une fiche, un texte et une image. |
| Comparatif courtiers | Préparer une carte et un post comparant deux ou trois courtiers. |
| Tweet Midi | Générer sept formats de publications intemporelles. |
| Comparateur d'indices | Comparer les expositions et ETF d'une famille d'indices. |
| Impact des frais | Illustrer l'effet hypothétique de deux TER. |
| Faits marquants des marchés | Préparer des statistiques historiques sourcées. |
| Cas concrets | Expliquer les conséquences de choix de placement. |
| Banque de tweets | Retrouver des publications et suivre leur période de repos. |

Le registre de navigation et les routes disponibles sont définis dans `src/tools.js`. Les données de chaque outil se trouvent dans `src/pages/<outil>/data.js` ou les fichiers de son dossier.

## Démarrer

```bash
npm ci
npm run dev
```

## Vérifier avant publication

```bash
npm run lint
npm run audit:etf-consistency
npm run audit:performance-consistency
npm run audit:portfolio-provenance
npm run audit:publishable-content
npm run audit:source-inventory
npm run verify:tweet-midi
npm run stress-test:portfolios
npm run check-freshness -- --priorities
node scripts/check-freshness.mjs --missing-json > scripts/source-inventory.json
npm run test:tools
```

Le test navigateur nécessite Chromium (`npx playwright install chromium`). La CI exécute les audits, le build et les contrôles navigateur avant le déploiement. Les audits de cohérence ne remplacent pas la vérification des chiffres auprès des émetteurs ou des grilles tarifaires. Voir `scripts/README.md` pour leur portée et `scripts/DATA-REVIEW-2026-09-24.md` pour les limites documentées des séries.

## Déploiement

Le workflow `.github/workflows/deploy-pages.yml` publie la branche `master` sur GitHub Pages après réussite des contrôles. Une pull request exécute les vérifications sans publication.
