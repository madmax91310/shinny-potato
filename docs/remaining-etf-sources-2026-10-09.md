# Sources restantes — deuxième vérification du 9 octobre 2026

## BNP Nasdaq — IE000QDFFK00

La fiche BNP identifie exactement `NASDAQ-100 Notional Net Total Return Index`,
une réplication physique et la part USD capitalisante. Ses positions et secteurs
restent des données du fonds. Sa géographie reste une table de régions.

Le complément pays utilise la composition de cet indice exact publiée par Amundi :
https://www.amundietf.fr/pdfDocuments/monthly-factsheet/FR0011871110/FRA/FRA/INSTITUTIONNEL/ETF/20260930

Collecte HTTP réelle validée le 9 octobre : photographie du 30 septembre, 101 valeurs,
dix positions, pays et secteurs contrôlés par le lecteur existant. Les pays totalisent
100,01 % avec les arrondis publiés : États-Unis 94,81 %, Irlande 1,79 %, Pays-Bas
1,38 %, Canada 0,91 %, Royaume-Uni 0,73 %, autres pays 0,39 %.

Seuls les pays de l'indice sont ajoutés à la part BNP, avec `basis: index`, identité,
source, date et empreinte propres. Ils ne sont pas présentés comme un inventaire
des titres détenus par BNP. Le lecteur valide d'abord le benchmark de la fiche BNP ;
un benchmark changé, une composition invalide ou un téléchargement impossible
conserve la dernière allocation et signale l'échec du complément. Les calendriers,
positions et secteurs BNP ne sont pas remplacés par ceux d'Amundi.

## QYLD — IE00BM8R0J59 : quatre champs toujours non qualifiés

La page officielle https://globalxetfs.eu/funds/qyld fournit encore une liste
`discrete` vide et des rendements glissants de la part USD capitalisante. La fiche
FundAssist redécouverte depuis cette page répond toujours HTTP 500 :
https://expressapi.fundassist.com/v1/api//Files/2152e942-df8d-ed11-a85a-005056a103bb/1

Une copie de la fiche Global X est accessible chez Analizy :
https://dokumenty.analizy.pl/pobierz/etf/E_GLBX013_AD_USD/KA/2026-08-31
Elle affiche explicitement `USD Accumulating Share Class`, malgré le Primary ISIN
distribuant. Elle ne contient pas de calendrier annuel. Cette copie ne qualifie
donc aucune performance annuelle de la part distribuante. Sa présence est une
nouvelle piste d'accès documentaire, pas un rétablissement des quatre champs.

Le document officiel pédagogique est accessible :
https://gxeustrapi.blob.core.windows.net/webpublic/uploads/Global_X_Product_Profile_Equity_Income_QYLD_EN_Digital_11650f3052.pdf
Il décrit deux composantes de notionnel égal : long Nasdaq-100 et vente d'options.
Une composition Nasdaq peut décrire la composante actions, mais ne serait ni une
composition exacte du portefeuille QYLD ni celle de l'indice BuyWrite entier.
Aucune composition Nasdaq autonome n'est ajoutée aux quatre champs de QYLD.

Le rapport semestriel clos au 31 décembre 2025 reste accessible :
https://dokumenty.analizy.pl/pobierz/etf/E_GLBX013_AD_USD/RP/2025-12-31
Les actifs physiques d'un fonds synthétique ne remplacent pas son exposition reçue.
Un historique de VL et de distributions exige des dates et conventions de
réinvestissement qualifiées ; aucun rendement approximatif n'est reconstruit.

## Russell 1000 : poids exacts encore absents

La nouvelle page publique Vanguard :
https://advisors.vanguard.com/investments/products/vone/vanguard-russell-1000-etf
utilise https://advisors.vanguard.com/investments/products/api/funds/3348/holdings/latest
La réponse HTTP réelle du 9 octobre fournit des lignes `percentOfFunds`, date du
31 août 2026. Il s'agit des poids du fonds VONE, pas d'une colonne de poids du
Russell 1000. Les services `analytics/portfolio-statistics` et
`analytics/fundamentals` ne donnent pas les dix poids du benchmark.

Ces poids ETF ne sont pas publiés dans le registre de l'indice. Les dernières
compositions et performances qualifiées restent intactes. La résolution demande
une publication des dix poids explicitement attribués au Russell 1000 exact.
