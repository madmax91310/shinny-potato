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
  actions_individuelles: { label: "Actions individuelles", emoji: "🔴" },
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
    id: "oblig_etat_eur", name: "ETF obligations d'État européennes", cat: "obligataire", risk: 2,
    r: [4.5, -2.5, -18.0, 7.0, 1.5, 3.0],
    desc: [
      "prête de l'argent aux États de la zone euro (France, Allemagne...) contre un intérêt régulier.",
      "sensible aux taux d'intérêt : quand la BCE relève ses taux, ce type d'ETF encaisse (2022 en est l'exemple).",
      "un pilier classique de diversification, censé amortir les chocs boursiers.",
      "le contraire d'un actif spectaculaire : de la dette publique européenne, jugée très sûre.",
    ],
  },
  {
    id: "oblig_etat_us", name: "ETF obligations d'État US (Treasuries)", cat: "obligataire", risk: 2,
    r: [8.0, -2.3, -12.0, 4.0, 0.5, 4.0],
    desc: [
      "de la dette de l'État américain, considérée comme l'un des actifs les plus sûrs au monde.",
      "attention : converti en euros, le résultat dépend aussi du taux de change dollar/euro.",
      "un baromètre des anticipations de taux de la Fed, à observer même sans en détenir.",
      "un pilier de diversification internationale, complémentaire des obligations européennes.",
    ],
  },
  {
    id: "oblig_corp_ig", name: "ETF obligations entreprises (investment grade)", cat: "obligataire", risk: 2,
    r: [5.0, -1.0, -13.0, 8.0, 3.0, 5.0],
    desc: [
      "prête de l'argent à de grandes entreprises solides, moyennant un intérêt un peu supérieur à l'État.",
      "un compromis entre la sécurité des obligations d'État et un rendement légèrement meilleur.",
      "regroupe des centaines d'émetteurs notés « investment grade » : risque de défaut jugé faible.",
      "un outil de diversification obligataire classique, sensible aux mouvements de taux.",
    ],
  },
  {
    id: "oblig_hy", name: "ETF obligations high yield", cat: "obligataire", risk: 3,
    r: [4.0, 3.5, -11.0, 12.0, 8.0, 7.0],
    desc: [
      "des obligations d'entreprises plus fragiles, donc mieux rémunérées mais plus risquées.",
      "le compartiment obligataire le plus volatil : du rendement, mais un vrai risque de défaut.",
      "surnommé « junk bonds » : plus de coupon en échange d'un risque de crédit plus élevé.",
      "se comporte parfois presque comme une action en période de stress sur les marchés.",
    ],
  },
  {
    id: "oblig_em", name: "ETF obligations émergentes", cat: "obligataire", risk: 3,
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
    id: "msci_world", name: "ETF MSCI World", cat: "actions_larges", risk: 3,
    r: [14.0, 20.0, -19.0, 21.0, 17.0, 12.0],
    desc: [
      "environ 1500 grandes entreprises de 23 pays développés en un seul support : la référence de la diversification actions.",
      "le point de comparaison classique de tout portefeuille actions dans le monde.",
      "très concentré sur les États-Unis (plus de 65 % de l'indice), à garder en tête.",
      "souvent considéré comme le cœur de portefeuille « simple et efficace » sur le long terme.",
    ],
  },
  {
    id: "msci_acwi", name: "ETF MSCI ACWI (World + émergents)", cat: "actions_larges", risk: 3,
    r: [14.0, 17.0, -18.0, 20.0, 16.0, 11.0],
    desc: [
      "le MSCI World auquel on ajoute les marchés émergents : une exposition mondiale quasi complète.",
      "une seule ligne pour couvrir l'essentiel de la capitalisation boursière mondiale.",
      "légèrement plus diversifié géographiquement que le World, au prix d'un peu plus de volatilité.",
      "pensé pour les investisseurs qui veulent « acheter le monde entier » en un clic.",
    ],
  },
  {
    id: "sp500", name: "ETF S&P 500", cat: "actions_larges", risk: 3,
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
    id: "nasdaq100", name: "ETF Nasdaq 100", cat: "actions_larges", risk: 4,
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
    id: "eurostoxx50", name: "ETF Euro Stoxx 50", cat: "actions_larges", risk: 3,
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
    id: "cac40", name: "ETF CAC 40", cat: "actions_larges", risk: 3,
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
    id: "msci_em", name: "ETF MSCI Emerging Markets", cat: "actions_larges", risk: 4,
    r: [15.0, -4.0, -22.0, 7.0, 5.0, 14.0],
    desc: [
      "Chine, Inde, Brésil, Taïwan... les grandes économies émergentes réunies dans un seul support.",
      "un potentiel de croissance supérieur aux pays développés, avec plus de volatilité et de risque politique.",
      "fortement sensible au dollar et aux tensions géopolitiques internationales.",
      "un pari sur le rattrapage économique des pays en développement sur le long terme.",
    ],
  },
  {
    id: "msci_europe", name: "ETF MSCI Europe", cat: "actions_larges", risk: 3,
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
    id: "ftse100", name: "ETF FTSE 100", cat: "actions_larges", risk: 3,
    r: [-14.0, 14.0, 0.9, 3.8, 5.7, 8.0],
    desc: [
      "les 100 plus grandes entreprises cotées à Londres, riches en pétrolières, minières et banques.",
      "un profil « value » assumé : moins de croissance, plus de dividendes.",
      "peu exposé à la technologie, ce qui explique sa relative stabilité en 2022.",
      "un indice historique, souvent perçu comme défensif face aux indices américains.",
    ],
  },
  {
    id: "nikkei225", name: "ETF Nikkei 225", cat: "actions_larges", risk: 3,
    r: [16.0, 4.9, -9.4, 28.0, 19.0, 7.0],
    desc: [
      "les 225 plus grandes entreprises cotées à Tokyo, portées par le renouveau de la Bourse japonaise.",
      "profite d'une politique monétaire longtemps très accommodante et d'un yen faible.",
      "un marché longtemps délaissé par les investisseurs, revenu en grâce depuis 2023.",
      "une diversification géographique bienvenue, décorrélée des cycles américains.",
    ],
  },
  {
    id: "msci_asia_exjp", name: "ETF MSCI Asie hors Japon", cat: "actions_larges", risk: 4,
    r: [22.0, -4.0, -20.0, 6.0, 8.0, 13.0],
    desc: [
      "Chine, Corée du Sud, Taïwan, Inde... l'Asie dynamique sans le Japon.",
      "très exposé à la tech asiatique (semi-conducteurs, électronique) et au risque chinois.",
      "un support volatil, sensible aux décisions politiques autant qu'à la croissance économique.",
      "un pari sur le poids grandissant de l'Asie dans l'économie mondiale.",
    ],
  },

  // ── Sectoriel ────────────────────────────────────────
  {
    id: "sect_tech", name: "ETF sectoriel Technologie", cat: "sectoriel", risk: 4,
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
    id: "sect_semi", name: "ETF Semi-conducteurs", cat: "sectoriel", risk: 5,
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
    id: "sect_sante", name: "ETF Santé / Biotech", cat: "sectoriel", risk: 3,
    r: [13.0, 19.0, -3.0, 2.0, 5.0, 9.0],
    desc: [
      "laboratoires pharmaceutiques et biotech : un secteur réputé plus défensif, porté par le vieillissement démographique.",
      "moins corrélé aux cycles économiques classiques, mais sensible aux décisions réglementaires.",
      "un secteur de long terme, porté par l'innovation médicale et le vieillissement de la population.",
      "traverse généralement mieux les crises boursières que les secteurs cycliques.",
    ],
  },
  {
    id: "sect_energie", name: "ETF sectoriel Énergie", cat: "sectoriel", risk: 4,
    r: [-34.0, 48.0, 59.0, -2.0, 5.0, -3.0],
    desc: [
      "pétrolières et gazières : un secteur ultra-cyclique, très lié au prix du baril.",
      "a connu l'une des pires années boursières en 2020... puis l'une des meilleures en 2022.",
      "un baromètre direct des tensions géopolitiques et de la demande énergétique mondiale.",
      "un secteur qui divise entre logique de rendement à court terme et transition énergétique de long terme.",
    ],
  },
  {
    id: "sect_finance", name: "ETF sectoriel Finance", cat: "sectoriel", risk: 3,
    r: [-5.0, 32.0, -12.0, 12.0, 28.0, 15.0],
    desc: [
      "banques et assurances : un secteur qui profite généralement de la hausse des taux d'intérêt.",
      "très sensible aux décisions des banques centrales et à la santé du crédit.",
      "un secteur cyclique, parmi les premiers touchés en cas de crise financière.",
      "a connu un net regain depuis la remontée des taux post-2022.",
    ],
  },
  {
    id: "sect_industrie", name: "ETF sectoriel Industrie", cat: "sectoriel", risk: 3,
    r: [11.0, 21.0, -13.0, 18.0, 17.0, 10.0],
    desc: [
      "machines, transport, construction : le secteur qui fait tourner l'économie physique.",
      "profite des grands plans d'investissement dans les infrastructures et la réindustrialisation.",
      "un secteur cyclique, sensible à la croissance économique mondiale.",
      "regroupe des entreprises souvent moins médiatiques mais essentielles à l'économie réelle.",
    ],
  },
  {
    id: "sect_conso_discr", name: "ETF Consommation discrétionnaire", cat: "sectoriel", risk: 4,
    r: [33.0, 24.0, -37.0, 42.0, 2.0, 9.0],
    desc: [
      "distribution, automobile, loisirs : les achats « non essentiels », très sensibles au pouvoir d'achat.",
      "un secteur cyclique qui souffre en premier quand les ménages réduisent leurs dépenses.",
      "porté par le e-commerce et la reprise de la consommation post-2020.",
      "l'un des secteurs les plus volatils car directement lié au moral des ménages.",
    ],
  },
  {
    id: "sect_conso_base", name: "ETF Consommation de base", cat: "sectoriel", risk: 2,
    r: [7.0, 14.0, -2.0, 2.0, 5.0, 6.0],
    desc: [
      "alimentation, hygiène, produits du quotidien : un secteur réputé très défensif.",
      "les gens continuent d'acheter du dentifrice même en récession : d'où sa stabilité relative.",
      "moins de performance en période de hausse, mais moins de dégâts en période de crise.",
      "un classique des portefeuilles prudents à la recherche de stabilité.",
    ],
  },
  {
    id: "sect_utilities", name: "ETF Utilities (services publics)", cat: "sectoriel", risk: 2,
    r: [0.5, 14.0, 1.0, -7.0, 23.0, 11.0],
    desc: [
      "eau, électricité, gaz : des besoins essentiels, réputés stables et souvent bien rémunérés en dividendes.",
      "un secteur régulé, moins soumis aux à-coups économiques que la moyenne du marché.",
      "de plus en plus lié aux besoins en électricité de l'intelligence artificielle et des data centers.",
      "un secteur défensif classique, apprécié pour ses dividendes réguliers.",
    ],
  },
  {
    id: "sect_reit", name: "ETF Immobilier coté (REIT)", cat: "sectoriel", risk: 3,
    r: [-8.0, 40.0, -26.0, 12.0, 5.0, 8.0],
    desc: [
      "des sociétés foncières cotées en Bourse : accès à l'immobilier sans acheter de mur directement.",
      "très sensible aux taux d'intérêt : la hausse des taux 2022 lui a fait mal.",
      "plus liquide qu'un investissement immobilier classique, mais aussi plus volatil.",
      "distribue généralement une grande partie de ses revenus sous forme de dividendes.",
    ],
  },
  {
    id: "sect_defense", name: "ETF Défense / Aérospatial", cat: "sectoriel", risk: 4,
    r: [-10.0, 5.0, 8.0, 30.0, 40.0, 25.0],
    desc: [
      "industrie militaire et aéronautique, portée par la hausse des budgets de défense en Europe.",
      "un secteur longtemps boudé pour des raisons ESG, redevenu très recherché depuis 2022.",
      "profite directement des tensions géopolitiques et du réarmement des États.",
      "un secteur cyclique lié aux décisions budgétaires publiques, donc aux enjeux politiques.",
    ],
  },
  {
    id: "sect_ia", name: "ETF Intelligence artificielle", cat: "sectoriel", risk: 5,
    r: [40.0, 15.0, -30.0, 45.0, 33.0, 14.0],
    desc: [
      "entreprises positionnées sur l'IA : semi-conducteurs, cloud, logiciels d'intelligence artificielle.",
      "l'un des thèmes d'investissement les plus discutés depuis 2023, avec des valorisations élevées.",
      "un pari sur une rupture technologique majeure, avec le risque de « bulle » que cela comporte.",
      "très concentré sur un petit nombre d'entreprises leaders du secteur.",
    ],
    tags: ["tech"],
  },
  {
    id: "sect_cyber", name: "ETF Cybersécurité", cat: "sectoriel", risk: 4,
    r: [80.0, 18.0, -32.0, 30.0, 25.0, 12.0],
    desc: [
      "protection des données et des systèmes : un besoin structurel, quelle que soit la conjoncture.",
      "porté par la multiplication des cyberattaques et la digitalisation des entreprises.",
      "un secteur de croissance considéré comme relativement résilient aux cycles économiques.",
      "reste toutefois soumis aux mêmes excès de valorisation que le reste de la tech.",
    ],
    tags: ["tech"],
  },
  {
    id: "sect_eau", name: "ETF thématique Eau", cat: "sectoriel", risk: 3,
    r: [18.0, 14.0, -14.0, 8.0, 6.0, 9.0],
    desc: [
      "traitement, distribution et gestion de l'eau : une ressource rare appelée à se raréfier encore.",
      "un thème d'investissement de long terme, lié aux enjeux climatiques et démographiques.",
      "regroupe des entreprises souvent peu connues mais essentielles à l'accès à l'eau potable.",
      "moins cyclique que la tech, mais pas à l'abri des phases de marché baissier.",
    ],
  },
  {
    id: "sect_luxe", name: "ETF sectoriel Luxe", cat: "sectoriel", risk: 3,
    r: [20.0, 38.0, -5.0, 12.0, -15.0, 5.0],
    desc: [
      "LVMH, Hermès, Kering... la mode et le luxe européens, très liés à la demande chinoise.",
      "porté par la clientèle mondiale aisée, mais sensible aux cycles de consommation en Asie.",
      "un secteur emblématique de l'économie française et européenne, valorisé en conséquence.",
      "a connu un net coup de frein en 2024 après plusieurs années de forte hausse.",
    ],
    tags: ["europe"],
  },

  // ── ETF stratégiques ─────────────────────────────────
  {
    id: "strat_6040", name: "ETF 60/40 (actions/obligations)", cat: "strategique", risk: 2,
    r: [11.0, 10.0, -16.0, 14.0, 11.0, 9.0],
    desc: [
      "un mix classique 60 % actions / 40 % obligations en une seule ligne, pour simplifier la gestion.",
      "l'allocation la plus enseignée en finance personnelle, entre croissance et stabilité.",
      "a pourtant souffert en 2022, année où actions et obligations ont chuté ensemble.",
      "pensé pour lisser les variations sans renoncer totalement à la performance des actions.",
    ],
  },
  {
    id: "strat_world_hedge", name: "ETF World couvert du risque de change", cat: "strategique", risk: 3,
    r: [6.0, 25.0, -13.0, 16.0, 20.0, 10.0],
    desc: [
      "le même MSCI World, mais protégé des variations euro/dollar : la performance vient purement des actions.",
      "utile pour un investisseur qui veut isoler le risque actions du risque de change.",
      "peut sous-performer le World classique quand le dollar se renforce face à l'euro.",
      "un choix technique, pertinent surtout pour les gros portefeuilles cherchant à limiter les aléas monétaires.",
    ],
  },
  {
    id: "strat_smallcap", name: "ETF Small Caps mondiales", cat: "strategique", risk: 4,
    r: [12.0, 18.0, -18.0, 14.0, 9.0, 11.0],
    desc: [
      "des petites capitalisations boursières, avec un potentiel de croissance supérieur aux grandes entreprises.",
      "historiquement plus performantes sur le très long terme, mais avec plus de volatilité.",
      "moins suivies par les analystes, donc parfois sous-évaluées... ou sur-risquées.",
      "un pari sur les futures grandes entreprises de demain.",
    ],
  },
  {
    id: "strat_dividendes", name: "ETF Dividendes / Aristocrates", cat: "strategique", risk: 2,
    r: [-2.0, 18.0, -3.0, 8.0, 12.0, 9.0],
    desc: [
      "des entreprises qui versent (et augmentent) leur dividende depuis des années : profil plutôt défensif.",
      "recherché pour générer un revenu régulier en plus de la performance en capital.",
      "a tendance à mieux résister lors des phases de baisse des marchés.",
      "un classique des portefeuilles orientés « revenu » plutôt que pure croissance.",
    ],
  },
  {
    id: "strat_value", name: "ETF Value", cat: "strategique", risk: 3,
    r: [-1.0, 25.0, -5.0, 12.0, 14.0, 11.0],
    desc: [
      "des entreprises jugées « sous-évaluées » par rapport à leurs fondamentaux : banques, énergie, industrie.",
      "un style d'investissement qui revient en grâce quand les taux d'intérêt remontent.",
      "moins spectaculaire que la croissance en période haussière, mais plus résistant en phase de correction.",
      "s'oppose historiquement au style « croissance », les deux alternant les phases de surperformance.",
    ],
  },
  {
    id: "strat_croissance", name: "ETF Croissance (Growth)", cat: "strategique", risk: 4,
    r: [33.0, 20.0, -30.0, 32.0, 22.0, 9.0],
    desc: [
      "des entreprises à forte croissance de leurs bénéfices, souvent dans la tech.",
      "plus sensible à la hausse des taux d'intérêt que les valeurs « value ».",
      "un style qui a largement dominé la dernière décennie boursière.",
      "capable de fortes surperformances... et de corrections tout aussi marquées.",
    ],
  },
  {
    id: "strat_momentum", name: "ETF Momentum", cat: "strategique", risk: 4,
    r: [15.0, 18.0, -14.0, 18.0, 25.0, 8.0],
    desc: [
      "sélectionne les actions qui montent déjà, en pariant que la tendance se poursuit.",
      "une stratégie qui peut amplifier les tendances de marché, à la hausse comme à la baisse.",
      "nécessite des ajustements réguliers du portefeuille sous-jacent, gérés automatiquement par l'ETF.",
      "peut brutalement changer de composition lors des retournements de marché.",
    ],
  },
  {
    id: "strat_lowvol", name: "ETF Low Volatility", cat: "strategique", risk: 2,
    r: [5.0, 12.0, -5.0, 7.0, 10.0, 8.0],
    desc: [
      "sélectionne les actions historiquement les moins volatiles, pour un parcours boursier plus lisse.",
      "vise à limiter les baisses plutôt qu'à maximiser les hausses.",
      "souvent surpondéré en santé, consommation de base ou utilities.",
      "un compromis intéressant pour rester investi en actions sans les montagnes russes.",
    ],
  },
  {
    id: "strat_esg", name: "ETF ESG / durable", cat: "strategique", risk: 3,
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
    id: "or", name: "Or (ETF physique)", cat: "matieres_premieres", risk: 2,
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
    id: "argent", name: "Argent métal (ETF physique)", cat: "matieres_premieres", risk: 3,
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
    id: "platine", name: "Platine (ETF physique)", cat: "matieres_premieres", risk: 3,
    r: [10.0, -10.0, 11.0, -8.0, 9.0, 18.0],
    desc: [
      "un métal précieux utilisé notamment dans l'industrie automobile (pots catalytiques).",
      "plus rare que l'or, mais moins recherché comme valeur refuge par les investisseurs.",
      "un marché de niche, sensible à la fois à la demande industrielle et à la demande d'investissement.",
      "sa performance dépend fortement de la santé de l'industrie automobile mondiale.",
    ],
    tags: ["antiinflation"],
  },
  {
    id: "mp_large", name: "ETF Matières premières large (panier diversifié)", cat: "matieres_premieres", risk: 3,
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
    id: "petrole", name: "ETF Pétrole / Énergie fossile", cat: "matieres_premieres", risk: 4,
    r: [-21.0, 55.0, 10.0, -11.0, 2.0, -6.0],
    desc: [
      "suit le cours du pétrole, extrêmement sensible aux tensions géopolitiques et à l'offre de l'OPEP+.",
      "l'un des actifs les plus imprévisibles : passé sous zéro en 2020, en flèche en 2021-2022.",
      "un pari direct sur la demande énergétique mondiale, en tension avec la transition écologique.",
      "à manier avec précaution tant sa volatilité peut être extrême.",
    ],
  },
  {
    id: "agriculture", name: "ETF Agriculture / matières premières agricoles", cat: "matieres_premieres", risk: 3,
    r: [3.0, 22.0, 14.0, -8.0, -3.0, 6.0],
    desc: [
      "blé, maïs, soja... les prix des matières premières agricoles mondiales.",
      "influencé par la météo, les récoltes et les tensions géopolitiques sur les grandes zones exportatrices.",
      "un actif de diversification, peu corrélé aux marchés financiers classiques.",
      "a connu un pic marqué en 2021-2022 lors des tensions sur les céréales.",
    ],
  },
  {
    id: "metaux_ind", name: "ETF Métaux industriels (cuivre...)", cat: "matieres_premieres", risk: 3,
    r: [26.0, 27.0, -15.0, 2.0, 7.0, 20.0],
    desc: [
      "cuivre, aluminium, nickel... les métaux indispensables à l'industrie et à la transition énergétique.",
      "surnommé parfois « l'économiste du cuivre » : un baromètre avancé de l'activité industrielle mondiale.",
      "porté par les besoins en électrification (véhicules électriques, réseaux, data centers).",
      "un actif cyclique, très lié à la santé de l'industrie chinoise et mondiale.",
    ],
  },

  // ── Crypto ───────────────────────────────────────────
  {
    id: "bitcoin", name: "Bitcoin (ETF/tracker)", cat: "crypto", risk: 5,
    r: [303.0, 60.0, -64.0, 156.0, 121.0, 25.0],
    desc: [
      "la première et plus grande cryptomonnaie, souvent présentée comme un « or numérique ».",
      "extrêmement volatil : capable de tripler... comme de perdre les deux tiers de sa valeur.",
      "de plus en plus intégré aux portefeuilles institutionnels via les ETF spot depuis 2024.",
      "à ne considérer qu'en petite proportion tant l'amplitude des mouvements est importante.",
    ],
  },
  {
    id: "ethereum", name: "Ethereum (ETF/tracker)", cat: "crypto", risk: 5,
    r: [469.0, 399.0, -67.0, 91.0, 47.0, 15.0],
    desc: [
      "la deuxième plus grande cryptomonnaie, socle de nombreuses applications décentralisées.",
      "encore plus volatil que le bitcoin sur certaines périodes, avec des cycles très marqués.",
      "sa valeur dépend aussi de l'usage de son réseau (contrats intelligents, finance décentralisée).",
      "un actif spéculatif à forte amplitude, à réserver à une poche satellite du portefeuille.",
    ],
  },
  {
    id: "crypto_panier", name: "ETF/panier crypto large cap", cat: "crypto", risk: 5,
    r: [250.0, 90.0, -65.0, 120.0, 80.0, 18.0],
    desc: [
      "un panier des plus grandes cryptomonnaies, pour diversifier un peu le risque propre à chaque actif.",
      "reste un compartiment extrêmement volatil malgré la diversification interne.",
      "permet d'être exposé à la tendance globale du secteur crypto en une seule ligne.",
      "un pari sur l'adoption durable des actifs numériques, avec un risque de perte élevé.",
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
    id: "foncieres_etf", name: "ETF Foncières cotées", cat: "immobilier", risk: 3,
    r: [-10.0, 35.0, -25.0, 10.0, 4.0, 7.0],
    desc: [
      "des sociétés immobilières cotées en Bourse : bureaux, entrepôts, commerces, logistique.",
      "beaucoup plus liquide que la pierre-papier classique, mais aussi plus volatil.",
      "très sensible aux mouvements de taux d'intérêt, à la hausse comme à la baisse.",
      "permet de s'exposer à l'immobilier sans les contraintes de gestion d'un bien en direct.",
    ],
  },

  // ── Actions individuelles ───────────────────────────
  {
    id: "lvmh", name: "Action LVMH", cat: "actions_individuelles", risk: 3,
    r: [12.0, 36.0, -6.0, 9.0, -20.0, 8.0],
    desc: [
      "le numéro un mondial du luxe, longtemps première capitalisation boursière européenne.",
      "très dépendant de la demande chinoise, ce qui explique son net recul en 2024.",
      "illustre bien le risque de concentrer une ligne sur une seule entreprise, même prestigieuse.",
      "un exemple classique pour parler du risque spécifique face au risque de marché.",
    ],
    tags: ["europe"],
  },
  {
    id: "apple", name: "Action Apple", cat: "actions_individuelles", risk: 3,
    r: [82.0, 34.0, -27.0, 48.0, 30.0, 5.0],
    desc: [
      "l'une des entreprises les plus valorisées au monde, entre iPhone, services et écosystème fermé.",
      "un exemple emblématique de la domination de la tech américaine dans les indices mondiaux.",
      "illustre à quel point une poignée d'entreprises peut peser sur la performance d'un indice comme le Nasdaq.",
      "à garder en tête : posséder déjà un ETF World revient souvent à détenir indirectement Apple.",
    ],
    tags: ["tech", "us"],
  },
  {
    id: "microsoft", name: "Action Microsoft", cat: "actions_individuelles", risk: 3,
    r: [41.0, 51.0, -28.0, 57.0, 12.0, 18.0],
    desc: [
      "cloud (Azure), logiciels et intelligence artificielle : un des piliers de la tech mondiale.",
      "l'une des rares entreprises à peser plusieurs milliers de milliards de dollars en Bourse.",
      "un exemple souvent cité de « croissance régulière » parmi les géants technologiques.",
      "fortement investie dans l'IA générative depuis son partenariat avec OpenAI.",
    ],
    tags: ["tech", "us"],
  },
  {
    id: "asml", name: "Action ASML", cat: "actions_individuelles", risk: 4,
    r: [49.0, 33.0, -32.0, 30.0, -5.0, 20.0],
    desc: [
      "le quasi-monopole mondial des machines de lithographie, indispensables à la fabrication de puces.",
      "une entreprise néerlandaise stratégique, au cœur des tensions géopolitiques sur les semi-conducteurs.",
      "un exemple européen rare de position dominante mondiale dans la tech de pointe.",
      "illustre la dépendance de toute l'industrie des puces à une poignée de fournisseurs clés.",
    ],
    tags: ["europe", "tech"],
  },
  {
    id: "totalenergies", name: "Action TotalEnergies", cat: "actions_individuelles", risk: 3,
    r: [-33.0, 19.0, 32.0, 2.0, -3.0, 6.0],
    desc: [
      "le géant pétrolier et gazier français, en pleine diversification vers les énergies renouvelables.",
      "a bondi en 2022 avec l'envolée des prix de l'énergie liée à la guerre en Ukraine.",
      "un exemple classique de valeur cyclique liée aux prix des matières premières énergétiques.",
      "verse historiquement un dividende généreux, apprécié des investisseurs orientés revenu.",
    ],
    tags: ["europe"],
  },
  {
    id: "tesla", name: "Action Tesla", cat: "actions_individuelles", risk: 5,
    r: [743.0, 50.0, -65.0, 102.0, 63.0, -10.0],
    desc: [
      "le pionnier du véhicule électrique, devenu un cas d'école de volatilité extrême en Bourse.",
      "sa valorisation intègre autant l'auto que des paris sur la conduite autonome et la robotique.",
      "l'un des exemples les plus cités pour illustrer le risque de concentrer une ligne sur une seule action.",
      "capable de multiplier sa valeur par 8 en un an... comme de la diviser par 3 l'année suivante.",
    ],
    tags: ["us"],
  },
  {
    id: "nvidia", name: "Action Nvidia", cat: "actions_individuelles", risk: 5,
    r: [122.0, 125.0, -50.0, 239.0, 171.0, 30.0],
    desc: [
      "le leader mondial des puces graphiques, devenu le symbole boursier de la révolution de l'IA.",
      "une des plus fortes progressions boursières de l'histoire récente entre 2023 et 2024.",
      "illustre à elle seule le poids qu'une seule entreprise peut prendre dans les indices mondiaux.",
      "un exemple parfait pour parler du risque de concentration, même sur une success story.",
    ],
    tags: ["tech", "us"],
  },
  {
    id: "sanofi", name: "Action Sanofi", cat: "actions_individuelles", risk: 3,
    r: [-4.0, 16.0, 14.0, -2.0, -8.0, 10.0],
    desc: [
      "l'un des grands laboratoires pharmaceutiques français, au profil plus défensif que la moyenne.",
      "un exemple d'action « santé », réputée pour mieux résister lors des phases de baisse du marché.",
      "verse un dividende régulier, appréciée des investisseurs à la recherche de stabilité.",
      "illustre qu'une action individuelle peut aussi avoir un profil défensif, pas seulement offensif.",
    ],
    tags: ["europe"],
  },
];

export function getAsset(id) {
  return ASSETS.find((a) => a.id === id);
}
