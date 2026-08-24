// Bibliothèque d'actifs — rendements annuels approximatifs 2020-2025 (fonds réels représentatifs,
// devise locale, dividendes non systématiquement réinvestis). Données illustratives, éditables à la main.
// r = [2020, 2021, 2022, 2023, 2024, 2025]
//
// Roster de 53 supports : chaque actif n'existe que parce qu'il a un rôle clair dans au moins une
// thèse de portefeuille (src/theses.js). Pas de ligne "parce qu'il en fallait une de plus" — voir
// CLAUDE.md du projet pour la philosophie de sélection. 8 actifs sans rôle identifié (china, india,
// japan, oblig_global_agg, oblig_short, petrole, strat_momentum, strat_smallcap) ont été retirés lors
// d'un audit en août 2026 pour que ce roster reste vrai. 4 jumeaux distribuants (suffixe _dist,
// flag distributing: true) ont été ajoutés ensuite, réservés au profil Rentier qui exige des parts
// distribuantes (cf. warning dans theses.js). 5 jumeaux supplémentaires (Monde, S&P 500, Nasdaq-100,
// Euro Stoxx 50, matières premières) ont été ajoutés lors d'un audit "enrichissement bibliothèque" —
// chacun vérifié réel et partageant le même sous-jacent (donc le même tableau `r`) que l'actif
// d'origine du groupe (cf. SP500_OPTIONS, NASDAQ100_OPTIONS, EUROSTOXX50_OPTIONS, COMMODITY_OPTIONS
// dans theses.js).

export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

// Catégories utilisées uniquement pour la colorimétrie de l'interface (liste d'allocation, légende).
// L'émoji affiché dans le texte du tweet est porté par chaque actif individuellement (cf. plus bas),
// car la nomenclature demandée classe par "rôle" plutôt que par catégorie de fonds.
export const CATEGORIES = {
  obligataire: { label: "Obligataire / fonds euros", color: "#3987e5" },
  actions_larges: { label: "Actions développées", color: "#199e70" },
  matieres_premieres: { label: "Matières premières", color: "#d95926" },
  dividendes: { label: "Dividendes", color: "#c98500" },
  immobilier: { label: "Immobilier", color: "#d55181" },
  emergents: { label: "Actions émergentes", color: "#008300" },
  crypto: { label: "Crypto", color: "#e66767" },
};

