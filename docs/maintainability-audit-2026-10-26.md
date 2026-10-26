# Structure et maintenance — audit du 26 octobre 2026

## Référence et méthode

Référence : `4a9a696774c8a8fcb252989916b48a60ed318d3a` (`master`).
Branche : `refactor/maintainability-audit-20261026`, clone initial propre.
`CLAUDE.md` et sa référence `docs/claude/audit-application-2026-10-18.md` lus.
Aucun `AGENTS.md` trouvé dans le dépôt ou les parents du workspace.
`gh pr list --repo madmax91310/shinny-potato --state open --json number,title,headRefName,baseRefName,files` : aucune PR ouverte au démarrage.
Les anciennes branches et les audits ne constituent pas des chantiers actifs établis.
Les collecteurs continuent à écrire sur master : ne pas éditer leurs observations ni
embarquer les projections produites par une simple vérification.

L'examen porte sur les imports, les points d'entrée et leurs consommateurs, les
contrats et les parcours. Les gros JSON d'observations ne sont pas relus en entier :
leurs schémas, adaptateurs, générateurs et contrôles sont examinés.

## Cartographie requalifiée

| Zone | Responsabilité et dépendances |
| --- | --- |
| `src/tools.js`, `src/data/editorial-calendar.js` | Registre public, groupes, métadonnées et créneaux. Le calendrier courant du 20 octobre prime sur celui de l'audit du 18. |
| `src/App.jsx`, `src/design-system/Layout.jsx` | Routes, aliases et navigation. `React.lazy` par outil et par format ; `/tweet-midi` reste un agrégat de compatibilité. AV/SCPI redirigent vers Présentations. |
| `src/pages/<outil>/` | Sélection, état et UI dans les composants ; contrats financiers et rédaction dans `engine.js`, `lib.js` et modules métier ; rendus dans `image.js`, `canvasImage.js`, `*Art.js`. Ce découpage n'est pas partout complet. |
| `src/data/` | Identité ISIN, cotations, frais, caractéristiques, PEA tri-état, conventions/provenances, observations collectées et adaptateurs. Aucun import de page trouvé. |
| `src/lib/` | Conventions, change, fenêtres historiques, taux effectifs, qualification radar, ressources artistiques et préférences. Les hooks React sont explicitement nommés `use*`. |
| `src/design-system/` | Sélecteurs, navigation, feedback, copie, téléchargement et espaces de publication. Deux dépendances vers des pages confirmées avant correction : `RadarCount` et `HistoricalContext`. |
| `scripts/project-selected-data.mjs` | Projette historiques, fiches, expositions et actifs par sélection ; cache des promesses, suppression de l'entrée en échec pour réessayer, URLs par empreinte de contenu. Remplace des façades Node à la compilation. |
| Autres plugins Vite | `project-light-registries`, `project-tool-data`, `project-fee-catalog`, `split-etf-records` : registres/observations chargés séparément. `data-bytes-plugin` et `audit-route-bundles` distinguent code et données. |
| `scripts/build-*`, `report-*`, `audit-*`, `test-*`, `playwright-*` | Génération, rapport, validation, tests Node et recette navigateur. Les scripts sont nombreux mais leurs noms séparent généralement ces rôles ; pas de renommage global justifié. |
| `.github/workflows/update-*`, collecteurs pilotes | Collecte → qualification et conservation du dernier état valide → `commit-validated-data.sh` → portail Pages. Ne pas absorber la réparation des sources dans ce chantier. |
| `deploy-pages.yml` et scripts de publication | Snapshot exact, voie code/voie données, manifeste et reçus de publication, secours avec code publié et données compatibles. Un succès de collecte ne prouve pas une publication. |

### Dépendances et conventions à préserver

- Les registres d'identité/frais ne sont pas des historiques de performance. Fonds,
  indice, cours brut, cours ajusté, net/brut et couverture de change restent distincts.
- Calculateur et anniversaires partagent `investment-calculator/math.js` avant ce
  chantier : interpolation, dates et séries de placement. Les anniversaires
  qualifient leurs cours bruts et mois admissibles en amont ; la mutualisation
  n'autorise pas un cours ajusté dans un récit de prix ancien.
- Les façades Tweet Midi consomment volontairement les moteurs lexique,
  purchasing-power et etf-tweets. Ces dépendances répondent à des contrats réels ;
  les supprimer par copie créerait une divergence.
- Présentations est un ensemble de trois familles ; `presentation-shared` partage
  modèles et dessin. Avant correction AV, acteurs et rendu importent SCPI pour
  trois fonctions communes de formatage/publication.
