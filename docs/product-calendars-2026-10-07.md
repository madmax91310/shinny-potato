# Calendriers des produits — qualification du 7 octobre 2026

Cinq des six calendriers manquants sont raccordés aux collectes des 3 et 16 du mois. La couverture active passe de 138 à 143 instruments sur 155. Les onze parts récentes sans calendrier qualifié restent suivies séparément.

| Produit exact | Devise | Années complètes | Source et convention |
|---|---|---|---|
| HSBC EURO STOXX 50 — IE00B4K6B022 | EUR | 2016–2025 | KIID du 3 mars 2026 ; barre Fund, jamais Benchmark ; NAV avec revenus réinvestis, après charges ; précision publiée 0,1 % |
| Bitwise Bitcoin — DE000A27Z304 | USD | 2021–2025 | Tableau officiel Year / NAV, daté du 7 octobre 2026 ; lancement juin 2020 exclu, YTD exclu |
| CoinShares Bitcoin — GB00BLD4ZL17 | USD | 2022–2025 | Série officielle du produit normalisée à 100 ; rapports des derniers niveaux de décembre ; lancement janvier 2021 exclu |
| CoinShares Ethereum — GB00BLD4ZM24 | USD | 2022–2025 | Même série du produit ; inclut les effets des frais et de l’entitlement avec staking, jamais les seuls cours ETH ; lancement février 2021 exclu |
| 21Shares Bitcoin — CH0454664001 | USD | 2020–2025 | Historique NAV officiel ABTC, contrôlé contre les douze rendements mensuels de chaque année ; niveaux déjà ajustés du fractionnement 14:1 ; année de lancement 2019 et YTD exclus |

HSBC : le renouvellement annuel du KIID est contrôlé, avec les dix années civiles précédentes. L’extraction géométrique conserve l’ordre Fund / Benchmark constaté dans le graphique officiel ; barres manquantes, années dupliquées ou ordre modifié échouent. Le KIID annuel ne suit pas le délai de fraîcheur de 75 jours des fiches mensuelles : il doit être renouvelé dans l’année courante.

CoinShares : la configuration publique du site est redécouverte sans clé privée à configurer. Le widget `ISIN_GRAPH_<ISIN>@%` est explicitement celui du graphique « ETP Performance », et non la série crypto de référence des PDF. Identité, lancement, devise USD qualifiée par les documents/pages, échelle normalisée, dates, absence de doublons, niveaux positifs et rendement depuis création sont contrôlés. Une observation de fin décembre doit exister dans chacune des années et l’année précédente. Les niveaux publics arrondis limitent la précision des rendements dérivés.

Les graphiques CoinShares ont été téléchargés et validés lors de cette passe (valorisation au 6 octobre 2026). Une tentative ultérieure de collecte complète a rencontré un refus HTTP 403 du tunnel réseau pour ces deux produits. Seuls les calendriers issus des réponses effectivement téléchargées sont ajoutés ; leurs frais et encours précédemment validés sont conservés. Le connecteur devra encore être confirmé dans l’environnement GitHub lors de la collecte suivante.

Les séries courtes restent des observations de la part exacte ; elles ne remplacent pas un proxy de simulation exigeant six années complètes. Sources, dates de valorisation/publication, dates de vérification et empreintes SHA-256 sont conservées par champ. Une panne ou un changement de schéma du calendrier conserve les autres champs valides et signale une erreur de collecte.

## Un calendrier encore bloqué

- **QYLD — IE00BM8R0J59** : le rendu de la page officielle présente des performances glissantes de la part USD capitalisante IE00BM8R0H36. Elles ne qualifient pas le calendrier de la part distribuante. Le document FundAssist référencé a rencontré des erreurs HTTP 500. Ni le fonds américain QYLD, ni la part capitalisante, ni l’indice ne sont utilisés comme substitut.
21Shares : l’API publique est celle utilisée par le graphique du site officiel. Le endpoint `product_details/ABTC` qualifie l’ISIN CH0454664001 et la devise USD ; `product_valuation_history/ABTC` fournit les NAV du produit ; `product_performance_metrics/ABTC` fournit ses performances mensuelles. Les dernières dates doivent être cohérentes et fraîches, les NAV positives et uniques, chaque mois présent et chaque rendement mensuel égal au rapport des NAV de fin de mois. Les réponses gzip sont décompressées avec une limite de taille. L’empreinte conservée couvre les trois réponses validées. Les pannes du PDF et du calendrier restent indépendantes et ne suppriment pas les champs précédemment validés.

L’avis officiel du 31 mars 2021 confirme un fractionnement **14:1, effectif le 12 avril 2021**. La série API est déjà ajustée : aucun facteur supplémentaire n’est appliqué. Les observations du 9 et du 12 avril sont contrôlées contre le mouvement du BTC pour détecter uniquement une rupture artificielle liée au fractionnement ; le BTC ne fournit aucun rendement publié. Le vieux PDF PRIIPs du 6 janvier 2025 affichait −88,21 % en 2021 : il reste exclu. L’API donne **+65,02 %**, cohérent avec ses NAV ajustées et ses douze rendements mensuels. Les autres années sont également calculées depuis cette API, sans panacher des conventions ou les barres du PDF.

Rendements USD dérivés, à la précision des NAV arrondies de l’émetteur : 2020 +277,89 %, 2021 +65,02 %, 2022 −65,41 %, 2023 +151,83 %, 2024 +114,17 %, 2025 −4,71 %. Valorisation au 6 octobre 2026.

QYLD : nouvelle vérification des fichiers FundAssist anglais, allemand et italien, ainsi que de l’URL anglaise normalisée (simple slash) : HTTP 500. Le rendu public conserve des périodes glissantes et une liste de périodes discrètes vide ; les scripts publics examinés ne fournissent pas de calendrier distribuante qualifié. Il reste nécessaire d’obtenir un calendrier officiel propre à cette part, ou un historique NAV accompagné des distributions et d’une convention officielle de réinvestissement.

Sources officielles examinées :

- https://www.assetmanagement.hsbc.co.uk/api/v1/download/document/ie00b4k6b022/gb/en/kiid
- https://bitwiseinvestments.eu/products/bitwise-physical-bitcoin-etp/
- https://coinshares.com/etp/physical-bitcoin/
- https://coinshares.com/etp/physical-ethereum/
- https://globalxetfs.eu/funds/qyld/
- https://www.21shares.com/en-eu/product/abtc
- https://api.primary.21shares.com/api/product_details/ABTC
- https://api.primary.21shares.com/api/product_valuation_history/ABTC
- https://api.primary.21shares.com/api/product_performance_metrics/ABTC
- https://5250-prd-web-21shares-cms.s3.amazonaws.com/21_Shares_AG_Official_Notice_ETP_Share_Split_1_8814f06a4b.pdf
- https://cdn.21shares.com/uploads/current-documents/past-performance/ABTC/CH0454664001_21SharesAG%28EN%29.pdf

Fixtures limitées aux tableaux, textes réglementaires et métadonnées nécessaires ; tests de régression exécutés en collecte et déploiement.
