# Audit technique Épargnant Libre — 1 novembre 2026

## Périmètre et méthode

Base locale initiale : `a9c92affdbf1a75b1464d5e4abee5dc079981ebf`, branche `master`.
Consignes : `CLAUDE.md`, `docs/claude/audit-application-2026-10-18.md`,
`scripts/README.md` et README du service privé. Aucun AGENTS.md dans l'arbre Git.
Checkout isolé ; aucune collecte intrusive, suppression réelle, rotation de secret
ou modification de partage. Les anciennes anomalies financières restent dans #881.
PR concurrentes repérées : #1115 (budgets), #1118 (récits, ensuite fusionnée),
#1119 (ordre BCE/NAV), #1061 (accès iShares, explicitement bloquée), #1042 (guide).
Leurs données, variantes et corrections ne sont pas remplacées par cet audit.

Architecture examinée : SPA React/Vite statique sur Pages, registre `src/tools.js`,
chargements différés dans `src/App.jsx`, données publiques et fichiers générés,
API Worker/D1 `services/tweet-bank-private`, scripts locaux/collecteurs et portail
`.github/workflows/deploy-pages.yml`. Le service privé a son dépôt source Sites et
son déploiement propre : pousser GitHub ne le met pas à jour.

## Registre des constats

| ID / statut | Composant | Preuve minimale et impact | Priorité / correction / vérification |
|---|---|---|---|
| S1 — confirmé, corrigé | Worker `api`, `preferencesApi` | Un PUT authentifié de même origine, dix blocs de 65 536 octets : tous consommés avant le 413, aucune annulation. Un flux sans fin ne terminait pas. | P1 : bornes pendant lecture 100 000/4 000 **octets**, 10 s, annulation. Tests réels de flux, SQLite et artefact ESM ; PR #1120. |
| R1 — confirmé, corrigé | Chargeur généré dans `project-selected-data.mjs` | Faire répondre `{unrelated:true}` à une URL d'historique : deux lectures renvoient cet objet avec une seule requête. Même problème pour une autre photographie JSON valide. Cache réussi empoisonné, données incohérentes possibles. | P1 : vérifier l'empreinte de contenu déjà inscrite dans le nom du fichier avant toute mutation des registres ou mise en cache réussie. `createRecordLoader`, tests de transport et projections canoniques. |
| R2 — confirmé, corrigé | Même chargeur, plusieurs outils | Une requête qui n'aboutit jamais laisse la promesse partagée et le chargement actifs sans limite. | P1 : délai 15 s couvrant fetch et lecture, rejet puis éviction du cache. Recette navigateur réelle : délai, erreur, reprise, choix conservé et réponse tardive ignorée. |
| F1 — confirmé, corrigé | `investment-calculator/lib.js:derive` | `amountRaw:'1e309'` produisait `Infinity` dans montant et capital ; `1e308` débordait après valorisation. Les textes contenaient « ∞ ». | P1 : validation des nombres finis strictement positifs saisis, puis refus des résultats non finis. Le champ vide reste neutre. Tests moteur et reprise dans l'interface. |
| T1 — limite identifiée, protection ajoutée | Tests des projections et interface/moteur | La parité canonique/projection prouve le raccordement, pas la justesse financière. | Exemples indépendants : 100/200/100 et trois versements de 100 donnent 250 ; +100 % puis −50 % donne 0 % annualisé ; 110 USD à 1,2 USD/EUR donnent 91⅔ EUR. Pas de compteur financier vivant figé. |
| C1 — analyse en cours | Lots navigateur | Trois runs : lots jusqu'à 1 337/1 376 s ; mesures du plan anciennes et contrôles hors plan concentrés sur le lot 0. | Optimisation indépendante du portail, sans modifier producteurs, verrous ou publication. Mesures détaillées ci-dessous ; seule une validation réelle peut confirmer le gain. |
| S2 — exposition dépendante de l'environnement | Vite/source-map-js | `npm audit` signale Vite 8.2.1 et source-map-js 1.2.1. Avis officiels relus le 1 novembre via l'API GitHub Advisories. | Correctifs d'outillage séparés ; ne pas attribuer ces avis au site statique en production. Voir sources et conditions ci-dessous. |

