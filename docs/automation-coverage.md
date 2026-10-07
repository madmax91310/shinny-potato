# Automatisation des données — état du 7 octobre 2026

Rapport fondé sur les collecteurs configurés et les données actives, pas sur les seuls rappels de fraîcheur. Une source inaccessible conserve ses valeurs précédentes et fait échouer le signal de collecte ; les autres données validées peuvent être publiées. Les publications restent conditionnées aux audits et au déploiement.

## Ce qui fonctionne sans assistant ni saisie manuelle

| Domaine | Couverture active | Fréquence |
|---|---|---|
| Historiques mensuels des simulateurs | 46/46 séries ; 44 nouveaux collecteurs + Bitcoin et or | Marchés : 2, 4, 8 et 16 du mois ; Bitcoin : 2, 4 et 8 ; or : tentatives du 3 au 10 |
| ETF/ETC/ETP | 155/155 instruments, au moins un champ | 3 et 16 du mois |
| Compositions d’indices | 39 indices | 3 et 16 du mois |
| Rendements annuels d’indices | 46 indices | 3 et 16 du mois |
| Inflation | INSEE, prolongement de la série mensuelle 2026+ | 1 et 16 du mois |
| Portefeuilles d’investisseurs | 18 déclarants SEC 13F | Vérification quotidienne ; publication trimestrielle par les déclarants |
| Suivi de fraîcheur | Rapport et rappels GitHub | Hebdomadaire ; ces rappels ne collectent pas les données manuelles |

Les mois incomplets sont exclus. Les cours ajustés, cours bruts, rendements NET/GROSS et devises restent distincts. Les clôtures Yahoo sont recoupées entre granularités ou fenêtres du même fournisseur ; ce ne sont pas deux fournisseurs indépendants. L’or reste une moyenne mensuelle Banque mondiale. Pour SI=F, Yahoo omet des bougies mensuelles : ces mois sont recoupés avec une seconde requête quotidienne de fin de mois. Les niveaux STOXX viennent de son tableau quotidien officiel.

## Disponibilité à fiabiliser

WPEA (IE0002XZSHO1) : le calendrier EUR 2025 est raccordé à la fiche exacte de la part. UBS World (IE00BD4TXV59) : les calendriers USD 2022–2025 sont raccordés. SPEA (IE000DQLYVB9) ne publie pas encore d’année civile complète. Ces historiques courts ne remplacent pas une fenêtre de simulation complète. WPEA et SPEA : les pages officielles iShares peuvent renvoyer HTTP 403. Le repli vers les fiches officielles courantes est désormais contrôlé (ISIN, devise, dates) et a été validé en production. Une modification de schéma reste signalée et conserve les dernières valeurs fiables. Les 155 instruments décrivent donc une couverture configurée et validée au moins une fois, pas 155 accès réussis à chaque exécution.

Les pages HTML WisdomTree Gold/Bitcoin/Copper/Defence/Quantum/Dividend Growth publient des encours datés ; elles peuvent renvoyer HTTP 403 depuis GitHub. Les six pages ont été qualifiées en collecte réelle, avec ISIN, devise et date propres contrôlés. Le connecteur utilise alors les fiches officielles courantes Dataspan : frais et calendriers complets publiés peuvent être actualisés. Pour Defence, Quantum et Dividend Growth, les tableaux PDF raccordent aussi les secteurs et dix principales positions. Les dix pays ne remplacent la répartition complète que si leur somme atteint 99–101 % ; aucun résidu n’est inventé. Les encours absents du PDF restent à leur dernière date validée tant que les pages sont bloquées. Les encours CoinShares utilisent désormais les widgets officiels liés à la page produit : ISIN et devise USD contrôlés, Rate Date de valorisation (jamais la date de cache). Les documents PDF restent la preuve des frais ; leurs rendements crypto de référence ne sont pas assimilés à ceux de la part. VanEck Gaming : URL régionale officielle France, puis fiches Pays-Bas/Royaume-Uni en cas de problème de transport ; le même nom de document, ISIN, devise et date sont contrôlés avant application. UBS : découverte du dernier PDF mensuel publié, avec repli entre les deux adresses officielles Swiss Fund Data puis le mois précédent ; identité, devise et fraîcheur sont contrôlées. WisdomTree : une panne du PDF conserve les champs HTML validés indépendamment et reste signalée comme erreur de collecte.