- Les moteurs de classements, DCA, duels, patrimoine, calculateur et portefeuille
  gardent leurs propres règles (flux, repondération, fenêtres, plafonds, fiscalité).
  La ressemblance de boucles de capitalisation ne justifie pas leur fusion.
- Le recensement initial des modules JS/JSX ne trouve aucun cycle d'import.
  Les imports entre outils sont essentiellement les façades ci-dessus, l'art
  partagé des historiques, les présentations, la maintenance des preuves courtiers
  et le formatage des champs du catalogue. L'audit automatisé ajouté au chantier
  fournit la liste actuelle exacte ; aucun interdit global inter-outils n'est imposé.

### Source, génération, compatibilité, archives

- Sources maintenues : modules métier et registres éditoriaux, configurations de
  collecte et règles de qualification. Les observations `automated-*` sont des
  sorties de collecteurs, pas des constantes à réécrire pour un refactoring.
- Projections : JSON DCA, calendriers annuels, liens entre outils, rapports de
  couverture, inbox et `public/data` dérivé. Corriger le générateur puis régénérer.
  Le build initial modifie 23 fichiers suivis ; ce bruit est exclu des commits.
- Modules virtuels et dossiers JSON versionnés : produits par les plugins Vite ;
  examiner le contrat source ET le code projeté, pas seulement le fallback Node.
- Compatibilité : anciennes routes, `__route`/404 Pages, façades publiques, clés
  locales et identifiants restent stables. Dilemme masqué reste routé.
- Archives/preuves : `scripts/source-snapshots`, `scripts/fixtures`, `reports`,
  photos datées et archives investisseurs. Une absence d'import runtime ne prouve
  pas qu'une preuve est supprimable. Aucun fichier déclaré mort sans preuve.

### Stockage et asynchronisme

Les préférences de publication sont facultatives et validées à la lecture ; les
favoris de classements et portefeuilles DCA ont des contrats propres et refusent
une écriture après lecture invalide. Ne pas les remplacer par un unique stockage
JSON permissif. `useSelectedHistory`, `useSelectedRecords` et les chargements de
présentation ignorent les réponses après démontage/changement. Les URL d'objets
sont révoquées dans les exports inspectés ; délais de transfert et aperçu persistant
ne sont pas le même contrat. La copie commune restaure focus/sélection et a un délai
de repli ; la banque propose aussi une copie manuelle de son texte daté, à conserver.

## Constats priorisés avant refactoring

| Priorité / fichiers et symboles | Preuve et conséquence | Consommateurs | Correction et bénéfice | Risque / vérification |
| --- | --- | --- | --- | --- |
| Haute — `tweet-bank/App.jsx`, `loadDrafts`, `loadLastPub`, effets de sauvegarde | Une lecture JSON invalide retourne `{}` puis un effet l'écrit au montage : perte silencieuse des octets conservés. Défaut fonctionnel préexistant, distinct du refactoring. | Brouillons, vérifications éditoriales et dates de publication de la banque | Isoler le stockage, garder l'état de lecture et interdire toute écriture sur un espace illisible ; conserver les clés/formats. | Changement volontaire ; tests données anciennes, corruption, indisponibilité, rechargement et édition navigateur. Commit séparé. |
| Haute — `publication-preferences.js`, effets de `SimpleExposure`, préférences Home et migration des favoris | La lecture validée retourne un repli, mais l'ancien écrivain remplace sans revalider les octets présents ; un montage suffit à effacer un brouillon illisible. La migration pouvait marquer comme terminé un transfert non enregistré. | Brouillon d'exposition, paramètres, favoris/recents et sélections communes | Protéger l'écriture à la frontière avec le validateur du consommateur ; préserver les namespaces Home ; n'acquitter une migration qu'après succès. | Correctif volontaire séparé ; tests de corruption, anciennes routes, migration interrompue et parcours normaux de tous les consommateurs. |
| Moyenne — `investment-calculator/math.js`, imports des anniversaires et projection Vite | Un moteur réellement partagé appartient au dossier interne d'un seul consommateur ; le générateur encode ce chemin en plus des sources. | Calculateur, anniversaires, tests et projection | Point d'entrée commun de séries de placement, façade historique conservée ; aucune formule modifiée. | Convention brut/ajusté et taux ; comparaison des résultats avant/après, audits financiers, historique chargé/réessai et exports réels. |
| Moyenne — `presentation-shared/imageExport.js`, modèles et canvas ; `scpi-presentation/lib.js`, `format/dateLabel/annualPublicationNote` | Tests Node de qualification et de modèles importent le module de dessin ; AV/acteurs dépendent du moteur SCPI seulement pour les libellés. | Trois familles de présentations et leurs tests | Modèles sans DOM séparés du dessin, libellés dans `presentation-shared`, réexports historiques. Les règles restent testables sans le canvas. | Textes/chiffres visuels ; comparaison PNG avant/après, tests modèles, anciens liens, changements de sélection et mobile. |
| Moyenne — `RadarCount`, `HistoricalContext` | Le design-system importe `pages/editorial-radar/read-state.js` et `pages/tweet-midi/data/indexVariants.js` ; une évolution de page peut entrer dans le graphe initial. | Navigation, contexte historique, radar et anniversaires | État radar commun et registre léger de conventions, façades historiques ; garde-fou `data/lib/design-system → pages` interdit. | Clés/événements et libellés identiques, tests radar/préférences et budgets de routes. |
| Moyenne — absence de contrôle de frontières source | Budgets Vite protègent les octets mais pas une nouvelle inversion ou un cycle de source. | Tout ajout futur de module commun | Contrôle ciblé des imports par AST, cycles et moteurs purs ; inventaire consultable. | Faux positifs ; analyser imports réels et tester le contrôle avec graphes positifs/négatifs, sans nouvelle dépendance. |
| Basse — wrappers Blob/formatage/stockage semblables | Délais de révocation, forme de retour, erreurs et migrations diffèrent ; identité de contrat non établie partout. | Exports et préférences des outils | Aucune mutualisation globale justifiée ici. | Éviter une abstraction à options qui efface les différences. |

