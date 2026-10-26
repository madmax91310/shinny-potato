# Complément des logos des indices

Base initiale : `master` `93affb1d012ec8fede186784c4887dd7e486bc41`, après #971. Les 22 évolutions indépendantes jusqu’à `21671ca1e756820404552c99313ca5e5c754dd79` ont ensuite été intégrées, dont #974 et #976 ; le recensement a été régénéré et reste à 203 entreprises / 560 apparitions. Branche : `feat/index-company-logo-completion`. Les PR concurrentes #974 et #976 ont été examinées avant modification. Leurs refactorisations et collectes financières restent hors périmètre. Les PR ouvertes #977 et #978 ont également été contrôlées : leurs fichiers de collecte et d’historique DCA sont préservés.

Le rendu validé est conservé : ivoire, pêche, lavande, turquoise et relief. La mention « bleu glacier » a été explicitement écartée par l’utilisateur. Aucune composition, pondération, performance, conversion, qualification ou collecte n’est modifiée.

## Couverture recalculée

Le [recensement initial réel](before.json) a été recalculé depuis les données affichables courantes : 55 fiches, 34 Top 10 qualifiés, 560 apparitions, **203 entreprises distinctes**.

| Mesure | Avant | État local actuel |
|---|---:|---:|
| Entreprises distinctes | 203 | 203 |
| Logos locaux disponibles | 70 | 202 |
| Ajouts de ce chantier | — | 132 |
| Entreprises en initiales | 133 | 1 |
| Entreprises des fiches principales | 116 | 116 |
| Logos dans les fiches principales | 51 | 115 |
| Initiales dans les fiches principales | 65 | 1 |

Les 70 fichiers de départ comprennent les 48 réutilisations et les 22 ajouts de #971 ; ces 22 ne sont pas recomptés dans les 132 ajouts actuels. Le [bilan détaillé](logo-coverage.json), le [CSV](logo-coverage.csv), la [liste des ajouts](added.json) et les [provenances](../../public/asset-art/index-logos/sources.json) permettent de vérifier les compteurs.

Le raccordement explicite contient désormais 184 ISIN issus des positions déjà affichables, avec leurs preuves dans les apparitions du recensement. Le nouvel alias exact `Micron Technology Inc.` est synchronisé avec l’identité Micron existante : il ne crée pas une entreprise supplémentaire. Le générateur privilégie les ISIN vérifiés et refuse un conflit nom/identifiant. Les classes Alphabet et Samsung conservent leur identité commune de marque et leurs traitements financiers préexistants ; les autres entreprises Samsung restent séparées.

## Recherche et limites encore ouvertes

Les **133 entreprises initialement manquantes** ont toutes été examinées : **132 logos officiels ajoutés**, un seul cas conservé en initiales. Le [journal des sources](source-research.json), le [bilan de recherche exhaustif](research-complete.json) et les [preuves complémentaires](remote-source-research.json) distinguent pages, CSS, navigateur, réponses HTTP et candidats rejetés. Un candidat n’est jamais compté comme couvert.

[Berkshire Hathaway](unresolved.json) reste en initiales. La page corporate affiche son nom en texte HTML ; son seul fichier image représente GEICO, une filiale. Les deux premières pages du rapport annuel officiel 2025 ne contiennent pas d’images intégrées (`pdfimages -f 1 -l 2 -list`). Aucun fichier de marque officiel autonome exploitable n’a été identifié dans les sources consultées. Aucune typographie reconstruite, vectorisation tierce ou marque de Berkshire Hathaway HomeServices n’a été substituée. Le dossier conserve les URL, empreintes et constats ; il ne prétend pas prouver l’absence d’un logo partout.

Une panne temporaire du proxy a empêché les téléchargements du terminal vers 11:44–12:34 UTC. La recherche a continué sur une branche GitHub isolée, avec contrôle TLS conservé et revue humaine des candidats ; aucun de ces scripts de collecte temporaires n’est ajouté à la branche produit. Après rétablissement, les derniers fichiers ont été récupérés et `master` actualisé. Les cas accessibles n’ont pas été abandonnés à cause de cette panne.

Des candidats ont été rejetés puis remplacés : Nu (PNG RI de 44 × 24 px → PNG officiel de 1722 × 937 px du kit presse), le bandeau SK Hynix Newsroom (→ marque du pied de page corporate), le symbole Deutsche Telekom distant (→ SVG autonome extrait du sprite officiel), une photo Alibaba (→ marque du bandeau), des marques de clients de Cisco/Motorola et celles de filiales sur les pages Berkshire/Unipol. Aucun logo de maison mère n’est automatiquement substitué à celui d’une filiale.

Le logo American Tower provient du fichier fourni par l’émetteur dans son propre communiqué officiel Business Wire ; l’identifiant du communiqué est lié depuis ses RI. Il ne provient pas d’un catalogue de logos. Pour Chevron, le groupe vectoriel complet de la marque corporate est extrait sans changer ses tracés de l’en-tête officiel Brand Center ; son intitulé de portail séparé est exclu. Les marges blanches extérieures du JPEG Sanofi sont recadrées sans changer les pixels conservés. Ces transformations et leurs empreintes d’origine sont explicites dans le manifeste.

