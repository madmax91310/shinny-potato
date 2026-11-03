# Compositions prioritaires — lot #1050, 29 octobre 2026

## Résultat mesuré

Le lot traite tous les supports du bilan de priorités. Il qualifie **21 nouveaux identifiants**, conserve les vrais instruments sans identifiant, raccorde les périmètres comptables publiés à l'analyse, isole les pannes de sources d'identifiants et automatise la surveillance des trois recherches d'indices natives. Il ne prétend pas avoir obtenu les compositions intégrales sous accès réservé.

Base : master **7543cec**, contenant #1045 fusionnée et publiée. Les PR ouvertes ont été relues : #1031 conserve le lecteur Global X, #1047 l'enregistrement et les preuves de frais, #1042 le guide éditorial. Aucun de leurs collecteurs métiers n'est modifié. Le document de coordination conserve chaque chantier. Fusion et déploiement sont explicitement autorisés dans la demande utilisateur.

## Avant / après par support

Les occurrences proviennent des 150 profils préparés, pas des visites. Les inventaires complets avant/après sont joints ; les fonctions de calcul et les seuils d'admission sont inchangés entre ces deux lectures.

| Support / ISIN | Avant | Après réel / effet sur l'application |
|---|---|---|
| WisdomTree Battery Solutions **IE00BKLF1R75** | 17 positions inconnues, 92,7974 % identifiés | 17 correspondances indépendantes confirmées : toutes les 111 positions sont identifiées. Somme publiée **100,0004 %**, conservée. Le contrat inchangé refuse toujours le score intégral au-delà de 100,00001 % : aucune renormalisation pour l'obtenir |
| WisdomTree Global Quality Dividend Growth **IE00BZ56SW52** | 5 positions inconnues, 97,0513 % identifiés | Eagers, Warner Music classe A, Sanoma ordinaire et U-NEXT qualifiés : **97,1431 %** identifiés. Seul Merck, SEDOL **B59RGY2**, reste inconnu pour **2,8565 %**. Le nom de l'entreprise ne fournit pas la preuve manquante |
| iShares ACWI **IE00B6R52259**, 33 profils | Fichier intégral ; 0,0001 % de position DUMMY sans ISIN | Réponse réelle : **SINOPAC FIN HOLDINGS CO LTD DUMMY**, non cotée, ticker 2684290D, ISIN null. Aucun ISIN de l'action Sinopac attribué à cette position distincte. Les 1 739 lignes du fichier et leur solde sont désormais rapprochés ; 99,6372 % retenus dont 99,6371 % identifiés. Analyse partielle conservée |
| iShares World Small Cap **IE00BF4RFH31**, 8 profils | Fichier intégral ; 0,0003 % sans ISIN | Réponse réelle : **AKERO THERAPEUTICS CVR**, ticker AKE, ISIN null. Aucun rapprochement avec l'ancienne action ordinaire. Rapprochement des 3 596 lignes, 99,5143 % retenus dont 99,5140 % identifiés ; droits inconnus explicités uniquement dans les sources de l'analyse |
| Xtrackers Emerging Markets **IE00BTJRMP35**, 13 profils | Fichier intégral déjà collecté, 99,40857298 % retenus | Solde expliqué : **0,55181269 % de liquidités** et **0,03960831 % de parts de fonds monétaire**. Le fonds IE00BYQNZ507 est qualifié par son KID exact, malgré la classe brute « Equities » du tableau. Cette contradiction de typage est visible, sans modifier les poids. Kangmei à poids nul garde son identifiant inconnu. Le seuil inchangé maintient l'analyse partielle |
| iShares Global Infrastructure **IE00B1FZS467**, 6 profils | Fichier intégral déjà collecté, 99,35595 % retenus | Solde publié conservé par classe : liquidités **0,41493 %**, supports monétaires **0,1053 %**, autres instruments **0,08706 %**, dépôts de garantie **0,03676 %**. Total net publié ≈ 100 %. Aucun pays/secteur actions fabriqué pour le solde ; aucune extension artificielle des actions à 100 % |
| iShares World EUR Hedged **IE00B441G979** | Nouvelle observation refusée au plafond de 100,5 % ; dernière valide conservée | Source réelle : actions **100,76218 %**, contrats à terme de change **−1,89321 %**, autres classes séparées, net total **100,00001 %**. Le net réconcilie : le blocage est celui du périmètre brut/net que le contrat actuel ne peut admettre, pas la preuve d'un fichier arithmétiquement incohérent. Diagnostic enrichi ; plafond conservé, dernière réussite et date d'origine inchangées |
| World **IE00B4L5Y983**, S&P 500 **IE00B5BMR087**, Nasdaq **IE00B53SZB19**, All-World **IE00BK5BQT80** | Collectes intégrales opérationnelles | Les quatre cœurs ont été recollectés réellement et validés ; ils restent dans les producteurs et calendriers ordinaires. Leurs dates financières originales ne sont pas remplacées par la date du contrôle |