## État initial des contrôles

| Commande | Résultat à la référence |
| --- | --- |
| `npm ci` (Node 24.19.0) | Réussi, lockfile inchangé ; avertissement core-js 2 hérité. Pas de mise à jour. |
| `npm run lint` | Exit 0, 13 avertissements préexistants (variables inutilisées, export composants, condition constante, expression). |
| `npm run build` | Réussi, contrôles prébuild, budgets et couverture publiée inclus. 27 outils différés ; JS initial 267,33 kB / gzip 87,47 kB ; plus gros chunk 636,55 kB, conforme aux budgets différenciés actuels. |
| `node scripts/test-selected-records.mjs` | Réussi : 691 historiques anniversaire, 672 expositions et catalogue reconstruits, cache/réessai, 70 présentations. |
| `node scripts/test-publication-preferences.mjs` | Réussi : restauration, actif retiré, JSON invalide, stockage indisponible. |
| `node scripts/test-wealth-simulator.mjs` | Réussi : 15 groupes de vérification. |
| `node scripts/test-tweet-bank-validity.mjs` | Réussi : validité éditoriale, indépendante du défaut de persistance identifié. |

Les contrôles navigateur et résultats par lot sont consignés ci-dessous au fil du
chantier. Chromium disponible à `/usr/bin/chromium`, pas à l'ancien chemin `/opt/pw-browsers/chromium`.

## Lot 1 — moteur de séries commun

Avant : `investment-calculator/math.js` détenait le moteur appelé par les anniversaires
et encodé dans la projection Vite. Après : `src/lib/investment-series.js` détient ces
fonctions sans React/DOM/stockage ; `math.js` garde son API par réexport. Aucun calcul
ou paramètre n'est changé. Les qualifications restent chez les appelants.
Consommateurs migrés : lib du Calculateur, données historiques et image anniversaire,
projection anniversaire Vite et son test. L'agrégateur Tweet Midi importe désormais
les deux formateurs depuis leur véritable module commun, sans passer par le calculateur.

Vérifications réussies : build et budgets ; `test-selected-records`, `test-selected-data`,
`test-investment-crisis`, `test-investment-conclusions` (1 398 scénarios),
`test-inflation-consistency`, `test-monthly-consumers` (704 historiques),
`test-anniversary-indices` et `audit:calculator-series`.
`CHROMIUM_PATH=/usr/bin/chromium node scripts/playwright-selected-records.mjs` :
historiques/expositions sélectionnés seulement, cache, échec/réessai sans perte de
sélection, catalogue différé, ordinateur et mobile.
Comparaison ponctuelle au moteur extrait du commit de référence : 32 jeux de paramètres,
192 sorties/erreurs de séries strictement identiques ; cinq PNG et textes calculateur
identiques octet par octet (Apple versement unique/DCA avec prix saisi, indice World,
anniversaire simple et comparatif). Les scripts de comparaison et PNG sont conservés
dans les artefacts de session, sans figer des valeurs vivantes dans les tests du dépôt.
Le premier essai comparatif sur une période Livret A non couverte a échoué comme prévu ;
la comparaison finale conserve aussi les contrats d'erreur, sans étendre la couverture.

