# Complément de l’audit technique — 1 novembre 2026

Ce complément traite les limites L1/L3 et les contrôles incomplets du registre final
à 18 entrées de l’audit précédent. Il ne relance pas la qualification financière.
Consignes relues : CLAUDE.md, référence d’audit, README des scripts et du service
privé. Checkouts isolés ; aucune restauration, suppression ou collecte intrusive en
production. Au début de cette mission, Pages servait encore `91ab124d`, Sites la
version 6 ; ces références ne constituent pas une preuve de livraison actuelle.
Les PR concurrentes et les mises à jour qualifiées de master sont conservées.

## Couverture retrouvée et complétée

| Domaine | État au début du complément | Preuve / travail nécessaire |
|---|---|---|
| Identité, propriétaire, origine, versions privées | Déjà vérifié | Tests API, PR #1120/#1124 ; protections conservées, tests de restauration ajoutés aux mêmes frontières. |
| Réseau ancien, malformé, partiel, bloqué ; sélection changée | Déjà vérifié | `test-record-loader.mjs`, `playwright-record-resilience.mjs`, PR #1122 ; empreinte, délai, éviction et résultat tardif. Pas de répétition générale sur code inchangé. |
| Stockage public corrompu, indisponible, quota, migrations et conflits | Couvert sous Chromium | `test-budget-portability.mjs`, `playwright-budget-portability.mjs`, contrôles banque et DCA. Complément Firefox/WebKit ciblé, sans dupliquer toute la matrice. |
| Sauvegarde privée restaurable | Non vérifié ; mécanisme absent | L’export v2 était une photographie affichée ; aucune API de restauration. Solution manuelle minimale et restauration réelle isolée, PR #1132. |
| Interruption et reprise privées | Partiel | Les sauvegardes de formulaire avaient leurs délais et brouillons conservés ; ajout des interruptions transactionnelles et perte de réponse après commit pour la restauration. |
| Python : versions transitives et sécurité | Non vérifié | Profils sans contraintes communes, parser PDF inutilisé ; environnements propres, avis officiels et fixtures détaillés ci-dessous. |
| Secrets historiques, anciens artefacts et journaux | Non vérifié | Recherche bornée et expurgée, périmètre et limites explicites ci-dessous. Absence de preuve initiale ≠ exposition. |
| Téléchargements, copie, mobile | Chromium uniquement pour le portail | Recette mobile 390 px sur trois moteurs, vrais PNG/JSON et collage natif ; aucune affirmation de téléphone physique. |
| Partage PNG des fiches ETF | Défaut confirmé | API texte disponible mais fichiers refusés : seul le titre était partagé, puis « Partagé ». Repli PNG corrigé. |
| Portail CI complet | Mesures non comparables / limites connues | Trois validations complètes comparables sélectionnées, distinction files d’attente / minutes de jobs / publication ; optimisation des checkouts justifiée. |
| Performance des comparaisons | Déjà mesurée et corrigée | PR #1128 : construction différée préservée ; aucun changement de moteur ni répétition de benchmark sans raison. |

## Constats et corrections

