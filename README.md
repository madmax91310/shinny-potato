# Épargnant Libre — outils éditoriaux

Application React + Vite pour préparer des contenus pédagogiques sur l'investissement. Elle est publiée sur [GitHub Pages](https://madmax91310.github.io/shinny-potato/). Les textes et graphiques produits restent à relire avant publication : les données financières et les offres commerciales peuvent changer.

## Outils disponibles

L’[inventaire automatique](docs/app-inventory.md) liste toutes les routes accessibles,
les effectifs du catalogue et la couverture des champs. `npm run inventory` le
régénère depuis les registres ; chaque build vérifie les correspondances entre
navigation, routes et modules. La collecte ETF quotidienne versionne son actualisation.

Le comparateur d’indices reste un moteur interne sans route publique. Les moteurs
conservés et les liens de compatibilité sont distingués des outils accessibles.


## Hey @Grok

`/hey-grok` prépare uniquement une question à copier sur X, sans appel à une IA ni publication automatique. La banque contient 280 questions, sur 8 sujets et 20 mécaniques indépendantes, dont 250 « Tout public » (89,3 %). La sélection manuelle « Ça va débattre » contient 47 questions. Sujet, mécanique, recherche, sélection éditoriale, favoris et filtre « Non utilisés » s’appliquent aussi au tirage ; les questions vues ne reviennent qu’après redémarrage explicite de la sélection épuisée ou nouvelle session. Une sélection vide propose de réinitialiser les filtres sans les modifier silencieusement.

Le compteur utilise `twitter-text` (comptage pondéré X, liens et emojis compris) et bloque la copie au-delà de 280 caractères. Les métadonnées de sujet et de mécanique ne sont pas copiées. Copier ne marque jamais « Utilisé ». Les 160 identifiants d’origine et la clé de stockage restent stables : favoris, usages et brouillons v1 restent disponibles. Un stockage illisible est signalé et conservé tant qu’il n’est pas effacé explicitement. Le calendrier reste inchangé.

La [relecture éditoriale](docs/hey-grok-editorial-review.md) documente les choix, les reformulations et la conservation des données. `npm run test:hey-grok` valide toute la banque et les intersections des filtres (également exécuté avant chaque build). Après compilation, `npm run test:hey-grok:browser` exerce les parcours Chromium à 1280, 390 et 320 px, les deux axes combinés, la copie, les limites, l’épuisement, la persistance v1 et les échecs du stockage/presse-papiers. Ce parcours est inclus dans les contrôles navigateur de la CI.

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

Les preuves et limites du comparatif courtiers sont documentées dans
[la revue du 13 octobre](docs/broker-confirmation-review-2026-10-13.md).

## Maintenir les frontières du code

Le [relevé structurel du 26 octobre](docs/maintainability-audit-2026-10-26.md)
donne les constats, contrats, consommateurs et validations des lots.

- Les routes et métadonnées viennent de `src/tools.js` et `src/App.jsx` ; les
  créneaux viennent de `src/data/editorial-calendar.js`. Conserver les anciens liens.
- `src/data`, `src/lib` et `src/design-system` n'importent pas les pages.
  Les moteurs de calcul n'importent ni composants, ni DOM, ni stockage.
- Les séries de placement communes entrent par `src/lib/investment-series.js` ;
  conventions et qualification restent explicites chez l'appelant. Les modèles de
  présentation sont dans `presentation-shared/image-model.js`, le dessin dans `imageExport.js`.
- Un outil garde sa sélection et sa rédaction spécifiques dans son dossier. Avant de
  mutualiser une règle, identifier ses consommateurs et prouver le même contrat financier.
- Les observations viennent des collecteurs ; les projections viennent des `scripts/build-*`
  et plugins Vite. Modifier la source ou le générateur, jamais une projection à la main.

Pour ajouter ou modifier un outil : lire `CLAUDE.md`, mettre à jour registre/routes
et liens existants, garder le chargement différé, puis vérifier le moteur et tous
les consommateurs de ses modules communs. `npm run audit:architecture` contrôle les
cycles et frontières avant chaque build ; `--json` sur
`scripts/audit-module-boundaries.mjs` liste les imports réels. Compléter par
`npm run build`, les audits financiers pertinents, les parcours Chromium et les
exports réels. Les budgets de routes ne remplacent pas ces vérifications.

## Déploiement

Le workflow `.github/workflows/deploy-pages.yml` publie la branche `master` sur GitHub Pages après réussite des contrôles. Une pull request exécute les vérifications sans publication.