Recette initiale complémentaire : `test-route-loading.mjs` et
`test-presentation-images.mjs`, Chromium réel, réussis avant refactoring de leurs zones.

## Lot 2 — modèles et rendu des présentations

Avant : modèles de sections/cartes/relief, choix des faits et qualifications,
chargement des ressources et dessin dans `presentation-shared/imageExport.js` ;
libellés communs détenus par le moteur SCPI. Après : `image-model.js` prépare les
faits publiés sans DOM ; `imageExport.js` charge/dessine ; `labels.js` détient les
libellés communs. Les règles d'assurance restent dans leur moteur spécialisé.
Les exports historiques de `imageExport.js` et du moteur SCPI restent disponibles.
Consommateurs migrés : AV (moteur et UI), acteurs (UI), modèles des trois familles,
tests Node de présentations et test de modèles d'images. Aucun texte ni dessin modifié.

`test-scpi.mjs`, `test-insurance.mjs`, `test-presentations.mjs`, build et budgets :
réussis. `test-presentation-images.mjs` Chromium : toutes les familles et offres,
conditions expirées, chiffres longs, bornes des textes, brouillon conservé,
image téléchargée égale à l'aperçu, sélection, mobile 320/390 et réessai après
échec de logo : réussi. Les 25 PNG distincts enregistrés sont identiques octet par
octet aux captures initiales, ainsi que les quatre captures mobiles.
Deux captures desktop complètes diffèrent uniquement par le positionnement des
éléments fixes (navigation, barre d'actions et toast) lors de la capture en page
longue après redimensionnement ; les pixels des exports sont inchangés.

## Correction isolée du contrôle de routes

Lors de la recette du lot 3, `test-route-loading.mjs` échoue une fois sur
« Missing tool link: /fiches-etf » : sa boucle lit immédiatement les cartes après
`networkidle`, sans attendre le rendu de Home chargé par `React.lazy`.
La phase initiale du même script attendait déjà le titre de Home, mais pas cette
boucle. Ajout de la même attente explicite avant la lecture ; toutes les assertions
sur les liens, les budgets et les écrans sont conservées. Relance complète réussie
sur les 25 outils visibles, ordinateur et mobile, et les liens directs Pages.
Ce changement de synchronisation est committé séparément des déplacements de code.

## Lot 3 — sens des dépendances et garde-fou

Avant : navigation → page radar pour les clés/événements ; contexte historique →
page Tweet Midi pour les conventions. Après : `src/lib/radar-read-state.js` et
`src/data/index-history-conventions.js` possèdent ces contrats légers. Navigation,
client radar, historique et art anniversaire consomment les propriétaires communs.
Les deux anciens chemins sont des façades ; clés, formats, limites et événements
restent identiques, sans migration de stockage.

`npm run audit:architecture` analyse 467 modules, 1 303 imports JS dont 68 différés :
zéro cycle et zéro inversion interdite. Les tests du garde-fou exercent imports,
réexports, JSX, commentaires, imports différés/calculés, cycles et dépendances UI
transitives. Le prébuild exécute ce contrôle en local et dans la CI existante.
Le garde-fou ne prétend pas résoudre un chemin d'import arbitraire calculé à
l'exécution ; les générateurs et budgets Vite restent complémentaires.

`test-radar-read-state` (exécuté au prébuild), toute la suite `test:radar`,
`test-anniversary-indices`, `test-format-loading` et recette Chromium radar :
réussis. Build, budgets et lint réussis ; les mêmes 13 avertissements restent.
JS initial : 267,36 kB / gzip 87,48 kB, contre 267,33 / 87,47 initialement ;
27 points d'entrée différés inchangés. Aucun historique chargé systématiquement.
La recette globale de routes passe après la correction de synchronisation isolée
ci-dessus. README et documentation des scripts décrivent responsabilités,
dépendances permises, ajout d'outil et commandes de vérification.

Requalification complémentaire : le registre courant expose 26 entrées, dont
25 visibles ; les 27 entrées différées du build incluent les points d'entrée de
compatibilité. Analyse d'entreprise et sa collecte ne sont plus présentes : la
fiche du 18 octobre n'est plus un inventaire courant. Les clés/aliases de données
et archives de tests qui la mentionnent ne sont pas réactivés.

## Lot 4 — correctif fonctionnel isolé : sauvegardes de la banque

Reproduction Chromium sur le build précédant ce lot : deux clés contenant
`{broken` deviennent toutes deux `{}` après la seule ouverture de la banque.
Ce défaut existait avant le refactoring ; ce lot est un correctif volontaire.

Avant : lecture permissive et effets de sauvegarde dans `tweet-bank/App.jsx`.
Après : `storage.js` décrit les deux maps existantes, valide les champs consommés
et conserve les champs/identifiants inconnus ; `useBankRecord.js` garde l'état de
lecture et n'écrit jamais au montage. Un espace illisible reste verrouillé pour
cette ouverture ; l'autre reste utilisable. En cas d'échec/quota, édition en mémoire
et avertissement explicite. Une écriture observée depuis une autre page est refusée
si les octets ne correspondent plus à la version lue. Ce contrôle local n'est pas
une transaction atomique entre processus et n'annonce aucune synchronisation.
Aucun nouveau format, aucune migration, aucune nouvelle clé, aucune réinitialisation.
Les contrôles éditoriaux (texte/date vérifiés invalidés après édition) restent ceux
existants. Les avertissements de panne/conflit sont le changement UI volontaire.

`test-tweet-bank-storage.mjs` (prébuild) : formats anciens réellement écrits par
l'application, métadonnées de revue, champs/IDs inconnus, corruption, accès refusé,
quota et conflit observé : réussi. `playwright-tweet-bank-storage.mjs` (ajouté aux
shards navigateur existants) : lecture sans écriture, édition/rechargement,
validation éditoriale, dates, deux onglets, stockage corrompu/indisponible et
indépendance des maps, en 1440 et 390 px : réussi.
`playwright-tools.mjs --tweet-bank` : parcours existant réussi (repos, copie fidèle,
textes pédagogiques et mobile). `test-tweet-bank-validity`, `test-browser-shards`,
build et budgets : réussis ; lint garde les mêmes 13 avertissements initiaux.

## Lot 5 — correctif fonctionnel isolé : préférences et brouillon d'exposition

La revue finale des écritures confirme une seconde occurrence du même défaut :
`readPreference` validait à la lecture, mais `writePreference` pouvait écrire
immédiatement le repli d'un composant sur les octets invalides. Le brouillon
SimpleExposure et les favoris Home étaient concernés. La migration des favoris
pouvait également enregistrer son marqueur après un transfert non sauvegardé.

La primitive commune relit et valide maintenant le record existant avant de le
remplacer ; elle retourne un succès explicite. Chaque consommateur transmet son
validateur existant. Le préfixe `epargnant-publication:v1:` et les deux clés Home
sans préfixe restent inchangés. Home réutilise la primitive, conserve les anciennes
routes dans ses favoris enregistrés et affiche un avertissement en cas de panne.
SimpleExposure affiche une erreur de sauvegarde et garde l'édition en mémoire.
Les préférences facultatives gardent leur repli ; un record illisible reste intact.
Aucune migration des valeurs ni règle financière nouvelle. Cette primitive ne
remplace pas le stockage spécialisé de la banque, qui possède en plus un contrat
de conflit observé et des messages spécifiques.

Consommateurs migrés : Home, brouillon SimpleExposure, paramètres du Calculateur,
subject/devise Tweet Midi, hook de sélection commune (ETF, indices et duels),
favoris/récents des sélecteurs et leur ancienne migration. La validation reste
hors des boucles de calcul. Les validateurs inline ne provoquent pas de nouvelle
sauvegarde d'une sélection inchangée (`useEffectEvent`, déjà disponible dans la
version React du dépôt).

