# Quatre erreurs du run 38250622360 — diagnostic et correction

## Diagnostic individuel

| ISIN | Produit exact | Diagnostic |
|---|---|---|
| IE000RDRMSD1 | iShares Blockchain Technology UCITS ETF USD (Acc), BLKC | Le lecteur refusait la ligne signée Cash and/or Derivatives, −0,10 % dans les pays et secteurs au 09/10/2026. Les pondérations totalisent 100 %. Les positions officielles du même jour donnent −1,00468 % de USD CASH et un solde total liquidités/dérivés de −0,10401 %, soit −0,10 % arrondi. Erreur d'interprétation, pas une performance ou un encours invalide. |
| IE00B3F81R35 | iShares Core € Corp Bond UCITS ETF EUR (Dist), IEAC | Même problème dans les secteurs au 09/10/2026 : Cash and/or Derivatives −0,01 %, total 99,99 %. Les positions officielles donnent −0,16672 % de EUR CASH et un solde liquidités/dérivés de −0,00722 %, soit −0,01 % arrondi. Les pays au 01/10/2026 ont leur date propre et ne sont pas re-datés. |
| GB00BLD4ZL17 | CoinShares Bitcoin ETP, BITC | HTTP 500 pendant le run. Les journaux ne fournissent pas l'URL de la requête fautive : ils ne permettent pas d'attribuer rétrospectivement la panne au PDF, aux scripts publics ou aux widgets. Le PDF, les widgets d'encours et le calendrier ont réussi lors de la nouvelle collecte du 12 octobre. |
| GB00BLD4ZM24 | CoinShares Ethereum Staking ETP, ETHE | Même panne HTTP 500, même limite du diagnostic rétrospectif. Nouvelle collecte officielle complète réussie. Produit de dette ETP adossé à ETH avec staking, distinct d'un ETF UCITS. |

Les fiches BlackRock officielles de septembre téléchargées le 12 octobre identifient les mêmes ISIN, les devises USD/EUR, les politiques Acc/Dist et les frais 0,50 %/0,09 %. Leurs encours et compositions sont au 30 septembre : ils ne sont pas comparés comme s'ils étaient du 9 octobre. Les positions datées du 9 octobre expliquent directement les soldes négatifs de la réponse structurée.

Sources BlackRock :
- https://www.ishares.com/uk/individual/en/products/328618/ishares-blockchain-technology-ucits-etf
- https://www.ishares.com/uk/individual/en/products/251726/
- https://www.ishares.com/gls-download/literature/fact-sheet/blkc-ishares-blockchain-technology-ucits-etf-fund-fact-sheet-en-gb.pdf
- https://www.ishares.com/gls-download/literature/fact-sheet/ieac-ishares-core-corp-bond-ucits-etf-fund-fact-sheet-en-gb.pdf

## Contrôles conservés et reprise CoinShares

La validation des allocations distingue uniquement le libellé exact Cash and/or Derivatives. Ses valeurs finies restent bornées à −100/+100 ; toutes les autres catégories restent non négatives. Les sommes 99–101 %, dates, identité, devise, unicité et taille des colonnes restent contrôlées. Aucune suppression, valeur absolue ou renormalisation des pondérations.

Les téléchargements avaient déjà trois essais pour HTTP 500/502/503/504 et 429. Répéter sans changement de source ne garantit pas la reprise. En cas d'échec de transport du PDF CoinShares, le lecteur peut maintenant récupérer les frais dans le widget officiel ISIN_KEYSTATS de la part exacte, section OVERVIEW, champ managementFee, daté par rateDate (maximum dix jours). Un PDF reçu mais invalide ne déclenche pas ce secours. Les frais du staking ne sont pas confondus avec son rendement.

Les encours proviennent toujours de ISIN_DYNKEYSTATISTICS, avec identité ISIN_STATMETADATA et date Rate Date. Les performances proviennent de la série normalisée du produit, alignée à l'overview ; les rendements du BTC/ETH brut dans le PDF ne les remplacent pas. La configuration publique de l'API est redécouverte dans les scripts du site, sans figer une clé ni un PDF mensuel.

Sources CoinShares :
- https://coinshares.com/etp/physical-bitcoin/
- https://coinshares.com/etp/physical-ethereum/
- https://coinshares.com/en/d/etp/factsheet/physical-btc/
- https://coinshares.com/en/d/etp/factsheet/physical-ethereum/
- https://www-api.coinshares.com/api/v2/Widgets (paramètres publics redécouverts)

Une panne d'encours ou de calendrier n'efface plus les autres champs validés. Le champ indisponible et ses dates antérieures restent inchangés ; collectionErrors continue à rendre la panne visible et le workflow rouge. Une panne complète conserve le record entier.

## Validation

Les quatre collectes réelles ont réussi sans collectionErrors le 12 octobre et leurs seuls records ont été actualisés dans automated-etf.json. Les deux calendriers CoinShares conservent leurs observations validées, notamment 2025 : −7,99 % Bitcoin et −11,70 % Ethereum.

Les tests de régression vérifient les deux réponses numériques réelles, les valeurs négatives non qualifiées, non finies et hors bornes, les tableaux incomplets, dates futures/périmées, le secours frais pour les deux ETP, les mauvaises identités/devises, les champs dupliqués, le rejet d'un PDF invalide et la conservation exacte des champs/dates lors de pannes partielles ou totales.

Le test des consommateurs vérifie que les fiches de présentation, encours, performances annuelles, séries des comparatifs/duels et détails de composition reçoivent le registre validé sans perdre les poids signés. Les séries mensuelles des simulateurs ont leur collecte indépendante ; aucun rendement annuel n'est transformé artificiellement en rendement mensuel.

Les nouvelles régressions et le test des consommateurs sont inclus dans les workflows de collecte et de validation/déploiement Pages.

## Blocage supplémentaire découvert par la CI

Le run de validation 38267323653 a réparé les quatre sources ciblées (42 parts principales validées), mais a échoué pour IE00BM67HV82, Xtrackers MSCI World Industrials UCITS ETF 1C. La table officielle DWS du 07/10/2026 contient une part de fonds IE00BYQNZ507, DEUTSCHE GLOBAL LIQUIDITY SERI, à 0,42899138 %, classe Mutual Fund, pays d'enregistrement Ireland, industrie Unknown. Le lecteur ne connaissait pas cette classe et refusait la composition entière.

La part de fonds positive et identifiée est désormais conservée avec son pays d'enregistrement officiel et son secteur Unassigned. Aucun secteur sous-jacent, aucune assimilation à une action industrielle ni à des liquidités n'est inféré. Les parts négatives, identités invalides, classes inconnues et portefeuilles incomplets restent refusés. La fixture est un extrait de https://etf.dws.com/api/pdp/en-gb/etf/IE00BM67HV82/holdings, téléchargé le 12/10/2026. Cette correction est nécessaire pour obtenir un workflow complet vert avant fusion.

La validation Pages a aussi détecté cinq fichiers d'illustration inexistants pour les actifs mensuels robotics, financials, infrastructure, health et clean energy. Ce problème a été corrigé en parallèle dans la PR #533, fusionnée sur master. Cette branche reprend ce correctif existant et ajoute des assertions sur les chemins partagés, sans dupliquer ni écraser sa correction du ratio des illustrations. Les exports réutilisent les illustrations correspondantes d'asset-art/etf-night. Les textes et squelettes restent inchangés.