| ID / état | Emplacement et reproduction | Impact / priorité | Correction et non-régression |
|---|---|---|---|
| PY1 — confirmé, corrigé | Workflows et profils Python : résolutions transitives non contraintes, environnement stdlib du build dépendant du runner | Reproductibilité, P2 | Python 3.12 explicite pour le build, contraintes communes des quinze dépendances utilisées ; deux venv propres ont des `pip freeze` identiques et `pip check` réussi. Contrats dans `test_audit_workflows.py`. |
| PY2 — composant affecté, exposition conditionnelle | Pillow 12.3.0, trente-neuf avis officiels actuels ; pdfplumber inutilisé tirait pdfminer-six 20251107 | Parseurs/outillage, P1 ; ne prouve pas trente-neuf exploitations de l’application | Pillow 13.0.0 : correctif officiel disponible, aucune 12.3.1 disponible lors du contrôle. Retrait de pdfplumber et de six transitives inutilisées. Fixtures enregistrées Corum/Russell validées. |
| PY3 — composant affecté, exposition conditionnelle | pip 25.0.1 d’un venv propre : six avis canoniques ; vecteurs archives/index malveillants | Installation CI, P2 | Bootstrap pip 26.2, wheel binaire au SHA-256 vérifié, avant toute installation applicative ; toutes ces installations emploient les contraintes. |
| BK1 — manque fonctionnel confirmé, implémenté | API privée : aucun chemin permettant de restaurer un export | Reprise après perte, P1 | `/api/backup` : photographie propriétaire puis fusion transactionnelle validée ; aucun écrasement d’une ligne différente. Voir README privé et tests API/navigateur #1132. |
| EX1 — confirmé, corrigé | Fiche ETF, image récapitulative : `navigator.canShare({files}) === false`, `navigator.share` présent | PNG absent malgré succès affiché, P2 | Téléchargement du PNG, aucun partage du seul titre ; vrai fichier décodé. Partage de fichier accepté, annulation puis reprise testés. Message de téléchargement « lancé ». |
| CI1 — travail inutile démontré, supprimé | Job `scope` d’une PR : checkout complet puis Node, toutes les opérations de classification déjà réservées aux publications | 210/233 s de checkout sans résultat utilisé, P2 | Job de contrôle conservé réussi pour les PR, checkout/Node réservés aux publications ; contrats bloquants. |
| CI2 — amélioration justifiée | Publications : checkout historique 147–222 s, contre 21–24 s avec blobs différés dans la sélection du même run | Transport historique, P2 | `filter: blob:none` avec `fetch-depth: 0` dans scope/deploy/fallback. Ascendance, reçus, qualification, verrous et producteurs conservés. Gain global à confirmer par les runs normaux. |
| T2 — défaut concurrent constaté, correction réutilisée | Comparaison d’une série vivante avec une archive datée : nouveau mois qualifié bloquait le build #1132 | Faux rouge déterministe, P2 | PR concurrente #1133 fusionnée ; préfixe historique exact, série entière reliée au registre courant et ordre contrôlé. #1134 fermée en doublon, aucune donnée/borne financière abaissée. |

Le run normal de #1135 a aussi révélé **T3, défaut confirmé du contrat partagé** :
`build_plan('refresh_anniversary_levels', ['--only', 'source-A'])` refusait une
configuration `{id: source-A, isin: TEST-ISIN-A}` avant tout accès réseau. Le CLI
natif accepte pourtant l'identifiant de source ; le plan n'acceptait que les
identifiants de rapport/ISIN et ne déclarait pas le sous-ensemble demandé.
Trois workflows de qualification utilisaient ce contrat. Correction dans
`producer_report_plans.py` : identifiants CLI exacts, sources non sélectionnées
explicitement exclues, dérivation or toujours déclarée comme dans le collecteur,
aucun ISIN/alias inconnu accepté à la place. Les 60 tests du contrat passent :
reproduction minimale, omissions toujours bloquantes et lecture des vraies commandes
`--only` des workflows, sans requête réseau ni nouvelle observation publiée.
Les règles de qualification et les résultats financiers ne sont pas modifiés.

### Python : procédure reproductible et portée des avis

Dépendances directes réellement importées : beautifulsoup4, Pillow, openpyxl, xlrd,
exchange_calendars. Les PDF utilisent aussi `pdftotext`/Poppler et les images
Tesseract ; ces exécutables système ne sont pas verrouillés par pip. Python 3.12.x
est la famille CI ; les deux installations locales ont utilisé 3.12.14/Linux x64.
Les wheels et les versions binaires système ne sont donc pas promises identiques
entre systèmes d’exploitation. Les contraintes fixent les transitives, elles ne
constituent pas un verrou cryptographique de tous les paquets. Seul le bootstrap
pip est également vérifié par hash.

