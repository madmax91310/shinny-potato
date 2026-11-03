# Compositions automatiques — lot #1045, 29 octobre 2026

## Résultat et périmètre

Ce lot répare l'accès automatique et renforce la qualification ; il ne prétend pas rendre intégrales toutes les compositions. Aucun profil, actif, seuil de fraîcheur, seuil financier ou format éditorial ajouté/modifié. Les poids observés ne sont jamais renormalisés. Les registres, producteurs et workflows partagés existants restent la voie unique.

L'inventaire porte sur les 150 profils préparés (84 supports distincts) et les 672 supports du sélecteur. Les occurrences mesurées sont disponibles dans `inventory-before.json` et `inventory-after.json` : elles ne mesurent pas l'usage des visiteurs. Le « avant » utilise réellement le moteur de la base ec54cd2 dans un worktree isolé. Les actualisations ordinaires intervenues sur master sont conservées ; leurs variations ne sont pas attribuées à ce lot.

## Avant / après

| Support et ISIN | Avant | Après et effet concret |
|---|---|---|
| WisdomTree Artificial Intelligence, IE00BDVPNG13 | Fichier intégral local, collecte GitHub en HTTP403 | Collecte ordinaire GitHub réussie, 58 lignes, poids identifiés 99,9995 % |
| WisdomTree Battery Solutions, IE00BKLF1R75 | Même panne distante | Collecte réussie, 111 lignes ; 92,7974 % identifiés. Analyse et recouvrement restent partiels |
| WisdomTree Europe Defence, IE0002Y8CX98 | Même panne distante | Collecte réussie, 42 lignes, 100 % identifiés |
| WisdomTree Quantum Computing, IE000W8WMSL2 | Même panne distante | Collecte réussie, 47 lignes ; somme publiée 100,0002 %, conservée. Pas de score intégral selon le contrat inchangé |
| WisdomTree Global Quality Dividend Growth, IE00BZ56SW52 | Même panne distante ; 96,9954 % identifiés | Cotation alternative GGRG LN admise uniquement par preuve officielle de la même part USD Acc. Collecte réussie ; découverte automatique raccordée au flux qualifié, preuve indépendante Amada ajoutée, couverture 97,0513 %. Les cinq identifiants encore inconnus restent explicites |
| WisdomTree Cloud Computing, IE00BJGWQN72 | Même panne distante | Collecte réussie, 64 lignes, 99,9999 % identifiés |
| Amundi PEA Japon TOPIX, FR0013411980 et FR0013411998 (couvert EUR) | Référence native intégrale disponible, preuve du rapprochement historique mal exposée ; possibilité de compléter avec des identités plus récentes | 1 636 membres, 99,9985 %, poids JPX et identités BlackRock au 31 août 2026. Désormais : preuve du fonds exact, source native admise, marqueur de fin de fichier, unicité, empreintes, dates compatibles et historique seul obligatoires. Aucune détention du fonds synthétique déduite de cette référence d'indice |

