# Compléments de composition — 7 octobre 2026

Périmètre accepté : expositions QYLD et deux fonds de matières premières ; compositions Russell 1000, Global Dividend Aristocrats Quality Income et Euro High Yield Dividend Aristocrats ; recherche de sources pour taux d’épargne, ménages et SCPI/fonds euros. Réplication, distribution, domicile, couverture de change et éligibilité PEA sont exclus des nouveaux raccordements demandés.

## Deux allocations raccordées

| Part exacte | Donnée active | Source |
|---|---|---|
| Invesco Bloomberg Commodity IE00BD6FTQ80 | Sept groupes publiés du Bloomberg Commodity Index, au 31/08/2026 | Fiche courante Invesco, section « Index composition (%) », ticker BCOMTR contrôlé |
| iShares Diversified Commodity Swap IE00BDFL4P12 | Même allocation de son indice exact ; performance de la part iShares conservée | Benchmark « Bloomberg Commodity Index Total Return (Official) » contrôlé dans la réponse BlackRock courante ; allocation d’indice de la fiche Invesco, provenance distincte |

Source courante relue aux collectes des 3 et 16 du mois :
https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE00BD6FTQ80_factsheet_en.pdf

Identité Invesco, BCOMTR, date propre au tableau, sept groupes uniques, bornes numériques et somme sont vérifiés. La ligne Others publiée à −0,01 % reste conservée : aucun écrêtage, ajustement ou résidu inventé. La somme arrondie publiée atteint 100,09 %. Ce nouveau champ `commodityAllocation` reste distinct des pays, secteurs actions et positions juridiques du fonds. Ni les titres de collatéral, ni les swaps de la fiche iShares ne deviennent des matières premières.

La collecte réelle des deux parts a validé les allocations. La fusion préserve les valeurs plus récentes et conserve le dernier tableau en cas de panne ; les frais, encours et performances valides restent indépendants, avec erreur de champ signalée. Le tableau apparaît dans Présentation ETF, les compléments du comparatif et la bibliothèque de données/export JSON. Les performances iShares ne proviennent jamais du fonds Invesco.

## Sources revérifiées mais non raccordées

| Objet | Vérification réelle | Blocage conservé |
|---|---|---|
| QYLD IE00BM8R0J59 | Page courante HTTP 200 ; document FundAssist HTTP 500 ; ancienne URL PDF Global X HTTP 404 | Deux séries de dix lignes dans une seule table « Top 10 Reference Index Constituents » ; aucun groupe identifié de manière univoque. Les allocations sectorielles ne sont pas raccordées tant que leur identité économique n’est pas recoupée. Le panier de substitution est explicitement sans exposition économique résiduelle et reste exclu. |
| Russell 1000 | PDF courant FTSE Russell au 30/09/2026, HTTP 200, 1 022 titres | Dix noms et secteurs, sans poids individuels ; graphique ICB sans table numérique complète. Le portefeuille VONE/IWB et les variantes Growth/Value ne remplacent pas cet indice. |
| Global Dividend Aristocrats Quality Income | Page S&P HTTP 200, indexId 92388578 | Service public de la page HTTP 400, y compris avec session/cookies et en-têtes de requête AJAX. Pas de tableaux pondérés complets et datés qualifiés. |
| Euro High Yield Dividend Aristocrats | Page S&P HTTP 200, indexId 5475610 | Même service HTTP 400. La variante Screened/Screened+ et les poids d’un fonds State Street ne remplacent pas la composition demandée. |

Sources inspectées :