## Extension du 6 octobre 2026

Douze des quinze instruments auparavant hors collecte sont désormais raccordés : Bitwise Bitcoin, WisdomTree Copper/Defence/Quantum/Dividend Growth, CoinShares Bitcoin/Ethereum, UBS World, L&G Battery/AI/Clean Energy et Global X QYLD. Les calendriers complets WisdomTree Copper et Dividend Growth proviennent des fiches PDF officielles. L&G Cyber Security reçoit aussi les calendriers exacts de la part ; WisdomTree Gold reçoit un encours daté depuis sa page officielle. Les séries complètes Battery, AI et Cyber Security sont intégrées lorsque leur devise correspond à la simulation. Clean Energy conserve son proxy : lancement en 2020, année incomplète.
MSCI EM IMI, MSCI EM Latin America et Selection 20/35 Capped : compositions et rendements nets USD issus des fiches MSCI actuelles. La fiche Selection conserve son titre historique ; son URL certifiée et son intitulé exact sont contrôlés. Nikkei 225 : composition officielle et rendement total JPY. STOXX 600 et EURO STOXX 50 : rendements prix EUR calculés sur les clôtures de décembre du tableau quotidien officiel. TOPIX : ligne indice total JPY de BlackRock. S&P Global/Euro Dividend Aristocrats : lignes indice nettes State Street ; 2020 Global est exclue à cause du changement d’indice en cours d’année. Les trois BNP reçoivent les frais courants publiés, encours et rendements calendaires exacts depuis les fiches rédigées par BNP et republiées sur Analizy. Chaque page produit est relue pour découvrir la dernière édition ; ISIN, devise, indice, millésime et fraîcheur sont contrôlés. Le domaine BNP reste indisponible (composant HTTP 502). Le miroir est explicitement identifié dans la provenance ; aucune donnée calculée par Analizy ne remplace celle du PDF émetteur. Les trois BNP raccordent maintenant les secteurs et dix positions : expositions de l’indice pour S&P 500/STOXX 600, portefeuille du fonds pour Nasdaq. STOXX 600 publie aussi une table complète de pays ; S&P 500 n’en publie pas et Nasdaq publie des régions, qui ne deviennent pas des pays.

## Avancement des priorités 1 et 2

Quatre compositions supplémentaires sont raccordées : S&P 500, S&P 500 Equal Weight, STOXX Europe 600 et EURO STOXX 50. La couverture atteint 39 compositions avec le Russell 2000 ; 46 séries annuelles sont automatisées. Deux calendriers de parts sont ajoutés : WPEA EUR 2025 et UBS World USD 2022–2025. Le calendrier TOTAL USD S&P 500 Equal Weight est raccordé à la ligne indice SPXEWTR de la fiche trimestrielle Invesco. Les trois BNP sont raccordés pour frais, encours et calendriers ; les trois compositions restent à qualifier ; voir [la qualification du 7 octobre](source-reliability-index-coverage-2026-10-07.md).

## Complément des champs BNP, VanEck et obligations