Vérifications : tests de préférences de publication et de sélecteur enrichis,
build/budgets, lint (13 avertissements préexistants), navigateur d'intégrité sur
Home/expositions/calculateur/comparatif/favoris/récents/migration en 1440 et 390 px,
recette des sélecteurs (modes, recherche, PEA, favoris partagés, historique,
rechargement), dossiers sélectionnés/cache/réessai, et SimpleExposure avec quatre
exports réels : réussis. Recette Home complète : sept jours, hrefs exacts, recherche,
préférences, stockage refusé, clavier, contrôles fixes, quatre largeurs et outils
réels : réussie. Un premier essai Home n'a pas obtenu son serveur dans le délai
initial ; relancé avec un serveur preview explicitement démarré, sans modifier le
contrôle. Le test SimpleExposure a d'abord nécessité `CHROMIUM_PATH=/usr/bin/chromium`.
Le nouveau contrôle d'intégrité est raccordé aux shards CI existants.

## Livraison, concurrence et limites

- Arbre de travail principal propre après exclusion des seules sorties régénérées
  au contrôle. Aucun fichier d'observations financières ni lockfile modifié.
- État final : 469 modules JS/JSX, 1 307 imports JS dont 68 différés, aucun cycle ni
  inversion interdite. Build : 27 entrées différées, JS initial 267,37 kB / gzip
  87,47 kB (référence : 267,33 / 87,47) ; tous les budgets existants conservés.
