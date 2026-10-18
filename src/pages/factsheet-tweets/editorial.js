// Revue du 10/10/2026 : un angle propre à chaque indice, sans vécu personnel inventé.
// Les chiffres et les constats de concentration sont dérivés de la fiche reçue.
export const INDEX_HOOKS = {
  'msci-world-health-care': 'Un ETF santé mondial peut contenir des laboratoires, des fabricants de matériel et des services de santé. Mais ces entreprises n’y pèsent pas toutes autant 🏥',
  'msci-world-financials': 'Un ETF finance mondial ne contient pas seulement des banques. Tu y retrouves aussi des assureurs et des entreprises de paiement 🏦',
  'msci-world-energy': 'Investir dans les entreprises de l’énergie, ce n’est pas acheter du pétrole. Leurs coûts et leurs marges comptent aussi ⚡',
  'msci-world-materials': 'Derrière un ETF matériaux, tu trouves des entreprises de chimie, de métaux ou de construction. Leurs actions évoluent aussi avec leurs coûts et leurs marges 🪨',
  'msci-world-utilities': 'Électricité, gaz, eau : les services publics ont leur indice mondial. Ces entreprises restent pourtant exposées au risque actions 💡',
  'msci-world-industrials': 'L’industrie mondiale ne se limite pas aux usines. Les entreprises du transport et des équipements y occupent aussi une place 🏭',
  'msci-world-consumer-staples': 'Les produits du quotidien ont aussi leur indice mondial. Mais leurs fabricants ne pèsent pas tous autant dans ce panier 🛒',
  'msci-em-imi': 'Les émergents ne se limitent pas aux grandes entreprises. Le MSCI Emerging Markets IMI inclut aussi les petites capitalisations 🌏',
  'ftse-all-world-high-dividend-yield': 'Un ETF mondial à dividendes élevés peut avoir une composition très différente d’un ETF All-World classique 💰',
  'sp-global-dividend-aristocrats': 'Derrière le mot « Aristocrats », il y a des règles de sélection. Un dividende élevé ne suffit pas à entrer dans cet indice 💰',
  'msci-world-growth': 'Un ETF World Growth ne reprend pas tout le World. Il sélectionne les entreprises selon leurs caractéristiques de croissance 🔎',
  'msci-usa': 'Il n’y a pas que le S&P 500 pour suivre les entreprises américaines. Le MSCI USA couvre aussi les grandes et moyennes capitalisations 🇺🇸',
  'msci-india': 'Un ETF Inde donne accès à plusieurs entreprises, mais ton argent reste investi sur un seul pays 🇮🇳',
  "world": "Un ETF World contient plus que quelques noms connus. Mais toutes les entreprises n’y prennent pas la même place 🌍",
  "acwi": "Avec un ETF ACWI, tu investis dans les pays développés et les marchés émergents 🌍",
  "ftse-all-world": "Un ETF All-World couvre les pays développés et les marchés émergents. Pourtant, ton argent n’est pas réparti à parts égales entre les pays 🌍",
  "acwi-imi": "Le MSCI ACWI IMI inclut aussi les petites entreprises des pays développés et émergents 🌍",
  "world-small-cap": "Les petites entreprises ont aussi leur indice mondial. Mais « petites » ne veut pas dire qu’elles viennent toutes de pays différents 👀",
  "world-ex-usa": "Le MSCI World ex USA retire les entreprises américaines du World. Le Japon, la France ou le Royaume-Uni prennent alors davantage de place 🌍",
  "em-standard": "Chine, Inde, Taïwan, Corée du Sud… Les marchés émergents regroupent des économies très différentes 🌏",
  "em-esg": "Un ETF émergent avec un filtre ESG ne contient pas exactement les mêmes entreprises qu’un indice émergent classique 🌏",
  "msci-em-ex-china": "Un ETF émergents sans la Chine donne davantage de poids aux autres pays. Sa composition peut donc beaucoup changer 🌏",
  "stoxx600": "Un ETF Europe peut aussi contenir des entreprises britanniques et suisses 🇪🇺\n\nC’est le cas du STOXX Europe 600.",
  "mscieurope": "Le MSCI Europe dépasse les frontières de la zone euro. Le Royaume-Uni et la Suisse en font aussi partie 🇪🇺",
  "eurostoxx50": "L’EURO STOXX 50 regroupe 50 grandes entreprises de la zone euro. Mais chacune n’y occupe pas la même place 🇪🇺",
  "topix": "Pour investir au Japon, il n’y a pas que le Nikkei. Le TOPIX donne accès à un ensemble plus large d’entreprises 🇯🇵",
  "nikkei225": "Dans le Nikkei 225, le prix d’une action compte dans son poids. La plus grosse entreprise en Bourse n’est donc pas forcément la première de l’indice 🇯🇵",
  "sp500-pea": "Le S&P 500 regroupe de grandes entreprises américaines. Mais ton argent n’est pas partagé également entre elles 🇺🇸",
  "nasdaq-pea": "Le Nasdaq-100 contient une centaine d’entreprises. Quelques grands noms y prennent pourtant beaucoup de place 👀",
  "sp500-equal-weight": "Les mêmes entreprises que le S&P 500, mais avec un poids égal à chaque rééquilibrage : c’est le principe de l’Equal Weight 🇺🇸",
  "russell-2000": "Le Russell 2000 permet d’investir dans les petites entreprises américaines. Sa composition est bien différente de celle du S&P 500 🇺🇸",
  "msci-world-momentum": "Le World Momentum privilégie les actions dont les cours ont récemment le mieux progressé, en tenant compte du risque 👀",
  "msci-world-minimum-volatility-usd": "Un indice qui cherche à moins bouger ne se contente pas de choisir les actions les plus stables 👀",
  "msci-world-sector-neutral-quality": "Rentabilité, dette, stabilité des bénéfices : le World Quality choisit ses entreprises à partir de critères précis 🔎",
  "msci-world-enhanced-value": "Une entreprise peut paraître peu chère en Bourse. Encore faut-il savoir à quoi on compare son prix 🔎",
  "ftse-epra-nareit-developed-dividend-plus": "Avec un ETF immobilier, tu achètes des actions de sociétés immobilières. Mais lesquelles, et dans quels pays ? 🏠",
  "ftse-global-core-infrastructure": "Réseaux d’énergie, transport… Un ETF infrastructures investit dans les entreprises qui exploitent ces équipements 🏗️"
}

