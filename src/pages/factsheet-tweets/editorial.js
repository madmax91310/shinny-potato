// Revue du 10/10/2026 : un angle propre à chaque indice, sans vécu personnel inventé.
// Les chiffres et les constats de concentration sont dérivés de la fiche reçue.
export const INDEX_HOOKS = {
  world: 'Un ETF « monde », ça veut dire que ton argent est réparti un peu partout ? 🌍',
  acwi: 'Ajouter les émergents à un indice mondial change-t-il vraiment la répartition de ton argent ? 🌍',
  'ftse-all-world': 'Avec un ETF All-World, tu couvres de nombreux marchés. Mais lesquels prennent le plus de place ? 🌍',
  'acwi-imi': 'Des grandes entreprises aux plus petites, que contient un indice qui veut couvrir presque tout le marché mondial ? 🌍',
  'world-small-cap': 'Tu ajoutes des petites entreprises à ton portefeuille. Mais de quels pays viennent-elles ? 👀',
  'world-ex-usa': 'Si tu retires les États-Unis du World, où se retrouve ton argent ? 🌍',
  'em-standard': 'Quand tu lis « marchés émergents », quels pays te viennent en tête ? 🌏',
  'em-esg': 'Un ETF émergent avec un filtre ESG, qu’est-ce que ça change dans les entreprises que tu détiens ? 🌏',
  'msci-em-ex-china': 'Retirer la Chine des marchés émergents, est-ce que ça répartit davantage ton argent entre les autres pays ? 🌏',
  stoxx600: 'Investir en Europe, c’est forcément investir surtout dans la zone euro ? 🇪🇺',
  mscieurope: 'Un ETF européen contient-il les mêmes types d’entreprises qu’un ETF mondial ? 🇪🇺',
  eurostoxx50: 'Cinquante grandes entreprises de la zone euro : comment ton argent est-il réparti entre elles ? 🇪🇺',
  topix: 'Tu veux investir au Japon. Mais derrière le nom d’un indice, quelles entreprises prennent le plus de place ? 🇯🇵',
  nikkei225: 'Les 225 entreprises du Nikkei ont-elles toutes la même importance dans ton placement ? 🇯🇵',
  'sp500-pea': 'Avec le S&P 500, tu achètes de grandes entreprises américaines. Mais chacune ne reçoit pas la même part de ton argent 👀',
  'nasdaq-pea': 'Le Nasdaq-100, c’est une centaine de lignes. Mais combien pèsent vraiment les premières ? 👀',
  'sp500-equal-weight': 'Tu gardes les entreprises du S&P 500, mais tu changes leur poids. Est-ce encore la même exposition ? 🇺🇸',
  'russell-2000': 'Les petites entreprises américaines ont-elles la même répartition que les grandes ? 🇺🇸',
  'msci-world-momentum': 'Et si ton indice donnait davantage de place aux entreprises dont les cours ont récemment le mieux progressé ? 👀',
  'msci-world-minimum-volatility-usd': 'Chercher moins de volatilité, est-ce simplement acheter les actions qui bougent le moins ? 👀',
  'msci-world-sector-neutral-quality': 'Un indice « Quality » retient des entreprises selon leurs fondamentaux. Mais que regarde-t-il exactement ? 🔎',
  'msci-world-enhanced-value': 'Acheter des entreprises jugées peu chères, ça paraît séduisant. Mais peu chères par rapport à quoi ? 🔎',
  'ftse-epra-nareit-developed-dividend-plus': 'Avec un ETF immobilier, tu achètes des actions de sociétés immobilières. Où sont-elles et comment sont-elles sélectionnées ? 🏠',
  'ftse-global-core-infrastructure': 'Réseaux, transport, énergie : derrière un ETF infrastructures, quelles entreprises retrouves-tu vraiment ? 🏗️',
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
    [/^ASML/i, 'ASML'], [/^MICRON/i, 'Micron'], [/^BROADCOM/i, 'Broadcom'],
  ]
  return labels.find(([pattern]) => pattern.test(name))?.[1] ?? name
}