- `test-route-loading.mjs` rejoué sur le dernier code : accueil froid, navigation
  retardée, retour arrière, liens Pages restaurés avec query/hash, rechargements et
  ouverture des 25 outils visibles à 1280/390 : réussi. Lint : mêmes 13 warnings.
- Contrôles financiers complémentaires réussis : partitions Tweet Midi,
  `test-cross-tool-currency` (478 comparaisons ETF), `test-performance-currency`,
  `test-fx-consistency` (27 changes annuels et 333 mois),
  `test-financial-window-safety`, `test-reusable-data-contracts`.
  Le contrôle de fenêtres a d'abord lu la projection suivie devenue ancienne après
  nettoyage du build : échec sur l'admission consommateur. Après
  `build-review-reconciliation.mjs`, il passe (79 comparaisons, 41 quotes refusées,
  38 bases NAV indépendantes préservées), comme après le prébuild normal. Aucune
  qualification ni donnée n'a été modifiée pour le faire passer.
- Les trois modèles de présentation ont aussi été comparés au code de référence
  sur les 29 fiches/offres : 87 objets strictement identiques, en plus des PNG.

Des PR concurrentes sont apparues après le relevé initial vide. Deux raccordements
ont été adaptés pour ne pas modifier les mêmes lignes : contrôle d'état radar au
prébuild plutôt que sur la commande `test:radar`, et enregistrement des nouveaux
contrôles navigateur à côté des actions de publication plutôt qu'en fin de liste.

| Référence vérifiée | Vérification de compatibilité |
| --- | --- |
| master `37f08939e8f08d0633d579de30214b8176653e93` | Inclut #970 et deux actualisations de données ; simulation de fusion sans conflit. |
| #970 `788f5cfebcfe2a94b42a3a2c6e2924f7eb8c65b3` | Réparation de sources radar, ensuite fusionnée ; tests de reprise et contrats d'état conservés. Aucun changement du collecteur ajouté à cette branche. |
| #971 `8d0b821319e201cfdb5c837f4de3f6f248b120c7` | Visuels indices ; simulation et assemblage local sans conflit. |
| #972 `8850ed1aae8b4ab562c436faec960378496cf837` | Récits de marchés ; simulation et assemblage local sans conflit. |
| #973 `ca2c32c5c112cb711693104a2fc730cf226efb42` | Découverte/qualification radar ; fichiers disjoints et simulation de fusion sans conflit. |

Un worktree jetable a assemblé cette branche, master 37f08939, #971 et #972 :
contrôle d'architecture (471 modules), tests des préférences/favoris/banque,
reprise des sources radar, sélection des récits, puis build complet, budgets et
couverture publiée réussis. Aucun commit de cet assemblage n'a été poussé.
Ces résultats portent sur les têtes ci-dessus ; ils ne certifient pas leurs futures
révisions. Les changements des autres PR ne font pas partie de cette livraison.

Restent hors de cette certification : lecture indépendante de toutes les sources
financières, réparation des collectes et audit exhaustif de toutes les images de
l'application. Les parcours « mobile » sont exécutés dans Chromium avec viewport
mobile, pas sur matériel physique. Aucun poids à risque du Générateur n'a changé :
son stress test n'est pas requis par ce diff. Les 32 imports inter-dossiers d'outils
restants sont listables par le graphe ; plusieurs sont des façades, moteurs ou arts
partagés justifiés, pas des duplications à supprimer automatiquement. Les scripts
très nombreux et les écritures de projections au prébuild restent une contrainte
à gérer, sans renommage massif ni réparation des workflows dans ce chantier.

La PR exécute en plus le portail CI existant ; son statut est à lire sur GitHub.
Aucune fusion sur master ni aucun déploiement n'est effectué par ce chantier.

### Retour du portail CI et correction de la régression Home

Sur `6472b4ba`, le run `40305157069` termine avec build, Python, smoke,
classements, validations des présentations/radar, quatre partitions exhaustives
Tweet Midi et trois shards navigateur réussis. Le shard navigateur 3 échoue dans
`playwright-cobalt-home.mjs:41` : un favori venant d'être ajouté n'est pas retrouvé
après rechargement immédiat (`aria-pressed` false au lieu de true).

Cette régression vient de notre adaptation Home, pas de l'état initial :
`writeLocalPreference` avait été placé dans la fonction passée à
`setPreferenceErrors`. React peut différer ou rejouer cette fonction ; l'écriture
n'avait donc plus le même moment d'exécution que l'effet d'origine. Correction :
calculer le résultat de sauvegarde directement dans l'effet, puis ne transmettre
que ce résultat à la mise à jour d'état, pour la vue et les favoris.