const numericRows = rows => (rows ?? []).filter(([, value]) => Number.isFinite(value) && value >= 0)
export const sortedRows = rows => [...numericRows(rows)].sort((a, b) => b[1] - a[1])
export const sumRows = rows => numericRows(rows).reduce((sum, [, value]) => sum + value, 0)
export const plainLabel = name => name.replace(/^[^\p{L}\p{N}]+/u, '').trim()

// Traduction à l’affichage : les libellés officiels restent intacts dans les sources.
const SECTOR_LABELS = {
  'Data Centers': 'Centres de données',
  Diversified: 'Immobilier diversifié',
  HealthCare: 'Immobilier de santé',
  Industrial: 'Immobilier industriel',
  'Industrial/Office Mixed': 'Industrie et bureaux',
  'Lodging/Resorts': 'Hôtels et résidences de vacances',
  Office: 'Bureaux',
  Residential: 'Résidentiel',
  Retail: 'Commerces',
  'Self Storage': 'Garde-meubles',
  Speciality: 'Immobilier spécialisé',
  Technology: 'Technologie',
  'Consumer Goods': 'Biens de consommation',
  Materials: 'Matériaux',
  'Capital Goods/Others': 'Biens d’équipement et autres',
  Financials: 'Finance',
  'Transportation and Utilities': 'Transports et services publics',
}
export const sectorLabel = name => SECTOR_LABELS[plainLabel(name)] ?? plainLabel(name)
const SECTOR_METHOD_LABELS = {
  'Property Sector Breakdown': 'répartition par secteur immobilier',
  'ICB Subsector Breakdown': 'classification ICB par sous-secteur',
  'ICB Industry Breakdown': 'classification ICB par secteur',
  'ICB Supersector Breakdown': 'classification ICB par grand secteur',
  'Nikkei six-sector classification': 'classification Nikkei en six secteurs',
}
export const sectorMethodLabel = name => SECTOR_METHOD_LABELS[name] ?? name