L'empreinte ne certifie pas une donnée financière : elle assure uniquement que le
fichier reçu appartient exactement au build courant. Un collecteur qui produit
une mauvaise donnée valide reste du ressort des contrôles de qualification.

## Sécurité : contrôles présents et limites

- API privée : identité exigée sur UI, catalogue, découverte et deux API ; SQL
  paramétré avec `owner` dans les lectures et écritures ; conflits optimistes 409.
  Origine exacte et JSON requis pour les mutations ; pas de CORS permissif.
  Les tests existants exercent comptes distincts, requêtes inter-origines et versions.
- Sessions et cookies : délégués au dispatch Sites. Le header d'identité suppose
  ce passage ; il ne suffit pas sur une exposition directe du Worker. Politique
  réellement relue : propriétaire seul, aucun visiteur externe, aucun groupe.
  Pas de test de contournement intrusif de la passerelle en production.
- UI privée : textes et liens créés avec les API DOM, `textContent`, sources
  HTTPS ; CSP à nonce, `base-uri 'none'`, `frame-ancestors 'none'`, `no-store`.
  Catalogue distant à URL constante et délai 7 s, repli explicitement nommé.
- Site public : aucune session serveur ; données et sources publiques par contrat.
  Pas de secret applicatif nécessaire pour servir les fichiers. Recherche ciblée
  de clés privées, tokens GitHub, clés AWS et clés API dans src/public/services/
  scripts/workflows : aucun candidat trouvé. Ce contrôle n'est pas une recherche
  exhaustive de secrets dans tout l'historique ou tous les anciens artefacts.
  Sourcemaps publiques non activées dans la configuration Vite examinée.
- Actions : PR ordinaires sans secrets exposés ; l'unique `pull_request_target`
  examiné (`retire-closed-pr-validation`) ne traite que des PR internes fermées et
  exécute `master`, jamais leur checkout. Publication conditionnée hors PR sur
  master ; reçus code/données, contrôle d'ascendance et verrou Pages conservés.
  Les permissions globales Pages/OIDC dépassent les besoins du job build :
  amélioration de moindre privilège possible, distincte d'une exploitation démontrée.
- Imports et fichiers distants : données mensuelles, preuves et qualifications
  restent distinctes des prix et rendements ; le décodage gzip du moniteur borne
  la taille décodée et vérifie empreinte et schéma. Les imports de brouillons et
  migrations sont testés par les suites de stockage existantes. Les collecteurs
  n'ont pas tous été soumis à un audit d'URL/SSRF exhaustif.

Sources officielles des avis :
- https://github.com/advisories/GHSA-68fv-2mgg-jv7q : cartes de sources indexées non
  fiables ; correctif source-map-js 1.2.2. Pas de téléversement public de sourcemaps
  traité par le serveur statique.
- https://github.com/advisories/GHSA-vfpm-58rq-9qcg : lecture des quatre premiers
  octets via le serveur **de développement** exposé, correctif Vite 8.2.4.
- https://github.com/advisories/GHSA-rq7h-c2jc-7f22 : chemins importés correspondant
  à des chemins absolus sur un hôte non Windows ; conditions spécifiques.
- https://github.com/advisories/GHSA-9jrq-w75r-8gcw : middleware HTML personnalisé,
  non utilisé dans la SPA de production examinée.
- https://github.com/advisories/GHSA-698v-4r3x-3vcv,
  https://github.com/advisories/GHSA-r825-w8mm-5pxw et
  https://github.com/advisories/GHSA-587h-7wmj-h5pm : éditeur/Windows/WSL et chemins
  contrôlés ; aucune conclusion d'exécution distante dans Pages.

## Tests réellement raccordés