Le portefeuille de recette 50 % Battery / 50 % GGRA passe de **94,92435 % à 98,57175 % identifiés**, soit **+3,6474 points**, de 643 à **664 titres distincts**. Ses poids et sa structure n'ont pas été modifiés ; le PNG conserve le même format et reste explicitement partiel.

## Identités : sources, renouvellement et garde-fous

Les recherches ont fourni des hypothèses depuis des dépôts SEC N-PORT réellement téléchargés, des annuaires de dépositaires (SQM ADR et Sanoma ordinaire), des positions déjà qualifiées et deux références de sociétés S&P Global/StockAnalysis. Les documents historiques sont des pistes, **jamais une photographie actuelle des fonds**. Leurs identifiants ne sont admis qu'après les deux requêtes exactes et indépendantes SEDOL/ISIN à OpenFIGI : même FIGI, même classe et même type. Une hypothèse issue d'une source secondaire n'est pas une preuve financière.

Les 21 réponses natives, leurs requêtes, empreintes et dates réelles sont conservées dans le registre existant `src/data/security-identifier-observations.json` : **128 preuves qualifiées**, contre 107. Aucun actif ajouté au catalogue. Le registre existant de candidats et le workflow de renouvellement existant sont réutilisés, avec le même budget automatique de requêtes et les mêmes règles d'expiration.

La fixture `scripts/fixtures/security-residual-identities.json.gz` contient ces 21 réponses, une requête réelle négative **SQM ADR / action ordinaire chilienne**, et le refus réel Merck. Les deux ISIN de SQM restent distincts. La régression rejoue les preuves à leur horloge d'origine ; elle ne rajeunit pas un ancien identifiant.

Une source de livres d'identifiants en panne est isolée et diagnostiquée ; les autres preuves valides et les observations retenues restent soumises à leurs dates. Deux sources valides contradictoires provoquent toujours un refus. Une recette supplémentaire a injecté la panne d'un seul livre, avec les autres sources et le portefeuille émetteur réellement lus : Battery reste identifiée, la panne est conservée dans `identitySourceFailures`. Il s'agit d'une **panne contrôlée**, pas d'une panne fournisseur revendiquée comme réparée.

## Rapprochement comptable et consommation

Le nouveau rapprochement est produit dans les collecteurs partagés BlackRock et DWS, puis conservé dans les projections différées. Il porte la date, le nombre de lignes, le poids retenu, les classes brutes exclues signées, les positions sans identifiant et les qualifications documentaires des fonds monétaires. Il vérifie la conservation du net ; il ne change ni les poids ni l'admission du recouvrement.

L'interface de détail des sources affiche ces informations en ordinateur et mobile. Les très petits poids restent lisibles, par exemple **0,0003 %**, sans arrondi trompeur à zéro. Les positions DUMMY/CVR ne reçoivent pas l'identité de l'action ordinaire. Le pays et le secteur de l'or/Bitcoin restent hors classification actions. Aucun ajout aux tweets, PNG, matrices ou formats éditoriaux ; aucune refonte graphique.

## Europe/PEA : recherches et surveillance automatique