Le parcours Home complet passe après correction. Le test d'intégrité est renforcé
avec six bascules suivies d'un rechargement immédiat par largeur, soit douze cas,
sans attendre artificiellement l'écriture du stockage : tous passent, en plus des
cas de corruption, migration et anciennes routes. Build et budgets passent ; lint
reste à 13 avertissements préexistants. Aucune assertion de la recette existante,
aucun seuil et aucune règle de données n'ont été assouplis. Le portail complet est
relancé automatiquement sur le commit correctif ; son statut final reste sur la PR.

## Suite ciblée : historique d'usages DCA

Référence : master `21671ca1e756820404552c99313ca5e5c754dd79`, arbre propre,
branche dédiée `fix/dca-usage-history-integrity`. PR concurrente #977 : producteur
de preuves de cotation, sans recoupement des modules DCA concernés.

Constat haute priorité confirmé avant correction : `management.readUsed` convertit
erreur JSON/accès en tableau vide et filtre silencieusement les entrées invalides ;
`DcaApp.toggleUsed` écrit ensuite l'état mémoire sans relire le stockage. Le nouveau
test navigateur échoue sur la référence : `{broken` devient `["julien"]` au clic.
Ni calcul, ni texte de publication, ni donnée financière ou dessin n'est impliqué.

Avant : lecture permissive dans `management.js`, état tableau et écriture directe
dans `DcaApp.jsx`. Après : `usage-history.js` possède le contrat complet, lecture,
validation et bascule persistée ; DcaApp transmet le résultat déjà enregistré à
React. Les seuls consommateurs sont les libellés « utilisé », le filtre des profils
et la bascule dans DcaApp ; aucun consommateur restant de `readUsed` supprimé.

Le format reste un tableau non versionné sous `el-dca-used-v1` : IDs anciens/inconnus,
doublons et chaînes historiquement admises restent conservés. Absence seule = vide.
Une lecture invalide verrouille les écritures pour ce montage ; les IDs reconnus
peuvent informer l'affichage. Aucun nettoyage, migration ou reset automatique.
Chaque clic relit/valide les octets et les compare à l'instantané chargé avant
d'écrire. Une erreur garde l'état antérieur et affiche un avertissement distinct ;
quota temporaire : réessai possible. Même protection d'instantané que #974, sans
réutiliser les fonctions banque (formats/keys spécifiques) ni préférences (pas de
comparaison d'instantané). Pas de nouvelle abstraction commune.

Contrôles : build/budgets/couverture initiaux réussis ; lint initial réussi avec
13 avertissements existants. Test rouge avant correction conservé dans le relevé
de PR. Tests unitaires couvrant formats valides/absents/partiellement invalides,
JSON corrompu, getter localStorage refusé, getItem refusé, quota, réessai, corruption
tardive et changements inter-onglets ; test navigateur intégré à la CI, avec
rechargement immédiat et filtre réel. Après correction : build/budgets/couverture,
lint (mêmes 13 avertissements), `npm run test:dca`, unités de stockage et navigateur
1440/390 réussis ; parcours de sélection existant et 620 rendus DCA réussis. Les
premiers essais dev ont dépassé l’attente de démarrage locale et ont été rejoués
après disponibilité du serveur. CI complète et publication consignées dans la PR.
Le contrôle protège un changement inter-onglets observé ; localStorage ne fournit
pas de transaction atomique entre deux processus écrivant exactement simultanément.

## Suite ciblée : projections, ressources d'export et préparation

Base de cette branche : master `ab0f3b5d`, après #978 (correctif DCA livré séparément,
CI 40321971594, Pages 40326309731 et scénario HTTPS desktop/mobile réussis).
#977 reste un chantier de conservation des preuves de cotation : pas de modification
de ses producteurs, observations ou workflows dans ces lots.

