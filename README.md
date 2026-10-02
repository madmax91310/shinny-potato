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

Le comparatif de courtiers compte encore neuf conclusions corroborées sans confirmation officielle explicite. Voir l’[état des preuves au 30 septembre 2026](scripts/BROKER-AUDIT-CLOSURE-2026-09-30.md) ; la vérification intégrale n’est pas achevée.

## Déploiement

Le workflow `.github/workflows/deploy-pages.yml` publie la branche `master` sur GitHub Pages après réussite des contrôles. Une pull request exécute les vérifications sans publication.

La revue hebdomadaire des données reste informative. Tous les 180 jours à partir du 27 septembre 2026, `.github/workflows/review-freshness.yml` ouvre une issue de rappel avec les priorités de vérification. Une issue par période est créée, même si le workflow tourne chaque lundi ; une erreur de rappel ne bloque jamais le déploiement. Les dates signalées ne prouvent pas qu'un chiffre est devenu faux.

Le générateur `/france-100-menages` propose 17 sujets et sept rendus PNG : Ivoire & noir, Bleu & blanc, Prune & sable, original, affiche typographique, éditorial clair et cartes contrastées. Le paramètre `design` conserve le rendu choisi dans l’URL. Les huit sujets supplémentaires portent sur le niveau de vie, les salaires et les différences selon l’âge ou la catégorie sociale. Les statistiques de personnes et de salariés sont identifiées explicitement, avec leur champ, leur période et le statut provisoire le cas échéant. Les salaires sont nets de cotisations avant impôt, en EQTP ; les nouveaux patrimoines par âge sont bruts.

Trois nouvelles compositions sont disponibles dans La France en 100 : Ivoire & noir (par défaut), Bleu & blanc et Prune & sable. Elles couvrent les taux, les seuils en euros, les parts de patrimoine et les comparaisons. Les quatre rendus précédents restent accessibles, y compris via leurs liens partagés.

Les 11 profils de Portefeuille d’investisseur disposent d’une présentation courte sourcée dans `src/data/investor-profiles.js`. La même phrase préremplit l’éditeur et le tweet ; elle est modifiable et réinitialisable. Les sources biographiques sont affichées dans l’application, séparées de celles des déclarations 13F.

### Actualisation automatique des portefeuilles 13F

Les huit profils Tracefour chargent la dernière photographie disponible à chaque ouverture
ou changement d’investisseur, avec revalidation du cache. Li Lu, Gates Foundation Trust et
Seth Klarman sont contrôlés chaque jour à 12 h 25 UTC par `update-investor-13f.yml`,
sans clé API, depuis FolioFact. Les nouveaux fichiers sont commités puis le workflow
réutilisable de déploiement construit, contrôle et publie ce commit sur GitHub Pages.
L’appel explicite évite de dépendre d’un événement push émis par `GITHUB_TOKEN`, qui ne
déclenche pas le déploiement habituel. Le déploiement est également retenté au contrôle
suivant si les données n’ont pas changé.

Toutes les réponses sont validées avant écriture. Une erreur du fournisseur ou un retour
à un trimestre plus ancien fait échouer le contrôle et conserve les fichiers précédents.
Les corrections du trimestre courant restent acceptées. La fraîcheur dépend de la
publication des déclarations et de leur intégration par les sources ; les dates de
photographie affichées ne sont pas remplacées par la date du contrôle.

Vérification : `python -m unittest discover -s scripts -p test_investor_refresh.py`.

Les tweets investisseurs ajoutent un encart de quatre mouvements au maximum,
issus de la comparaison trimestrielle fournie par Tracefour ou FolioFact : nouvelles
lignes, variations du nombre d’actions et sorties. Les données sont conservées avant
le regroupement des catégories d’actions. Une variation de poids ne sert jamais à
inférer un achat ou une vente. Sans mouvement exploitable ou comparaison disponible,
l’encart est omis. Les mêmes récupérations automatiques actualisent cet encart.

Huit entreprises supplémentaires sont disponibles dans le Calculateur et Performance depuis :
Costco, McDonald’s, Air Liquide, Schneider Electric, Hermès, L’Oréal, Intel et PayPal.
Les dernières clôtures quotidiennes ajustées Yahoo de chaque mois couvrent janvier 2015
à septembre 2026 pour Costco, McDonald’s et Intel ; août 2015 pour PayPal ; janvier 2016
pour Schneider, Hermès et L’Oréal ; janvier 2017 pour Air Liquide. Les cours ajustés
simulent le réinvestissement des dividendes et tiennent compte des divisions, hors frais
et fiscalité ; la prime de fidélité Air Liquide est exclue. Les mêmes données alimentent
le versement unique, le DCA, les vidéos et les rendements annuels, sans modifier les anciens actifs.
Elles sont exclues du format Anniversaire, qui affiche un prix historique brut : une
clôture ajustée ne correspond pas au prix effectivement coté à cette date.
Capture et limites : scripts/source-snapshots/calculator-companies-2026-10-02.json.
Ces séries sont figées au dernier contrôle ; leur ajout ne crée pas d’actualisation programmée.
