# Sources des fixtures de couverture

Réponses publiques collectées le 6 octobre 2026, sauf les deux tables Russell synthétiques explicitement signalées. Ces fichiers servent aux tests hors réseau ; ils ne constituent pas des données actives supplémentaires.

| Fixture | Source officielle | Périmètre |
|---|---|---|
| `amundi-index-share.json` | API Amundi `ProductAPI/getProductsData`, configuration `additional-etf-sources.json` | FR0014017NX3 ; champs de l’indice et date propres, réponse du produit exact |
| `vanguard-exact-share.json` | https://www.vanguard.co.uk/gpx/graphql | Produit 9507, IE00B3VVMM84 ; observations annuelles 2020–2025 et glissante au 30/09/2026, allocations de toutes classifications |
| `dws-exact-share.json` | API DWS `pdpMetaTagsTealium`, configuration de IE00BLNMYC90 | Sections caractéristiques et performances du produit exact |
| `dws-history.xlsx` | API DWS `historicaldata/download` de IE00BLNMYC90 | Classeur original, encours du fonds, dates de valorisation et d’export distinctes |
| `dws-physical-holdings.json` | API DWS `holdings` de IE00BM67HK77 | Portefeuille physique complet du fonds Health Care, photographie du 02/10/2026 |
| `msci-china.txt` | https://www.msci.com/documents/10199/255599/msci-china-index-usd-net.pdf | Texte extrait du PDF officiel, 30/09/2026 |
| `msci-min-vol-net.txt` | https://www.msci.com/documents/10199/255599/msci-world-minimum-volatility-index-net.pdf | Texte extrait du PDF officiel NET, 30/09/2026 |
| `russell-1000-benchmark-row.txt` | Fixture synthétique, aucune valeur FTSE republiée | Deux lignes concurrentes et rendements fabriqués, pour tester le choix exact Russell 1000 |
| `russell-2000-benchmark-row.txt` | Fixture synthétique, aucune valeur FTSE republiée | Deux lignes concurrentes et rendements fabriqués, pour tester le choix exact Russell 2000 |

Les fixtures JSON DWS de caractéristiques et Vanguard sont réduites aux sections/observations nécessaires. Les catégories géographiques Vanguard concurrentes sont gardées pour vérifier leur exclusion. Les fixtures PDF ne conservent que les titres, dates, conventions et extraits de tables nécessaires aux tests ; les commentaires éditoriaux, descriptions, graphiques et autres pages ne sont pas republiés. Les valeurs des tables restent celles des documents officiels.

`index-extensions/russell-2000.json` : extraits texte de la fiche officielle Amundi LU1681038672 du 31/08/2026, collectée le 07/10/2026 à https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681038672/FRA/FRA/INSTITUTIONNEL/ETF/20260831. En-tête d’identité, date, réplication, symbole, nombre de titres et tableaux d’indice ; les autres pages et commentaires sont exclus. Empreinte du PDF : `c68c356dfc4bd1e3cc7229aa3710df56f0044a8735771a96acbd3403a56136cc`.

`amundi-dow-index-share.json` : réponse API Amundi `ProductAPI/getProductsData` collectée le 07/10/2026 pour FR0007056841, réduite à l’identité, au benchmark, à la méthode de réplication, à la date INDEX_BREAKDOWNS_AS_OF_DATE du 02/10/2026 et aux trois tableaux INDEX_TOP10, INDEX_COUNTRIES, INDEX_SECTORS.

Les fixtures `bnp-easy-sp500.txt`, `bnp-easy-stoxx.txt` et `bnp-easy-ii-nasdaq.txt` conservent uniquement les sections nécessaires aux contrôles de parts, frais, encours et calendriers. Elles sont extraites avec `pdftotext -layout` des trois fiches BNP du 31/08/2026 republiées par Analizy, dont les liens et limites sont documentés dans `docs/source-reliability-index-coverage-2026-10-07.md`. Aucun tableau de composition n’est activé depuis ces fixtures.

## Compléments de champs — 7 octobre 2026

- BNP : extraits des tables de composition ajoutés aux trois fixtures exactes déjà sourcées. Les tables françaises portent « HOLDINGS BENCHMARK » ; Nasdaq utilise les colonnes Portfolio. Aucun tableau de régions ne sert de pays.
- `blackrock-em-bond-holdings.json` : six colonnes du portefeuille complet officiel [iShares EM Bond, produit 251824](https://www.ishares.com/uk/individual/en/products/251824/), snapshot holdings 6 octobre 2026 ; réponse `product-data/api/v2/get-product-data`, devise USD. Les autres métriques sont retirées du fixture.
- VanEck TDIV et TRET : extraits assemblés de faits/identité, calendriers et top dix, plus extraction de la colonne pays des fiches [TDIV](https://www.vaneck.com/ucits/library/fact-sheets/tdiv-fact-sheet.pdf) et [TRET](https://www.vaneck.com/ucits/library/fact-sheets/tret-fact-sheet.pdf), datées 30 septembre 2026. Les distributions sont brutes de retenue néerlandaise, après frais du fonds.
- `vaneck-tdiv-sectors.json` : réponse officielle du widget lié à [la page TDIV](https://www.vaneck.com/uk/en/investments/dividend-etf/), `Main/HoldingsWeightingsChartBlock/GetContent`, blockid 194841 / pageid 233165 / ticker TDIV, 30 septembre 2026. Seuls les champs utilisés et toutes les lignes du tableau sont conservés. Les identifiants de widget sont redécouverts à chaque collecte.
