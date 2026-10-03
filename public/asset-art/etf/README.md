# Présentation ETF — collection titane

106 identités explicites dans `src/pages/etf-sheets/visualIdentity.js`. Contrôle visuel et associations revus le 03/10/2026. Les illustrations désignent une exposition, jamais un logo officiel d’indice ou d’émetteur. Les globes sont illustratifs et ne constituent pas des cartes d’allocation. Les variantes d’une exposition peuvent partager leur scène.

24 scènes nouvelles générées avec le mode intégré ImageGen, sans texte financier ni branding, puis encodées en WebP (qualité 88). Les objets restent proportionnels, entiers et fondus dans la fiche par canvas. Les scènes or/argent, symboles Bitcoin/Ethereum et police éditoriale sont réutilisés depuis `public/asset-art/` (sources et licence : README parent). Aucun service externe n’est appelé pendant l’export.

## Prompts de production

Pour chaque sujet ci-dessous : `Use case: stylized-concept. LANDSCAPE 3:2 production hero illustration. [Subject]. Photorealistic 3D studio product photography, coherent brushed titanium silver/ivory/champagne palette, pale warm ivory silver studio background, subtle brushed metallic floor and soft reflection. Complete object entirely inside middle 70% of frame, generous margins. Soft dramatic upper-left light. No text, letters, numbers, branding, logo, frame or watermark. Premium titanium editorial ETF card collection.` Les quatre globes précisent la géographie visible ; batteries : une cellule en coupe ; nucléaire, énergie et autres objets : détails sectoriels indiqués ci-dessous.

| Scène | Sujet contrôlé |
|---|---|
| world | Globe Europe/Afrique/Asie — actions internationales et facteurs |
| america | Globe des Amériques — marchés actions américains |
| europe | Globe centré sur l’Europe — marchés européens |
| asia | Globe centré sur l’Asie — marchés asiatiques |
| batteries | Cellules de batterie, dont une coupe cuivre/graphite |
| chip | Microprocesseur et circuits — informatique, puces et technologies numériques |
| health | Double hélice — santé et biotechnologies |
| security | Bouclier et serrure — cybersécurité |
| energy | Chevalet de pompage et baril — énergie traditionnelle |
| water | Goutte — industrie de l’eau |
| luxury | Montre sans marque — luxe |
| finance | Bâtiment bancaire — services financiers |
| property | Immeubles — immobilier coté |
| robotics | Bras industriel articulé — robotique |
| nuclear | Centrale nucléaire — uranium et technologies nucléaires |
| space | Satellite — industrie spatiale |
| bonds | Certificats vierges — marchés obligataires et monétaires |
| renewables | Éolienne et panneaux solaires — transition énergétique |
| commodities | Lingots, blé et baril — matières premières diversifiées |
| consumer | Panier de produits essentiels — consommation défensive |
| defense | Aéronef sans insigne — industrie aéronautique de défense |
| resources | Minerai, bobine d’acier et lingots — ressources de base |
| infrastructure | Pont et réseau de transport d’électricité — infrastructures |
| utilities | Réseau électrique et barrage — services collectifs |
| gold | Lingot Au — or physique |
| silver | Lingot Ag — argent physique |
| bitcoin | Symbole Bitcoin déjà contrôlé — produits adossés au bitcoin |
| ethereum | Symbole Ethereum déjà contrôlé — produit adossé à ether |

## Affectations contrôlées

Les caractéristiques financières restent dérivées des registres partagés, sans recopie. Statut PEA inconnu : aucun badge PEA ajouté. Les distinctions de réplication/adossement, les devises, les dates et le périmètre d’encours sont conservés.