La revue hebdomadaire des données reste informative. Chaque lundi, `.github/workflows/review-freshness.yml` exécute `scripts/data-review-reminder.mjs`, qui consomme directement le calendrier de `buildReview` dans `src/pages/data-review/lib.js`, également utilisé par l’interface « Données à revoir ». Les rappels portent sur les échéances prévues dans les sept prochains jours ou déjà échues, selon le type de donnée, ainsi que sur les échéances des offres. Ils sont regroupés par date ; une même donnée et une même échéance ne déclenchent pas de nouveau rappel si une issue existe déjà, même fermée. Les réserves, archives et champs sans échéance exploitable restent consultables dans l’interface sans déclencher seuls un rappel. Une erreur de rappel ne bloque jamais le déploiement. Les dates signalées ne prouvent pas qu'un chiffre est devenu faux.

Le générateur `/france-100-menages` propose 17 sujets et sept rendus PNG : Ivoire & noir, Bleu & blanc, Prune & sable, original, affiche typographique, éditorial clair et cartes contrastées. Le paramètre `design` conserve le rendu choisi dans l’URL. Les huit sujets supplémentaires portent sur le niveau de vie, les salaires et les différences selon l’âge ou la catégorie sociale. Les statistiques de personnes et de salariés sont identifiées explicitement, avec leur champ, leur période et le statut provisoire le cas échéant. Les salaires sont nets de cotisations avant impôt, en EQTP ; les nouveaux patrimoines par âge sont bruts.

Trois nouvelles compositions sont disponibles dans La France en 100 : Ivoire & noir (par défaut), Bleu & blanc et Prune & sable. Elles couvrent les taux, les seuils en euros, les parts de patrimoine et les comparaisons. Les quatre rendus précédents restent accessibles, y compris via leurs liens partagés.

Les 18 profils de Portefeuille d’investisseur disposent d’une présentation courte sourcée dans `src/data/investor-profiles.js`. La même phrase préremplit l’éditeur et le tweet ; elle est modifiable et réinitialisable. Les sources biographiques sont affichées dans l’application, séparées de celles des déclarations 13F.

### Actualisation automatique des portefeuilles 13F

Tous les profils définis dans `scripts/update-investor-13f.py` sont contrôlés chaque jour
à 12 h 25 UTC par `.github/workflows/update-investor-13f.yml`, sans clé API, depuis
l’API publique de FolioFact. Pour Bill Ackman, le collecteur compare aussi la déclaration
disponible chez Tracefour et la retient si son trimestre est plus récent et validé.
À chaque ouverture ou changement d’investisseur, l’application charge le fichier
correspondant dans `public/data/investors/`, avec revalidation du cache. Les nouveaux fichiers sont commités puis le workflow
réutilisable de déploiement construit, contrôle et publie ce commit sur GitHub Pages.
L’appel explicite évite de dépendre d’un événement push émis par `GITHUB_TOKEN`, qui ne
déclenche pas le déploiement habituel. Le déploiement est également retenté au contrôle
suivant si les données n’ont pas changé.

Toutes les réponses sont validées avant écriture. Une erreur du fournisseur ou un retour
à un trimestre plus ancien fait échouer le contrôle et conserve les fichiers précédents.
Les corrections du trimestre courant restent acceptées ; lors du passage au trimestre
suivant, la photographie précédente est archivée. La fraîcheur dépend de la
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
Les séries raccordées sont renouvelées par les collecteurs mensuels ; la période disponible et la provenance sont celles du registre actif, consultables dans la Bibliothèque de données.

Les portraits des investisseurs sont stockés localement avec leurs sources et crédits dans `public/asset-art/investors/sources.json`.

Le vendredi midi est consacré aux présentations de placements, en alternance SCPI et assurance-vie. Le comparatif ETF conserve son créneau du lundi midi en alternance avec le lexique.

### Chargement des outils et des formats

Les six formats de publication ont chacun une entrée différée dans
`src/pages/tweet-midi/formats/` et un moteur dans `engines/`. Ils partagent les
contrôles de `Workspace.jsx` et les fonctions pures de `engine.js`, avec uniquement
les sources du format sélectionné. `/tweet-midi` conserve son fonctionnement mixte
pour les anciens liens. Les rendus d’images sont importés à la demande.

À chaque compilation, `scripts/project-tool-data.mjs` dérive les historiques utilisés
par les outils et les métadonnées de revue depuis les registres canoniques. La recherche
charge un index léger, puis une fiche JSON complète par sélection ; son URL contient
une empreinte du contenu pour éviter les mélanges entre versions. Les valeurs,
preuves historiques et exports JSON restent complets. Ne pas éditer ces projections :
modifier leurs registres sources, puis relancer la compilation.

`node scripts/test-format-loading.mjs --built` compare les sélections, textes,
échéances, liens de maintenance et fiches exportées. Les budgets par route et les
tests navigateur vérifient aussi l’absence de chargements financiers sans rapport
avec les formats légers, ainsi que la reprise d’une fiche après une erreur réseau.

## Outil retiré

Portefeuilles IA a été retiré. L’ancienne URL revient à l’accueil ; les données et collectes utilisées par les autres outils sont conservées. Le [périmètre et les vérifications](docs/suppression-portefeuilles-ia.md) distinguent les composants supprimés des éléments partagés.
