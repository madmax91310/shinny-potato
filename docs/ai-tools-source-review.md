# Identités, continuités et indices — contrôle du 22 octobre 2026

La matrice JSON et Markdown couvre les 29 actifs et 16 destinations ou modes. Les 20 actions étaient déjà dans le quotidien IA, mais absentes du registre mensuel partagé vérifié. Les neuf fonds/ETC avaient déjà des fiches et des usages ; leurs nouveaux profils ne sont pas annoncés comme neuf instruments nouveaux.

## Identités et continuité

Les annuaires Nasdaq/NYSE et Nasdaq Nordic utilisés par Portefeuilles IA donnent la classe, le MIC, la devise et un identifiant de société. Les positions complètes BlackRock apportent l’ISIN exact et la classification pays de risque/secteur. Ces deux preuves restent distinctes. Le pays de risque de Nu est le Brésil ; cela ne prouve pas son domicile juridique. Aucun domicile n’est déduit de sa cotation NYSE. Cameco utilise CCJ, NYSE/USD : la position détenue par BlackRock en CCO/Toronto/CAD sert à identifier la même action ordinaire, jamais à remplacer les cours américains.

Les décisions et URL primaires sont conservées dans `global-equities.json`, `monthly-automation.json` et les observations :

- Nebius : reprise le 21 octobre 2024 après cession des activités Yandex en Russie. Premier mois complet retenu : novembre 2024. Aucun historique Yandex n’est publié comme celui de Nebius. [Émetteur](https://nebius.com/newsroom/nebius-group-announces-planned-resumption-of-trading-on-nasdaq-and-provides-investor-update), [Nasdaq](https://www.nasdaq.com/press-release/nasdaq-resumes-trading-nebius-group-nv-2024-10-18).
- Vertiv : combinaison du 7 février 2020 ; mars 2020 retenu, GSAH exclu. [8-K](https://www.sec.gov/Archives/edgar/data/1674101/000119312520028315/d880241d8k.htm).
- Rocket Lab : cotation opérationnelle depuis le 25 août 2021 ; septembre retenu, VACQ exclu. La réorganisation du 23 mai 2025 remplace chaque action par une action avec les mêmes droits. La continuité économique est admise explicitement ; l’ancien ISIN US7731221062 ne devient pas un alias universel du nouvel ISIN US7731211089. [FAQ](https://investors.rocketlabcorp.com/resources/investor-faqs), [8-K de réorganisation](https://www.sec.gov/Archives/edgar/data/1819994/000162828025027473/rklb-20250523.htm).
- AST SpaceMobile : combinaison du 6 avril 2021 ; mai retenu, NPA, unités et warrants exclus. [Nasdaq](https://www.nasdaqtrader.com/TraderNews.aspx?id=ECA2021-59), [émetteur](https://ast-science.com/nasdaq-asts/).
- SoFi : début SOFI en juin 2021 après combinaison ; juillet retenu par prudence, sans prolongation dans IPOE. [Émetteur](https://investors.sofi.com/news/news-details/2021/SoFi-A-Leading-Next-Generation-Financial-Services-Platform-to-Become-Publicly-Traded-following-Business-Combination-with-Social-Capital-Hedosophia-V/default.aspx).
- GE Vernova : indépendante le 2 avril 2024 ; mai retenu, aucun cours GE ni when-issued. [FAQ](https://www.gevernova.com/investors/faq), [communiqué](https://www.gevernova.com/news/press-releases/ge-vernova-completes-spin-off-begins-trading-new-york-stock-exchange).
- Constellation : séparation d’Exelon en février 2022 ; mars retenu, aucun cours Exelon ni when-issued. [Émetteur](https://www.constellationenergy.com/news/2022/constellation-launches-as-largest-u-s--clean-energy-company-afte.html).
- Strategy : même classe A, changement de nom de MicroStrategy et division 10:1 en août 2024. La série ajustée conserve divisions/regroupements et distributions du fournisseur. Son passé avant 2020 ne mesure pas une exposition au Bitcoin. Le profil Bitcoin/entreprises démarre après Coinbase. [SEC](https://www.sec.gov/Archives/edgar/data/1050446/000105044626000020/R31.htm).
- Saab : classe B Stockholm/SEK, division 4:1 en mai 2024 et nouvel identifiant, continuité du titre B ajusté ; aucune classe A ajoutée. [Nasdaq](https://www.nasdaq.com/press-release/adjustment-due-to-split-in-saab-158-24-2024-05-06).
- Cameco : actions ordinaires au NYSE en USD ; pas de conversion implicite de CCO/CAD. [Émetteur](https://www.cameco.com/invest/stock-information).

Pour Robinhood, Coinbase, Cloudflare, Zscaler, Datadog, Snowflake, Reddit, Duolingo, MercadoLibre et Nu : identité de classe et cotation issues des deux preuves ci-dessus ; recherche depuis `firstTradeDate` du fournisseur, premier mois incomplet exclu. Aucune substitution ADR/local/classe. Les réponses quotidienne/mensuelle, dates de dernière séance et SHA-256 sont dans `monthly-automated.json`. Les cours ajustés servent au rendement avec réinvestissement ; les clôtures hors revenus servent aux comparaisons de niveaux. Une unité ajustée de simulation n’est pas annoncée comme un prix d’achat historique brut.

## ETF et ETC

Les neuf parts ont été examinées individuellement. Les historiques longs préexistants sont conservés ou étendus. Les deux parts Vanguard ne sont jamais fusionnées et aucun duel Acc/Dist n’est ajouté. VWRD conserve ses rendements ajustés avec réinvestissement des distributions. Les conversions EUR/USD utilisent les taux historiques aux bornes. Les débuts figés de certaines places et les trous historiques ne sont ni interpolés ni raccordés à une autre place : seule une nouvelle série complète de même ISIN, même devise et profondeur supérieure peut remplacer la précédente.

L’or IE00B4ND3602 possède déjà une fiche qui sait présenter un ETC. Cette fiche est conservée en tant qu’ETC, sans pays ni secteurs d’entreprises et sans qualification ETF UCITS.

## Coulisses des indices

Les quatre sujets généraux existent déjà. Vérification des noms et règles auprès des fournisseurs, sans créer un deuxième FTSE All-World pour Acc et Dist :

| Sujet | Identité et méthodologie consultées | Décision |
|---|---|---|
| MSCI World | [MSCI 990100](https://www.msci.com/indexes/index/990100/msci-world-index) ; grandes/moyennes capitalisations développées, capitalisation flottante | Déjà raccordé ; source de rendement et composition de l’indice conservées |
| MSCI ACWI | [MSCI 892400](https://www.msci.com/indexes/index/892400/msci-acwi-index) ; développés et émergents, grandes/moyennes capitalisations | Déjà raccordé |
| Nasdaq-100 | [méthodologie 2026](https://indexes.nasdaqomx.com/docs/methodology_NDX.pdf), [révision effective le 1er mai 2026](https://ir.nasdaq.com/news-releases/news-release-details/nasdaq-concludes-public-consultation-nasdaq-100-indexr) ; grandes sociétés non financières cotées au Nasdaq, pondération modifiée | Déjà raccordé ; prix NDX distincts du rendement total XNDX |
| FTSE All-World | Règles FTSE Global Equity Index Series, [fournisseur](https://www.lseg.com/en/ftse-russell/indices/ftse-all-world) ; grandes/moyennes capitalisations développées/émergentes, flottant et investissabilité | Déjà raccordé ; un seul sujet pour les deux parts Vanguard |
| Digital Security | [iShares IE00BG0J4C88](https://www.ishares.com/uk/individual/en/products/297843/ishares-digital-security-ucits-etf-fund), [STOXX Global Digital Security](https://stoxx.com/index/stxtdsv/?factsheet=true) ; benchmark émetteur « STOXX Global Digital Security Open Net Index in USD » ; sélection par revenus thématiques, filtres et pondération ajustée équipondérée | Bloqué dans Coulisses : aucun jeu commun qualifié et actualisé de composition/poids/pays/secteurs et cinq années de rendement de la variante exacte. Les données du fonds ne sont pas celles de l’indice |
| Automation & Robotics | [iShares IE00BYZK4552](https://www.ishares.com/uk/individual/en/products/284219/ishares-automation-robotics-ucits-etf-usd-acc-fund), [STOXX Global Automation & Robotics](https://stoxx.com/index/ixarobs/?factsheet=true) ; benchmark « Stoxx Global Automation & Robotics Net USD Index » ; univers thématique et règles STOXX | Bloqué pour les mêmes champs index spécifiques ; ne pas reprendre les 158 positions du fonds comme composition de l’indice |
| Clean Energy Transition | [iShares IE00B1XNHC34](https://www.ishares.com/uk/individual/en/products/251911/ishares-global-clean-energy-ucits-etf), [S&P](https://www.spglobal.com/spdji/en/indices/sustainability/sp-global-clean-energy-transition-index/), [méthode de sélection S&P](https://www.indexologyblog.com/2025/06/12/rebalance-review-of-the-sp-global-clean-energy-transition-index-h1-2025/) ; nom actuel « S&P Global Clean Energy Transition Index in USD (Net) », scores d’exposition à l’énergie propre et filtres | Bloqué : variante nette exacte et jeu complet de champs non qualifiés pour le contrat de Coulisses ; pas de rendement ETF présenté comme rendement d’indice |

Un top 10 d’indice peut alimenter une rubrique « principales lignes » sourcée, mais ne suffit pas à qualifier les autres ventilations ni un recouvrement complet. Les pages et méthodologies accessibles constituent des pistes de collecte, pas une preuve que ces trois nouveaux sujets disposent déjà des observations exigées. Aucun sujet vide n’est créé. L’ETC or est hors périmètre des sujets d’indice.

## Actualisation et limites restantes

Les sources nouvellement qualifiées rejoignent `monthly-automation.json`, les niveaux récents `anniversary-levels.json`, les identités internationales `global-equities.json`, les classifications `dca-security-classifications.json` et l’univers de collecte des compositions existant. Aucune compétition, position ou ancre IA n’est modifiée. La collecte ne dépend pas de la détention par un participant IA. Les nouveaux candidats ont été retirés de la file après leur qualification effective.

À poursuivre : qualifier les observations propres aux trois indices thématiques pour Coulisses ; attendre une deuxième année complète commune pour les profils infrastructure IA, plateformes numériques et énergie/infrastructures numériques, ainsi qu’une troisième pour admettre Nebius, Reddit et GE Vernova dans les Duels/le mode manuel du Générateur. Les champs de domicile juridique et de répartition du chiffre d’affaires non sourcés ne sont pas inventés. L’automatique ETF conserve ses admissions et ses limites actuelles.