export function companyLabel(name) {
  const labels = [
    [/^LILLY \(ELI\) & COMPANY$/i, 'Eli Lilly'], [/^JOHNSON & JOHNSON$/i, 'Johnson & Johnson'],
    [/^ABBVIE$/i, 'AbbVie'], [/^MERCK & CO$/i, 'Merck & Co'], [/^UNITEDHEALTH GROUP$/i, 'UnitedHealth'],
    [/^JPMORGAN CHASE & CO$/i, 'JPMorgan Chase'], [/^BERKSHIRE HATHAWAY B$/i, 'Berkshire Hathaway (classe B)'],
    [/^VISA A$/i, 'Visa (classe A)'], [/^MASTERCARD A$/i, 'Mastercard (classe A)'],
    [/^EXXONMOBIL HOLDINGS$/i, 'ExxonMobil'], [/^CHEVRON CORP$/i, 'Chevron'], [/^SHELL$/i, 'Shell'],
    [/^NVIDIA/i, 'Nvidia'], [/^APPLE/i, 'Apple'], [/^MICROSOFT/i, 'Microsoft'], [/^AMAZON/i, 'Amazon'],
    [/^ALPHABET.*(?: A|CLASS A)$/i, 'Alphabet (classe A)'], [/^ALPHABET.*(?: C|CLASS C)$/i, 'Alphabet (classe C)'],
    [/^META PLATFORMS/i, 'Meta'], [/^TAIWAN SEMICONDUCTOR/i, 'TSMC'], [/^SAMSUNG ELECTRONICS/i, 'Samsung Electronics'],
    [/^SIEMENS/i, 'Siemens'], [/^BANCO SANTANDER/i, 'Banco Santander'], [/^SAP\b/i, 'SAP'],
    [/^TOTALENERGIES/i, 'TotalEnergies'], [/^SCHNEIDER/i, 'Schneider Electric'], [/^ALLIANZ/i, 'Allianz'],
    [/^ASML/i, 'ASML'], [/^MICRON/i, 'Micron'], [/^BROADCOM/i, 'Broadcom'],
  ]
  return labels.find(([pattern]) => pattern.test(name))?.[1] ?? name
}

// Les accroches chiffrées suivent la composition reçue, y compris après actualisation.
export function indexHook(sheet) {
  // Derived sheets have no written intro: the hook names the index and announces its composition.
  let hook = INDEX_HOOKS[sheet.id] ?? sheet.intro ?? `Que contient vraiment le ${sheet.index} ? Ses pays, ses secteurs et ses principales lignes racontent où va l’argent investi.`
  if (sheet.id === 'acwi') {
    const usa = sortedRows(sheet.countries).find(([name]) => /États-Unis|United States/i.test(name))?.[1]
    if (usa > 50) {
      const share = usa >= 63 && usa <= 68 ? 'près des deux tiers' : `${Math.round(usa)} %`
      hook += `\n\nMais les États-Unis représentent encore ${share} de ton placement.`
    }
  }
  if (sheet.id === 'eurostoxx50') {
    const first = sortedRows(sheet.holdings)[0]
    if (first?.[1] >= 10) {
      hook = `Dans l’EURO STOXX 50, ${companyLabel(first[0])} représente à elle seule ${first[1] > 10 ? 'plus de' : ''} 10 % de l’indice.`.replace('  ', ' ')
    }
  }
  const transition = {
    acwi: 'Regardons ce que contient le MSCI ACWI 👇',
    eurostoxx50: 'Regardons les principales entreprises de l’EURO STOXX 50 et la place qu’elles occupent 👇',
    stoxx600: 'Regardons les pays et les entreprises qui composent cet indice 👇',
    'world-ex-usa': 'Je t’explique ce que contient cet indice 👇',
  }[sheet.id] ?? `Regardons les principales entreprises du ${sheet.index} et leur poids 👇`
  return `${hook}\n\n${transition}\n\n🔖 Sauvegarde ce tweet`
}