25 instruments reçoivent des champs supplémentaires. Les huit VanEck découvrent les widgets sectoriels de leur page UCITS exacte à chaque exécution ; seules les tables du fonds sont utilisées, avec dates et classification Sector/SubIndustry propres. Les calendriers de cinq parts supplémentaires (Real Estate, Dividend Leaders, Uranium, Space et Defense) sont raccordés ; les années incomplètes au lancement restent exclues. Les deux fonds néerlandais conservent leur convention publiée de distributions brutes de retenue néerlandaise, après frais du fonds.
Douze ETF obligataires iShares reçoivent secteurs et dix positions obligataires individuelles, avec pays lorsque publiés ou issus du portefeuille complet. Les classifications obligataires (Treasury, Sovereign, Banking, titrisations…) restent distinctes des secteurs actions. Les positions sont distinguées par ISIN ; les rares pools hypothécaires sans ISIN publié conservent nom, coupon et échéance. Le SPDR Euro Corporate Bond raccorde pays, secteurs et positions depuis sa page et son XLSX daté. Vanguard Euro Corporate Bond raccorde les pays du widget GPX CNTRYATPCB, la répartition par type d’émetteur de la fiche et les dix obligations principales du portefeuille GPX paginé ; SEDOL, coupon et échéance distinguent les émissions.
Les compléments BNP et VanEck invalides conservent les données antérieures et signalent un échec, tout en laissant les frais/encours/calendriers valides être appliqués. Aucun poids résiduel n’est inventé et aucun tableau régional n’est converti en pays. Les parts récentes et les actifs crypto/métaux gardent leurs limites de publication ou d’applicabilité.

## Poursuite : positions et expositions exactes

Neuf champs supplémentaires sont raccordés sur cinq instruments : dix obligations Vanguard EUR Corporate Bond, dix positions HSBC EURO STOXX 50, pays/secteurs/positions WPEA et SPEA, pays BNP S&P 500. Vanguard vérifie toutes les pages (3 598 lignes au 31/08/2026, somme 99,99984 %) avant de classer les obligations individuelles ; liquidités et futures sont exclus des dix positions, sans renormaliser les poids. HSBC utilise le tableau explicitement consacré aux positions du fonds ; ses rendements glissants ne deviennent pas des calendriers annuels.
WPEA et SPEA vérifient le benchmark de leur fiche courante puis relisent la composition officielle MSCI World ou les tableaux d’indice S&P 500 Amundi. BNP S&P 500 conserve ses tableaux BNP et reçoit uniquement les pays de cet indice exact. Ces champs portent basis=index, une source, une empreinte et une date distinctes. Le panier de swap est exclu ; les rendements d’indice ne remplacent pas ceux des parts. Une panne ou un changement d’identité conserve les champs indépendants valides et signale l’échec.
Les trois compositions Russell 1000 et Dividend Aristocrats restent non qualifiées après la nouvelle vérification ; les performances annuelles déjà raccordées continuent leur collecte. Les 17 calendriers de parts restant absents incluent onze parts récentes sans année complète qualifiée et six produits sans calendrier exact raccordé (21Shares Bitcoin, Bitwise Bitcoin, deux CoinShares, HSBC EURO STOXX 50 et QYLD). Ils ne sont pas dix-sept collecteurs à simplement activer. Les expositions actions ne sont pas applicables aux métaux, crypto ou overnight ; les allocations matières premières des deux fonds diversifiés et les expositions QYLD restent à qualifier. BNP Nasdaq ne publie que des régions, pas des pays. Voir le détail des sources et blocages dans la qualification du 7 octobre.

## Limites par champ ETF

Les frais collectés peuvent être ceux du dernier exercice publié : leur date distincte est conservée lorsqu’elle existe. Un document republié par un tiers garde son hébergeur et son auteur dans la provenance. La couverture ci-dessous compte les champs actifs après protection contre la régression de date.

| Champ collecté et consommé | Instruments |
|---|---:|
| Frais annuels | 155 |
| Encours daté | 155 |
| Rendements calendaires de la part (au moins une année complète) | 138 |
| Pays | 139 |
| Secteurs ou sous-secteurs publiés | 140 |
| Principales positions | 140 |