Les changements de nom Everpure et Vivmark ont été contrôlés sur les publications des sociétés :

- [Pure Storage devient Everpure](https://www.everpuredata.com/company/newsroom/press-releases/pure-storage-becomes-everpure.html).
- [Lancement de Vivmark Residential](https://investors.vivmarkresidential.com/news-events/press-releases/detail/113/vivmark-residential-launches-as-one-of-the-countrys-leading-real-estate-companies).
- [Présentation du groupe coté Zhongji InnoLight](https://www.zj-innolight.com/cn/about.html), distinct de sa filiale opérationnelle.

## Rendu et robustesse

Les logos sont locaux, avec empreintes SHA-256, URL officielle et date de vérification. Les SVG inline conservent leurs tracés ; leurs styles calculés sont incorporés lorsque nécessaire pour garder les couleurs officielles. Aucun service de logos externe n’est utilisé lors de l’aperçu ou de l’export.

Les marques blanches utilisent l’insert sombre déjà présent dans #971. Les proportions, couleurs et transparences sont conservées ; les rasters ne sont pas agrandis au-delà de leur taille native, y compris lors d’une nouvelle tentative après erreur. Le relief porte uniquement sur le support.

Le chargement attend maintenant `decode()` et des dimensions non nulles. Une erreur ou un délai dépassé revient aux initiales sans rejet non géré. Une nouvelle tentative contourne l’entrée invalide du cache d’images du navigateur par un paramètre local de relance. Les identifiants inconnus et mélanges d’entreprises ne reçoivent aucun rapprochement approximatif.

## Preuves visuelles

Les [132 marques contrôlées](visual-checks.json) sont décodées et non vides. Les sept planches montrent chacune les **deux supports réellement utilisés**, de 122 px et 68 px :

[1](previews/logos-1.png) · [2](previews/logos-2.png) · [3](previews/logos-3.png) · [4](previews/logos-4.png) · [5](previews/logos-5.png) · [6](previews/logos-6.png) · [7](previews/logos-7.png).

Les PNG de preuve sont compressés sans perte ; les [empreintes des pixels conservés](png-proof-integrity.json) en attestent. Les [huit comparaisons avant/après](render-comparison.json) utilisent les mêmes données et le même moteur, avec le registre de départ puis le registre actuel. Textes, positions et pixels hors supports de logos sont strictement identiques.

| Exemple | Avant | Après |
|---|---|---|
| Nasdaq-100 | [PNG](previews/nasdaq-pea-main-before.png) | [PNG](previews/nasdaq-pea-main-after.png) |
| S&P 500 | [PNG](previews/sp500-pea-main-before.png) | [PNG](previews/sp500-pea-main-after.png) |
| CAC 40 | [PNG](previews/cac40-main-before.png) | [PNG](previews/cac40-main-after.png) |
| MSCI World | [PNG](previews/world-main-before.png) | [PNG](previews/world-main-after.png) |
| Amérique latine | [PNG](previews/msci-em-latin-america-selection-main-before.png) | [PNG](previews/msci-em-latin-america-selection-main-after.png) |
| MSCI World Enhanced Value | [PNG](previews/msci-world-enhanced-value-main-before.png) | [PNG](previews/msci-world-enhanced-value-main-after.png) |
| Nasdaq Top 10 | [PNG](previews/nasdaq-pea-top10-before.png) | [PNG](previews/nasdaq-pea-top10-after.png) |
| World Top 10 | [PNG](previews/world-top10-before.png) | [PNG](previews/world-top10-after.png) |

## Reproduction des contrôles

- `node scripts/build-index-logo-registry.mjs --check` : empreintes, correspondances et SVG autonomes. L’archive #971 reste inchangée ; la nouvelle photographie de couverture se trouve ici.
- `npm run verify:factsheet-tweets`, `npm run test:index-concentration`, `npm run lint`, `npm run build`.
- `node scripts/test-index-ribbon.mjs` : toutes les fiches, devises/historiques, noms longs, erreurs de logos, export téléphone/ordinateur.
- `node scripts/playwright-index-concentration.mjs` : 34 compositions, géométrie et poids exacts, parcours et téléchargements réels, changement rapide, mobile.
- `node scripts/review-index-company-logos.mjs` : planches utilisant le support exact du moteur partagé.
- `node scripts/compare-index-logo-rendering.mjs` : PNG avant/après et comparaison pixel/textes hors logos.
- `node scripts/playwright-index-relief.mjs` : application compilée, parcours ordinateur/iPhone, changement rapide avec logo retardé, devises et égalité binaire aperçu/téléchargement.

Les statuts effectivement obtenus figurent dans [validation.json](validation.json). La PR, la fusion puis les vérifications Pages / `build-info.json` / téléchargements publics sont consignées au fur et à mesure dans le même bilan de validation.
