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