Ces couvertures ne s’additionnent pas : plusieurs champs concernent le même instrument. Les 23 expositions Amundi à l’indice suivi recouvrent des parts déjà collectées ; elles ne sont pas 23 fonds supplémentaires. Les compositions d’indice, portefeuilles de fonds et paniers de substitution ne sont jamais assimilés. Les simulations choisissent automatiquement la dernière fenêtre complète commune : six ans pour le Générateur, trois à six ans pour les Duels. Les comparatifs alignent les années des produits. Une publication tardive ou un change BCE manquant conserve la dernière période commune ; aucun rendement n’est extrapolé. Les getters historiques et photographies archivées gardent leur période fixe.

## Instruments entièrement hors collecte active

Aucun instrument entièrement hors collecte : les 155 instruments ont au moins un champ actif. Les lacunes par champ restent détaillées ci-dessous.

| ISIN | Instrument | Blocage actuel |
|---|---|---|

## Champs restant manuels sur les instruments partiellement couverts

Les identités, domiciles, modes de réplication, couvertures de change, politiques de distribution, nombres de positions, statuts PEA et cotations ne sont pas raccordés à une actualisation automatique. Les données intermédiaires d’indice/distribution récupérées par certains collecteurs ne suffisent pas : elles ne remplacent pas encore ces registres dans l’application.

