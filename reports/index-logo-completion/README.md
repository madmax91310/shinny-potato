# Complément des logos des indices — chantier en cours

Base : `master` `93affb1d012ec8fede186784c4887dd7e486bc41`, après #971. Branche locale : `feat/index-company-logo-completion`. Les PR concurrentes #974 et #976 ont été examinées avant modification. Leurs refactorisations et collectes financières restent hors périmètre.

Le rendu validé est conservé : ivoire, pêche, lavande, turquoise et relief. La mention « bleu glacier » a été explicitement écartée par l’utilisateur. Aucune composition, pondération, performance, conversion, qualification ou collecte n’est modifiée.

## Couverture recalculée

Le [recensement initial réel](before.json) a été recalculé depuis les données affichables courantes : 55 fiches, 34 Top 10 qualifiés, 560 apparitions, **203 entreprises distinctes**.

| Mesure | Avant | État local actuel |
|---|---:|---:|
| Entreprises distinctes | 203 | 203 |
| Logos locaux disponibles | 70 | 174 |
| Ajouts de ce chantier | — | 104 |
| Entreprises en initiales | 133 | 29 |
| Entreprises des fiches principales | 116 | 116 |
| Logos dans les fiches principales | 51 | 102 |
| Initiales dans les fiches principales | 65 | 14 |

Les 70 fichiers de départ comprennent les 48 réutilisations et les 22 ajouts de #971 ; ces 22 ne sont pas recomptés dans les 104 ajouts actuels. Le [bilan détaillé](logo-coverage.json), le [CSV](logo-coverage.csv), la [liste des ajouts](added.json) et les [provenances](../../public/asset-art/index-logos/sources.json) permettent de vérifier les compteurs.

Le raccordement explicite contient désormais 184 ISIN issus des positions déjà affichables, avec leurs preuves dans les apparitions du recensement. Le nouvel alias exact `Micron Technology Inc.` est synchronisé avec l’identité Micron existante : il ne crée pas une entreprise supplémentaire. Le générateur privilégie les ISIN vérifiés et refuse un conflit nom/identifiant. Les classes Alphabet et Samsung conservent leur identité commune de marque et leurs traitements financiers préexistants ; les autres entreprises Samsung restent séparées.

## Recherche et limites encore ouvertes

Les **133 entreprises initialement manquantes** ont toutes été examinées. Le [journal des sources](source-research.json) distingue pages, CSS, navigateur, réponses HTTP et candidats ; un candidat n’est jamais compté comme couvert. Les [29 dossiers ouverts](unresolved.json) donnent pour chaque entreprise les identifiants, sa priorité, les sources effectivement interrogées, les réponses, le défaut constaté et les pistes officielles restantes.

Depuis environ 11:44 UTC le 26 octobre 2026, le proxy de l’environnement renvoie HTTP 503 (`remote connection failure`, `cloudflare_https_tunnel`) sur tous les nouveaux accès, y compris GitHub. L’état de l’environnement annonce pourtant un réseau unrestricted/enforced et connecté. Les tentatives Git et HTTP reproduisent cette panne. Elle empêche de finir plusieurs téléchargements officiels, de pousser la branche et de livrer en production. **Ce n’est pas une preuve que les 29 logos sont introuvables ; le chantier n’est pas terminé.**

Des ressources ont été volontairement rejetées : Nu (44 × 24 px, pixellisé), le bandeau SK Hynix Newsroom (illisible à la taille réelle), le SVG Deutsche Telekom dépendant encore d’un sprite distant, un candidat photo Alibaba, des logos de filiales proposés sur les sites Berkshire/Unipol et des logos de clients de Cisco/Motorola. Aucun logo de maison mère n’est automatiquement substitué à une filiale.

Les changements de nom Everpure et Vivmark ont été contrôlés sur les publications des sociétés :

- [Pure Storage devient Everpure](https://www.everpuredata.com/company/newsroom/press-releases/pure-storage-becomes-everpure.html).
- [Lancement de Vivmark Residential](https://investors.vivmarkresidential.com/news-events/press-releases/detail/113/vivmark-residential-launches-as-one-of-the-countrys-leading-real-estate-companies).
- [Présentation du groupe coté Zhongji InnoLight](https://www.zj-innolight.com/cn/about.html), distinct de sa filiale opérationnelle.

## Rendu et robustesse

Les logos sont locaux, avec empreintes SHA-256, URL officielle et date de vérification. Les SVG inline conservent leurs tracés ; leurs styles calculés sont incorporés lorsque nécessaire pour garder les couleurs officielles. Aucun service de logos externe n’est utilisé lors de l’aperçu ou de l’export.

Les marques blanches utilisent l’insert sombre déjà présent dans #971. Les proportions, couleurs et transparences sont conservées ; les rasters ne sont pas agrandis au-delà de leur taille native, y compris lors d’une nouvelle tentative après erreur. Le relief porte uniquement sur le support.

Le chargement attend maintenant `decode()` et des dimensions non nulles. Une erreur ou un délai dépassé revient aux initiales sans rejet non géré. Une nouvelle tentative contourne l’entrée invalide du cache d’images du navigateur par un paramètre local de relance. Les identifiants inconnus et mélanges d’entreprises ne reçoivent aucun rapprochement approximatif.

## Preuves visuelles

Les [104 marques contrôlées](visual-checks.json) sont décodées et non vides. Les six planches montrent chacune les **deux supports réellement utilisés**, de 122 px et 68 px :

[1](previews/logos-1.png) · [2](previews/logos-2.png) · [3](previews/logos-3.png) · [4](previews/logos-4.png) · [5](previews/logos-5.png) · [6](previews/logos-6.png).

Les [huit comparaisons avant/après](render-comparison.json) utilisent les mêmes données et le même moteur, avec le registre de départ puis le registre actuel. Textes, positions et pixels hors supports de logos sont strictement identiques.

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

Les statuts effectivement obtenus figurent dans [validation.json](validation.json). La PR, la fusion, le déploiement Pages, `build-info.json` public et le téléchargement sur le site public restent à effectuer après rétablissement du réseau et résolution des cas accessibles restants. Aucun déploiement de ce chantier n’est annoncé.
