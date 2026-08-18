// Bibliothèque d'actifs — rendements annuels approximatifs 2020-2025 (fonds réels représentatifs,
// devise locale, dividendes non systématiquement réinvestis). Données illustratives, éditables à la main.
// r = [2020, 2021, 2022, 2023, 2024, 2025]
//
// Roster volontairement resserré (~20 supports) : chaque actif n'existe que parce qu'il a un rôle
// clair dans au moins une thèse de portefeuille (src/theses.js). Pas de ligne "parce qu'il en fallait
// une de plus" — voir CLAUDE.md du projet pour la philosophie de sélection.

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
    r: [1.3, 1.1, 1.6, 2.6, 2.9, 2.7],
    desc: [
      "le socle sécuritaire des assurances-vie : capital garanti, rendement modeste mais stable.",
      "le matelas de sécurité du portefeuille : pas de sensation forte, mais on ne perd (presque) jamais.",
      "le support préféré des épargnants prudents : liquidité et garantie du capital avant tout.",
    ],
  },
  {
    id: "oblig_etat_eur", name: "iShares Core € Govt Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    r: [4.5, -2.5, -18.0, 7.0, 1.5, 3.0],
    desc: [
      "prête de l'argent aux États de la zone euro (France, Allemagne...) contre un intérêt régulier.",
      "sensible aux taux d'intérêt : quand la BCE relève ses taux, ce type d'ETF encaisse (2022 en est l'exemple).",
      "le contraire d'un actif spectaculaire : de la dette publique européenne, jugée très sûre.",
    ],
  },
  {
    id: "oblig_corp_ig", name: "iShares Core € Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    r: [5.0, -1.0, -13.0, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_hy", name: "iShares € High Yield Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    r: [4.0, 3.5, -11.0, 12.0, 8.0, 7.0],
    desc: [
      "des obligations d'entreprises plus fragiles, donc mieux rémunérées : plus de coupon.",
      "le compartiment obligataire le plus généreux en revenu, avec un vrai risque de crédit en face.",
      "verse un coupon nettement supérieur aux obligations d'État, contre un peu plus de risque.",
    ],
  },

  {
    id: "oblig_inflation", name: "iShares € Inflation Linked Govt Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
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
    // 2022 : -12,78% en EUR (net) — performance officielle MSCI World EUR, à ne pas confondre
    // avec le -19% du S&P 500 en USD sur la même année.
    r: [14.0, 20.0, -12.78, 21.0, 17.0, 12.0],
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    id: "sp500", name: "Amundi PEA S&P 500 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [16.0, 27.0, -19.0, 24.0, 23.0, 14.0],
    desc: [
      "les 500 plus grandes entreprises cotées aux États-Unis, tirées par la tech ces dernières années.",
      "l'indice le plus suivi au monde, souvent utilisé comme référence absolue de performance.",
      "un pari implicite sur la capacité des entreprises américaines à rester leaders mondiaux.",
    ],
  },
  {
    id: "nasdaq100", name: "Amundi PEA Nasdaq-100 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [44.0, 26.0, -33.0, 53.0, 25.0, 10.0],
    desc: [
      "les 100 plus grandes entreprises non financières du Nasdaq : très orienté technologie.",
      "concentré sur des géants comme Apple, Microsoft ou Nvidia : un pari sur l'innovation US.",
      "un des supports les plus volatils parmi les grands indices actions.",
    ],
  },
  {
    id: "cac40", name: "Amundi CAC 40 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [-7.0, 28.0, -9.0, 16.0, -2.0, 6.0],
    desc: [
      "les 40 plus grosses capitalisations françaises, de LVMH à TotalEnergies en passant par L'Oréal.",
      "éligible au PEA, avec une fiscalité avantageuse après 5 ans de détention en France.",
      "un classique du portefeuille « patriote » des investisseurs particuliers français.",
    ],
  },
  {
    id: "eurostoxx50", name: "Amundi Core EURO STOXX 50 UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [-5.0, 21.0, -12.0, 19.0, 8.0, 10.0],
    desc: [
      "les 50 plus grandes entreprises de la zone euro, dont LVMH, TotalEnergies ou SAP.",
      "souvent éligible au PEA, ce qui en fait un classique pour les investisseurs français.",
      "un bon indicateur de la santé économique de la zone euro dans son ensemble.",
    ],
  },
  {
    id: "msci_europe", name: "iShares Core MSCI Europe UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [-3.0, 23.0, -12.0, 14.0, 7.0, 9.0],
    desc: [
      "une exposition large aux grandes entreprises européennes, au-delà de la seule zone euro.",
      "inclut le Royaume-Uni et la Suisse en plus de la zone euro : diversification géographique intéressante.",
      "un bon complément pour ne pas dépendre uniquement des marchés américains.",
    ],
  },
  {
    id: "sect_sante", name: "iShares S&P 500 Health Care Sector UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [13.0, 19.0, -3.0, 2.0, 5.0, 9.0],
    desc: [
      "laboratoires pharmaceutiques et biotech : un secteur réputé plus défensif.",
      "moins corrélé aux cycles économiques classiques, mais sensible aux décisions réglementaires.",
      "traverse généralement mieux les crises boursières que les secteurs cycliques.",
    ],
  },

  // ── 🟤 Actions émergentes ──────────────────────────────
  {
    id: "msci_em", name: "iShares Core MSCI EM IMI UCITS ETF", cat: "emergents", emoji: "🟤",
    r: [15.0, -4.0, -22.0, 7.0, 5.0, 14.0],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },

  // ── 🟡 Or ───────────────────────────────────────────────
  {
    id: "or", name: "Invesco Physical Gold ETC", cat: "matieres_premieres", emoji: "🟡",
    r: [21.0, -4.0, -1.0, 13.0, 27.0, 30.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
  },

  // ── 🛢️ Autres matières premières ───────────────────────
  {
    id: "argent", name: "iShares Physical Silver ETC", cat: "matieres_premieres", emoji: "🛢️",
    r: [47.0, -12.0, 3.0, -1.0, 21.0, 25.0],
    desc: [
      "souvent surnommé « l'or du pauvre », plus volatil que l'or car aussi utilisé dans l'industrie.",
      "profite à la fois de la demande refuge et de la demande industrielle.",
      "un actif plus spéculatif que l'or, avec des variations plus marquées dans les deux sens.",
    ],
  },
  {
    id: "mp_large", name: "Invesco Bloomberg Commodity UCITS ETF", cat: "matieres_premieres", emoji: "🛢️",
    r: [-3.0, 27.0, 16.0, -7.0, 5.0, 12.0],
    desc: [
      "un panier diversifié : énergie, métaux, agriculture réunis en une seule ligne.",
      "réputé pour bien se comporter en période d'inflation élevée, comme en 2021-2022.",
      "peu corrélé aux actions et obligations, un bon outil de diversification globale.",
    ],
  },
  {
    id: "petrole", name: "WisdomTree Brent Crude Oil ETC", cat: "matieres_premieres", emoji: "🛢️",
    r: [-21.0, 55.0, 10.0, -11.0, 2.0, -6.0],
    desc: [
      "suit le cours du pétrole, extrêmement sensible aux tensions géopolitiques et à l'offre de l'OPEP+.",
      "l'un des actifs les plus imprévisibles : passé sous zéro en 2020, en flèche en 2021-2022.",
      "à manier avec précaution tant sa volatilité peut être extrême.",
    ],
  },

  // ── 🟠 Crypto ───────────────────────────────────────────
  {
    id: "bitcoin", name: "CoinShares Physical Bitcoin ETP", cat: "crypto", emoji: "🟠",
    r: [303.0, 60.0, -64.0, 156.0, 121.0, 25.0],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "ethereum", name: "CoinShares Physical Ethereum ETP", cat: "crypto", emoji: "🟠",
    r: [469.0, 399.0, -67.0, 91.0, 47.0, 15.0],
    desc: [
      "la deuxième plus grande cryptomonnaie, socle de nombreuses applications décentralisées.",
      "encore plus volatil que le bitcoin sur certaines périodes, avec des cycles très marqués.",
      "un actif spéculatif à forte amplitude, à réserver à une poche satellite du portefeuille.",
    ],
  },

  // ── ⚪ Immobilier ────────────────────────────────────────
  {
    id: "scpi", name: "SCPI (rendement générique)", cat: "immobilier", emoji: "⚪",
    r: [4.2, 4.5, 4.5, -6.0, -3.0, 2.0],
    desc: [
      "de l'immobilier locatif mutualisé (bureaux, commerces...), avec un rendement historiquement régulier.",
      "a traversé une période difficile en 2023-2024 avec la baisse de valorisation du parc immobilier.",
      "un support prisé en assurance-vie ou en direct pour générer des revenus complémentaires.",
    ],
  },
  {
    id: "foncieres_etf", name: "Amundi FTSE EPRA NAREIT Global UCITS ETF", cat: "immobilier", emoji: "⚪",
    r: [-10.0, 35.0, -25.0, 10.0, 4.0, 7.0],
    desc: [
      "des sociétés immobilières cotées en Bourse : bureaux, entrepôts, commerces, logistique.",
      "beaucoup plus liquide que la pierre-papier classique, mais aussi plus volatil.",
      "distribue généralement une grande partie de ses revenus sous forme de dividendes.",
    ],
  },

  // ── 🟣 Dividendes ────────────────────────────────────────
  {
    id: "strat_dividendes", name: "SPDR S&P Global Dividend Aristocrats UCITS ETF", cat: "dividendes", emoji: "🟣",
    r: [-2.0, 18.0, -3.0, 8.0, 12.0, 9.0],
    desc: [
      "des entreprises qui versent (et augmentent) leur dividende depuis des années : profil plutôt défensif.",
      "recherché pour générer un revenu régulier en plus de la performance en capital.",
      "a tendance à mieux résister lors des phases de baisse des marchés.",
    ],
  },
  {
    id: "high_dividend", name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", cat: "dividendes", emoji: "🟣",
    r: [-2.0, 16.0, 4.0, 7.0, 11.0, 9.0],
    desc: [
      "sélectionne les entreprises mondiales au rendement de dividende le plus élevé.",
      "plus large et plus « value » que les aristocrates du dividende, avec un couponnage souvent supérieur.",
      "profite des secteurs traditionnellement généreux en dividendes : énergie, finance, télécoms.",
    ],
  },
  {
    id: "quality_dividend", name: "iShares MSCI World Quality Dividend UCITS ETF", cat: "dividendes", emoji: "🟣",
    r: [3.0, 17.0, -8.0, 12.0, 14.0, 10.0],
    desc: [
      "combine dividende régulier et critères de qualité financière (rentabilité, faible endettement).",
      "vise des entreprises capables de maintenir leur dividende même en période difficile.",
      "un compromis entre le rendement pur et la solidité du bilan des entreprises sélectionnées.",
    ],
  },

  // ── 🟢 Actions développées — styles complémentaires ─────
  {
    id: "strat_smallcap", name: "iShares MSCI World Small Cap UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [12.0, 18.0, -18.0, 14.0, 9.0, 11.0],
    desc: [
      "des petites capitalisations boursières, avec un potentiel de croissance supérieur aux grandes entreprises.",
      "historiquement plus performantes sur le très long terme, mais avec plus de volatilité.",
      "un pari sur les futures grandes entreprises de demain, encore peu suivies par les analystes.",
    ],
  },
  {
    id: "sect_semi", name: "VanEck Semiconductor UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [50.0, 40.0, -35.0, 65.0, 35.0, 8.0],
    desc: [
      "les fabricants de puces qui font tourner smartphones, IA et voitures : ultra-cyclique.",
      "l'un des secteurs les plus volatils de la Bourse, porté par la demande en intelligence artificielle.",
      "de fortes hausses possibles, mais des corrections tout aussi violentes en cas de ralentissement.",
    ],
  },
  {
    id: "strat_momentum", name: "iShares Edge MSCI World Momentum Factor UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [15.0, 18.0, -14.0, 18.0, 25.0, 8.0],
    desc: [
      "sélectionne les actions qui montent déjà, en pariant que la tendance se poursuit.",
      "une stratégie qui peut amplifier les tendances de marché, à la hausse comme à la baisse.",
      "change régulièrement de composition selon les tendances de marché en cours.",
    ],
  },
  {
    id: "japan", name: "iShares Core MSCI Japan IMI UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [14.0, 6.0, -3.0, 26.0, 18.0, 8.0],
    desc: [
      "grandes, moyennes et petites capitalisations japonaises réunies en un seul support.",
      "profite du retour en grâce de la Bourse de Tokyo depuis 2023, après des années d'indifférence.",
      "une diversification géographique décorrélée des cycles américains et européens.",
    ],
  },

  // ── 🔵 Obligations complémentaires ───────────────────────
  {
    id: "oblig_short", name: "iShares $ Treasury Bond 1-3yr UCITS ETF", cat: "obligataire", emoji: "🔵",
    r: [3.3, -0.5, -3.8, 4.0, 4.5, 4.2],
    desc: [
      "de la dette d'État américaine à très courte échéance : la version la moins volatile des obligations.",
      "sa faible durée le protège en grande partie des à-coups de taux d'intérêt.",
      "un quasi-équivalent de trésorerie rémunérée, pour une poche de sécurité en dollars.",
    ],
  },
  {
    id: "oblig_global_agg", name: "Vanguard Global Aggregate Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    r: [5.5, -2.0, -12.5, 5.0, 2.0, 3.5],
    desc: [
      "un panier mondial d'obligations d'État et d'entreprises, toutes qualités et zones confondues.",
      "diversifie la poche obligataire au-delà de la seule zone euro.",
      "a lui aussi souffert en 2022 : la hausse des taux touche les obligations partout dans le monde.",
    ],
  },

  // ── 🟤 Actions émergentes — géographies ciblées ──────────
  {
    id: "india", name: "iShares MSCI India UCITS ETF", cat: "emergents", emoji: "🟤",
    r: [15.0, 26.0, 4.0, 20.0, 12.0, 10.0],
    desc: [
      "un pari ciblé sur la croissance démographique et économique indienne.",
      "l'un des marchés émergents les plus réguliers de la période, porté par la consommation intérieure.",
      "moins dépendant des exportations que la Chine, donc un profil de croissance différent.",
    ],
  },
  {
    id: "china", name: "Amundi MSCI China UCITS ETF", cat: "emergents", emoji: "🟤",
    r: [30.0, -22.0, -21.0, -11.0, 15.0, 20.0],
    desc: [
      "un pari ciblé sur la deuxième économie mondiale, avec une volatilité politique bien réelle.",
      "a traversé plusieurs années difficiles (régulation, immobilier) avant d'amorcer un rebond.",
      "concentré sur un seul pays : un risque spécifique bien plus élevé qu'un ETF émergents diversifié.",
    ],
  },

  // ── Jumeaux de marque ─────────────────────────────────────
  // Même sous-jacent, même performance (métal physique, BTC spot, dette corporate € IG) : seul
  // l'émetteur change. Permet de varier les noms affichés sans jamais inventer un chiffre de
  // performance pour un produit qui, économiquement, est identique à quelques points de base
  // de frais près.
  {
    id: "or_wisdomtree", name: "WisdomTree Physical Gold", cat: "matieres_premieres", emoji: "🟡",
    r: [21.0, -4.0, -1.0, 13.0, 27.0, 30.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
  },
  {
    id: "or_ishares", name: "iShares Physical Gold ETC", cat: "matieres_premieres", emoji: "🟡",
    r: [21.0, -4.0, -1.0, 13.0, 27.0, 30.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
  },
  {
    id: "or_amundi", name: "Amundi Physical Gold ETC", cat: "matieres_premieres", emoji: "🟡",
    r: [21.0, -4.0, -1.0, 13.0, 27.0, 30.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
  },
  {
    id: "bitcoin_wisdomtree", name: "WisdomTree Physical Bitcoin", cat: "crypto", emoji: "🟠",
    r: [303.0, 60.0, -64.0, 156.0, 121.0, 25.0],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "bitcoin_etcgroup", name: "ETC Group Physical Bitcoin", cat: "crypto", emoji: "🟠",
    r: [303.0, 60.0, -64.0, 156.0, 121.0, 25.0],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "bitcoin_21shares", name: "21Shares Bitcoin ETP", cat: "crypto", emoji: "🟠",
    r: [303.0, 60.0, -64.0, 156.0, 121.0, 25.0],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "oblig_corp_amundi", name: "Amundi € Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    r: [5.0, -1.0, -13.0, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_corp_vanguard", name: "Vanguard € Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    r: [5.0, -1.0, -13.0, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
    ],
  },
  {
    id: "oblig_corp_spdr", name: "SPDR € Corp Bond UCITS ETF", cat: "obligataire", emoji: "🔵",
    r: [5.0, -1.0, -13.0, 8.0, 3.0, 5.0],
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
    r: [14.0, 20.0, -12.78, 21.0, 17.0, 12.0],
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    id: "msci_acwi", name: "SPDR MSCI ACWI UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [14.0, 17.0, -18.0, 20.0, 16.0, 11.0],
    desc: [
      "le MSCI World auquel on ajoute les marchés émergents : une exposition mondiale quasi complète.",
      "une seule ligne pour couvrir l'essentiel de la capitalisation boursière mondiale.",
      "légèrement plus diversifié géographiquement que le World, au prix d'un peu plus de volatilité.",
    ],
  },
  {
    id: "ftse_allworld_vanguard", name: "Vanguard FTSE All-World UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [14.0, 17.0, -18.0, 20.0, 16.0, 11.0],
    desc: [
      "l'équivalent Vanguard du « monde entier en une ligne », émergents compris.",
      "l'un des ETF actions les moins chers du marché, plébiscité pour l'investissement de long terme.",
      "légèrement plus diversifié géographiquement que le World, au prix d'un peu plus de volatilité.",
    ],
  },
  {
    id: "msci_em_amundi", name: "Amundi MSCI Emerging Markets UCITS ETF", cat: "emergents", emoji: "🟤",
    r: [15.0, -4.0, -22.0, 7.0, 5.0, 14.0],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  {
    id: "ftse_em_vanguard", name: "Vanguard FTSE Emerging Markets UCITS ETF", cat: "emergents", emoji: "🟤",
    r: [15.0, -4.0, -22.0, 7.0, 5.0, 14.0],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  {
    id: "msci_em_spdr", name: "SPDR MSCI Emerging Markets UCITS ETF", cat: "emergents", emoji: "🟤",
    r: [15.0, -4.0, -22.0, 7.0, 5.0, 14.0],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
    ],
  },
  // ── 🔵 Obligataire — durée courte ────────────────────────
  {
    id: "oblig_etat_eur_short", name: "iShares € Govt Bond 1-3yr UCITS ETF", cat: "obligataire", emoji: "🔵",
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
    r: [5.0, 15.0, -25.0, 20.0, 10.0, 12.0],
    desc: [
      "la technologie européenne : un secteur beaucoup plus restreint qu'aux États-Unis, mais bien réel.",
      "ASML, SAP, Dassault Systèmes... les rares géants tech du continent réunis en une ligne.",
      "plus volatil que l'indice européen large, pour une thèse qui reste 100% régionale.",
    ],
  },
  {
    id: "smallcap_europe", name: "iShares MSCI Europe Small Cap UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [10.0, 20.0, -22.0, 16.0, 8.0, 9.0],
    desc: [
      "des petites capitalisations européennes, plus proches de l'économie réelle du continent.",
      "un potentiel de croissance supérieur aux grandes valeurs, sans sortir de la logique 100% Europe.",
      "moins suivi par les analystes internationaux, donc parfois sous-évalué.",
    ],
  },
  {
    id: "sect_energie", name: "iShares S&P 500 Energy Sector UCITS ETF", cat: "actions_larges", emoji: "🟢",
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
    r: [18.0, 14.0, -20.0, 26.0, 16.0, 11.0],
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