- https://globalxetfs.eu/funds/qyld/
- https://expressapi.fundassist.com/v1/api/Files/2152e942-df8d-ed11-a85a-005056a103bb/1
- https://globalxetfs.eu/content/files/QYLD_UCITS-factsheet.pdf
- https://research.ftserussell.com/Analytics/FactSheets/Home/DownloadSingleIssue?isManual=False&issueName=US1000USD&openfile=open
- https://www.lseg.com/en/ftse-russell/index-resources/constituent-weights
- https://advisors.vanguard.com/investments/products/vone/vanguard-russell-1000-etf?compositionTabBox=1
- https://www.spglobal.com/spdji/en/indices/dividends-factors/sp-global-dividend-aristocrats-quality-income-index/
- https://www.spglobal.com/spdji/en/indices/dividends-factors/sp-euro-high-yield-dividend-aristocrats/
- https://www.spglobal.com/spdji/en/util/redesign/index-data/get-performance-data-for-datawidget-redesign.dot?indexId=92388578
- https://www.spglobal.com/spdji/en/util/redesign/index-data/get-performance-data-for-datawidget-redesign.dot?indexId=5475610

Les trois compositions restent hors collecte active ; leurs performances annuelles déjà raccordées continuent indépendamment. Les tentatives rejetées ne recertifient aucune photographie existante.

## Sources des trois autres familles

Recherche uniquement à ce stade : aucun de ces jeux n’est ajouté à une mise à jour automatique par cette PR.

| Famille | Source confirmée | Voie de raccordement et limites |
|---|---|---|
| Taux d’épargne | Banque de France, rapport sur l’épargne réglementée et pages Webstat | Page et PDF courants accessibles. Identifier une série de taux réglementaire et ses dates d’effet ; un taux apparent moyen de dépôts ou le taux moyen d’anciens PEL ne remplace pas le taux légal d’un livret. Source publique et historique à qualifier avant activation. |
| Ménages / patrimoine | INSEE, Distribution du patrimoine des ménages | Excel public réellement téléchargé et ouvert ; feuille Données, patrimoine brut et net par décile, période début 2024. Relire la page stable pour découvrir le prochain fichier et sa période ; contrôle des unités, champ géographique et définitions avant remplacer les seuls indicateurs correspondants. Les seuils de décile ne deviennent pas les moyennes de chaque décile. |
| SCPI | ASPIM, SCPI en chiffres et communiqués trimestriels | Page accessible avec situation au 31/12/2025 et historique. Conserver les périmètres immobilier d’entreprise/résidentiel/toutes catégories et distinguer taux de distribution, variation du prix de part et rendement global immobilier. Le rendement moyen ne remplace pas celui d’une SCPI précise. |
| Fonds euros | ACPR, Revalorisation des contrats d’assurance-vie et de capitalisation | Page courante et rapport n°180 au titre de 2025 réellement téléchargés. Découvrir le prochain rapport depuis le catalogue ACPR, garder conventions net de gestion/avant prélèvements sociaux et population des contrats. Les taux de contrats individuels exigent les publications des assureurs. |

Liens confirmés :

- https://www.banque-france.fr/fr/publications-et-statistiques/publications/rapport-sur-lepargne-reglementee-2025
- https://webstat.banque-france.fr/
- https://www.insee.fr/fr/statistiques/8736846
- https://www.insee.fr/fr/statistiques/2388851
- https://www.insee.fr/fr/statistiques/fichier/2388851/reve-patrim-decile.xlsx
- https://www.aspim.fr/scpi-en-chiffres/
- https://www.aspim.fr/actualites/collecte-et-performance-des-fonds-immobiliers-grand-public-au-premier-semestre-2026/
- https://acpr.banque-france.fr/fr/publications-et-statistiques/publications/ndeg-180-revalorisation-2025-des-contrats-dassurance-vie-et-de-capitalisation
- https://acpr.banque-france.fr/system/files/2026-06/20260630_AS180_revalorisation_2025.pdf

Suite utile : raccorder d’abord les statistiques INSEE structurées, puis les indicateurs moyens SCPI et fonds euros. Qualifier en parallèle la série exacte des taux réglementés et poursuivre la recherche des quatre compositions bloquées. Les caractéristiques peu variables restent hors priorité.
