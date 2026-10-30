# Reprise du livre économique physique Invesco All-World

## Périmètre qualifié

Deux parts seulement : IE000716YHJ7 (Acc), IE0000QLH0G6 (Dist), fonds USD Invesco FTSE All-World UCITS ETF, réplication physique échantillonnée, sans couverture de change. Aucun nouveau support de catalogue. Les contrats synthétiques restent inchangés.

La route `/holdings/fund` renvoie le document officiel vide (SHA-256 `163c0f680f12b6c5dd4bc16fd22ccf929d5adacceb5f6a069353d6b15d435892`). La page publique de chaque part utilise en revanche `/holdings/index?idType=isin&loadType=initial` pour sa table « Les 10 principales expositions ». **Le nom interne `index` ne qualifie pas à lui seul le périmètre.** Le contrat est limité au livre économique de ce fonds physique échantillonné : nom exact du fonds et de la part, ISIN, devise, réplication physique, absence de hedge et benchmark TAWNT01U contrôlés par le lecteur partagé des caractéristiques ; identité physique également contrôlée dans la fiche officielle. La page décrit explicitement un fonds détenant moins de titres que son indice de référence. Ce flux n'est pas enregistré comme composition native FTSE, ni étendu aux ETF synthétiques.

Le compteur public « Afficher 1 à 10 de 2090 produits » correspond aux 2 090 lignes du JSON intégral et à sa même date : dix est la pagination de l'écran, pas la couverture collectée. Un JSON à dix lignes, sans compteur public vérifié ou à date différente est refusé. Le compteur rendu et le JSON proviennent de la même publication : ce contrôle de cohérence n'est pas une seconde source indépendante. La fermeture NAV aux poids natifs et l'identité physique sont contrôlées séparément. Ce contrôle se refait à chaque collecte : aucun compteur historique n'est substitué à celui de la page. Le JSON est servi officiellement en `text/plain`, puis analysé strictement comme JSON.

## Observation réelle locale du 30 octobre

Les deux parts renvoient le même livre économique du 29 octobre : SHA-256 `3e406344c7b77c263d9ad79391e9dcce47dd09a7989a633c82a3ccdcb9d0b7b1`. 2 063 actions à poids positif, 26 lignes actions à zéro et une ligne explicitement nommée « Cash and/or Derivatives » (0,0589 %). Actions : **99,94 %** ; somme publiée : **99,9989 %**. Les poids à quatre décimales restent intacts. Le résidu n'est ni réparti sur les actions ni présenté comme exclusivement liquide. Aucun pays/secteur ne lui est attribué.

Avant : 1 076 lignes, 98,94 % du NAV, observation du 28 octobre conservée lors des erreurs du flux vide. Après collecte locale : 2 063 positions positives identifiées et nouveau livre du 29 octobre. La fixture compressée conserve les octets natifs, les métadonnées exactes et le compteur/date observés sur les deux pages. Ce succès local ne constitue pas une preuve GitHub : les exécutions ordinaires, leurs artefacts et la publication sont ajoutés au bilan de PR après vérification.

## Exploitation

Même producteur `collect_dca_complete_holdings.py`, cibles générées par `build-automation-targets.mjs`, même workflow `update-qualified-exposures.yml`, même archivage `PHYSICAL_SOURCE_PROOF_DIR`, même conservation de la dernière observation en cas d'échec. Aucun seuil existant modifié. Les métadonnées de méthode et de contrôle du contrat traversent la projection paresseuse ; aucun texte, dessin ou calcul du PNG/tweet modifié.

Les quatre échecs précédents hors Invesco ne sont pas résolus par cette correction : WisdomTree Battery IE00BKLF1R75 et Global Quality Dividend Growth IE00BZ56SW52 (403 sur l'API précise, secours plus ancien rejeté), Global X Uranium IE000NDWFGA5 (NAV d'un contrat ZAR non publié), World EUR Hedged IE00B441G979 (poids bruts actions au-dessus du périmètre net admis). Les indices économiques synthétiques non licenciés restent hors admission ; voir le bilan détaillé de #1065. Aucun incident fermé sur la seule présence du code.

## Corroboration historique de périmètre

La fixture `historical-scope-corroboration.json.gz` conserve le livre `/holdings/fund` déjà qualifié du 28/10 et les octets de la table publique du même 28/10 (SHA `4579e05100768a2bb3116f058d27a10b572e60bb9ea6ccab5c9bd822cb4fb11e`). Les 1 076 ISIN antérieurs sont tous présents ; chaque poids est identique à 0,005 point près, précision des anciennes valeurs à deux décimales. Les 1 013 autres ISIN de la table pèsent chacun au plus 0,005 %, dont des zéros. Cette corroboration et la ligne explicite Cash and/or Derivatives étayent le périmètre économique du fonds physique ; elles ne constituent ni une composition native FTSE ni une nouvelle actualisation. Le contrôle UTC exact de cette ancienne capture locale n’est pas reconstruit depuis son heure de fichier : il reste inconnu ; sa date financière reste le 28/10.