| Fiche | Nom | Scène |
|---|---|---|
| sp500_equal_weight | Xtrackers S&P 500 Equal Weight UCITS ETF 1C | america |
| russell2000_spdr | State Street SPDR Russell 2000 U.S. Small Cap UCITS ETF (Acc) | america |
| oblig_em_usd_ishares | iShares J.P. Morgan $ EM Bond UCITS ETF USD (Dist) | bonds |
| oblig_eur_long_ishares | iShares € Govt Bond 15-30yr UCITS ETF EUR (Dist) | bonds |
| world_ex_usa | Xtrackers MSCI World ex USA UCITS ETF 1C | world |
| pea_global_amundi | Amundi PEA Global (MSCI ACWI) UCITS ETF (Acc) | world |
| monetaire-eur | Xtrackers II EUR Overnight Rate Swap UCITS ETF 1C | bonds |
| obligations-etat-0-1 | iShares € Govt Bond 0-1yr UCITS ETF EUR (Dist) | bonds |
| obligations-globales-eur | iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc) | bonds |
| obligations-inflation | iShares € Inflation Linked Govt Bond UCITS ETF | bonds |
| em-ex-chine | iShares MSCI EM ex-China UCITS ETF (Acc) | world |
| inde | iShares MSCI India UCITS ETF USD (Acc) | asia |
| infrastructures | iShares Global Infrastructure UCITS ETF USD (Dist) | infrastructure |
| sp500-spea | iShares S&P 500 Swap PEA UCITS ETF | america |
| topix-pea-hedged | Amundi PEA Japon (TOPIX) UCITS ETF EUR Hedged Acc | asia |
| basic-resources-pea | Amundi STOXX Europe 600 Basic Resources UCITS ETF | resources |
| msci-world | Amundi PEA Monde (MSCI World) UCITS ETF | world |
| sp500 | Amundi PEA S&P 500 UCITS ETF | america |
| nasdaq100 | Amundi PEA Nasdaq-100 UCITS ETF | america |
| eurostoxx50 | Amundi Core EURO STOXX 50 UCITS ETF | europe |
| msci-em | iShares Core MSCI EM IMI UCITS ETF | world |
| msci-acwi | iShares MSCI ACWI UCITS ETF USD (Acc) | world |
| ftse-all-world | Vanguard FTSE All-World UCITS ETF (USD) Accumulating | world |
| semiconducteurs | iShares MSCI Global Semiconductors UCITS ETF | chip |
| sante-biotech | iShares Nasdaq US Biotechnology UCITS ETF | health |
| energie | SPDR MSCI World Energy UCITS ETF | energy |
| defense | VanEck Defense UCITS ETF | defense |
| cybersecurite | L&G Cyber Security UCITS ETF | security |
| eau | Amundi MSCI Water UCITS ETF (Dist) | water |
| luxe | Amundi S&P Global Luxury UCITS ETF | luxury |
| financieres | iShares MSCI World Financials Sector Advanced UCITS ETF USD (Dist) | finance |
| immobilier-reit | iShares Developed Markets Property Yield UCITS ETF USD (Dist) | property |
| technologie | iShares MSCI World Information Technology Sector Advanced UCITS ETF USD (Dist) | chip |
| quantique | VanEck Quantum Computing UCITS ETF A | chip |
| ia | L&G Artificial Intelligence UCITS ETF | chip |
| robotique | iShares Automation & Robotics UCITS ETF | robotics |
| blockchain | iShares Blockchain Technology UCITS ETF | chip |
| nucleaire | VanEck Uranium and Nuclear Technologies UCITS ETF | nuclear |
| batteries-ve | L&G Battery Value-Chain UCITS ETF | batteries |
| spatial | VanEck Space Innovators UCITS ETF | space |
| dividendes | SPDR S&P US Dividend Aristocrats UCITS ETF | world |
| covered-call | Global X Nasdaq 100 Covered Call UCITS ETF | world |
| low-volatility | iShares Edge MSCI World Minimum Volatility UCITS ETF | world |
| value | iShares Edge MSCI World Value Factor UCITS ETF | world |
| small-caps | iShares MSCI World Small Cap UCITS ETF | world |
| quality | iShares Edge MSCI World Quality Factor UCITS ETF (Acc) | world |
| momentum | iShares Edge MSCI World Momentum Factor UCITS ETF (Acc) | world |
| or | iShares Physical Gold ETC | gold |
| bitcoin | CoinShares Physical Bitcoin ETP | bitcoin |
| obligations-etat | iShares Core Euro Government Bond UCITS ETF (Dist) | bonds |
| high-yield | iShares Euro High Yield Corporate Bond UCITS ETF (Dist) | bonds |
| corp-bond-ig | iShares Core € Corp Bond UCITS ETF (Dist) | bonds |
| high-yield-acc | iShares € High Yield Corp Bond UCITS ETF (Acc) | bonds |
| em-local-bond | iShares J.P. Morgan EM Local Govt Bond UCITS ETF (Acc) | bonds |
| support-msci_world | Amundi MSCI World Swap UCITS ETF (Acc) | world |
| support-sp500_ishares | iShares Core S&P 500 UCITS ETF | america |
| support-nasdaq100_ishares | iShares Nasdaq 100 UCITS ETF | america |
| support-lqq | Amundi Nasdaq-100 Daily (2x) Leveraged UCITS ETF Acc | america |
| support-cl2 | Amundi MSCI USA Daily (2x) Leveraged UCITS ETF Acc | america |
| support-cac40 | Amundi CAC 40 UCITS ETF | europe |
| support-eurostoxx50_ishares | iShares Core EURO STOXX 50 UCITS ETF | europe |
| support-msci_europe | iShares Core MSCI Europe UCITS ETF | europe |
| support-sect_sante | iShares S&P 500 Health Care Sector UCITS ETF | health |
| support-or | Invesco Physical Gold ETC | gold |
| support-argent | iShares Physical Silver ETC | silver |
| support-mp_large | Invesco Bloomberg Commodity UCITS ETF | commodities |
| support-mp_large_icom | iShares Diversified Commodity Swap UCITS ETF | commodities |
| support-ethereum | CoinShares Ethereum Staking ETP | ethereum |
| support-foncieres_etf | Amundi FTSE EPRA NAREIT Global UCITS ETF | property |
| support-foncieres_etf_dist | Amundi FTSE EPRA NAREIT Global UCITS ETF Dist | property |
| support-strat_dividendes_dist | SPDR S&P Global Dividend Aristocrats UCITS ETF | world |
| support-high_dividend | Vanguard FTSE All-World High Dividend Yield UCITS ETF | world |
| support-high_dividend_dist | Vanguard FTSE All-World High Dividend Yield UCITS ETF | world |
| support-quality_dividend | iShares MSCI World Quality Dividend Advanced UCITS ETF | world |
| support-quality_dividend_dist | iShares MSCI World Quality Dividend Advanced UCITS ETF (Dist) | world |
| support-or_wisdomtree | WisdomTree Physical Gold | gold |
| support-or_amundi | Amundi Physical Gold ETC | gold |
| support-bitcoin_wisdomtree | WisdomTree Physical Bitcoin | bitcoin |
| support-bitcoin_etcgroup | Bitwise Physical Bitcoin ETP | bitcoin |
| support-bitcoin_21shares | 21Shares Bitcoin ETP | bitcoin |
| support-oblig_corp_amundi | Amundi Core EUR Corporate Bond UCITS ETF | bonds |
| support-oblig_corp_vanguard | Vanguard € Corp Bond UCITS ETF | bonds |
| support-oblig_corp_spdr | SPDR € Corp Bond UCITS ETF | bonds |
| support-msci_world_ishares | iShares Core MSCI World UCITS ETF (Acc) | world |
| support-msci_acwi | SPDR MSCI ACWI UCITS ETF | world |
| support-msci_em_amundi | Amundi MSCI Emerging Markets UCITS ETF | world |
| support-ftse_em_vanguard | Vanguard FTSE Emerging Markets UCITS ETF (Acc) | world |
| support-msci_em_spdr | SPDR MSCI Emerging Markets UCITS ETF | world |
| support-oblig_etat_eur_short | iShares € Govt Bond 1-3yr UCITS ETF | bonds |
| support-tech_europe | iShares MSCI Europe Information Technology Sector UCITS ETF | chip |
| support-smallcap_europe | iShares MSCI Europe Small Cap UCITS ETF | europe |
| support-sect_energie | iShares S&P 500 Energy Sector UCITS ETF | energy |
| support-sect_tech | iShares S&P 500 Information Technology Sector UCITS ETF | chip |
| support-sect_cybersecurite | iShares Digital Security UCITS ETF | security |
| support-sect_energie_propre | iShares Global Clean Energy Transition UCITS ETF | renewables |
| support-sect_conso_defensive | iShares S&P 500 Consumer Staples Sector UCITS ETF | consumer |
| support-sect_utilities | iShares S&P 500 Utilities Sector UCITS ETF | utilities |
| support-dividend_leaders | VanEck Morningstar Developed Markets Dividend Leaders UCITS ETF | world |
| support-immo_gpr | VanEck Global Real Estate UCITS ETF | property |
| support-oblig_hy_amundi | Amundi Core EUR High Yield Bond UCITS ETF | bonds |
| support-oblig_etat_us | iShares $ Treasury Bond UCITS ETF | bonds |
| support-actions_japon | iShares Core MSCI Japan IMI UCITS ETF (Acc) | asia |
| support-actions_coree | iShares MSCI Korea UCITS ETF | asia |
| support-actions_taiwan | iShares MSCI Taiwan UCITS ETF | asia |
| support-actions_asie_ex_japon | iShares MSCI AC Far East ex-Japan UCITS ETF | asia |
| support-sect_financieres | iShares S&P 500 Financials Sector UCITS ETF | finance |

## Vérification

`node scripts/test-etf-art.mjs` teste les 106 exports PNG 1600 × 2000, les associations, les faits complets, les textes sans chevauchement, la signature et la prudence uniques, le chargement local et la reprise/téléchargement dans l’interface. Un exemple de chaque thème et toutes les étiquettes sont conservés dans l’artefact CI `test-artifacts/etf-titanium`. Les graphiques annuels restent un export distinct.