export function indexObservation(sheet) {
  const top = sortedRows(sheet.holdings).slice(0, 4)
  const countries = sortedRows(sheet.countries)
  const usa = countries.find(([name]) => /États-Unis|United States/i.test(name))?.[1] ?? 0
  const asia = countries.filter(([name]) => /Taïwan|Taiwan|Corée|Korea/i.test(name))
  const concentration = top.length
    ? 'Une entreprise à 10 % pèse dix fois plus dans l’indice qu’une entreprise à 1 %. Le nombre de titres ne raconte donc pas tout.'
    : 'Les pays et les secteurs permettent de voir où va l’argent investi dans cet indice.'
  switch (sheet.id) {
    case 'msci-world-consumer-discretionary': return 'Ce secteur comprend des achats que les ménages peuvent repousser. Le crédit et leur confiance peuvent changer la demande, même si les entreprises de ce secteur vendent des produits très différents.'
    case 'msci-world-communication-services': return 'Le mot « communication » réunit plusieurs activités. Une plateforme financée par la publicité et un opérateur qui facture des abonnements ne dépendent pas des mêmes revenus.'
    case 'msci-world-health-care': return 'Le secteur de la santé réunit plusieurs métiers. Un laboratoire et un assureur santé ne gagnent pas leur argent de la même façon, même s’ils figurent dans le même secteur.'
    case 'msci-world-financials': return 'Dans cet indice, la finance ne se limite pas aux banques. Les assureurs et les réseaux de paiement ont des activités différentes, et les plus grandes entreprises prennent davantage de place.'
    case 'msci-world-energy': return 'Avec cet indice, tu achètes des actions d’entreprises énergétiques. Leurs bénéfices et leurs investissements comptent aussi : ce n’est pas une exposition directe au prix du pétrole.'
    case 'world': return concentration
    case 'acwi': case 'ftse-all-world': case 'acwi-imi': return usa > 50
      ? 'Derrière le nom « tous pays », il faut regarder les poids : les émergents sont bien inclus, mais les grandes entreprises américaines gardent beaucoup de poids. Couvrir davantage de pays ne veut pas dire répartir ton argent à parts égales entre eux.'
      : 'Cet indice couvre les marchés développés et émergents, mais ne répartit pas l’investissement à parts égales entre eux.'
    case 'world-small-cap': return 'Cet indice complète le World en ajoutant les petites entreprises que le World classique laisse de côté. Il contient aussi des entreprises américaines.'
    case 'world-ex-usa': return 'Cet indice enlève les États-Unis, mais n’ajoute pas les marchés émergents. Il donne davantage de place aux autres pays développés déjà présents dans le World.'
    case 'em-standard': case 'em-esg': case 'msci-em-ex-china': return asia.length === 2 && sumRows(asia) > 40
      ? 'Taïwan et la Corée du Sud prennent beaucoup de place ici. À eux deux, ils représentent une grande partie de l’indice, même si les émergents couvrent bien d’autres pays.'
      : 'Les pays et les entreprises classés parmi les marchés émergents dépendent de l’indice choisi. Leurs poids peuvent être très différents.'
    case 'stoxx600': return 'Cet indice ne s’arrête pas à la zone euro. Le Royaume-Uni et la Suisse en font partie, contrairement à l’EURO STOXX 50.'
    case 'mscieurope': return 'Acheter des entreprises européennes, c’est investir dans des activités qui n’ont pas toutes le même poids dans cet indice.'
    case 'eurostoxx50': return top[0]?.[1] >= 10
      ? `Le poids de ${companyLabel(top[0][0])} compte particulièrement dans cette composition. Avec ${top[0][1] > 10 ? 'plus de' : ''} 10 % de l’indice, ses variations comptent bien davantage que celles d’une entreprise qui n’en représente que 1 %.`.replace('  ', ' ')
      : concentration
    case 'topix': return 'Le TOPIX donne davantage de poids aux entreprises selon leur valeur en Bourse et les actions disponibles à l’échange ; le Nikkei utilise les prix ajustés des actions.'
    case 'nikkei225': return 'Le détail à connaître, c’est sa règle de calcul : les prix ajustés des actions déterminent leur poids. Une entreprise peut donc peser lourd sans être la plus importante en valeur boursière.'
    case 'sp500-pea': case 'nasdaq-pea': return concentration
    case 'sp500-equal-weight': return 'On retrouve les entreprises du S&P 500. Ce qui change, c’est qu’on leur redonne le même poids à chaque rééquilibrage. Entre deux rééquilibrages, les cours font évoluer ces poids.'
    case 'russell-2000': return 'Cet indice donne accès aux petites entreprises américaines. Il ne remplace pas une exposition aux grandes entreprises ou aux autres pays.'
    case 'msci-world-momentum': return 'La sélection suit les tendances récentes des cours. Les entreprises retenues et leur poids peuvent donc changer au fil des rééquilibrages.'
    case 'msci-world-minimum-volatility-usd': return 'Le comportement des actions ensemble compte ici. L’indice cherche à réduire les variations de l’ensemble, pas seulement celles de chaque action. Il peut tout de même baisser.'
    case 'msci-world-sector-neutral-quality': return '« Quality » décrit une méthode de sélection : rentabilité, dette et stabilité des bénéfices. Cela ne promet ni de meilleures performances ni une protection contre les baisses.'
    case 'msci-world-enhanced-value': return 'Une entreprise jugée peu chère peut le rester longtemps. Le filtre compare son prix à ses données financières, sans prédire quand le cours remontera.'
    case 'ftse-epra-nareit-developed-dividend-plus': return 'Le résultat comprend la variation des actions et les dividendes reçus. Ces sociétés possèdent de l’immobilier, mais leur cours reste sensible à leur financement et aux marchés.'
    case 'ftse-global-core-infrastructure': return 'Le nom « infrastructures » recouvre plusieurs activités. Ces entreprises exploitent des équipements utiles, mais leurs actions peuvent baisser comme celles des autres sociétés cotées.'
    default: return concentration
  }
}
