# Revue des données publiables — 24 septembre 2026

Cette revue distingue les contrôles automatisés des comparaisons avec des documents primaires. Une série techniquement cohérente ne prouve pas l'exactitude de chaque rendement.

## Historiques incomplets et substitutions

L'audit `npm run audit:portfolio-provenance` recense 72 supports : 58 historiques émetteur, 5 historiques de sous-jacent, 7 historiques mixtes et 2 hypothèses sans titre précis. Les cinq substitutions restent identifiées dans les tweets et l'interface : CoinShares Bitcoin, CoinShares Ethereum, 21Shares Bitcoin, Amundi PEA Monde, iShares Europe Small Cap. Les sept séries mixtes concernent argent, semi-conducteurs, JEPQ, obligations haut rendement Amundi, actions Asie hors Japon, Quality Dividend et Bitwise Bitcoin.

Priorités avant de remplacer un proxy : obtenir les performances *calendaires* de la part exacte (ISIN), dans la même devise et avec le même traitement des frais et distributions ; retirer les années antérieures à sa création ; noter explicitement toute année indisponible. La fiche 21Shares ABTC du 30 août 2026 donne des rendements mensuels 2022–2025, tandis que son document « Performances passées » donne des valeurs annuelles 2023/2024 différentes de la composition de ces mois arrondis (respectivement +152,83 % / +113,33 % contre environ +151,83 % / +114,14 %). **Ne pas substituer ces rendements sans lever cet écart entre documents du même émetteur.**

Sources : https://cdn.21shares.com/uploads/current-documents/factsheets/all/Factsheet_ABTC.pdf ; https://cdn.21shares.com/uploads/current-documents/past-performance/ABTC/CH0454664001_21SharesAG(FR).pdf .

### Mise à jour ciblée du 24 septembre

- CoinShares Bitcoin (GB00BLD4ZL17) : lancement le 19/01/2021 ; CoinShares Ethereum (GB00BLD4ZM24) : lancement le 23/02/2021. Les lignes du générateur ne montrent plus de rendement 2020 pour ces ETP. Les années suivantes conservent clairement leur base en cours spot USD : ce ne sont pas des performances nettes des ETP et les frais, le staking ETH et le change EUR n'y sont pas intégrés. Sources : https://coinshares.com/etp/physical-bitcoin/ et https://coinshares.com/etp/physical-ethereum/ .
- La fiche officielle Vanguard pour IE00BK5BQT80 précise que FTSE All-World réunit grandes et moyennes capitalisations. La mention « small caps incluses » a été retirée du thème ETF Monde. Source : https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf .
- Le fait « 27 bear markets depuis 1928 » a été attribué à Hartford Funds et débarrassé des moyennes temporelles contradictoires qui l'accompagnaient. Source : https://www.hartfordfunds.com/practice-management/client-conversations/managing-volatility/bear-markets.html .

Le cas 21Shares reste en attente de clarification sur les rendements annuels des documents de l'émetteur ; aucune série concurrente n'a été substituée au cours spot existant. Les autres proxies et historiques mixtes déjà revus lors des passes précédentes restent assortis de leurs avertissements propres.

## Dates et chiffres entre outils

`npm run check-freshness -- --priorities` relève 50 supports du générateur et 6 actifs du calculateur sans date individuelle documentée. Cette absence n'est pas une preuve d'erreur. Les six du calculateur sont Bitcoin, or, Apple, Microsoft, Broadcom et Tesla ; leur date sera renseignée après confrontation de leurs points de prix à la source exacte, pas par simple lecture d'un commentaire voisin.

`npm run audit:etf-consistency` compare 122 lignes, 96 ISIN uniques et 21 ISIN répétés ; aucune divergence de TER pour ces 21 ISIN. `npm run audit:performance-consistency` compare 12 séries entre comparateur et générateur : aucun écart inexpliqué au seuil de 0,1 point ; 17 fonds du comparateur restent sans correspondant dans le générateur, désormais listés individuellement par le script. Cela ne vérifie **pas** leurs rendements auprès de l'émetteur. Les autres séries propres aux Fiches ETF, Tweet Midi, Cas concrets, Faits marquants et Pouvoir d'achat doivent être revues sur leurs sources spécifiques : les contrôles actuels portent sur la cohérence interne et les données partagées, pas sur tous les faits publiés.

## Méthode affichée dans les trois simulateurs

- Portefeuilles : somme des rendements calendaires pondérés par les poids affichés chaque année ; pas de simulation d'un capital cumulé, de versements ni de change entre lignes USD/EUR.
- Calculateur : versement unique au prix de départ ou achats mensuels aux prix du mois ; interpolation des mois manquants, indicateurs Livret A et inflation à taux moyens.
- Frais : versements en début de mois ; rendement annuel brut moins frais annuels, puis division **arithmétique** par 12 ; écart en pourcentage du capital final le plus élevé, fiscalité et inflation exclues.

Ces explications ont été ajoutées à l'interface ou aux tweets sans modifier les formules de calcul.