const joinNames = names => names.length < 2 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} et ${names.at(-1)}`

export function indexObservation(sheet) {
  const top = sortedRows(sheet.holdings).slice(0, 4)
  const total = sumRows(top)
  const countries = sortedRows(sheet.countries).filter(([name]) => !/autres|others/i.test(name))
  const usa = countries.find(([name]) => /États-Unis|United States/i.test(name))?.[1] ?? 0
  const asia = countries.filter(([name]) => /Taïwan|Taiwan|Corée|Korea/i.test(name))
  const [sector] = sortedRows(sheet.sectors)
  const names = joinNames(top.slice(0, 2).map(([name]) => companyLabel(name)))
  const concentration = total >= 15
    ? 'Je trouve ce poids utile à garder en tête : un grand nombre de titres ne donne pas forcément une petite place aux premières lignes.'
    : top.length ? 'Ce qui m’intéresse ici, c’est la place assez réduite des premières lignes. Regarder seulement leurs noms donnerait une idée incomplète du reste du panier.' : ''
  switch (sheet.id) {
    case 'world': return total >= 15
      ? `Ce qui me frappe, c’est qu’on peut détenir ${sheet.constituents > 1000 ? 'plus d’un millier de titres' : 'autant de titres'} et rester très exposé à quelques grandes entreprises. Le World répartit bien ton investissement, mais chaque entreprise est loin d’avoir le même poids.`
      : 'Pour comprendre cette répartition, je regarderais les poids autant que le nombre de titres. Toutes les entreprises ne prennent pas la même place dans le World.'
    case 'acwi': case 'ftse-all-world': case 'acwi-imi': return usa > 50
      ? 'Ce qui m’intéresse, c’est que l’univers s’élargit sans faire disparaître la majorité américaine. Ajouter des marchés ou des entreprises ne leur donne pas automatiquement autant de place qu’aux plus grandes lignes.'
      : 'Je trouve utile de distinguer les marchés couverts de leur poids réel. Un univers mondial ne veut pas dire que chaque pays ou entreprise reçoit la même part.'
    case 'world-small-cap': return 'Ce qui m’intéresse dans ce panier, c’est qu’il change la taille des entreprises auxquelles on s’expose. Je regarderais aussi les pays : ajouter des small caps ne veut pas forcément dire réduire le poids américain.'
    case 'world-ex-usa': return 'Je trouve cette répartition plus parlante que le seul nom « ex-USA ». Retirer un pays donne davantage de place aux autres, mais ne les rend pas égaux et ne supprime pas le risque actions.'
    case 'em-standard': case 'em-esg': case 'msci-em-ex-china': return asia.length === 2 && sumRows(asia) > 40
      ? 'Ce qui me frappe, c’est la place cumulée de Taïwan et de la Corée du Sud. Le mot « émergents » couvre de nombreux marchés, mais ces deux pays prennent beaucoup de place dans cette photographie.'
      : 'Pour comprendre cette exposition, je regarderais la place de chaque pays et des principales entreprises. L’étiquette « émergents » ne suffit pas à décrire la répartition.'
    case 'stoxx600': return 'Ce qui m’intéresse ici, c’est le périmètre européen au-delà de la zone euro. Choisir cet indice, ce n’est pas simplement choisir davantage d’entreprises dans les mêmes pays que l’EURO STOXX 50.'
    case 'mscieurope': return sector
      ? `C’est la place du secteur ${plainLabel(sector[0]).toLowerCase()} qui retient mon attention. Le nom « Europe » décrit une zone ; les poids sectoriels montrent les activités auxquelles on s’expose.`
      : 'Je regarderais les secteurs autant que les pays pour comprendre ce qu’apporte ce panier européen.'
    case 'eurostoxx50': return `${concentration} Avec cinquante entreprises de la zone euro, je regarderais donc autant la taille des premières lignes que la longueur de la liste.`
    case 'topix': return 'Pour comparer deux indices japonais, je ne m’arrêterais pas au pays. Le nombre de titres et la règle de pondération peuvent donner une place très différente aux mêmes entreprises.'
    case 'nikkei225': return `${concentration} Ce qui m’intéresse aussi, c’est sa pondération liée aux prix ajustés des actions : elle ne donne pas simplement plus de poids aux plus grandes entreprises en capitalisation.`
    case 'sp500-pea': case 'nasdaq-pea': return `${concentration} ${names ? `Des noms comme ${names} sont familiers, mais c’est leur poids cumulé qui permet de mesurer leur place dans le placement.` : ''}`
    case 'sp500-equal-weight': return 'C’est ce changement de poids que je trouve intéressant : on garde le même univers d’entreprises, mais on modifie la place de chacune. L’égalité est rétablie au rééquilibrage ; les cours font ensuite évoluer les poids.'
    case 'russell-2000': return `${concentration} Je regarderais ce panier comme une exposition à un segment précis des États-Unis, plutôt que comme une version miniature de tout le marché mondial.`
    case 'msci-world-momentum': return 'Ce qui m’intéresse dans le Momentum, c’est que la sélection suit les tendances récentes. Je regarderais donc la composition du moment avant d’imaginer y retrouver les mêmes entreprises et les mêmes poids que dans le World classique.'
    case 'msci-world-minimum-volatility-usd': return 'Je trouve important de regarder comment le panier est construit : il tient compte des corrélations entre les titres, pas seulement de chaque action prise séparément. Chercher moins de volatilité ne rend pas le placement garanti.'
    case 'msci-world-sector-neutral-quality': return 'Ce qui m’intéresse ici, c’est que « Quality » correspond à des critères de sélection précis. Je ne le lirais pas comme un label qui promet de meilleures performances ou empêche les pertes.'
    case 'msci-world-enhanced-value': return 'Je comprends l’intérêt de regarder le prix par rapport aux fondamentaux. Mais une entreprise sélectionnée comme peu chère peut le rester : le filtre ne donne ni une date de rebond ni une garantie de gain.'
    case 'ftse-epra-nareit-developed-dividend-plus': return 'Ce qui m’intéresse, c’est qu’on reste propriétaire d’actions de sociétés immobilières, avec leurs risques de financement et de marché. Le revenu distribué ne raconte pas à lui seul ce que devient la valeur des parts.'
    case 'ftse-global-core-infrastructure': return 'Je trouve les activités de ces entreprises plus parlantes que l’étiquette « infrastructures ». Elles restent cotées en Bourse : leur rôle dans les réseaux ou le transport ne protège pas leur cours des baisses.'
    default: return concentration || 'Je regarderais les règles de sélection et les poids avant de résumer ce panier à son nom.'
  }
}