Le build lance les contrôles de stockage, exports, architecture et générateurs
via `prebuild`, puis budgets de routes, couverture et manifeste construit. Le
portail ajoute calculs, change, qualifications, stress des portefeuilles,
Python, quatre partitions exhaustives Tweet Midi et quatre lots navigateur.
`smoke-data-routes.mjs` teste toutes les routes et quatre liens profonds : erreurs
JS, frontière d'erreur, texte vide, NaN/undefined. C'est volontairement un smoke,
il ne prouve ni un résultat financier exact ni la réussite de tous les exports.

Suites ciblées retrouvées : `test-export-resources`, `test-tweet-bank-storage`,
`test-dca-usage-storage`, `test-publication-preferences`, leurs recettes navigateur,
`playwright-selected-records`, `stress-test-portfolios` (regression/combo).
Les nouvelles vérifications sont raccordées à prebuild et au manifeste navigateur,
sans nouvelle infrastructure de chaos ni relâchement des seuils.

## Performance : protocole et observations

`scripts/measure-audit-performance.mjs <label>` : Chromium local, fichiers `dist`,
trois contextes froids à chaque largeur (390/1440), CPU ×4 pour 390, neuf exports
PNG téléchargés et signature/dimensions vérifiées par largeur. Téléchargement
local contrôlé, pas une mesure 4G ou un véritable téléphone. Distinguer les octets
JS/JSON, le temps jusqu'au texte prêt et le temps de téléchargement de l'export.

| Mesure | Avant | Après chargeur |
|---|---:|---:|
| JS/JSON transférés, route anniversaire Apple | 1 829 352 octets | 1 829 027 octets |
| Prêt médian, 390 px CPU ×4 | 2 392 ms | 2 218 ms |
| Prêt médian, 1440 px | 845 ms | 699 ms |
| Export médian, 390 px (9 PNG) | 505 ms | 468 ms |
| Export médian, 1440 px (9 PNG) | 139 ms | 137 ms |

Ces mesures servent à détecter une régression. Elles ne démontrent pas un gain
attribuable au chargeur : bruit de machine, premier lancement et découpage des
chunks influencent le résultat. Aucun gain de vitesse revendiqué, aucune refonte
du chargement sur cette base. L'empreinte et le délai répondent à des défauts de
fiabilité. Les grands sélecteurs bornent déjà le rendu initial à 30 options.
Les ressources d'export ont une suite vérifiant révocation des URL même en erreur ;
la mémoire navigateur à long terme n'a pas été profilée exhaustivement.

## CI : référence mesurée avant modification

Données officielles API jobs/steps et logs accessibles ; trois runs réussis :

| Run | Événement | Somme durées jobs actifs | Lot navigateur le plus long |
|---|---|---:|---:|
| 41331119939 | PR | 132,75 min | 1 327 s |
| 41328488296 | PR | 131,70 min | 1 337 s |
| 41327475687 | push | 136,58 min | 1 376 s |

Les durées de run complètes incluent files d'attente : ne pas les confondre avec
la somme des jobs. Le build est déjà mutualisé : `validated-site`, projections
et vérificateur Tweet Midi sont réutilisés par les jobs aval. `npm ci` est rapide
avec cache (environ 1 s dans le premier run) ; partager node_modules n'est pas
justifié par ces observations. Les images de diagnostic ne sont téléversées que
sur échec et conservées sept jours ; ne pas réduire les preuves producteurs.
Les PR obsolètes peuvent s'annuler ; les producteurs et publications actifs ne
sont pas annulés. Tarifs, facturation et minutes réellement facturées non lus :
aucune économie en euros annoncée.

## Limites

Pas de certificat de sécurité global, de requalification de toutes les sources
financières, d'audit de tous les anciens rapports, ni de test destructif. Les
incidents iShares/403, les écarts de cotation déjà suivis et l'ordre BCE/NAV restent
avec leurs chantiers existants. Les vérifications de fusion/déploiement doivent
être consignées avec leurs runs et le `build-info.json` public ; un build local
ou une PR verte ne vaut pas preuve de publication.
