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

  // ── 🟢 Actions développées ─────────────────────────────
  {
    id: "msci_world", name: "Amundi MSCI World UCITS ETF", cat: "actions_larges", emoji: "🟢",
    r: [14.0, 20.0, -19.0, 21.0, 17.0, 12.0],
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
];

export function getAsset(id) {
  return ASSETS.find((a) => a.id === id);
}