Les six réussites distantes sont prouvées dans le workflow ordinaire [40902183101](https://github.com/madmax91310/shinny-potato/actions/runs/40902183101), commit 1ced4c0 : `github-paced-collection.json`. Le premier essai des seuls en-têtes passait cinq supports ; des HTTP403 intermittents ont justifié l'espacement et les reprises bornées. Les identités communes sont collectées une fois, sous verrou. Le flux impose l'identité de part, le groupe Fund1, la date, le recensement et les poids ; il n'accepte ni top positions, ni pays/secteurs, ni poids d'indice comme détentions.

Le run entier reste rouge : **182/183**, IE00B441G979 publie 100,762180 % de poids actions, au-delà du plafond existant de 100,5 %. La dernière observation valide conserve sa date. Cet échec est distinct des six réussites ; il n'est ni masqué ni déclaré résolu. En production, les étapes existantes isolent les échecs de collecte et publient les observations valides après leurs contrôles. Sur PR, elles restent bloquantes.

Les recettes locales réelles (six WisdomTree et deux TOPIX) sont jointes dans `local-collection-receipts.json`. Le registre d'identifiants compte désormais 107 preuves qualifiées. Une recherche de nom ne fournit que des candidats : la réponse SEDOL et la réponse ISIN doivent confirmer le même FIGI, la même classe et le même type. Le SEDOL Merck B59RGY2 reste inconnu : ni la ressemblance du nom ni une autre cotation de Merck avec un autre SEDOL ne suffisent. Un renouvellement infructueux conserve la preuve précédente et sa date ; une preuve expirée n'est pas rendue courante.

## Europe/PEA : blocages documentés, calculs partiels conservés

| ISIN | Source officielle contrôlée et obstacle précis |
|---|---|
| FR0011550193, BNP Easy STOXX Europe 600 EUR C | [STOXX SXXP](https://stoxx.com/index/sxxp/) : page de composants sans identifiants et sans date qualifiée des poids ; téléchargements de poids/indices NR inactifs. L'export PDF de composants contient une page nginx « 429 Too Many Requests », malgré HTTP200. L'ancienne factsheet accessible date d'août 2023. Les poids d'un ETF iShares physique ne sont pas ceux de l'indice de ce fonds synthétique |
| FR0011871110, Amundi PEA Nasdaq-100 EUR Acc | [Nasdaq GIW Weighting NDX](https://indexes.nasdaqomx.com/Index/Weighting/NDX) réserve la composition pondérée complète à un accès authentifié. L'aperçu gratuit ne fournit pas les poids complets. Benchmark exact contrôlé dans le document de la part ; aucune substitution par QQQ |
| FR0011869304, Amundi PEA immobilier | [LSEG FTSE EPRA Nareit](https://www.lseg.com/en/ftse-russell/indices/epra-nareit) : PDF public Europe ENHU daté du 30 juin 2026, ancien et d'univers différent (dont Turquie). [EPRA Monthly Statistical Bulletin](https://www.epra.com/research/monthly-reports), septembre 2026 : poids d'actions relatifs au périmètre mondial Developed, non au benchmark Developed Europe exact de la part ; effectifs et principaux poids divergent de sa factsheet. Repondérer le sous-ensemble Europe créerait artificiellement un autre périmètre |

Les empreintes et tailles des documents réellement acquis figurent dans `source-probe-fingerprints.json`. Aucun accès officiel sous licence n'a été fourni au cours de cette recette. L'application refuse une référence intégrale non admise, conserve les poids partiels observés et ne publie pas de taux de recouvrement intégral dans ces cas. Sources et limites restent dans l'analyse ; aucun texte, badge ou matrice ajouté aux images/tweets.

## Validation exécutée

- Tests Python WisdomTree : 54 ; découverte/renouvellement d'identifiants : 7 ; contrats TOPIX : 7 ; tests DCA Python : 20.
- Contrats d'identité indépendante : huit tests. Leur double du flux de découverte a été raccordé à la nouvelle entrée partagée ; les assertions d'expiration, de renouvellement et de conservation sur panne restent identiques, sans requête réelle accidentelle avec une date simulée de 2028.
- `npm run test:dca`, `npm run lint`, `npm run build` et contrôles de contrats d'indice natif exécutés. Aucun budget ni seuil réduit.
- Les régressions couvrent les cas intégral, partiel, périmé, incompatible, tronqué, doublonné et en échec, la conservation datée, le raccordement des URL équivalentes et le refus des références Europe non qualifiées.
- Chromium réel, site compilé : neuf portefeuilles (complets, partiels, sans identifiants, hors actions, indices natifs et bases mixtes), calculs du moteur comparés au texte de l'analyse et du canvas ; PNG téléchargé identique octet par octet à l'aperçu ; ordinateur 1 440 px et mobile 390 px. Recette DCA analytics distincte réussie (contributions, comparaisons, exports). Autre consommateur partagé : 34 compositions dans l'outil Indices, labels/géométrie, téléchargements réels, bascules rapides, indisponibilité et mobile vérifiés. Inspection visuelle du PNG TOPIX et de l'analyse Europe/PEA mobile effectuée.
- Les logs sont joints dans `checks/`, avec deux PNG représentatifs et une capture mobile. Le déploiement et sa recette publique ne sont pas encore revendiqués dans cet état du rapport ; ils seront établis après fusion par le manifeste public et la recette navigateur.
