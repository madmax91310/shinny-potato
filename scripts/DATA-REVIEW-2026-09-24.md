# Revue des données publiables — 24 septembre 2026

Cette revue distingue les contrôles automatisés des comparaisons avec des documents primaires. Une série techniquement cohérente ne prouve pas l'exactitude de chaque rendement.

## Séries complètes du générateur et provenance des substitutions

Les 71 supports sélectionnables possèdent désormais six rendements finis (2020-2025). La part VanEck Semiconductor a été retirée du tirage automatique et manuel : son indice exact MVSMCTR n'a pas fourni de rendement calendaire 2020 vérifiable. Elle pourra revenir après vérification d'une source primaire. Le test de 9 300 tirages contrôle chaque année, tous les profils et les tweets.

- CoinShares Bitcoin et Ethereum : 2020 reprend le cours spot BTC/USD (+303,16 %) et ETH/USD (+469,25 %) selon Slickcharts ; l'ensemble de leurs séries est un proxy spot et ne représente pas les rendements nets des ETP. Sources : https://www.slickcharts.com/currency/BTC/returns et https://www.slickcharts.com/currency/ETH/returns .
- Bitwise Physical Bitcoin : 2020 reprend le cours spot BTC/USD (+303,16 %), puis 2021-2025 proviennent de la NAV USD du produit ; le fonds a commencé en juin 2020. Source : https://bitwiseinvestments.eu/de/products/bitwise-physical-bitcoin-etp/ .
- iShares Europe Information Technology : 2020 +11,61 % provient de l'indice exact MSCI Europe Information Technology 20/35 Capped net EUR ; 2021-2025 proviennent du fonds EUR. Source : https://www.msci.com/documents/10199/255599/msci-europe-it-2035-capped-index-eur-net.pdf .
- JEPQ UCITS : 2020-2022 proviennent de l'indice Nasdaq-100 Total Return USD (+48,88 %, +27,51 %, −32,38 %), **qui ne reproduit pas les ventes d'options** ; 2023-2024 proviennent du fonds américain JEPQ (+36,28 %, +24,82 %), 2025 de la part UCITS USD (+15,40 %). Ces années ne constituent pas un historique propre de la part UCITS. Sources : https://indexes.nasdaq.com/docs/FS_XNDX.pdf , https://am.jpmorgan.com/content/dam/jpm-am-aem/americas/us/en/literature/fact-sheet/etfs/FS-JEPQ.PDF et https://am.jpmorgan.com/content/dam/jpm-am-aem/emea/ch/en/regulatory/annual-report/jpm-icav-etf-annual-report-ch-en.pdf .

Les substitutions et les écarts de devise restent consultables dans la page, dans « Sources et limites des performances simulées ». La section « Méthode » et les longs avertissements par actif ont été retirés du tweet ; les avertissements de risque et sa structure ont été conservés.

La fiche 21Shares ABTC du 30 août 2026 donne des rendements mensuels 2022-2025, tandis que son document « Performances passées » donne des valeurs annuelles 2023/2024 différentes de la composition de ces mois arrondis. Le cours spot existant reste signalé comme proxy : https://cdn.21shares.com/uploads/current-documents/factsheets/all/Factsheet_ABTC.pdf et https://cdn.21shares.com/uploads/current-documents/past-performance/ABTC/CH0454664001_21SharesAG(FR).pdf .

## Dates et chiffres entre outils

`npm run check-freshness -- --priorities` relève 50 supports du générateur et 6 actifs du calculateur sans date individuelle documentée. Cette absence n'est pas une preuve d'erreur. Les six du calculateur sont Bitcoin, or, Apple, Microsoft, Broadcom et Tesla ; leur date sera renseignée après confrontation de leurs points de prix à la source exacte, pas par simple lecture d'un commentaire voisin.

`npm run audit:etf-consistency` compare 122 lignes, 96 ISIN uniques et 21 ISIN répétés ; aucune divergence de TER pour ces 21 ISIN. `npm run audit:performance-consistency` compare 12 séries entre comparateur et générateur : aucun écart inexpliqué au seuil de 0,1 point ; 17 fonds du comparateur restent sans correspondant dans le générateur, désormais listés individuellement par le script. Cela ne vérifie **pas** leurs rendements auprès de l'émetteur. Les autres séries propres aux Fiches ETF, Tweet Midi, Cas concrets, Faits marquants et Pouvoir d'achat doivent être revues sur leurs sources spécifiques : les contrôles actuels portent sur la cohérence interne et les données partagées, pas sur tous les faits publiés.

## Méthode affichée dans les trois simulateurs

- Portefeuilles : somme des rendements calendaires pondérés par les poids affichés chaque année ; pas de simulation d'un capital cumulé, de versements ni de change entre lignes USD/EUR.
- Calculateur : versement unique au prix de départ ou achats mensuels aux prix du mois ; interpolation des mois manquants, indicateurs Livret A et inflation à taux moyens.
- Frais : versements en début de mois ; rendement annuel brut moins frais annuels, puis division **arithmétique** par 12 ; écart en pourcentage du capital final le plus élevé, fiscalité et inflation exclues.

Ces explications ont été ajoutées à l'interface ou aux tweets sans modifier les formules de calcul.