export const ASSETS = [
  // ── 🔵 Obligataire / fonds euros ──────────────────────
  {
    id: "fonds_euros", name: "Fonds euros (assurance-vie)", cat: "obligataire", emoji: "🔵",
    // Source : rendement moyen net des fonds euros en assurance-vie (marché français, hors
    // frais de gestion du contrat), FranceTransactions.com / Nalo / La Finance pour Tous,
    // années 2020-2025. 2020 = résultat définitif (1,14%), pas la prévision initiale (~1,0-1,1%).
    r: [1.14, 1.30, 1.90, 2.60, 2.60, 2.65],
    desc: [
      "le socle sécuritaire des assurances-vie : capital garanti, rendement modeste mais stable.",
      "le matelas de sécurité du portefeuille : pas de sensation forte, mais on ne perd (presque) jamais.",
      "le support préféré des épargnants prudents : liquidité et garantie du capital avant tout.",
    ],
  },
  {
    id: "oblig_etat_eur", name: "iShares Core € Govt Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    // Source : fiche fonds iShares/BlackRock (IEGA) — seule l'année 2022 a pu être vérifiée de
    // façon fiable (-18,52%, cohérent avec le choc de taux sur les obligations d'État €).
    // 2020, 2021, 2023, 2024, 2025 : les extractions obtenues via recherche web se sont révélées
    // incohérentes d'une requête à l'autre (mélange probable avec d'autres échéances/fonds) —
    // valeurs d'origine conservées, non vérifiées.
    r: [4.5, -2.5, -18.52, 7.0, 1.5, 3.0],
    desc: [
      "prête de l'argent aux États de la zone euro (France, Allemagne...) contre un intérêt régulier.",
      "sensible aux taux d'intérêt : quand la BCE relève ses taux, ce type d'ETF encaisse (2022 en est l'exemple).",
      "le contraire d'un actif spectaculaire : de la dette publique européenne, jugée très sûre.",
    ],
  },
  {
    id: "oblig_corp_ig", name: "iShares Core € Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    // Source : fiche fonds iShares/BlackRock (IEAC) — seule l'année 2022 vérifiée de façon
    // fiable (-13,86%). 2020, 2021, 2023, 2024, 2025 : recherches infructueuses/incohérentes,
    // valeurs d'origine conservées, non vérifiées. Même valeurs répliquées sur les jumeaux
    // Amundi/Vanguard/SPDR (même sous-jacent, cf. CORPBOND_OPTIONS dans theses.js).
    r: [5.0, -1.0, -13.86, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_hy", name: "iShares € High Yield Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    // Source : performance annuelle du fonds iShares € High Yield Corp Bond UCITS ETF (IHYG),
    // Yahoo Finance, années 2020-2025.
    r: [1.29, 3.02, -9.47, 11.31, 5.71, 5.32],
    desc: [
      "des obligations d'entreprises plus fragiles, donc mieux rémunérées : plus de coupon.",
      "le compartiment obligataire le plus généreux en revenu, avec un vrai risque de crédit en face.",
      "verse un coupon nettement supérieur aux obligations d'État, contre un peu plus de risque.",
    ],
  },

  {
    id: "oblig_inflation", name: "iShares € Inflation Linked Govt Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    // NON VÉRIFIÉ : recherches infructueuses pour les 6 années — la seule donnée obtenue pour
    // 2022 (fonds IBCI) a varié d'une requête à l'autre entre +1,20% et -9,73% selon la source,
    // deux résultats incompatibles entre eux et avec le comportement connu des obligations
    // indexées inflation € en 2022 (choc de taux réels). Valeurs d'origine conservées intégralement.
    r: [5.0, 3.0, -15.0, 4.0, 2.0, 3.0],
    desc: [
      "des obligations d'État dont le capital et le coupon sont indexés sur l'inflation de la zone euro.",
      "protège le pouvoir d'achat du capital investi, contrairement à une obligation classique à taux fixe.",
      "a tout de même chuté en 2022 : la hausse des taux réels a pesé plus lourd que la protection inflation.",
    ],
  },

  // ── 🟢 Actions développées ─────────────────────────────
  {
    id: "msci_world", name: "Amundi MSCI World UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : indice MSCI World (EUR, net de dividendes), fiches MSCI + recoupement avec la
    // performance publiée du fonds Amundi MSCI World, années 2020-2025. 2022 : -12,78% en EUR
    // (net) — à ne pas confondre avec le -18% du même indice en USD sur la même année. 2025
    // (5,35%) reflète la forte dépréciation du dollar face à l'euro sur l'année (l'indice a
    // nettement mieux performé en USD).
    r: [6.33, 31.07, -12.78, 19.60, 26.60, 5.35],
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    id: "sp500", name: "Amundi PEA S&P 500 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : performance annuelle réelle du fonds Amundi PEA S&P 500 (Screened) UCITS ETF,
    // en euros (non couvert), Yahoo Finance, années 2020-2025.
    r: [8.54, 38.24, -12.95, 21.53, 31.71, 3.72],
    desc: [
      "les 500 plus grandes entreprises cotées aux États-Unis, tirées par la tech ces dernières années.",
      "l'indice le plus suivi au monde, souvent utilisé comme référence absolue de performance.",
      "un pari implicite sur la capacité des entreprises américaines à rester leaders mondiaux.",
    ],
  },
  {
    // Jumeau strict de "sp500" — même indice S&P 500, fonds vérifié réel (ISIN IE00B5BMR087,
    // ticker CSPX, l'un des plus gros ETF actions d'Europe). Part USD (non-PEA), contrairement à
    // sp500 qui est la version PEA d'Amundi — même sous-jacent, donc même performance.
    id: "sp500_ishares", name: "iShares Core S&P 500 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [8.54, 38.24, -12.95, 21.53, 31.71, 3.72],
    desc: [
      "les 500 plus grandes entreprises cotées aux États-Unis, tirées par la tech ces dernières années.",
      "l'indice le plus suivi au monde, souvent utilisé comme référence absolue de performance.",
      "un pari implicite sur la capacité des entreprises américaines à rester leaders mondiaux.",
    ],
  },
  {
    id: "nasdaq100", name: "Amundi PEA Nasdaq-100 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : performance annuelle réelle de l'iShares NASDAQ 100 UCITS ETF, part EUR,
    // années 2020-2025 (proxy du fonds Amundi PEA, même indice sous-jacent).
    r: [48.38, 28.86, -34.10, 54.99, 27.18, 20.78],
    desc: [
      "les 100 plus grandes entreprises non financières du Nasdaq : très orienté technologie.",
      "concentré sur des géants comme Apple, Microsoft ou Nvidia : un pari sur l'innovation US.",
      "un des supports les plus volatils parmi les grands indices actions.",
    ],
  },
  {
    // Jumeau strict de "nasdaq100" — c'est d'ailleurs ce fonds (part EUR, ISIN IE00B53SZB19,
    // ticker SXRV) qui a servi de source à la série "nasdaq100" ci-dessus (proxy du fonds Amundi
    // PEA, même indice sous-jacent). Fonds vérifié réel.
    id: "nasdaq100_ishares", name: "iShares Nasdaq 100 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [48.38, 28.86, -34.10, 54.99, 27.18, 20.78],
    desc: [
      "les 100 plus grandes entreprises non financières du Nasdaq : très orienté technologie.",
      "concentré sur des géants comme Apple, Microsoft ou Nvidia : un pari sur l'innovation US.",
      "un des supports les plus volatils parmi les grands indices actions.",
    ],
  },
  {
    id: "cac40", name: "Amundi CAC 40 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source pour 2023-2025 : indice CAC 40 GR (dividendes réinvestis), fiche officielle
    // Euronext, +20,14% / +0,92% / +14,28%. 2020-2022 : NON VÉRIFIÉ en version GR malgré
    // plusieurs recherches (seule la version « nue », hors dividendes, a pu être confirmée pour
    // 2021 à ~+28,85%, proche de la valeur d'origine) — valeurs d'origine conservées pour ces
    // trois années.
    r: [-7.0, 28.0, -9.0, 20.14, 0.92, 14.28],
    desc: [
      "les 40 plus grosses capitalisations françaises, de LVMH à TotalEnergies en passant par L'Oréal.",
      "éligible au PEA, avec une fiscalité avantageuse après 5 ans de détention en France.",
      "un classique du portefeuille « patriote » des investisseurs particuliers français.",
    ],
  },
  {
    id: "eurostoxx50", name: "Amundi Core EURO STOXX 50 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : indice EURO STOXX 50 (Total Return, dividendes réinvestis), années 2020-2025.
    r: [-3.03, 23.19, -9.02, 22.46, 10.91, 22.01],
    desc: [
      "les 50 plus grandes entreprises de la zone euro, dont LVMH, TotalEnergies ou SAP.",
      "souvent éligible au PEA, ce qui en fait un classique pour les investisseurs français.",
      "un bon indicateur de la santé économique de la zone euro dans son ensemble.",
    ],
  },
  {
    // Jumeau strict de "eurostoxx50" — même indice, fonds vérifié réel (ISIN IE00B53L3W79, déjà
    // utilisé et vérifié pour l'outil Tweets ETF : le plus liquide des ETF Euro Stoxx 50).
    id: "eurostoxx50_ishares", name: "iShares Core EURO STOXX 50 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [-3.03, 23.19, -9.02, 22.46, 10.91, 22.01],
    desc: [
      "les 50 plus grandes entreprises de la zone euro, dont LVMH, TotalEnergies ou SAP.",
      "souvent éligible au PEA, ce qui en fait un classique pour les investisseurs français.",
      "un bon indicateur de la santé économique de la zone euro dans son ensemble.",
    ],
  },
  {
    id: "msci_europe", name: "iShares Core MSCI Europe UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : indice MSCI Europe (EUR, net de dividendes), fiches MSCI, années 2020-2025.
    r: [-3.32, 25.13, -9.49, 15.83, 8.59, 19.39],
    desc: [
      "une exposition large aux grandes entreprises européennes, au-delà de la seule zone euro.",
      "inclut le Royaume-Uni et la Suisse en plus de la zone euro : diversification géographique intéressante.",
      "un bon complément pour ne pas dépendre uniquement des marchés américains.",
    ],
  },
  {
    id: "sect_sante", name: "iShares S&P 500 Health Care Sector UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : performance annuelle réelle du fonds iShares S&P 500 Health Care Sector UCITS
    // ETF, Yahoo Finance, années 2020-2025.
    r: [11.93, 27.58, -2.63, 1.72, 2.16, 14.67],
    desc: [
      "laboratoires pharmaceutiques et biotech : un secteur réputé plus défensif.",
      "moins corrélé aux cycles économiques classiques, mais sensible aux décisions réglementaires.",
      "traverse généralement mieux les crises boursières que les secteurs cycliques.",
    ],
  },

  // ── 🟤 Actions émergentes ──────────────────────────────
  {
    id: "msci_em", name: "iShares Core MSCI EM IMI UCITS ETF", cat: "emergents", emoji: "🟤",
    // Source : indice MSCI Emerging Markets (EUR, net de dividendes), fiches MSCI, années
    // 2020-2025. Même valeurs répliquées sur les jumeaux Amundi/SPDR (cf. EM_OPTIONS dans
    // theses.js) ; ftse_em_vanguard est traité séparément (indice FTSE EM, composition
    // différente — cf. plus bas).
    r: [8.54, 4.86, -14.85, 6.11, 14.68, 17.76],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },

  // ── 🟡 Or ───────────────────────────────────────────────
  {
    id: "or", name: "Invesco Physical Gold ETC", cat: "matieres_premieres", emoji: "🟡",
    // Source : cours de l'or spot en USD/once (Visual Capitalist « Gold's Annual Returns
    // 2000-2025 » ; BullionVault pour la clôture 2025), années 2020-2025. Base devise : USD (le
    // rendement réel en EUR de l'ETC, non couvert, diffère selon l'évolution EUR/USD chaque
    // année — donnée EUR précise non trouvée de façon fiable via recherche web). Même valeurs
    // répliquées sur les jumeaux WisdomTree/iShares/Amundi (cf. GOLD_OPTIONS dans theses.js).
    r: [25.1, -3.6, -0.4, 13.2, 27.2, 65.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
  },

  // ── 🛢️ Autres matières premières ───────────────────────
  {
    id: "argent", name: "iShares Physical Silver ETC", cat: "matieres_premieres", emoji: "🛢️",
    // Source : cours de l'argent spot en USD/once. 2020 (+47%) confirmé. 2021 (-14%) vérifié via
    // recherche web. 2022, 2023, 2024 : NON VÉRIFIÉ malgré plusieurs recherches (données
    // fragmentaires/contradictoires) — valeurs d'origine conservées pour ces trois années.
    // 2025 : le cours spot USD a bien grimpé de +144% (BullionVault « Silver Jumps 144% »,
    // confirmé), mais ce fonds est une ligne EUR au même titre que le reste du fichier — corrigé
    // en tenant compte de la baisse du dollar face à l'euro sur 2025 (EUR/USD +13,34% sur
    // l'année, exchange-rates.org) : (1+1,44)/(1+0,1334)-1 ≈ +115,3%. Estimation calculée à
    // partir de deux chiffres réels (rendement spot USD + variation de change), pas une clôture
    // EUR directement lue — aucune source n'a donné le rendement EUR exact du fonds pour 2025.
    r: [47.0, -14.0, 3.0, -1.0, 21.0, 115.3],
    desc: [
      "souvent surnommé « l'or du pauvre », plus volatil que l'or car aussi utilisé dans l'industrie.",
      "profite à la fois de la demande refuge et de la demande industrielle.",
      "un actif plus spéculatif que l'or, avec des variations plus marquées dans les deux sens.",
    ],
  },
  {
    id: "mp_large", name: "Invesco Bloomberg Commodity UCITS ETF", cat: "matieres_premieres", emoji: "🛢️",
    // Source : fiche officielle Invesco (performance annuelle calendaire du fonds), datée du
    // 31/12/2025, années 2020-2025.
    r: [-3.13, 26.70, 14.90, -8.47, 5.02, 15.39],
    desc: [
      "un panier diversifié : énergie, métaux, agriculture réunis en une seule ligne.",
      "réputé pour bien se comporter en période d'inflation élevée, comme en 2021-2022.",
      "peu corrélé aux actions et obligations, un bon outil de diversification globale.",
    ],
  },
  {
    // Jumeau strict de "mp_large" — vérifié réel (ISIN IE00BDFL4P12, ticker ICOM) : réplique
    // bien l'indice Bloomberg Commodity, confirmé via la fiche produit iShares.
    id: "mp_large_icom", name: "iShares Diversified Commodity Swap UCITS ETF", cat: "matieres_premieres", emoji: "🛢️",
    r: [-3.13, 26.70, 14.90, -8.47, 5.02, 15.39],
    desc: [
      "un panier diversifié : énergie, métaux, agriculture réunis en une seule ligne.",
      "réputé pour bien se comporter en période d'inflation élevée, comme en 2021-2022.",
      "peu corrélé aux actions et obligations, un bon outil de diversification globale.",
    ],
  },
  // ── 🟠 Crypto ───────────────────────────────────────────
  {
    id: "bitcoin", name: "CoinShares Physical Bitcoin ETP", cat: "crypto", emoji: "🟠",
    // Source : cours BTC/USD (clôtures 31 décembre), recoupé avec un tableau agrégé de
    // rendements annuels (World of Statistics). 2020-2024 déjà cohérents avec les cours réels
    // (écart < 1 pt) et conservés. 2025 recalculé à partir des clôtures réelles ($93 460 fin
    // 2024 → $87 502 fin 2025, soit -6,4%) : la valeur d'origine (+25%) était erronée. L'ETP
    // CoinShares n'existait pas avant janvier 2021 — c'est le sous-jacent (BTC spot) qui est
    // utilisé ici, en USD (pas de donnée EUR fiable trouvée). Même valeurs répliquées sur les
    // jumeaux WisdomTree/ETC Group/21Shares (cf. BITCOIN_OPTIONS dans theses.js).
    r: [303.0, 60.0, -64.0, 156.0, 121.0, -6.4],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "ethereum", name: "CoinShares Physical Ethereum ETP", cat: "crypto", emoji: "🟠",
    // Source : cours ETH/USD (clôtures 31 décembre, Kraken). 2020-2024 déjà cohérents avec les
    // cours réels (écart < 1,5 pt) et conservés. 2025 recalculé/vérifié : les sources
    // convergent vers une année négative (-11% à -13% selon la source ; -12% retenu ici) après
    // un fort repli en fin d'année — la valeur d'origine (+15%) était erronée. Sous-jacent ETH
    // spot en USD utilisé, l'ETP CoinShares n'existant pas avant mars 2021 (pas de donnée EUR
    // fiable trouvée).
    r: [469.0, 399.0, -67.0, 91.0, 47.0, -12.0],
    desc: [
      "la deuxième plus grande cryptomonnaie, socle de nombreuses applications décentralisées.",
      "encore plus volatil que le bitcoin sur certaines périodes, avec des cycles très marqués.",
      "un actif spéculatif à forte amplitude, à réserver à une poche satellite du portefeuille.",
    ],
  },

  // ── ⚪ Immobilier ────────────────────────────────────────
  {
    id: "scpi", name: "SCPI (rendement générique)", cat: "immobilier", emoji: "⚪",
    // Source : rendement global ASPIM (taux de distribution + variation de la valeur de
    // réalisation des parts, pas seulement la distribution), années 2020-2025 : 2020 = 5,30%
    // (distribution 4,18% + revalorisation +1,12%) ; 2021 = 5,85% (RGI, 4,49% + 1,36%) ; 2022 ≈
    // 2,0% (4,53% de distribution, -2,44% de valeur) ; 2023 = -5,78% (confirmé, chute de -10,3%
    // des valeurs de réalisation) ; 2024 = -1,1% (confirmé) ; 2025 = +1,46% (confirmé, ASPIM
    // T4 2025).
    r: [5.30, 5.85, 2.0, -5.78, -1.1, 1.46],
    desc: [
      "de l'immobilier locatif mutualisé (bureaux, commerces...), avec un rendement historiquement régulier.",
      "a traversé une période difficile en 2023-2024 avec la baisse de valorisation du parc immobilier.",
      "un support prisé en assurance-vie ou en direct pour générer des revenus complémentaires.",
    ],
  },
  {
    id: "foncieres_etf", name: "Amundi FTSE EPRA NAREIT Global UCITS ETF", cat: "immobilier", emoji: "⚪",
    distributing: false,
    // Source : FTSE EPRA Nareit Global Developed Index, total return EUR (dividendes réinvestis),
    // années 2020-2024 vérifiées précisément. 2025 (+10,7%) recoupé indépendamment via un chiffre
    // Nareit "FTSE EPRA Nareit Developed +10.7% en 2025" (devise non précisée sur cette source,
    // mais cohérent avec la valeur déjà présente). Remplace une précédente série qui ne
    // correspondait à aucune donnée réelle trouvable (l'ancien -24,4% de 2022 ne correspondait ni
    // au total return EUR (-20,18%) ni même au price return USD (-21,62%) de l'indice).
    r: [-16.55, 35.67, -20.18, 5.96, 7.68, 10.7],
    desc: [
      "des sociétés immobilières cotées en Bourse : bureaux, entrepôts, commerces, logistique.",
      "beaucoup plus liquide que la pierre-papier classique, mais aussi plus volatil.",
      "distribue généralement une grande partie de ses revenus sous forme de dividendes.",
    ],
  },
  {
    // Jumeau distribuant de "foncieres_etf" (part Dist, vérifiée réelle, réservée au profil
    // Rentier — cf. DIST_TWINS et Rentier dans theses.js) : même sous-jacent (FTSE EPRA Nareit
    // Global Developed), seule la politique de distribution change.
    id: "foncieres_etf_dist", name: "Amundi FTSE EPRA NAREIT Global UCITS ETF Dist", cat: "immobilier", emoji: "⚪",
    distributing: true,
    r: [-16.55, 35.67, -20.18, 5.96, 7.68, 10.7],
    desc: [
      "des sociétés immobilières cotées en Bourse : bureaux, entrepôts, commerces, logistique.",
      "beaucoup plus liquide que la pierre-papier classique, mais aussi plus volatil.",
      "distribue généralement une grande partie de ses revenus sous forme de dividendes.",
    ],
  },

  // ── 🟣 Dividendes ────────────────────────────────────────
  {
    id: "strat_dividendes", name: "SPDR S&P Global Dividend Aristocrats UCITS ETF", cat: "dividendes", emoji: "🟣",
    distributing: false,
    // Source : performance annuelle réelle du fonds SPDR S&P Global Dividend Aristocrats UCITS
    // ETF, années 2020-2025 (méthodologie « Quality Income Index » depuis février 2020).
    r: [-9.11, 15.21, -6.53, 7.13, 7.41, 17.55],
    desc: [
      "des entreprises qui versent (et augmentent) leur dividende depuis des années : profil plutôt défensif.",
      "recherché pour générer un revenu régulier en plus de la performance en capital.",
      "a tendance à mieux résister lors des phases de baisse des marchés.",
    ],
  },
  {
    // Jumeau distribuant de "strat_dividendes" — le fonds SPDR existe en version Dist (paiement
    // trimestriel), vérifié réel, réservé au profil Rentier.
    id: "strat_dividendes_dist", name: "SPDR S&P Global Dividend Aristocrats UCITS ETF Dist", cat: "dividendes", emoji: "🟣",
    distributing: true,
    r: [-9.11, 15.21, -6.53, 7.13, 7.41, 17.55],
    desc: [
      "des entreprises qui versent (et augmentent) leur dividende depuis des années : profil plutôt défensif.",
      "recherché pour générer un revenu régulier en plus de la performance en capital.",
      "a tendance à mieux résister lors des phases de baisse des marchés.",
    ],
  },
  {
    id: "high_dividend", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", cat: "dividendes", emoji: "🟣",
    distributing: false,
    // Source : performance annuelle calendaire réelle du fonds (nette de frais), fiches
    // Vanguard, années 2020-2025. NB : ce fonds existe bien en version Acc (ISIN IE00BK5BR626)
    // ET Dist (IE00B8GKDB10) — contrairement à une hypothèse initiale qui le pensait Dist-only.
    r: [-0.26, 17.88, -5.74, 11.51, 9.39, 26.40],
    desc: [
      "sélectionne les entreprises mondiales au rendement de dividende le plus élevé.",
      "plus large et plus « value » que les aristocrates du dividende, avec un couponnage souvent supérieur.",
      "profite des secteurs traditionnellement généreux en dividendes : énergie, finance, télécoms.",
    ],
  },
  {
    // Jumeau distribuant de "high_dividend" (part Dist, ISIN IE00B8GKDB10, vérifiée réelle),
    // réservé au profil Rentier.
    id: "high_dividend_dist", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF Dist", cat: "dividendes", emoji: "🟣",
    distributing: true,
    r: [-0.26, 17.88, -5.74, 11.51, 9.39, 26.40],
    desc: [
      "sélectionne les entreprises mondiales au rendement de dividende le plus élevé.",
      "plus large et plus « value » que les aristocrates du dividende, avec un couponnage souvent supérieur.",
      "profite des secteurs traditionnellement généreux en dividendes : énergie, finance, télécoms.",
    ],
  },
  {
    id: "quality_dividend", name: "iShares MSCI World Quality Dividend Advanced UCITS ETF", cat: "dividendes", emoji: "🟣",
    distributing: false,
    // Source : performance annuelle réelle du fonds iShares MSCI World Quality Dividend
    // Advanced UCITS ETF, années 2020-2025. Changement de benchmark le 1er juin 2022 (nom du
    // fonds identique, méthodologie affinée). Nom corrigé pour inclure "Advanced", omis par
    // erreur dans la version précédente (le fonds réel s'appelle bien ainsi).
    r: [0.05, 15.95, -6.87, 17.14, 9.87, 9.76],
    desc: [
      "combine dividende régulier et critères de qualité financière (rentabilité, faible endettement).",
      "vise des entreprises capables de maintenir leur dividende même en période difficile.",
      "un compromis entre le rendement pur et la solidité du bilan des entreprises sélectionnées.",
    ],
  },
  {
    // Jumeau distribuant de "quality_dividend" (part Dist, ISIN IE00BYYHSQ67, vérifiée réelle),
    // réservé au profil Rentier.
    id: "quality_dividend_dist", name: "iShares MSCI World Quality Dividend Advanced UCITS ETF Dist", cat: "dividendes", emoji: "🟣",
    distributing: true,
    r: [0.05, 15.95, -6.87, 17.14, 9.87, 9.76],
    desc: [
      "combine dividende régulier et critères de qualité financière (rentabilité, faible endettement).",
      "vise des entreprises capables de maintenir leur dividende même en période difficile.",
      "un compromis entre le rendement pur et la solidité du bilan des entreprises sélectionnées.",
    ],
  },

  // ── 🟢 Actions développées — styles complémentaires ─────
  {
    id: "sect_semi", name: "VanEck Semiconductor UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : performance annuelle réelle du fonds VanEck Semiconductor UCITS ETF, années
    // 2021-2025. Le fonds ayant été lancé en août 2020, l'année 2020 est approximée par le
    // rendement de l'iShares Semiconductor ETF (SOXX, indice proche mais pas identique),
    // +52,72% sur l'année pleine.
    r: [52.72, 43.56, -34.77, 73.15, 23.16, 50.11],
    desc: [
      "les fabricants de puces qui font tourner smartphones, IA et voitures : ultra-cyclique.",
      "l'un des secteurs les plus volatils de la Bourse, porté par la demande en intelligence artificielle.",
      "de fortes hausses possibles, mais des corrections tout aussi violentes en cas de ralentissement.",
    ],
  },
  // ── Jumeaux de marque ─────────────────────────────────────
  // Même sous-jacent, même performance (métal physique, BTC spot, dette corporate € IG) : seul
  // l'émetteur change. Permet de varier les noms affichés sans jamais inventer un chiffre de
  // performance pour un produit qui, économiquement, est identique à quelques points de base
  // de frais près.
  {
    id: "or_wisdomtree", name: "WisdomTree Physical Gold", cat: "matieres_premieres", emoji: "🟡",
    // Jumeau strict de "or" — même source (cours de l'or spot USD, cf. commentaire ci-dessus).
    r: [25.1, -3.6, -0.4, 13.2, 27.2, 65.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
  },
  {
    id: "or_ishares", name: "iShares Physical Gold ETC", cat: "matieres_premieres", emoji: "🟡",
    // Jumeau strict de "or" — même source (cours de l'or spot USD, cf. commentaire ci-dessus).
    r: [25.1, -3.6, -0.4, 13.2, 27.2, 65.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
  },
  {
    id: "or_amundi", name: "Amundi Physical Gold ETC", cat: "matieres_premieres", emoji: "🟡",
    // Jumeau strict de "or" — même source (cours de l'or spot USD, cf. commentaire ci-dessus).
    r: [25.1, -3.6, -0.4, 13.2, 27.2, 65.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
  },
  {
    id: "bitcoin_wisdomtree", name: "WisdomTree Physical Bitcoin", cat: "crypto", emoji: "🟠",
    // Jumeau strict de "bitcoin" — même source (cours BTC/USD, cf. commentaire ci-dessus).
    r: [303.0, 60.0, -64.0, 156.0, 121.0, -6.4],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "bitcoin_etcgroup", name: "ETC Group Physical Bitcoin", cat: "crypto", emoji: "🟠",
    // Jumeau strict de "bitcoin" — même source (cours BTC/USD, cf. commentaire ci-dessus).
    r: [303.0, 60.0, -64.0, 156.0, 121.0, -6.4],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "bitcoin_21shares", name: "21Shares Bitcoin ETP", cat: "crypto", emoji: "🟠",
    // Jumeau strict de "bitcoin" — même source (cours BTC/USD, cf. commentaire ci-dessus).
    r: [303.0, 60.0, -64.0, 156.0, 121.0, -6.4],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "oblig_corp_amundi", name: "Amundi € Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    // Jumeau strict de "oblig_corp_ig" — même source (cf. commentaire ci-dessus, 2022 vérifié
    // à -13,86%, autres années non vérifiées).
    r: [5.0, -1.0, -13.86, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_corp_vanguard", name: "Vanguard € Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    // Jumeau strict de "oblig_corp_ig" — même source (cf. commentaire ci-dessus, 2022 vérifié
    // à -13,86%, autres années non vérifiées).
    r: [5.0, -1.0, -13.86, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_corp_spdr", name: "SPDR € Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    // Jumeau strict de "oblig_corp_ig" — même source (cf. commentaire ci-dessus, 2022 vérifié
    // à -13,86%, autres années non vérifiées).
    r: [5.0, -1.0, -13.86, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },

  // ── Variantes "monde" — indices proches mais pas strictement identiques : composition et
  // performance propres à chacun (l'ACWI et le FTSE All-World incluent les émergents).
  {
    id: "msci_world_ishares", name: "iShares Core MSCI World UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Jumeau strict de "msci_world" — même source (indice MSCI World EUR net, cf. commentaire
    // ci-dessus).
    r: [6.33, 31.07, -12.78, 19.60, 26.60, 5.35],
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    // Jumeau strict de "msci_world" — même source. Fonds réel vérifié (Amundi PEA Monde (MSCI
    // World) UCITS ETF, ISIN FR001400U5Q4, lancé le 04/03/2025, ticker DCAM — pas "EWLD" comme
    // suggéré initialement) : les 6 années de la série représentent la performance réelle de
    // l'indice répliqué, le fonds lui-même n'existant que depuis 2025.
    id: "msci_world_amundi_pea", name: "Amundi PEA Monde (MSCI World) UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [6.33, 31.07, -12.78, 19.60, 26.60, 5.35],
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    id: "msci_acwi", name: "SPDR MSCI ACWI UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : indice MSCI ACWI (EUR, net de dividendes), fiches MSCI, années 2020-2025.
    r: [6.42, 29.97, -14.72, 18.90, 24.65, 7.89],
    desc: [
      "le MSCI World auquel on ajoute les marchés émergents : une exposition mondiale quasi complète.",
      "une seule ligne pour couvrir l'essentiel de la capitalisation boursière mondiale.",
      "légèrement plus diversifié géographiquement que le World, au prix d'un peu plus de volatilité.",
    ],
  },
  {
    id: "ftse_allworld_vanguard", name: "Vanguard FTSE All-World UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Approximation par l'indice MSCI ACWI en EUR (cf. "msci_acwi" ci-dessus) : une donnée FTSE
    // All-World spécifiquement en EUR n'a pas pu être trouvée de façon fiable (seule une version
    // en USD a été trouvée : +16,0% / +18,3% / -18,1% / +22,0% / +17,2% / +22,6%, non comparable
    // aux autres lignes du fichier qui sont en EUR). Les deux indices (ACWI et FTSE All-World)
    // sont très proches en composition et en performance.
    r: [6.42, 29.97, -14.72, 18.90, 24.65, 7.89],
    desc: [
      "l'équivalent Vanguard du « monde entier en une ligne », émergents compris.",
      "l'un des ETF actions les moins chers du marché, plébiscité pour l'investissement de long terme.",
      "légèrement plus diversifié géographiquement que le World, au prix d'un peu plus de volatilité.",
    ],
  },
  {
    id: "msci_em_amundi", name: "Amundi MSCI Emerging Markets UCITS ETF", cat: "emergents", emoji: "🟤",
    // Jumeau strict de "msci_em" — même source (indice MSCI Emerging Markets EUR net, cf.
    // commentaire ci-dessus).
    r: [8.54, 4.86, -14.85, 6.11, 14.68, 17.76],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  {
    id: "ftse_em_vanguard", name: "Vanguard FTSE Emerging Markets UCITS ETF", cat: "emergents", emoji: "🟤",
    // Source : performance annuelle réelle du fonds Vanguard FTSE Emerging Markets UCITS ETF
    // (part USD, nette de frais), années 2020-2025 — sciemment différente de "msci_em" : le
    // FTSE Emerging Markets a une composition distincte du MSCI EM (ex. la Corée du Sud, classée
    // « développée » par FTSE, « émergente » par MSCI). Base devise : USD, donnée EUR précise
    // non trouvée de façon fiable — à ne pas comparer terme à terme avec les lignes en EUR.
    r: [14.66, -0.66, -17.50, 7.86, 12.06, 25.67],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  {
    id: "msci_em_spdr", name: "SPDR MSCI Emerging Markets UCITS ETF", cat: "emergents", emoji: "🟤",
    // Jumeau strict de "msci_em" — même source (indice MSCI Emerging Markets EUR net, cf.
    // commentaire sur "msci_em" plus haut).
    r: [8.54, 4.86, -14.85, 6.11, 14.68, 17.76],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  // ── 🔵 Obligataire — durée courte ────────────────────────
  {
    id: "oblig_etat_eur_short", name: "iShares € Govt Bond 1-3yr UCITS ETF", cat: "obligataire", emoji: "🔵",
    // NON VÉRIFIÉ : aucune donnée annuelle fiable trouvée malgré plusieurs recherches (fiches
    // BlackRock/iShares non exploitables via les résultats de recherche disponibles). Valeurs
    // d'origine conservées intégralement.
    r: [1.5, -0.8, -4.5, 3.0, 3.2, 3.0],
    desc: [
      "de la dette d'État de la zone euro à très courte échéance : la version la moins sensible aux taux.",
      "sa faible durée l'a protégé d'une bonne partie du choc de taux subi par les obligations longues en 2022.",
      "un quasi-équivalent de trésorerie rémunérée, mais 100% européen.",
    ],
  },

  // ── 🟢 Europe — styles complémentaires ───────────────────
  {
    id: "tech_europe", name: "iShares MSCI Europe Information Technology Sector UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // NON VÉRIFIÉ : les recherches menées pour cet indice sectoriel n'ont renvoyé que des
    // données dupliquées par erreur avec l'indice MSCI Europe large (non spécifiques au secteur
    // technologie). Valeurs d'origine conservées intégralement.
    r: [5.0, 15.0, -25.0, 20.0, 10.0, 12.0],
    desc: [
      "la technologie européenne : un secteur beaucoup plus restreint qu'aux États-Unis, mais bien réel.",
      "ASML, SAP, Dassault Systèmes... les rares géants tech du continent réunis en une ligne.",
      "plus volatil que l'indice européen large, pour une thèse qui reste 100% régionale.",
    ],
  },
  {
    id: "smallcap_europe", name: "iShares MSCI Europe Small Cap UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // Source : performance annuelle réelle de l'iShares MSCI Europe Small-Cap ETF (part USD,
    // cotée aux États-Unis, IEUS — même indice sous-jacent que la version UCITS EUR, mais
    // devise différente ; une donnée EUR spécifique n'a pas pu être trouvée de façon fiable),
    // années 2020-2025.
    r: [13.84, 14.75, -26.94, 16.63, -1.06, 31.49],
    desc: [
      "des petites capitalisations européennes, plus proches de l'économie réelle du continent.",
      "un potentiel de croissance supérieur aux grandes valeurs, sans sortir de la logique 100% Europe.",
      "moins suivi par les analystes internationaux, donc parfois sous-évalué.",
    ],
  },
  {
    id: "sect_energie", name: "iShares S&P 500 Energy Sector UCITS ETF", cat: "actions_larges", emoji: "🟢",
    // NON VÉRIFIÉ précisément : les recherches ont renvoyé des chiffres incohérents (dont un
    // signe manifestement erroné pour 2020, où le secteur énergie a en réalité fortement chuté
    // suite au choc pétrolier Covid). Les valeurs d'origine restent conformes à l'ordre de
    // grandeur largement documenté du secteur S&P 500 Énergie sur la période (krach 2020,
    // rebond 2021-2022 lié au choc gazier/pétrolier, tassement depuis) mais n'ont pas pu être
    // confirmées précisément via les outils de recherche disponibles — valeurs d'origine
    // conservées intégralement.
    r: [-34.0, 48.0, 59.0, -2.0, 5.0, -3.0],
    desc: [
      "pétrolières et gazières : un secteur ultra-cyclique, très lié au prix du baril.",
      "a connu l'une des pires années boursières en 2020... puis l'une des meilleures en 2022.",
      "un baromètre direct des tensions géopolitiques et de la demande énergétique mondiale.",
    ],
  },

  // ── 🟣 Revenu — covered call ──────────────────────────────
  // JEPQ (lancé en 2022) : les rendements 2020-2021 sont estimés à partir du profil de la
  // stratégie (vente d'options d'achat sur le Nasdaq — hausse plafonnée, baisse amortie par la
  // prime), pas des données réelles du fonds. Comme le reste de la bibliothèque, chiffres
  // illustratifs à corriger si besoin.
  {
    id: "jepq", name: "JPMorgan Nasdaq Equity Premium Income UCITS ETF (JEPQ)", cat: "dividendes", emoji: "🟣",
    // Source pour 2022-2025 : performance annuelle réelle du fonds JEPQ (part US, JPMorgan),
    // années 2023 à 2025 en année pleine ; 2022 = rendement réel mais partiel (fonds lancé le
    // 4 mai 2022, -13% de l'inception à fin décembre 2022 — pas une année calendaire complète).
    // 2020 et 2021 : estimations conservées inchangées (fonds inexistant, cf. commentaire de
    // section ci-dessus).
    r: [18.0, 14.0, -13.0, 36.25, 24.86, 15.18],
    desc: [
      "un ETF distribuant mensuel : vend des options d'achat sur le Nasdaq pour générer un revenu élevé.",
      "environ 9-10% de rendement annualisé, au prix d'une hausse plafonnée en marché très haussier.",
      "amortit une partie des baisses grâce aux primes encaissées, sans jamais les annuler complètement.",
    ],
  },
];

export function getAsset(id) {
  return ASSETS.find((a) => a.id === id);
}
