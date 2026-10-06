# Automatisation des données — état du 6 octobre 2026

Rapport fondé sur les collecteurs configurés et les données actives, pas sur les seuls rappels de fraîcheur. Une source inaccessible conserve ses valeurs précédentes et fait échouer le signal de collecte ; les autres données validées peuvent être publiées. Les publications restent conditionnées aux audits et au déploiement.

## Ce qui fonctionne sans assistant ni saisie manuelle

| Domaine | Couverture active | Fréquence |
|---|---|---|
| Historiques mensuels des simulateurs | 46/46 séries ; 44 nouveaux collecteurs + Bitcoin et or | Marchés : 2, 4, 8 et 16 du mois ; Bitcoin : 2, 4 et 8 ; or : tentatives du 3 au 10 |
| ETF/ETC/ETP | 151/154 instruments, au moins un champ | 3 et 16 du mois |
| Compositions d’indices | 30 indices | 3 et 16 du mois |
| Rendements annuels d’indices | 32 indices | 3 et 16 du mois |
| Inflation | INSEE, prolongement de la série mensuelle 2026+ | 1 et 16 du mois |
| Portefeuilles d’investisseurs | 18 déclarants SEC 13F | Vérification quotidienne ; publication trimestrielle par les déclarants |
| Suivi de fraîcheur | Rapport et rappels GitHub | Hebdomadaire ; ces rappels ne collectent pas les données manuelles |

Les mois incomplets sont exclus. Les cours ajustés, cours bruts, rendements NET/GROSS et devises restent distincts. Les clôtures Yahoo sont recoupées entre granularités ou fenêtres du même fournisseur ; ce ne sont pas deux fournisseurs indépendants. L’or reste une moyenne mensuelle Banque mondiale. Pour SI=F, Yahoo omet des bougies mensuelles : ces mois sont recoupés avec une seconde requête quotidienne de fin de mois. Les niveaux STOXX viennent de son tableau quotidien officiel.

## Disponibilité à fiabiliser

WPEA (IE0002XZSHO1) et SPEA (IE000DQLYVB9) : les pages officielles iShares ont fourni des données validées, mais plusieurs collectes GitHub du 6 octobre 2026 ont ensuite renvoyé HTTP 403. Les connecteurs et tentatives planifiées existent ; leurs dernières valeurs validées sont conservées. Leur accès reste à fiabiliser. Les 151 instruments décrivent donc une couverture configurée et validée au moins une fois, pas 151 accès réussis à chaque exécution.

## Extension du 6 octobre 2026

Douze des quinze instruments auparavant hors collecte sont désormais raccordés : Bitwise Bitcoin, WisdomTree Copper/Defence/Quantum/Dividend Growth, CoinShares Bitcoin/Ethereum, UBS World, L&G Battery/AI/Clean Energy et Global X QYLD. L&G Cyber Security reçoit aussi les calendriers exacts de la part ; WisdomTree Gold reçoit un encours daté depuis sa page officielle. Les séries complètes Battery, AI et Cyber Security sont intégrées lorsque leur devise correspond à la simulation. Clean Energy conserve son proxy : lancement en 2020, année incomplète.
MSCI EM IMI et MSCI EM Latin America : compositions et rendements nets USD issus des fiches MSCI actuelles. Les trois instruments BNP restent hors collecte : accès au composant Fundsheet HTTP 502 et découverte récurrente de la fiche actuelle non qualifiée. Les anciens PDF ne sont pas promus en source actuelle.

## Limites par champ ETF

| Champ collecté et consommé | Instruments |
|---|---:|
| Frais annuels | 151 |
| Encours daté | 148 |
| Rendements calendaires 2020–2025 de la part | 111 |
| Pays | 131 |
| Secteurs ou sous-secteurs publiés | 112 |
| Principales positions | 119 |