| Support | Contrôle réel et blocage restant |
|---|---|
| BNP Easy STOXX Europe 600 **FR0011550193**, 22 profils | Pages officielles du **SXXR / EU0009658210**, version NR EUR exacte, contrôlées. La page de composants n'expose pas de lignes exploitables dans sa table HTML ; le tableau de données ne fournit pas la composition pondérée, datée et identifiée requise. Le dernier examen SXXP n'apportait pas davantage de preuve complète. Aucun remplacement par le portefeuille physique d'un autre ETF |
| Amundi PEA Nasdaq-100 **FR0011871110**, 1 profil | GIW officiel contrôlé : table gratuite limitée à Number / Company Name / Security Symbol, avec accès Login/Register et service de livraison des pondérations. Pas de poids complets publics qualifiés. Benchmark exact de la part conservé ; aucune substitution par QQQ |
| Amundi PEA Immobilier Europe **FR0011869304**, 1 profil | LSEG et EPRA relus réellement. EPRA signale des fichiers réservés aux membres. Le bulletin public septembre donne des poids relatifs au Developed mondial, pas les poids du benchmark Developed Europe exact ; les documents Europe disponibles et les principales pondérations ne permettent pas le rapprochement requis. Aucune renormalisation de ce sous-ensemble ni assimilation d'un comptage de sociétés à un comptage de titres |

Les trois connexions, auparavant **sans URL configurée pour leur composition intégrale**, sont maintenant liées à cinq routes officielles dans `native-index-source-candidates.json`, via l'inventaire et le contrôleur d'accès ordinaires. Les cinq accès réels ont réussi, avec empreinte et horloge, **tous non qualifiés financièrement**. Ce registre de recherche n'est pas le contrat d'admission des indices natifs. Toute nouvelle disponibilité demande toujours les identifiants, poids, date, méthode et lien au benchmark exact avant consommation.

Une réponse HTTP200 contenant un document d'erreur nginx 403/429/5xx est désormais classée comme accès en échec, avec conservation du dernier reçu, au lieu d'un faux succès. Aucun accès authentifié ou sous licence n'était configuré pour ces trois indices. L'obstacle ne peut être résolu en ajoutant un collecteur qui inventerait les champs absents.

## Validation exécutée et preuves

- **Collectes réelles locales** : six succès sur sept supports ciblés, World Hedged refusé ; quatre cœurs et DWS ensuite cinq sur cinq. Reçus avec URL, date, contrôle, hash, nombres de lignes et poids joints.
- **Workflow ordinaire GitHub PR** [40924306948](https://github.com/madmax91310/shinny-potato/actions/runs/40924306948), commit 468c69e : **182/183**, seul World Hedged refusé. Les dix autres supports nommés dans le bilan sont collectés et leurs poids confirmés ; le renouvelleur confirme 128 identités qualifiées. Ce run rouge n'est pas présenté comme un succès global. L'autre workflow ETF a rencontré son verrou régional VanEck, distinct de ce lot.
- **Tests** : 24 DCA Python, 56 WisdomTree, 7 candidats, 8 contrats indépendants, 3 régressions de réponses réelles, 5 accès sources ; `npm run test:dca`, lint et build. Aucun seuil ou budget réduit. Les réponses officielles complètes des quatre cas BlackRock sont jointes compressées et rejouées dans les tests.
- **Chromium réel sur site compilé** : douze portefeuilles, cas partiels, sans identifiants, or/crypto seuls, fonds/indices séparés, résidus comptables, ACWI/CVR et couverture World Hedged refusée ; analyse, canvas et PNG téléchargé identiques, 1 440 px et 390 px. DCA analytics distinct réussi. Autre consommateur partagé : **34 compositions de l'outil Indices**, géométrie, labels, téléchargements et mobile vérifiés.
- **Inspection visuelle** : export Battery/GGRA à 98,57 %, analyses mobiles résidus et droits. Les preuves sont dans `checks/`, `visuals/`, les reçus JSON et les corps natifs compressés. Les inventaires conservent les 150 profils et 672 supports du sélecteur.

À cet état du rapport, fusion et publication ne sont pas encore revendiquées. Elles seront attestées après livraison dans la PR par le SHA du code et des données publics, la collecte de production et la recette publique. Aucun incident de suivi clôturé manuellement.