| ISIN | Instrument | Champs courants hors collecte active |
|---|---|---|
| FR0007056841 | Amundi Dow Jones Industrial Average UCITS ETF Dist | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BYWQWR46 | VanEck Video Gaming and eSports UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BYZK4776 | iShares Healthcare Innovation UCITS ETF USD (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B3YLTY66 | State Street SPDR MSCI All Country World Investable Market UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BLNMYC90 | Xtrackers S&P 500 Equal Weight UCITS ETF 1C | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ38QD84 | State Street SPDR Russell 2000 U.S. Small Cap UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B2NPKV68 | iShares J.P. Morgan $ EM Bond UCITS ETF USD (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B1FZS913 | iShares € Govt Bond 15-30yr UCITS ETF EUR (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE0006WW1TQ4 | Xtrackers MSCI World ex USA UCITS ETF 1C | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0014017NX3 | Amundi PEA Global (MSCI ACWI) UCITS ETF (Acc) | Rendements calendaires |
| LU0290358497 | Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C | Pays, Secteurs, Principales positions |
| IE00B3FH7618 | iShares € Govt Bond 0-1yr UCITS ETF EUR (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BDBRDM35 | iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
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
| FR0011550185 | BNP Paribas Easy S&P 500 UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR0011550193 | BNP Paribas Easy STOXX Europe 600 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
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
| FR001400S9V0 | Amundi PEA Luxe Monde UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| FR001400U5Q4 | Amundi PEA Monde (MSCI World) UCITS ETF | Rendements calendaires |
| GB00B15KXQ89 | WisdomTree Copper | Pays, Secteurs, Principales positions |
| GB00BJYDH287 | WisdomTree Physical Bitcoin | Pays, Secteurs, Principales positions |
| GB00BLD4ZL17 | CoinShares Physical Bitcoin ETP | Rendements calendaires, Pays, Secteurs, Principales positions |
| GB00BLD4ZM24 | CoinShares Ethereum Staking ETP | Rendements calendaires, Pays, Secteurs, Principales positions |
| IE0000N55FP4 | iShares MSCI Europe Small Cap UCITS ETF | Rendements calendaires |
| IE0002XZSHO1 | iShares MSCI World Swap PEA UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE0002Y8CX98 | WisdomTree Europe Defence UCITS ETF | Rendements calendaires |
| IE0007Y8Y157 | VanEck Quantum Computing UCITS ETF A | Rendements calendaires |
| IE000C6ITGC8 | iShares Quantum Computing UCITS ETF | Rendements calendaires |
| IE000DQLYVB9 | iShares S&P 500 Swap PEA UCITS ETF | Rendements calendaires |
| IE000I8KRLL9 | iShares MSCI Global Semiconductors UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE000L6ZMMC4 | Xtrackers FTSE All-World UCITS ETF 1C | Rendements calendaires |
| IE000M7V94E1 | VanEck Uranium and Nuclear Technologies UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE000QDFFK00 | BNP Paribas Easy II Nasdaq 100 UCITS ETF (Acc) | Pays |
| IE000RDRMSD1 | iShares Blockchain Technology UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE000W8WMSL2 | WisdomTree Quantum Computing UCITS ETF | Rendements calendaires |
| IE000XZSV718 | SPDR S&P 500 UCITS ETF Acc | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE000YU9K6K2 | VanEck Space Innovators UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE000YYE6WK5 | VanEck Defense UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B02KXK85 | iShares China Large Cap UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B0M62X26 | iShares € Inflation Linked Govt Bond UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B0M63623 | iShares MSCI Taiwan UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B14X4Q57 | iShares € Govt Bond 1-3yr UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B1FZS350 | iShares Developed Markets Property Yield UCITS ETF USD (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B1XNHC34 | iShares Global Clean Energy Transition UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B3F81R35 | iShares Core € Corp Bond UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B3T9LM79 | SPDR € Corp Bond UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B3VVMM84 | Vanguard FTSE Emerging Markets UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B3WJKG14 | iShares S&P 500 Information Technology Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B40B8R38 | iShares S&P 500 Consumer Staples Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B42NKQ00 | iShares S&P 500 Energy Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B43HR379 | iShares S&P 500 Health Care Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B44Z5B48 | SPDR MSCI ACWI UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B469F816 | SPDR MSCI Emerging Markets UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4JNQZ49 | iShares S&P 500 Financials Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4K48X80 | iShares Core MSCI Europe UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4K6B022 | HSBC EURO STOXX 50 | Rendements calendaires |
| IE00B4KBBD01 | iShares S&P 500 Utilities Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4L5Y983 | iShares Core MSCI World UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4L5YX21 | iShares Core MSCI Japan IMI UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B4NCWG09 | iShares Physical Silver ETC | Pays, Secteurs, Principales positions |
| IE00B4ND3602 | iShares Physical Gold ETC | Pays, Secteurs, Principales positions |
| IE00B4WXJJ64 | iShares Core Euro Government Bond UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B52SFT06 | iShares MSCI USA UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B53L3W79 | iShares Core EURO STOXX 50 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B53SZB19 | iShares Nasdaq 100 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B579F325 | Invesco Physical Gold ETC | Pays, Secteurs, Principales positions |
| IE00B5BMR087 | iShares Core S&P 500 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B5M1WJ87 | SPDR S&P Euro Dividend Aristocrats UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B5W4TY14 | iShares MSCI Korea UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B66F4759 | iShares Euro High Yield Corporate Bond UCITS ETF (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B6R52259 | iShares MSCI ACWI UCITS ETF USD (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B6YX5D40 | SPDR S&P US Dividend Aristocrats UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B8FHGS14 | iShares Edge MSCI World Minimum Volatility UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B8GKDB10 | Vanguard FTSE All-World High Dividend Yield UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00B9CQXS71 | SPDR S&P Global Dividend Aristocrats UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BD4TXV59 | UBS Core MSCI World UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BD6FTQ80 | Invesco Bloomberg Commodity UCITS ETF | Pays, Secteurs, Principales positions |
| IE00BDFBTQ78 | VanEck S&P Global Mining UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BDFL4P12 | iShares Diversified Commodity Swap UCITS ETF | Pays, Secteurs, Principales positions |
| IE00BF0M2Z96 | L&G Battery Value-Chain UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BF3N7094 | iShares € High Yield Corp Bond UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BF4RFH31 | iShares MSCI World Small Cap UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BFZPF546 | iShares J.P. Morgan EM Local Govt Bond UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BG0J4C88 | iShares Digital Security UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BGV5VN51 | Xtrackers Artificial Intelligence and Big Data UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ5JNY98 | iShares MSCI World Information Technology Sector Advanced UCITS ETF USD (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ5JNZ06 | iShares MSCI World Health Care Sector Advanced UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ5JP097 | iShares MSCI World Financials Sector Advanced UCITS ETF USD (Dist) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BJ5JPG56 | iShares MSCI China UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BCD43 | L&G Artificial Intelligence UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BCH80 | L&G Clean Energy UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BQT80 | Vanguard FTSE All-World UCITS ETF (USD) Accumulating | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BR626 | Vanguard FTSE All-World High Dividend Yield UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK5BR733 | Vanguard FTSE Emerging Markets UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BK95B138 | iShares $ Treasury Bond UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BKM4GZ66 | iShares Core MSCI EM IMI UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BKPSFC54 | iShares MSCI World Quality Dividend Advanced UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BKPX3K41 | iShares MSCI AC Far East ex-Japan UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BM67HK77 | Xtrackers MSCI World Health Care UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BM67HS53 | Xtrackers MSCI World Materials UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BM8R0J59 | Global X Nasdaq 100 Covered Call UCITS ETF | Rendements calendaires, Pays, Secteurs, Principales positions |
| IE00BMG6Z448 | iShares MSCI EM ex-China UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BMW42413 | iShares MSCI Europe Information Technology Sector UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
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
| IE00BZ163G84 | Vanguard € Corp Bond UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| IE00BZ56SW52 | WisdomTree Global Quality Dividend Growth UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| JE00B1VS3770 | WisdomTree Physical Gold | Pays, Secteurs, Principales positions |
| LU0908500753 | Amundi Core STOXX Europe 600 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1437018838 | Amundi FTSE EPRA NAREIT Global UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1681043599 | Amundi MSCI World Swap UCITS ETF (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1681045370 | Amundi MSCI Emerging Markets UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1681047236 | Amundi Core EURO STOXX 50 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1681048630 | Amundi S&P Global Luxury UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1737652823 | Amundi FTSE EPRA NAREIT Global UCITS ETF Dist | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1834983550 | Amundi STOXX Europe 600 Basic Resources UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1834983634 | Amundi STOXX Europe 600 Basic Materials UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1834986900 | Amundi STOXX Europe 600 Healthcare UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1834988518 | Amundi STOXX Europe 600 Technology UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1875395870 | Xtrackers Nikkei 225 UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU1931975079 | Amundi Core EUR Corporate Bond UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU2089238385 | Amundi Prime Japan UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU2196470426 | Xtrackers Nikkei 225 UCITS ETF 1C (Acc) | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| LU2970735911 | Amundi Core EUR High Yield Bond UCITS ETF | Rendements calendaires |
| LU3038520774 | Amundi STOXX Europe Defense UCITS ETF | Rendements calendaires |
| NL0009690239 | VanEck Global Real Estate UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |
| NL0011683594 | VanEck Morningstar Developed Markets Dividend Leaders UCITS ETF | Les six champs sont couverts ; caractéristiques et cotations restent manuelles |

« Hors collecte » peut aussi signifier non publié ou non applicable. Une part récente n’a pas six années complètes : ses performances YTD, depuis création et périodes glissantes restent manuelles lorsqu’elles existent. Les proxys de simulation ne sont pas remplacés par une série incomplète. Le monétaire overnight n’a pas de composition actions pertinente ; publier son panier de swap comme exposition économique serait incorrect.

## Indices avec au moins un bloc restant manuel

S&P 500, S&P 500 Equal Weight, STOXX Europe 600 et EURO STOXX 50 : les compositions complètes sont raccordées aux fiches mensuelles Amundi avec identité exacte, nombre de titres et poids numériques. Les éditions sont découvertes à chaque collecte ; les dates de composition restent celles de la publication. Le benchmark NET de ces fiches ne remplace pas les conventions de rendement existantes. Voir [qualification du 7 octobre](source-reliability-index-coverage-2026-10-07.md).

| Indice | Bloc hors collecte active |
|---|---|
| Russell 1000 (russell-1000) | Composition / méthodologie |
| S&P Global Dividend Aristocrats (sp-global-dividend-aristocrats) | Composition / méthodologie |
| S&P Euro Dividend Aristocrats (sp-euro-dividend-aristocrats) | Composition / méthodologie |

Russell 2000 : composition automatisée depuis les tables explicitement consacrées à l’indice de la fiche mensuelle Amundi LU1681038672 (pays, secteurs, dix positions pondérées et nombre de titres). Sa convention de rendement TOTAL USD reste issue de FTSE Russell, distincte du NET de la fiche Amundi. Russell 1000 : composition encore à qualifier dans une publication exploitable avec poids numériques. Les photographies archivées ne changent pas de date. Les quatre séries annuelles de sous-jacents sont automatisées : or/argent depuis les lignes Benchmark USD des fiches BlackRock (cours du métal, jamais rendement ETC), Bitcoin/Ethereum depuis les clôtures décembre/décembre de leurs séries spot USD validées. S&P 500 utilise également sa série exacte ^SP500TR USD, dividendes réinvestis. Les mises à jour mensuelles recalculent ces annuels avant leurs audits et publications. Les moyennes mensuelles Banque mondiale pour l’or et les contrats SI=F pour l’argent ne servent pas de substitut aux références métal annuelles.

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

Les lacunes ne se traitent pas toutes de la même manière : une donnée non applicable (pays actions d’un ETC or) doit rester absente ; un calendrier non encore publié attend sa première année complète ; une source exploitable mais non raccordée nécessite un connecteur.

1. Compléter les champs des instruments partiellement raccordés et fiabiliser la disponibilité des pages WisdomTree et du miroir des fiches BNP. 0 instruments restent entièrement hors collecte. Les pays, secteurs et dix positions du Dow Jones Amundi sont raccordés à ses tableaux d’indice datés, en conservant les caractéristiques de la part. Les encours CoinShares sont raccordés aux widgets officiels, avec leur Rate Date réelle ; les pages WisdomTree accessibles fournissent leurs encours datés ; compléter les calendriers exacts et compositions restant listés ci-dessus. CoinShares : les fiches publient un rendement crypto de référence, qui ne remplace pas celui de la part après frais ou staking. Distinguer explicitement les données non applicables, non publiées et réellement à connecter.
2. Qualifier les trois compositions restantes (Russell 1000 et les deux Dividend Aristocrats) en conservant exactement la variante de rendement et la devise existantes. Suivre le renouvellement annuel automatique ; les sources sans nouveau millésime gardent leur dernière période documentée.
3. Raccorder les caractéristiques et cotations (domicile, réplication, distribution, PEA) avec une provenance et une date propres à chaque champ.
4. Connecter les taux d’épargne réglementée, statistiques de ménages et rendements SCPI/fonds euros à des séries officielles ; maintenir une revue des règles fiscales et offres de courtiers.

Régénération : `npm run report:automation`. Ce rapport décrit une couverture, pas une garantie de disponibilité permanente des émetteurs.

## Fiabilité des accès émetteurs

Les collectes QYLD, WisdomTree et iShares disposent de reprises bornées tenant compte de `Retry-After`, de secours officiels validés et de rapports de récupération. Les erreurs iShares sont isolées par instrument et par complément de positions ; les observations valides sont appliquées sans effacer les précédentes en cas de panne. QYLD garde seulement frais et encours automatiques, son calendrier distribuante et ses expositions restant non qualifiés. Voir [la qualification des accès et des limites](issuer-collection-reliability-2026-10-07.md).
