# Reprise des collectes — 9 octobre 2026

## iShares Japan IMI — IE00B4L5YX21

La réponse officielle BlackRock du 7 octobre publie 939 lignes et une somme de 99,9999 %. La ligne `USD CASH` pèse −1,36679 %, contre +2,29492 % pour `JPY CASH`. Le lecteur rejetait toute pondération inférieure à −1 %, y compris les liquidités signées.

Les valeurs signées sont désormais acceptées seulement pour les classes publiées Cash, Cash Collateral and Margins, FX et Futures, dans les bornes −100/+100. Les actions et obligations négatives, classes inconnues négatives, valeurs non finies et portefeuilles incomplets restent rejetés. Les poids des titres ne sont pas renormalisés. Les dix premières positions et les répartitions existantes restent distinctes.

Source : https://www.ishares.com/uk/individual/en/products/251867/ et son service public `get-product-data`, portfolioId 251867, devise USD. Dix positions réelles relues sans erreur ; contrôle d'identité et de somme conservé.

## Russell 2000

Source : https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1681038672/FRA/FRA/INSTITUTIONNEL/ETF/20260930

Le document du 30 septembre publie 1 976 titres et dix principales lignes explicitement identifiées comme données de l'indice. Le lecteur ignorait les noms contenant des chiffres, notamment `10X GENOMICS INC-CLASS A` (0,35 %) et `HUT 8 CORP` (0,32 %), puis rejetait les huit lignes restantes.

La lecture des noms accepte désormais les chiffres tout en exigeant un pourcentage terminal distinct. Les dix lignes totalisent 3,33 %. Une table amputée reste rejetée. Une fixture contient les trois extractions natives du document officiel ; les anciens relevés sont conservés dans l'historique actif.

## QYLD — IE00BM8R0J59 : blocage confirmé

La page officielle https://globalxetfs.eu/funds/qyld identifie la part distribuante dans Key Information. Sa performance structurée est une série glissante avec `discrete: []` ; la section de performance affiche USD Accumulating. Elle ne qualifie aucun rendement annuel de la part distribuante.

Les trois fiches actuelles découvertes dans les données publiques de la page ont toutes répondu HTTP 500 :

- https://expressapi.fundassist.com/v1/api//Files/2152e942-df8d-ed11-a85a-005056a103bb/1
- https://expressapi.fundassist.com/v1/api//Files/153edc92-3c5d-ee11-a868-005056a103bb/1
- https://expressapi.fundassist.com/v1/api//Files/163edc92-3c5d-ee11-a868-005056a103bb/1

Les anciennes fiches anglaise et allemande `/content/files/QYLD_UCITS-factsheet.pdf` et `/content/files/QYLD-UCITS-factsheet-German.pdf` répondent HTTP 404.

Le rapport accessible lié par la page https://gxeustrapi.blob.core.windows.net/webpublic/uploads/Annual_Report_and_Audited_Financial_Statements_1_f4a7f3867b.pdf est arrêté au 30 juin 2025. Sa performance 1Y du sous-fonds couvre une année close en juin : elle ne remplace pas une année civile de l'ISIN distribuante. Le panier physique de substitution n'est pas l'exposition économique reçue via le swap. Aucun de ses poids ni rendement n'a été publié comme donnée QYLD qualifiée.

Les quatre champs QYLD restent donc manquants. Leur résolution nécessite une publication officielle cohérente de l'exposition et un calendrier de la part exacte, ou un historique complet de VL et distributions avec convention de réinvestissement explicite. Aucun rendement de la part capitalisante, de l'indice ou d'un ETF américain homonyme n'est substitué.