| Priorité / constat confirmé | Preuve et consommateurs | Correction / contrat protégé |
| --- | --- | --- |
| Moyenne — `project-selected-data.mjs`, `project-tool-data.mjs`, fonctions d'historique extraites par regex | Le test Vite ajouté reproduit `ReferenceError: INFLATION_MONTHLY is not defined` sur le défaut de paramètre de la projection Calculateur ; l'adaptateur complet émettait la même fonction sans binding. Aucun appel UI direct à cet export. Calculateur/vidéo/crises, anniversaires, historique commun et duels consomment ces projections. | Deux petits commits fonctionnels distincts du refactoring rétablissent les bindings. Puis imports explicites des règles pures, façades conservées ; données et chargement par actif inchangés. |
| Moyenne — `project-light-registries.mjs`, extraction sensible aux accolades/formatage | Une fonction exportée sur une ligne ne correspond pas à l'ancienne regex. 21 registres projetés, avec accès aux instruments, cotations, PEA, frais, change et métadonnées d'exposition. | Déclarations lues par AST, sans déplacer tous les registres. Le test compile une déclaration compacte et contrôle les bindings générés avec Oxlint existant, même hors des branches exercées ; témoin négatif obligatoire. Les imports restent explicitement bornés et les comparaisons canoniques restent actives. |
| Moyenne — wrappers Blob, dont `anniversaryImage.downloadAnniversaryImage` | Injection d'un clic défaillant en navigateur avant correction : une URL créée, zéro révoquée, un lien conservé. Cinq formats Tweet Midi, export d'indices, courtier, frais, fiches pratiques, patrimoine, ménages, bibliothèque et téléchargements PNG communs. | `downloadBlob.js` possède URL/lien dans finally dès l'acquisition. Encodage/MIME/nom restent chez l'appelant ; 1s conservée, 60s pour les PNG mobiles. Le JSON direct de ReviewInbox garde ses messages et son clic direct, avec finally local. |
| Moyenne — prérequis implicites des contrôles / longues chaînes npm | Après nettoyage des sorties, `test-financial-window-safety.mjs` échoue sur « Review screen reports actual consumer admission » ; en CI, un autre test régénérait le rapport avant lui. predev et prebuild dupliquent un ordre de producteurs. | Le contrôle isolé prépare le rapport avant d'importer les consommateurs/restrictions. `prepare-app-inputs.mjs` expose dev/build et un plan sans écriture ; les 10/19 commandes et leur ordre sont strictement conservés, arrêt au premier échec. Aucun collecteur ni mécanisme de publication réparé dans ce lot. |

Avant : les mêmes règles exécutables étaient copiées dans des chaînes Vite depuis
des fichiers financiers mêlant registres et fonctions. Après : `history-dates.js`
possède conversion année-mois, plancher et options d'anniversaire ;
`annual-inflation.js` possède la dérivation annuelle INSEE ; `duel-returns.js`
possède la conversion EUR d'une ligne de duel. Les API de market-history,
marketHistory, investment-series et duel-assets restent accessibles. Les deux
adaptateurs Vite et le test de modules sélectionnés sont migrés ensemble.
Les déclarations de registres légers restent une projection de source contrôlée par
AST et bindings, pas une migration massive de leurs données vers de nouveaux modules.

Le garde-fou d'architecture a refusé un cycle introduit pendant l'extraction :
importer investment-series depuis le module de dates ramenait market-history via
les paramètres. La conversion année-mois a été déplacée sans changement dans le
module pur, puis réexportée au point historique. Aucun cycle nouveau n'est livré.

Preuves locales : six corps de règles déplacés identiques par AST, autres fonctions
de séries retenues identiques ; instantanés identiques sur 721 historiques et cinq
dates de scénario, inflation et formatage inclus. Tests canoniques de projections,
chaque calendrier annuel, cache/réessai et conversion EUR de chaque ligne de duel
réussis. Les registres légers reconstruisent les valeurs et helpers canoniques.
Douze téléchargements réels avant/après (six familles à 1440/390) ont mêmes octets,
dimensions et noms. Seuls les IDs temporaires de formulaires ETF, déjà créés à chaque
chargement, diffèrent ; ISIN, faits financiers et PNG sont identiques.

Les unités d'export couvrent création URL/lien, affectation, append, clic,
notification et nettoyage en échec ; elles protègent MIME, noms, octets et délais.
Le scénario navigateur conserve le test rouge de fuite et vérifie le réessai réel.
Build/budgets/couverture réussis : 27 outils différés, JS initial 267,43 kB / gzip
87,51 kB (après #978 : 267,37 / 87,50), sans seuil modifié. Le contrôle financier
isolé passe sans test préalable : 79 rapprochements, 41 cotations refusées et 38
cas NAV indépendants préservés. Résultats finaux CI/publication consignés dans la PR.

Examinés sans migration nécessaire : URL d'aperçu DCA possédée par son effet,
URL vidéo possédée par son état et nettoyage au changement/démontage, URL de décodage
d'illustration révoquée en finally ; aucune révocation courte de ces ressources
persistantes n'est introduite. Les projections de constantes, compression et glues
de chargement restent générées avec leurs contrats existants. Les 13 warnings lint
préexistants ne sont pas une priorité de ce chantier. La validation ne recertifie
pas toutes les sources financières ni tous les navigateurs mobiles.