```bash
python3.12 -m venv /tmp/epargnant-python
/tmp/epargnant-python/bin/python -m pip install --require-hashes -r scripts/python-installer-requirements.txt
/tmp/epargnant-python/bin/python -m pip install -r scripts/python-requirements.in
/tmp/epargnant-python/bin/python -m pip check
/tmp/epargnant-python/bin/python -m pip freeze
```

Les profils company/economic/gold et toutes les installations pip des workflows
réutilisent `python-constraints.txt`. Le job Python n’effectue plus quatre
installations successives ; il installe les cinq racines en une seule commande.
Aucun seuil de qualification, source financière, date ou dernière valeur valide
n’est modifié par cette mise à jour. Pour régénérer les contraintes : lire la
commande pip-compile en tête du fichier, dans un environnement d’outillage séparé,
puis refaire installations propres, audit et fixtures avant publication.

Les identifiants, dates et correctifs des avis officiels relus sont dans
[le reçu de preuves](technical-audit-followup-2026-11-01-evidence.json).
Sources : [GitHub Advisory Database](https://github.com/advisories),
[publication officielle Pillow 13](https://pypi.org/project/pillow/13.0.0/),
[publication pip 26.2](https://pypi.org/project/pip/26.2/),
[avis pdfminer](https://github.com/advisories/GHSA-f83h-ghpp-7wcc).
Les vecteurs Pillow varient selon format/fontes/images hostiles ; les consommateurs
actuels identifiés travaillent sur des images PNG dérivées. Le vecteur pdfminer
concerne des CMap pickle modifiables ; aucun appel applicatif au parser inutilisé
n’a été trouvé. Certains avis pip dépendent d’un index hostile, de wheels/archives
malveillants ou d’un ancien Python sans PEP 706 ; Python 3.12 couvre déjà ce dernier
cas. Ces conditions restent distinctes d’une exploitation démontrée du service.

Résultats ciblés : Corum vectoriel/OCR 5 tests, composition Russell 7, économie 18,
or mensuel 11 ; réponses et fichiers enregistrés, aucune observation réelle publiée.
`pip-audit` sur le chemin du venv installé après correction : zéro avis retourné,
avec pip 26.2 audité lui aussi. Les outils d’audit vivent dans un autre venv.

### Secrets : recherche et limites

Gitleaks 8.30.1, archive officielle vérifiée par checksum. Les rapports durables
ne contiennent que règle, chemin, ligne, commit ; jamais Match/Secret ou extrait.
Arbre courant : 4 681 fichiers texte suivis jusqu’à 2 Mio, 105 fichiers trop gros
non scannés dans ce passage. Historique épinglé `a1184d9` : 3 484 commits accessibles,
diffs techniques, lots bornés puis reprise des lots trop lourds ; données publiques
massives, JSON de pages, fixtures et captures historiques exclus. Les 400 commits
repris excluent aussi reports. Ce n’est pas une certification de chaque ancien
blob financier, binaire ou branche inaccessible.

Aucun secret privé de l’application confirmé dans ce périmètre. Les candidats
génériques examinés correspondent à des clés de stockage navigateur, sélecteurs,
identités d’instruments, prose et configuration cliente de documents publics.
Deux candidats de type clé Google se trouvent dans la capture tierce
`scripts/fixtures/broker-profiles/caSavingsDocs.txt`, lignes 235/237 : configuration
cliente publiée par le fournisseur, pas un accès privé de l’application. Leurs
restrictions et leur validité n’ont pas été testées ; aucune requête d’exploitation.
La fidélité de la preuve financière est conservée, aucune révocation revendiquée.

Artefact réellement distribué `validated-site` du run 41348779366 : ZIP téléchargé,
extraction bornée, texte jusqu’à 5 Mio examiné ; seul candidat = identifiant public
de stockage navigateur. Même contrôle sur le nouveau dist local, même classification.
Journaux accessibles : sélection, build, Python et déploiement, jobs 124998488632,
124983463752, 124983463861, 124991561719 ; analyse en mémoire de 24 003 lignes avec
règles de clés privées/tokens fournisseurs/affectations sensibles, aucun candidat.
Ce contrôle ciblé n’est pas un scan de tous les logs historiques, artefacts expirés,
variables secrètes GitHub ou valeurs privées de production. Aucun accès révoqué,
secret tourné ou historique partagé réécrit.

### Sauvegarde et restauration privée

L’écriture atomique d’une ligne n’est pas une sauvegarde. L’ancien export v2 reste
une photographie locale de l’état affiché. La nouvelle sauvegarde manuelle charge
un snapshot serveur v3 cohérent, limité à 1 Mio et lié au propriétaire. Aucun
planificateur de sauvegardes automatiques n’est configuré ou annoncé.

La restauration est une fusion de lignes absentes/identiques, pas un remplacement
silencieux. Les deux écritures tweets/préférences partagent une transaction D1
([contrat officiel batch](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch)).
Une différence sur une ligne existante produit un conflit et annule toute la
transaction. Identifiants, texte, dates, publication, favoris, versions et préférences
d’anciennes versions restent conservés. Schémas v3 et export v2 réel acceptés ;
versions inconnues et propriétaires mélangés refusés. Une réponse perdue après
commit reste « résultat incertain », jamais un faux succès ; rechargement puis
réessai identique possible.

Tests réels en mémoire SQLite : fichier valide v3/v2, corruption, ancien schéma
inconnu, doublons, champs inconnus, propriétaire différent/mélangé, corps interrompu,
limite UTF-8, erreur injectée après la première écriture et conflit tardif de
préférences. Dans ces échecs, les données sentinelles déjà valides sont préservées ;
les nouvelles lignes de la transaction échouée sont absentes. Après restauration,
la modification optimiste et le refus d’une ancienne version sont testés.
Recette navigateur : vrai JSON téléchargé/inspecté, suppression puis restauration
**d’une ligne synthétique isolée**, recharge, fichier corrompu, double-clic unique,
nettoyage d’URL, interruption de réponse après commit et reprise idempotente.
Procédure complète : [README privé](../services/tweet-bank-private/README.md).
Aucune table réelle de production n’a servi à ces restaurations.

### Navigateurs et Android

`playwright-browser-portability.mjs` complète les suites existantes : Chromium,
Firefox et WebKit à 390 px, PNG réellement téléchargés et décodés, JSON lu,
migration v1, dernière frappe puis rechargement, copie native suivie d’un collage
réel dans un autre champ, refus explicite du presse-papiers, quota conservant les
octets précédents, export du brouillon en mémoire puis reprise du stockage. Trois
exports PNG n’ajoutent pas d’URL à celle de l’aperçu ; l’export JSON révoque son URL ;
la navigation SPA libère l’aperçu. Les cas de partage utilisent des capacités API
contrôlées dans Chromium : ce n’est pas un passage dans une feuille OS native.
La restauration privée couvre les trois moteurs ; les longs tests de délai réseau
existants restent ciblés Chromium. Seul le lot public contenant la nouvelle commande
installe Firefox/WebKit, avec cache séparé invalidé par le lock Node et l’architecture.
Les autres contrôles restent dans le manifeste et bloquants.

Aucun téléphone physique disponible. Recette Android manuelle à faire avec un
profil et des données synthétiques, serveur public local et aperçu privé en mémoire
(USB `adb reverse` pour localhost sécurisé si nécessaire) :

1. Saisir accents et plusieurs lignes dans un brouillon budget, recharger : dernier
   texte conservé. Copier puis coller dans une application Notes : texte identique.
2. Télécharger PNG/JSON dans Fichiers, ouvrir réellement l’image et lire le JSON :
   image complète, identité correcte, brouillon et états présents. Répéter trois fois.
3. Ouvrir la fiche ETF, image récapitulative, partager : PNG joint si supporté,
   téléchargement PNG sinon ; annuler le partage ne doit ni annoncer succès ni
   déclencher de téléchargement inattendu. Réessayer doit fonctionner.
4. Refuser la copie : message permettant la sélection manuelle, texte toujours là.
5. Dans l’aperçu privé isolé, sauvegarder puis restaurer une ligne synthétique :
   identifiants/texte/états conservés ; corrompre une copie du JSON : refus sans perte.
6. Simuler l’interruption par DevTools pendant restauration : aucun faux succès ;
   recharger avant réessai. Ne pas utiliser les données privées réelles pour ce test.

L’arrêt forcé d’une application Android n’exécute pas toujours beforeunload : aucune
promesse de persistance d’un formulaire privé encore non enregistré n’est faite.

## CI complète : mesures et protections

Trois PR complètes avec les mêmes blobs de manifeste navigateur, durées, lock Node
et registre d’outils ; données financières évolutives, pas un benchmark bit à bit.
Toutes à la première tentative ; aucune série coûteuse lancée pour calculer une moyenne.

| Run | Durée créée → dernier job actif | Somme des minutes actives | Dernière branche de validation |
|---|---:|---:|---|
| 41349940947 | 41 min 05 s | 138,70 | navigateur 1, 1 366 s |
| 41356800318 | 34 min 01 s | 143,70 | navigateur 0, 1 402 s |
| 41357426130 | 30 min 44 s | 132,50 | navigateur 0, 1 389 s |

Chemin dépendant : sélection → build partagé → quatre lots navigateur (en parallèle
avec quatre lots Tweet Midi, smoke et Python). Les files d’attente expliquent une
partie des écarts. Les 112 secondes de l’ancien chemin privé ne mesurent pas ce portail.
Aucun gain total ni économie en euros déduit de ces écarts. Les nouveaux runs normaux
PR/master fourniront les mesures après changement ; les reçus JSON identifient chaque
SHA, tentative et définition. Le test historique Amundi était un faux rouge
déterministe traité par #1133, pas une instabilité résolue par retries.

Les checkouts PR scope observés 233/210 s sont supprimés, soit du travail de job
mesuré désormais évitable ; scope était parallèle au build, donc aucune réduction
équivalente du chemin critique n’est promise. Sur deux publications, scope/deploy
prenaient 220/222 s puis 147/148 s, contre 21 s de sélection filtrée dans ces mêmes
runs. `blob:none` conserve l’historique, et permet toujours la lecture paresseuse de
fichiers anciens nécessaires aux reçus. Aucun verrou producteur ni annulation ajouté.

Build/dist, projections DCA et vérificateur Tweet Midi déjà mutualisés : conservés.
La seconde construction du run 41348779366 utilisait un autre snapshot de données,
ce n’était pas un doublon supprimable. Le run 41343114420 évitait déjà la reconstruction
quand le reçu était inchangé. npm ci prenait environ une seconde sur les caches chauds
observés ; pas de cache node_modules supplémentaire. Pas de masquage des échecs externes.

Artefacts du run 41348779366 : validated-site 49,4 Mo et projections/vérificateur
conservés 2 jours ; paquets Pages ~47,1 Mo chacun, 1 jour ; petites mesures et reçus
35 jours ; diagnostics radar 9,84 Mo, 14 jours. Ces doublons de packaging n’établissent
pas une compilation répétée. Conservation financière/producteurs non réduite.
La facturation et les minutes réellement facturées ne sont pas accessibles.

## Validation et livraison

Les tests ciblés sont reliés aux mêmes contrôles durables (API privée, manifeste
navigateur, contrats workflows et planner), avec compilation publique et privée.
Les protections du registre précédent et la recette réseau existante restent en place.
La livraison exige les portails complets, fusion, preuve Pages sur SHA descendant et
version Sites effectivement publiée ; une PR fusionnée seule ne suffit pas.
Les résultats finaux et les mesures après changement sont à rapprocher des checks
des PR #1132 et de la PR portant ce document, puis du reçu final de livraison.
Les incidents NAV/collecte déjà suivis restent dans leur chantier (#881 notamment).