Ces couvertures ne s’additionnent pas : plusieurs champs concernent le même instrument. Les 22 expositions Amundi à l’indice suivi recouvrent des parts déjà collectées ; elles ne sont pas 22 fonds supplémentaires. Les compositions d’indice, portefeuilles de fonds et paniers de substitution ne sont jamais assimilés. Les séries de simulation restent limitées à 2020–2025 ; le choix automatique d’une nouvelle fenêtre annuelle n’est pas implémenté.

## Instruments entièrement hors collecte active

| ISIN | Instrument | Blocage actuel |
|---|---|---|
| FR0011550185 | BNP Paribas Easy S&P 500 UCITS ETF (Acc) | Découverte de la fiche officielle actuelle non qualifiée : composant Fundsheet HTTP 502 ; anciens liens PDF non utilisables pour une mise à jour récurrente. |
| FR0011550193 | BNP Paribas Easy STOXX Europe 600 UCITS ETF | Découverte de la fiche officielle actuelle non qualifiée : composant Fundsheet HTTP 502 ; anciens liens PDF non utilisables pour une mise à jour récurrente. |
| IE000QDFFK00 | BNP Paribas Easy II Nasdaq 100 UCITS ETF (Acc) | Découverte de la fiche officielle actuelle non qualifiée : composant Fundsheet HTTP 502 ; anciens liens PDF non utilisables pour une mise à jour récurrente. |

## Champs restant manuels sur les instruments partiellement couverts

Les identités, domiciles, modes de réplication, couvertures de change, politiques de distribution, nombres de positions, statuts PEA et cotations ne sont pas raccordés à une actualisation automatique. Les données intermédiaires d’indice/distribution récupérées par certains collecteurs ne suffisent pas : elles ne remplacent pas encore ces registres dans l’application.

