// Bibliothèque d'actifs — rendements annuels approximatifs 2020-2025 (indices/ETF représentatifs,
// devise locale, dividendes non systématiquement réinvestis). Données illustratives, éditables à la main.
// r = [2020, 2021, 2022, 2023, 2024, 2025]

export const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];

export const CATEGORIES = {
  obligataire: { label: "Sécurité / Obligataire", emoji: "🔵" },
  actions_larges: { label: "Actions larges / mondiales", emoji: "🟢" },
  sectoriel: { label: "Sectoriel", emoji: "🟡" },
  strategique: { label: "ETF stratégique", emoji: "🟣" },
  matieres_premieres: { label: "Matières premières & métaux", emoji: "🟠" },
  crypto: { label: "Crypto", emoji: "🟤" },
  immobilier: { label: "Immobilier", emoji: "⚪" },
};

export const ASSETS = [
  // ── Sécurité / Obligataire ──────────────────────────────
  {
    id: "fonds_euros", name: "Fonds euros (assurance-vie)", cat: "obligataire", risk: 1,
    r: [1.3, 1.1, 1.6, 2.6, 2.9, 2.7],
    desc: [
      "le socle sécuritaire des assurances-vie : capital garanti, rendement modeste mais stable.",
      "le matelas de sécurité du portefeuille : pas de sensation forte, mais on ne perd (presque) jamais.",
      "le support préféré des épargnants prudents : liquidité et garantie du capital avant tout.",
      "l'équivalent d'un compte qui rapporte un peu plus qu'un livret, sans risque de perte en capital.",
    ],
  },
  {
    id: "oblig_etat_eur", name: "iShares Core € Govt Bond UCITS ETF", cat: "obligataire", risk: 2,
    r: [4.5, -2.5, -18.0, 7.0, 1.5, 3.0],
    desc: [
      "prête de l'argent aux États de la zone euro (France, Allemagne...) contre un intérêt régulier.",
      "sensible aux taux d'intérêt : quand la BCE relève ses taux, ce type d'ETF encaisse (2022 en est l'exemple).",
      "un pilier classique de diversification, censé amortir les chocs boursiers.",
      "le contraire d'un actif spectaculaire : de la dette publique européenne, jugée très sûre.",
    ],
  },
  {
    id: "oblig_etat_us", name: "iShares $ Treasury Bond 7-10yr UCITS ETF", cat: "obligataire", risk: 2,
    r: [8.0, -2.3, -12.0, 4.0, 0.5, 4.0],
    desc: [
      "de la dette de l'État américain, considérée comme l'un des actifs les plus sûrs au monde.",
      "attention : converti en euros, le résultat dépend aussi du taux de change dollar/euro.",
      "un baromètre des anticipations de taux de la Fed, à observer même sans en détenir.",
      "un pilier de diversification internationale, complémentaire des obligations européennes.",
    ],
  },
  {
    id: "oblig_corp_ig", name: "iShares Core € Corp Bond UCITS ETF", cat: "obligataire", risk: 2,
    r: [5.0, -1.0, -13.0, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
      "un outil de diversification obligataire classique, sensible aux mouvements de taux.",
    ],
  },
  {
    id: "oblig_hy", name: "iShares € High Yield Corp Bond UCITS ETF", cat: "obligataire", risk: 3,
    r: [4.0, 3.5, -11.0, 12.0, 8.0, 7.0],
    desc: [
      "des obligations d'entreprises plus fragiles, donc mieux rémunérées mais plus risquées.",
      "le compartiment obligataire le plus volatil : du rendement, mais un vrai risque de défaut.",
      "surnommé « junk bonds » : plus de coupon en échange d'un risque de crédit plus élevé.",
      "se comporte parfois presque comme une action en période de stress sur les marchés.",
    ],
  },
  {
    id: "oblig_em", name: "iShares J.P. Morgan $ EM Bond UCITS ETF", cat: "obligataire", risk: 3,
    r: [3.0, -2.0, -15.0, 9.0, 4.0, 6.0],
    desc: [
      "de la dette d'États émergents (Brésil, Indonésie...), plus rémunératrice mais plus incertaine.",
      "exposé au risque de change et au risque politique des pays émetteurs.",
      "un moyen de diversifier géographiquement sa poche obligataire, avec plus de volatilité.",
      "un compartiment souvent boudé en période de stress sur les marchés mondiaux.",
    ],
  },

  // ── Actions larges / mondiales ─────────────────────────
  {
    id: "msci_world", name: "Amundi MSCI World UCITS ETF", cat: "actions_larges", risk: 3,
    r: [14.0, 20.0, -19.0, 21.0, 17.0, 12.0],
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support : la référence de la diversification actions.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "très concentré sur les États-Unis (plus de 65 % de l'indice), à garder en tête.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    id: "msci_acwi", name: "SPDR MSCI ACWI UCITS ETF", cat: "actions_larges", risk: 3,
    r: [14.0, 17.0, -18.0, 20.0, 16.0, 11.0],
    desc: [
      "le MSCI World auquel on ajoute les marchés émergents : une exposition mondiale quasi complète.",
      "une seule ligne pour couvrir l'essentiel de la capitalisation boursière mondiale.",
      "légèrement plus diversifié géographiquement que le World, au prix d'un peu plus de volatilité.",
      "pensé pour les investisseurs qui veulent « acheter le monde entier » en un clic.",
    ],
  },
  {
    id: "sp500", name: "Amundi PEA S&P 500 UCITS ETF", cat: "actions_larges", risk: 3,
    r: [16.0, 27.0, -19.0, 24.0, 23.0, 14.0],
    desc: [
      "les 500 plus grandes entreprises cotées aux États-Unis, tirées par la tech ces dernières années.",
      "l'indice le plus suivi au monde, souvent utilisé comme référence absolue de performance.",
      "fortement concentré sur une poignée de méga-capitalisations technologiques.",
      "un pari implicite sur la capacité des entreprises américaines à rester leaders mondiaux.",
    ],
    tags: ["us"],
  },
  {
    id: "nasdaq100", name: "Amundi PEA Nasdaq-100 UCITS ETF", cat: "actions_larges", risk: 4,
    r: [44.0, 26.0, -33.0, 53.0, 25.0, 10.0],
    desc: [
      "les 100 plus grandes entreprises non financières du Nasdaq : très orienté technologie.",
      "capable de fortes hausses... et de chutes tout aussi marquées (voir 2022).",
      "concentré sur des géants comme Apple, Microsoft ou Nvidia : un pari sur l'innovation US.",
      "un des supports les plus volatils parmi les grands indices actions.",
    ],
    tags: ["us", "tech"],
  },
  {
    id: "eurostoxx50", name: "Amundi Core EURO STOXX 50 UCITS ETF", cat: "actions_larges", risk: 3,
    r: [-5.0, 21.0, -12.0, 19.0, 8.0, 10.0],
    desc: [
      "les 50 plus grandes entreprises de la zone euro, dont LVMH, TotalEnergies ou SAP.",
      "souvent éligible au PEA, ce qui en fait un classique pour les investisseurs français.",
      "moins dynamique que les indices américains sur la période, mais plus proche de l'économie réelle européenne.",
      "un bon indicateur de la santé économique de la zone euro dans son ensemble.",
    ],
    tags: ["europe"],
  },
  {
    id: "cac40", name: "Amundi CAC 40 UCITS ETF", cat: "actions_larges", risk: 3,
    r: [-7.0, 28.0, -9.0, 16.0, -2.0, 6.0],
    desc: [
      "les 40 plus grosses capitalisations françaises, de LVMH à TotalEnergies en passant par L'Oréal.",
      "éligible au PEA, avec une fiscalité avantageuse après 5 ans de détention en France.",
      "très exposé au luxe et à l'industrie, moins à la tech que les indices américains.",
      "un classique du portefeuille « patriote » des investisseurs particuliers français.",
    ],
    tags: ["europe"],
  },
  {
    id: "msci_em", name: "iShares Core MSCI EM IMI UCITS ETF", cat: "actions_larges", risk: 4,
    r: [15.0, -4.0, -22.0, 7.0, 5.0, 14.0],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
      "un pari sur le rattrapage économique des pays en développement sur le long terme.",
    ],
  },
  {
    id: "msci_europe", name: "iShares Core MSCI Europe UCITS ETF", cat: "actions_larges", risk: 3,
    r: [-3.0, 23.0, -12.0, 14.0, 7.0, 9.0],
    desc: [
      "une exposition large aux grandes entreprises européennes, au-delà de la seule zone euro.",
      "inclut le Royaume-Uni et la Suisse en plus de la zone euro : diversification géographique intéressante.",
      "moins spectaculaire que les indices américains, mais valorisé plus modestement.",
      "un bon complément pour ne pas dépendre uniquement des marchés américains.",
    ],
    tags: ["europe"],
  },
  {
    id: "ftse100", name: "iShares Core FTSE 100 UCITS ETF", cat: "actions_larges", risk: 3,
    r: [-14.0, 14.0, 0.9, 3.8, 5.7, 8.0],
    desc: [
      "les 100 plus grandes entreprises cotées à Londres, riches en pétrolières, minières et banques.",
      "un profil « value » assumé : moins de croissance, plus de dividendes.",
      "peu exposé à la technologie, ce qui explique sa relative stabilité en 2022.",
      "un indice historique, souvent perçu comme défensif face aux indices américains.",
    ],
  },
  {
    id: "nikkei225", name: "iShares Nikkei 225 UCITS ETF", cat: "actions_larges", risk: 3,
    r: [16.0, 4.9, -9.4, 28.0, 19.0, 7.0],
    desc: [
      "les 225 plus grandes entreprises cotées à Tokyo, portées par le renouveau de la Bourse japonaise.",
      "profite d'une politique monétaire longtemps très accommodante et d'un yen faible.",
      "un marché longtemps délaissé par les investisseurs, revenu en grâce depuis 2023.",
      "une diversification géographique bienvenue, décorrélée des cycles américains.",
    ],
  },

  // ── Sectoriel ────────────────────────────────────────
  {
    id: "sect_tech", name: "iShares S&P 500 Information Technology Sector UCITS ETF", cat: "sectoriel", risk: 4,
    r: [43.0, 30.0, -32.0, 50.0, 30.0, 12.0],
    desc: [
      "concentre le portefeuille sur les entreprises technologiques mondiales : fort potentiel, forte volatilité.",
      "logiciels, cloud, matériel informatique... le moteur de croissance des marchés depuis 15 ans.",
      "un pari assumé sur la poursuite de la révolution numérique.",
      "capable de doubler en un an... comme de perdre un tiers de sa valeur l'année suivante.",
    ],
    tags: ["tech"],
  },
  {
    id: "sect_semi", name: "VanEck Semiconductor UCITS ETF", cat: "sectoriel", risk: 5,
    r: [50.0, 40.0, -35.0, 65.0, 35.0, 8.0],
    desc: [
      "les fabricants de puces qui font tourner smartphones, IA et voitures : ultra-cyclique.",
      "l'un des secteurs les plus volatils de la Bourse, porté par la demande en intelligence artificielle.",
      "un pari sur une poignée d'acteurs clés dont dépend toute l'industrie technologique mondiale.",
      "de fortes hausses possibles, mais des corrections tout aussi violentes en cas de ralentissement.",
    ],
    tags: ["tech"],
  },
  {
    id: "sect_sante", name: "iShares S&P 500 Health Care Sector UCITS ETF", cat: "sectoriel", risk: 3,
    r: [13.0, 19.0, -3.0, 2.0, 5.0, 9.0],
    desc: [
      "laboratoires pharmaceutiques et biotech : un secteur réputé plus défensif, porté par le vieillissement démographique.",
      "moins corrélé aux cycles économiques classiques, mais sensible aux décisions réglementaires.",
      "un secteur de long terme, porté par l'innovation médicale et le vieillissement de la population.",
      "traverse généralement mieux les crises boursières que les secteurs cycliques.",
    ],
  },
  {
    id: "sect_energie", name: "iShares S&P 500 Energy Sector UCITS ETF", cat: "sectoriel", risk: 4,
    r: [-34.0, 48.0, 59.0, -2.0, 5.0, -3.0],
    desc: [
      "pétrolières et gazières : un secteur ultra-cyclique, très lié au prix du baril.",
      "a connu l'une des pires années boursières en 2020... puis l'une des meilleures en 2022.",
      "un baromètre direct des tensions géopolitiques et de la demande énergétique mondiale.",
      "un secteur qui divise entre logique de rendement à court terme et transition énergétique de long terme.",
    ],
  },
  {
    id: "sect_finance", name: "iShares S&P 500 Financials Sector UCITS ETF", cat: "sectoriel", risk: 3,
    r: [-5.0, 32.0, -12.0, 12.0, 28.0, 15.0],
    desc: [
      "banques et assurances : un secteur qui profite généralement de la hausse des taux d'intérêt.",
      "très sensible aux décisions des banques centrales et à la santé du crédit.",
      "un secteur cyclique, parmi les premiers touchés en cas de crise financière.",
      "a connu un net regain depuis la remontée des taux post-2022.",
    ],
  },
  {
    id: "sect_industrie", name: "iShares S&P 500 Industrials Sector UCITS ETF", cat: "sectoriel", risk: 3,
    r: [11.0, 21.0, -13.0, 18.0, 17.0, 10.0],
    desc: [
      "machines, transport, construction : le secteur qui fait tourner l'économie physique.",
      "profite des grands plans d'investissement dans les infrastructures et la réindustrialisation.",
      "un secteur cyclique, sensible à la croissance économique mondiale.",
      "regroupe des entreprises souvent moins médiatiques mais essentielles à l'économie réelle.",
    ],
  },
  {
    id: "sect_conso_discr", name: "iShares S&P 500 Consumer Discretionary Sector UCITS ETF", cat: "sectoriel", risk: 4,
    r: [33.0, 24.0, -37.0, 42.0, 2.0, 9.0],
    desc: [
      "distribution, automobile, loisirs : les achats « non essentiels », très sensibles au pouvoir d'achat.",
      "un secteur cyclique qui souffre en premier quand les ménages réduisent leurs dépenses.",
      "porté par le e-commerce et la reprise de la consommation post-2020.",
      "l'un des secteurs les plus volatils car directement lié au moral des ménages.",
    ],
  },
  {
    id: "sect_conso_base", name: "iShares S&P 500 Consumer Staples Sector UCITS ETF", cat: "sectoriel", risk: 2,
    r: [7.0, 14.0, -2.0, 2.0, 5.0, 6.0],
    desc: [
      "alimentation, hygiène, produits du quotidien : un secteur réputé très défensif.",
      "les gens continuent d'acheter du dentifrice même en récession : d'où sa stabilité relative.",
      "moins de performance en période de hausse, mais moins de dégâts en période de crise.",
      "un classique des portefeuilles prudents à la recherche de stabilité.",
    ],
  },
  {
    id: "sect_utilities", name: "iShares S&P 500 Utilities Sector UCITS ETF", cat: "sectoriel", risk: 2,
    r: [0.5, 14.0, 1.0, -7.0, 23.0, 11.0],
    desc: [
      "eau, électricité, gaz : des besoins essentiels, réputés stables et souvent bien rémunérés en dividendes.",
      "un secteur régulé, moins soumis aux à-coups économiques que la moyenne du marché.",
      "de plus en plus lié aux besoins en électricité de l'intelligence artificielle et des data centers.",
      "un secteur défensif classique, apprécié pour ses dividendes réguliers.",
    ],
  },
  {
    id: "sect_reit", name: "iShares European Property Yield UCITS ETF", cat: "sectoriel", risk: 3,
    r: [-8.0, 40.0, -26.0, 12.0, 5.0, 8.0],
    desc: [
      "des sociétés foncières européennes cotées en Bourse : accès à l'immobilier sans acheter de mur directement.",
      "très sensible aux taux d'intérêt : la hausse des taux 2022 lui a fait mal.",
      "plus liquide qu'un investissement immobilier classique, mais aussi plus volatil.",
      "distribue généralement une grande partie de ses revenus sous forme de dividendes.",
    ],
  },

  // ── ETF stratégiques ─────────────────────────────────
  {
    id: "strat_6040", name: "Allocation 60/40 (Amundi MSCI World + iShares Core € Govt Bond)", cat: "strategique", risk: 2,
    r: [11.0, 10.0, -16.0, 14.0, 11.0, 9.0],
    desc: [
      "un mix classique 60 % actions / 40 % obligations à composer soi-même (il n'existe pas d'ETF « 60/40 » unique), pour simplifier la logique.",
      "l'allocation la plus enseignée en finance personnelle, entre croissance et stabilité.",
      "a pourtant souffert en 2022, année où actions et obligations ont chuté ensemble.",
      "pensé pour lisser les variations sans renoncer totalement à la performance des actions.",
    ],
  },
  {
    id: "strat_smallcap", name: "iShares MSCI World Small Cap UCITS ETF", cat: "strategique", risk: 4,
    r: [12.0, 18.0, -18.0, 14.0, 9.0, 11.0],
    desc: [
      "des petites capitalisations boursières, avec un potentiel de croissance supérieur aux grandes entreprises.",
      "historiquement plus performantes sur le très long terme, mais avec plus de volatilité.",
      "moins suivies par les analystes, donc parfois sous-évaluées... ou sur-risquées.",
      "un pari sur les futures grandes entreprises de demain.",
    ],
  },
  {
    id: "strat_dividendes", name: "SPDR S&P Global Dividend Aristocrats UCITS ETF", cat: "strategique", risk: 2,
    r: [-2.0, 18.0, -3.0, 8.0, 12.0, 9.0],
    desc: [
      "des entreprises qui versent (et augmentent) leur dividende depuis des années : profil plutôt défensif.",
      "recherché pour générer un revenu régulier en plus de la performance en capital.",
      "a tendance à mieux résister lors des phases de baisse des marchés.",
      "un classique des portefeuilles orientés « revenu » plutôt que pure croissance.",
    ],
  },
  {
    id: "strat_esg", name: "Amundi MSCI World SRI UCITS ETF", cat: "strategique", risk: 3,
    r: [16.0, 19.0, -20.0, 19.0, 15.0, 10.0],
    desc: [
      "des grandes entreprises mondiales filtrées selon des critères environnementaux, sociaux et de gouvernance.",
      "exclut généralement l'armement, le tabac ou les énergies fossiles selon les critères retenus.",
      "un profil de performance assez proche du MSCI World, avec une composition légèrement différente.",
      "répond à une demande croissante d'investissement aligné avec ses valeurs.",
    ],
  },

  // ── Matières premières & métaux ─────────────────────
  {
    id: "or", name: "Invesco Physical Gold ETC", cat: "matieres_premieres", risk: 2,
    r: [21.0, -4.0, -1.0, 13.0, 27.0, 30.0],
    desc: [
      "la valeur refuge par excellence, recherchée en période d'inflation ou d'incertitude géopolitique.",
      "ne verse aucun revenu, mais joue historiquement un rôle d'assurance dans un portefeuille.",
      "a connu un rallye impressionnant depuis 2023, porté par les achats des banques centrales.",
      "peu corrélé aux actions, ce qui en fait un outil de diversification apprécié.",
    ],
    tags: ["antiinflation"],
  },
  {
    id: "argent", name: "iShares Physical Silver ETC", cat: "matieres_premieres", risk: 3,
    r: [47.0, -12.0, 3.0, -1.0, 21.0, 25.0],
    desc: [
      "souvent surnommé « l'or du pauvre », plus volatil que l'or car aussi utilisé dans l'industrie.",
      "profite à la fois de la demande refuge et de la demande industrielle (électronique, panneaux solaires).",
      "un actif plus spéculatif que l'or, avec des variations plus marquées dans les deux sens.",
      "un petit marché comparé à l'or, ce qui amplifie sa volatilité.",
    ],
    tags: ["antiinflation"],
  },
  {
    id: "mp_large", name: "Invesco Bloomberg Commodity UCITS ETF", cat: "matieres_premieres", risk: 3,
    r: [-3.0, 27.0, 16.0, -7.0, 5.0, 12.0],
    desc: [
      "un panier diversifié : énergie, métaux, agriculture réunis en une seule ligne.",
      "réputé pour bien se comporter en période d'inflation élevée, comme en 2021-2022.",
      "peu corrélé aux actions et obligations, un bon outil de diversification globale.",
      "sa performance dépend d'un ensemble de marchés très différents les uns des autres.",
    ],
    tags: ["antiinflation"],
  },
  {
    id: "petrole", name: "WisdomTree Brent Crude Oil ETC", cat: "matieres_premieres", risk: 4,
    r: [-21.0, 55.0, 10.0, -11.0, 2.0, -6.0],
    desc: [
      "suit le cours du pétrole, extrêmement sensible aux tensions géopolitiques et à l'offre de l'OPEP+.",
      "l'un des actifs les plus imprévisibles : passé sous zéro en 2020, en flèche en 2021-2022.",
      "un pari direct sur la demande énergétique mondiale, en tension avec la transition écologique.",
      "à manier avec précaution tant sa volatilité peut être extrême.",
    ],
  },

  // ── Crypto ───────────────────────────────────────────
  {
    id: "bitcoin", name: "CoinShares Physical Bitcoin ETP", cat: "crypto", risk: 5,
    r: [303.0, 60.0, -64.0, 156.0, 121.0, 25.0],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "de plus en plus intégré aux portefeuilles institutionnels via les ETF spot depuis 2024.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "ethereum", name: "CoinShares Physical Ethereum ETP", cat: "crypto", risk: 5,
    r: [469.0, 399.0, -67.0, 91.0, 47.0, 15.0],
    desc: [
      "la deuxième plus grande cryptomonnaie, socle de nombreuses applications décentralisées.",
      "encore plus volatil que le bitcoin sur certaines périodes, avec des cycles très marqués.",
      "sa valeur dépend aussi de l'usage de son réseau (contrats intelligents, finance décentralisée).",
      "un actif spéculatif à forte amplitude, à réserver à une poche satellite du portefeuille.",
    ],
  },

  // ── Immobilier ───────────────────────────────────────
  {
    id: "scpi", name: "SCPI (rendement générique)", cat: "immobilier", risk: 2,
    r: [4.2, 4.5, 4.5, -6.0, -3.0, 2.0],
    desc: [
      "de l'immobilier locatif mutualisé (bureaux, commerces...), avec un rendement historiquement régulier.",
      "a traversé une période difficile en 2023-2024 avec la baisse de valorisation du parc immobilier.",
      "moins liquide qu'un ETF : la revente des parts peut prendre du temps.",
      "un support prisé en assurance-vie ou en direct pour générer des revenus complémentaires.",
    ],
  },
  {
    id: "foncieres_etf", name: "Amundi FTSE EPRA NAREIT Global UCITS ETF", cat: "immobilier", risk: 3,
    r: [-10.0, 35.0, -25.0, 10.0, 4.0, 7.0],
    desc: [
      "des sociétés immobilières cotées en Bourse : bureaux, entrepôts, commerces, logistique.",
      "beaucoup plus liquide que la pierre-papier classique, mais aussi plus volatil.",
      "très sensible aux mouvements de taux d'intérêt, à la hausse comme à la baisse.",
      "permet de s'exposer à l'immobilier sans les contraintes de gestion d'un bien en direct.",
    ],
  },
];

export function getAsset(id) {
  return ASSETS.find((a) => a.id === id);
}
