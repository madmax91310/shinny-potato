// Revue du 10/10/2026 : un angle propre à chaque indice, sans vécu personnel inventé.
// Les chiffres et les constats de concentration sont dérivés de la fiche reçue.
export const INDEX_HOOKS = {
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

export function companyLabel(name) {
  const labels = [
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
  let hook = INDEX_HOOKS[sheet.id] ?? sheet.intro
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
    acwi: 'On décrypte le MSCI ACWI 👇',
    eurostoxx50: 'On décrypte l’EURO STOXX 50, ses principales entreprises et leur poids 👇',
    stoxx600: 'On décrypte l’indice, ses principaux pays et ses entreprises 👇',
    'world-ex-usa': 'Je t’explique ce que contient cet indice 👇',
  }[sheet.id] ?? `On décrypte ${sheet.index}, ses principales entreprises et leur poids 👇`
  return `${hook}\n\n${transition}\n\n🔖 Sauvegarde ce tweet`
}

export function indexObservation(sheet) {
  const top = sortedRows(sheet.holdings).slice(0, 4)
  const countries = sortedRows(sheet.countries)
  const usa = countries.find(([name]) => /États-Unis|United States/i.test(name))?.[1] ?? 0
  const asia = countries.filter(([name]) => /Taïwan|Taiwan|Corée|Korea/i.test(name))
  const concentration = top.length
    ? 'Je regarde aussi le poids de ces entreprises : leurs variations ne comptent pas toutes autant dans la performance de l’indice.'
    : 'Je regarde les pays et les secteurs pour comprendre comment cet indice répartit l’investissement.'
  switch (sheet.id) {
    case 'world': return concentration
    case 'acwi': case 'ftse-all-world': case 'acwi-imi': return usa > 50
      ? 'C’est ce que je regarde derrière le nom « tous pays » : les émergents sont bien inclus, mais les grandes entreprises américaines gardent beaucoup de poids. Couvrir davantage de pays ne veut pas dire répartir ton argent à parts égales entre eux.'
      : 'Je regarde aussi la place de chaque pays : cet indice couvre les marchés développés et émergents, mais ne répartit pas l’investissement à parts égales entre eux.'
    case 'world-small-cap': return 'Je vois cet indice comme un complément au World : il ajoute les petites entreprises que le World classique laisse de côté. Il contient aussi des entreprises américaines.'
    case 'world-ex-usa': return 'Je retiens surtout que cet indice retire les États-Unis sans ajouter les marchés émergents. Il donne davantage de place aux autres pays développés déjà présents dans le World.'
    case 'em-standard': case 'em-esg': case 'msci-em-ex-china': return asia.length === 2 && sumRows(asia) > 40
      ? 'Je retiens surtout la place de Taïwan et de la Corée du Sud. À eux deux, ils représentent une grande partie de l’indice, même si les émergents couvrent bien d’autres pays.'
      : 'Je regarde les pays et les entreprises derrière le mot « émergents ». Selon l’indice choisi, leur place peut être très différente.'
    case 'stoxx600': return 'Je retiens surtout que cet indice dépasse la zone euro. Le Royaume-Uni et la Suisse en font partie, contrairement à l’EURO STOXX 50.'
    case 'mscieurope': return 'Je regarde aussi les secteurs : acheter des entreprises européennes, c’est investir dans des activités qui n’ont pas toutes le même poids dans cet indice.'
    case 'eurostoxx50': return top[0]?.[1] >= 10
      ? `Quand je regarde cette composition, je garde surtout le poids de ${companyLabel(top[0][0])} en tête. Avec ${top[0][1] > 10 ? 'plus de' : ''} 10 % de l’indice, ses variations comptent bien davantage que celles d’une entreprise qui n’en représente que 1 %.`.replace('  ', ' ')
      : concentration
    case 'topix': return 'Je regarde aussi la construction de l’indice. Le TOPIX donne davantage de poids aux entreprises selon leur valeur en Bourse et les actions disponibles à l’échange ; le Nikkei utilise les prix ajustés des actions.'
    case 'nikkei225': return 'Je retiens surtout sa règle de calcul : les prix ajustés des actions déterminent leur poids. Une entreprise peut donc peser lourd sans être la plus importante en valeur boursière.'
    case 'sp500-pea': case 'nasdaq-pea': return concentration
    case 'sp500-equal-weight': return 'Je trouve ce changement intéressant : on garde les entreprises du S&P 500, mais on leur redonne le même poids à chaque rééquilibrage. Entre deux rééquilibrages, les cours font évoluer ces poids.'
    case 'russell-2000': return 'Je vois cet indice comme un investissement dans les petites entreprises américaines. Il ne remplace pas une exposition aux grandes entreprises ou aux autres pays.'
    case 'msci-world-momentum': return 'Je regarde la composition du moment : la sélection suit les tendances récentes des cours. Les entreprises retenues et leur poids peuvent donc changer au fil des rééquilibrages.'
    case 'msci-world-minimum-volatility-usd': return 'Je regarde surtout comment les actions se comportent ensemble. L’indice cherche à réduire les variations de l’ensemble, pas seulement celles de chaque action. Il peut tout de même baisser.'
    case 'msci-world-sector-neutral-quality': return 'Je retiens que « Quality » décrit une méthode de sélection : rentabilité, dette et stabilité des bénéfices. Cela ne promet ni de meilleures performances ni une protection contre les baisses.'
    case 'msci-world-enhanced-value': return 'Je garde en tête qu’une entreprise jugée peu chère peut le rester longtemps. Le filtre compare son prix à ses données financières, sans prédire quand le cours remontera.'
    case 'ftse-epra-nareit-developed-dividend-plus': return 'Je regarde la valeur des actions autant que les dividendes reçus. Ces sociétés possèdent de l’immobilier, mais leur cours reste sensible à leur financement et aux marchés.'
    case 'ftse-global-core-infrastructure': return 'Je regarde les activités derrière le nom « infrastructures ». Ces entreprises exploitent des équipements utiles, mais leurs actions peuvent baisser comme celles des autres sociétés cotées.'
    default: return concentration
  }
}