| ISIN | Instrument | Champs courants hors collecte active |
|---|---|---|
| IE00BYWQWR46 | VanEck Video Gaming and eSports UCITS ETF | Secteurs |
| IE00BYZK4776 | iShares Healthcare Innovation UCITS ETF USD (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B3YLTY66 | State Street SPDR MSCI All Country World Investable Market UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BLNMYC90 | Xtrackers S&P 500 Equal Weight UCITS ETF 1C | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ38QD84 | State Street SPDR Russell 2000 U.S. Small Cap UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B2NPKV68 | iShares J.P. Morgan $ EM Bond UCITS ETF USD (Dist) | Secteurs, Principales positions |
| IE00B1FZS913 | iShares € Govt Bond 15-30yr UCITS ETF EUR (Dist) | Secteurs, Principales positions |
| IE0006WW1TQ4 | Xtrackers MSCI World ex USA UCITS ETF 1C | Rendements calendaires |
| FR0014017NX3 | Amundi PEA Global (MSCI ACWI) UCITS ETF (Acc) | Rendements calendaires |
| LU0290358497 | Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C | Pays, Secteurs, Principales positions |
| IE00B3FH7618 | iShares € Govt Bond 0-1yr UCITS ETF EUR (Dist) | Secteurs, Principales positions |
| IE00BDBRDM35 | iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc) | Secteurs, Principales positions |
| IE00BZCQB185 | iShares MSCI India UCITS ETF USD (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B1FZS467 | iShares Global Infrastructure UCITS ETF USD (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| CH0454664001 | 21Shares Bitcoin ETP | Rendements calendaires, Pays, Secteurs, Principales positions |
| DE000A0H08Q4 | iShares STOXX Europe 600 Technology UCITS ETF (DE) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| DE000A27Z304 | Bitwise Physical Bitcoin ETP | Rendements calendaires, Pays, Secteurs, Principales positions |
| FR0010342592 | Amundi Nasdaq-100 Daily (2x) Leveraged UCITS ETF Acc | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0010524777 | Amundi MSCI New Energy UCITS ETF Dist | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0010527275 | Amundi MSCI Water UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0010755611 | Amundi MSCI USA Daily (2x) Leveraged UCITS ETF Acc | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0011440478 | Amundi PEA Emergent EMEA (MSCI Emerging EMEA) ESG Transition UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0011869320 | Amundi PEA Inde (MSCI India) UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0011871078 | Amundi PEA Chine (MSCI China) Screened UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0011871110 | Amundi PEA Nasdaq-100 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0011871128 | Amundi PEA S&P 500 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0013380607 | Amundi CAC 40 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0013411980 | Amundi PEA Japan (TOPIX) UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0013411998 | Amundi PEA Japon (TOPIX) UCITS ETF EUR Hedged Acc | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0013412004 | Amundi PEA Amérique Latine (MSCI Emerging Latin America Selection) UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0013412012 | Amundi PEA Asie Emergente (MSCI Emerging Asia) Screened UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0013412020 | Amundi PEA Emergent (MSCI Emerging) ESG Transition UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0013412038 | Amundi PEA MSCI Europe UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0013416716 | Amundi Physical Gold ETC | Pays, Secteurs, Principales positions |
| FR001400S9V0 | Amundi PEA Luxe Monde UCITS ETF | Rendements calendaires |
| FR001400U5Q4 | Amundi PEA Monde (MSCI World) UCITS ETF | Rendements calendaires |
| GB00B15KXQ89 | WisdomTree Copper | Rendements calendaires, Pays, Secteurs, Principales positions |
| GB00BJYDH287 | WisdomTree Physical Bitcoin | Encours, Pays, Secteurs, Principales positions |
| GB00BLD4ZL17 | CoinShares Physical Bitcoin ETP | Encours, Rendements calendaires, Pays, Secteurs, Principales positions |
| GB00BLD4ZM24 | CoinShares Ethereum Staking ETP | Encours, Rendements calendaires, Pays, Secteurs, Principales positions |
| IE0000N55FP4 | iShares MSCI Europe Small Cap UCITS ETF | Rendements calendaires |
| IE0002XZSHO1 | iShares MSCI World Swap PEA UCITS ETF (Acc) | Rendements calendaires, Pays, Secteurs, Principales positions |
| IE0002Y8CX98 | WisdomTree Europe Defence UCITS ETF | Rendements calendaires |
| IE0007Y8Y157 | VanEck Quantum Computing UCITS ETF A | Rendements calendaires, Secteurs |
| IE000C6ITGC8 | iShares Quantum Computing UCITS ETF | Rendements calendaires |
| IE000DQLYVB9 | iShares S&P 500 Swap PEA UCITS ETF | Rendements calendaires, Pays, Secteurs, Principales positions |
| IE000I8KRLL9 | iShares MSCI Global Semiconductors UCITS ETF | Rendements calendaires |
| IE000L6ZMMC4 | Xtrackers FTSE All-World UCITS ETF 1C | Rendements calendaires |
| IE000M7V94E1 | VanEck Uranium and Nuclear Technologies UCITS ETF | Rendements calendaires, Secteurs |
| IE000RDRMSD1 | iShares Blockchain Technology UCITS ETF | Rendements calendaires |
| IE000W8WMSL2 | WisdomTree Quantum Computing UCITS ETF | Rendements calendaires |
| IE000XZSV718 | SPDR S&P 500 UCITS ETF Acc | Rendements calendaires |
| IE000YU9K6K2 | VanEck Space Innovators UCITS ETF | Rendements calendaires, Secteurs |
| IE000YYE6WK5 | VanEck Defense UCITS ETF | Rendements calendaires, Secteurs |
| IE00B02KXK85 | iShares China Large Cap UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B0M62X26 | iShares € Inflation Linked Govt Bond UCITS ETF | Secteurs, Principales positions |
| IE00B0M63623 | iShares MSCI Taiwan UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B14X4Q57 | iShares € Govt Bond 1-3yr UCITS ETF | Secteurs, Principales positions |
| IE00B1FZS350 | iShares Developed Markets Property Yield UCITS ETF USD (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B1XNHC34 | iShares Global Clean Energy Transition UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B3F81R35 | iShares Core € Corp Bond UCITS ETF (Dist) | Secteurs, Principales positions |
| IE00B3T9LM79 | SPDR € Corp Bond UCITS ETF | Pays, Secteurs, Principales positions |
| IE00B3VVMM84 | Vanguard FTSE Emerging Markets UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B3WJKG14 | iShares S&P 500 Information Technology Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B40B8R38 | iShares S&P 500 Consumer Staples Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B42NKQ00 | iShares S&P 500 Energy Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B43HR379 | iShares S&P 500 Health Care Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B44Z5B48 | SPDR MSCI ACWI UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B469F816 | SPDR MSCI Emerging Markets UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4JNQZ49 | iShares S&P 500 Financials Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4K48X80 | iShares Core MSCI Europe UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4K6B022 | HSBC EURO STOXX 50 | Rendements calendaires, Principales positions |
| IE00B4KBBD01 | iShares S&P 500 Utilities Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4L5Y983 | iShares Core MSCI World UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4L5YX21 | iShares Core MSCI Japan IMI UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4NCWG09 | iShares Physical Silver ETC | Pays, Secteurs, Principales positions |
| IE00B4ND3602 | iShares Physical Gold ETC | Pays, Secteurs, Principales positions |
| IE00B4WXJJ64 | iShares Core Euro Government Bond UCITS ETF (Dist) | Secteurs, Principales positions |
| IE00B52SFT06 | iShares MSCI USA UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B53L3W79 | iShares Core EURO STOXX 50 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B53SZB19 | iShares Nasdaq 100 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B579F325 | Invesco Physical Gold ETC | Pays, Secteurs, Principales positions |
| IE00B5BMR087 | iShares Core S&P 500 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B5M1WJ87 | SPDR S&P Euro Dividend Aristocrats UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B5W4TY14 | iShares MSCI Korea UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B66F4759 | iShares Euro High Yield Corporate Bond UCITS ETF (Dist) | Secteurs, Principales positions |
| IE00B6R52259 | iShares MSCI ACWI UCITS ETF USD (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B6YX5D40 | SPDR S&P US Dividend Aristocrats UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B8FHGS14 | iShares Edge MSCI World Minimum Volatility UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B8GKDB10 | Vanguard FTSE All-World High Dividend Yield UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B9CQXS71 | SPDR S&P Global Dividend Aristocrats UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BD4TXV59 | UBS Core MSCI World UCITS ETF | Rendements calendaires |
| IE00BD6FTQ80 | Invesco Bloomberg Commodity UCITS ETF | Pays, Secteurs, Principales positions |
| IE00BDFBTQ78 | VanEck S&P Global Mining UCITS ETF | Secteurs |
| IE00BDFL4P12 | iShares Diversified Commodity Swap UCITS ETF | Pays, Secteurs, Principales positions |
| IE00BF0M2Z96 | L&G Battery Value-Chain UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BF3N7094 | iShares € High Yield Corp Bond UCITS ETF (Acc) | Secteurs, Principales positions |
| IE00BF4RFH31 | iShares MSCI World Small Cap UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BFZPF546 | iShares J.P. Morgan EM Local Govt Bond UCITS ETF (Acc) | Secteurs, Principales positions |
| IE00BG0J4C88 | iShares Digital Security UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BGV5VN51 | Xtrackers Artificial Intelligence and Big Data UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ5JNY98 | iShares MSCI World Information Technology Sector Advanced UCITS ETF USD (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ5JNZ06 | iShares MSCI World Health Care Sector Advanced UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ5JP097 | iShares MSCI World Financials Sector Advanced UCITS ETF USD (Dist) | Rendements calendaires |
| IE00BJ5JPG56 | iShares MSCI China UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BCD43 | L&G Artificial Intelligence UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BCH80 | L&G Clean Energy UCITS ETF | Rendements calendaires |
| IE00BK5BQT80 | Vanguard FTSE All-World UCITS ETF (USD) Accumulating | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BR626 | Vanguard FTSE All-World High Dividend Yield UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BR733 | Vanguard FTSE Emerging Markets UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK95B138 | iShares $ Treasury Bond UCITS ETF | Pays, Secteurs, Principales positions |
| IE00BKM4GZ66 | iShares Core MSCI EM IMI UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BKPSFC54 | iShares MSCI World Quality Dividend Advanced UCITS ETF | Rendements calendaires |
| IE00BKPX3K41 | iShares MSCI AC Far East ex-Japan UCITS ETF | Rendements calendaires |
| IE00BM67HK77 | Xtrackers MSCI World Health Care UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BM67HS53 | Xtrackers MSCI World Materials UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BM8R0J59 | Global X Nasdaq 100 Covered Call UCITS ETF | Rendements calendaires, Pays, Secteurs, Principales positions |
| IE00BMG6Z448 | iShares MSCI EM ex-China UCITS ETF (Acc) | Rendements calendaires |
| IE00BMW42413 | iShares MSCI Europe Information Technology Sector UCITS ETF | Rendements calendaires |
| IE00BP3QZ601 | iShares Edge MSCI World Quality Factor UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BP3QZ825 | iShares Edge MSCI World Momentum Factor UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BP3QZB59 | iShares Edge MSCI World Value Factor UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BQT3WG13 | iShares MSCI China A UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BTJRMP35 | Xtrackers MSCI Emerging Markets UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BYPLS672 | L&G Cyber Security UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BYTRR863 | SPDR MSCI World Energy UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BYXG2H39 | iShares Nasdaq US Biotechnology UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BYYHSQ67 | iShares MSCI World Quality Dividend Advanced UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BYZK4552 | iShares Automation & Robotics UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BZ163G84 | Vanguard € Corp Bond UCITS ETF | Pays, Secteurs, Principales positions |
| IE00BZ56SW52 | WisdomTree Global Quality Dividend Growth UCITS ETF | Rendements calendaires |
| JE00B1VS3770 | WisdomTree Physical Gold | Pays, Secteurs, Principales positions |
| LU0908500753 | Amundi Core STOXX Europe 600 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1437018838 | Amundi FTSE EPRA NAREIT Global UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1681043599 | Amundi MSCI World Swap UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1681045370 | Amundi MSCI Emerging Markets UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1681047236 | Amundi Core EURO STOXX 50 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1681048630 | Amundi S&P Global Luxury UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1737652823 | Amundi FTSE EPRA NAREIT Global UCITS ETF Dist | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1834983550 | Amundi STOXX Europe 600 Basic Resources UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1834983634 | Amundi STOXX Europe 600 Basic Materials UCITS ETF | Rendements calendaires |
| LU1834986900 | Amundi STOXX Europe 600 Healthcare UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1834988518 | Amundi STOXX Europe 600 Technology UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1875395870 | Xtrackers Nikkei 225 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1931975079 | Amundi Core EUR Corporate Bond UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU2089238385 | Amundi Prime Japan UCITS ETF | Rendements calendaires |
| LU2196470426 | Xtrackers Nikkei 225 UCITS ETF 1C (Acc) | Rendements calendaires |
| LU2970735911 | Amundi Core EUR High Yield Bond UCITS ETF | Rendements calendaires |
| LU3038520774 | Amundi STOXX Europe Defense UCITS ETF | Rendements calendaires |
| NL0009690239 | VanEck Global Real Estate UCITS ETF | Rendements calendaires, Secteurs |
| NL0011683594 | VanEck Morningstar Developed Markets Dividend Leaders UCITS ETF | Rendements calendaires, Secteurs |

« Hors collecte » peut aussi signifier non publié ou non applicable. Une part récente n’a pas six années complètes : ses performances YTD, depuis création et périodes glissantes restent manuelles lorsqu’elles existent. Les proxys de simulation ne sont pas remplacés par une série incomplète. Le monétaire overnight n’a pas de composition actions pertinente ; publier son panier de swap comme exposition économique serait incorrect.

## Indices avec au moins un bloc restant manuel

| Indice | Bloc hors collecte active |
|---|---|
| S&P 500 Equal Weight (sp500-equal-weight) | Composition / méthodologie, Rendements annuels |
| Russell 2000 (russell-2000) | Composition / méthodologie |
| TOPIX (topix) | Composition / méthodologie, Rendements annuels |
| Nikkei 225 (nikkei225) | Composition / méthodologie, Rendements annuels |
| STOXX Europe 600 (stoxx600) | Composition / méthodologie, Rendements annuels |
| EURO STOXX 50 (eurostoxx50) | Composition / méthodologie, Rendements annuels |
| S&P 500 (sp500-pea) | Composition / méthodologie, Rendements annuels |
| NASDAQ-100 Notional Net Total Return (nasdaq-pea) | Composition / méthodologie, Rendements annuels |
| Russell 1000 (russell-1000) | Composition / méthodologie |
| S&P Global Dividend Aristocrats (sp-global-dividend-aristocrats) | Composition / méthodologie, Rendements annuels |
| S&P Euro Dividend Aristocrats (sp-euro-dividend-aristocrats) | Composition / méthodologie, Rendements annuels |
| MSCI EM Latin America Selection 20/35% Capped (msci-em-latin-america-selection) | Composition / méthodologie, Rendements annuels |

Russell 1000/2000 : rendements annuels automatisés ; les compositions restent à qualifier dans une publication exploitable avec poids numériques. Les photographies archivées ne changent pas de date. Les quatre séries annuelles de sous-jacents (or, argent, Bitcoin, Ethereum) restent distinctes des historiques mensuels automatisés et ne sont pas automatiquement prolongées dans index-returns.

## Autres données de l’application encore manuelles

- Courtiers : tarifs, offres commerciales, conditions, disponibilité des produits et échéances promotionnelles.
- Épargne réglementée : taux Livret A et autres hypothèses/règles de simulation. L’inflation INSEE est automatisée ; elle ne met pas ces règles à jour.
- Fiscalité, plafonds et règles PEA/CTO/assurance-vie ; lexique financier et chiffres réglementaires.
- Les 29 statistiques de ménages : patrimoine, revenus, profils et benchmarks. Pas de connecteur INSEE/Banque de France pour leur révision.
- Rendements et hypothèses de fonds euros et SCPI ; historiques mixtes/proxys, hypothèses de frais et autres scénarios éditoriaux.
- Profils et biographies des investisseurs : seule la déclaration 13F est collectée. Les actifs hors périmètre 13F ne sont pas ajoutés automatiquement.
- Ajout de nouveaux instruments, choix des sources, compatibilité de nouvelles devises/méthodes et remplacement de sources devenues incompatibles.
- Réparation des connecteurs si un émetteur change son schéma, bloque l’accès ou retire une publication : les tâches réessaient et signalent l’échec, mais ne réécrivent pas seules le code.

## Priorités suivantes

1. Lever les blocages des 3 instruments encore hors collecte (BNP) ; compléter les encours CoinShares, calendriers complets disponibles et compositions des indices listés ci-dessus. Distinguer explicitement les données non applicables, non publiées et réellement à connecter.
2. Automatiser le renouvellement annuel des fenêtres de simulation, avec contrôle des années complètes, devises, dividendes et proxys.
3. Raccorder les caractéristiques et cotations (domicile, réplication, distribution, PEA) avec une provenance et une date propres à chaque champ.
4. Connecter les taux d’épargne réglementée, statistiques de ménages et rendements SCPI/fonds euros à des séries officielles ; maintenir une revue des règles fiscales et offres de courtiers.

Régénération : `npm run report:automation`. Ce rapport décrit une couverture, pas une garantie de disponibilité permanente des émetteurs.
