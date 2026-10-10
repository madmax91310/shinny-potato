import { indexHook, indexObservation, sortedRows, sumRows, plainLabel, companyLabel } from './editorial.js'

const number = (value, digits = 2) => value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const pct = (value, digits = 2) => `${value > 0 ? '+' : ''}${number(value, digits)} %`
const weight = (value) => `${number(value, value % 1 === 0 ? 0 : 2)} %`

const questions = {
  'ftse-epra-nareit-developed-dividend-plus': 'Tu préfèrerais l’immobilier coté ou une exposition plus large aux infrastructures ?',
  'ftse-global-core-infrastructure': 'Tu connaissais la place des réseaux d’énergie et du transport dans cet indice ?',
  'msci-world-momentum': 'Tu choisirais les tendances récentes ou le World classique ?',
  'msci-world-minimum-volatility-usd': 'Tu accepterais une autre répartition pour viser moins de volatilité ?',
  'msci-world-sector-neutral-quality': 'Tu choisirais le filtre Quality ou le World classique ?',
  'msci-world-enhanced-value': 'Tu accepterais des résultats différents du World pour un filtre Value ?',
  'msci-em-ex-china': 'Tu retirerais la Chine, même si cela renforce le poids d’autres pays ?',
  'acwi-imi': 'Tu réunirais les émergents et les petites entreprises dans une seule ligne mondiale ?',
  'sp500-equal-weight': 'Tu préfères un poids égal ou un poids lié à la taille des entreprises ?',
  'russell-2000': 'Tu ferais une place aux petites entreprises américaines ?',
  'em-standard': 'Tu imaginais Taïwan et la Corée aussi présents dans les émergents ?',
  topix: 'Pour le Japon, tu choisirais le TOPIX ou le Nikkei 225 ?',
  nikkei225: 'Tu connaissais le poids des trois premières valeurs du Nikkei 225 ?',
  acwi: 'Tu imaginais les États-Unis aussi présents dans un indice qui inclut les émergents ?',
  'ftse-all-world': 'Tu pensais que les États-Unis pesaient autant dans le FTSE All-World ?',
  'world-small-cap': 'Tu ajouterais ces petites capitalisations à un ETF World classique ?',
  'world-ex-usa': 'Tu envisagerais un indice World sans les États-Unis ?',
  world: 'Cette répartition te convient comme base de portefeuille ou tu préfères donner davantage de place aux autres marchés ?',
  stoxx600: 'Tu connaissais cette répartition du STOXX Europe 600 ?',
  eurostoxx50: 'Tu connaissais le poids des premières entreprises de l’EURO STOXX 50 ?',
  mscieurope: 'Tu imaginais que la finance prenait autant de place dans le MSCI Europe ?',
  'em-esg': 'Tu connaissais la concentration de cet indice émergent ESG ?',
  'sp500-pea': 'Tu connaissais le poids de la technologie dans le S&P 500 ?',
  'nasdaq-pea': 'Tu pensais que le Nasdaq 100 était aussi concentré ?',
}

export function buildFactsheetTweet(sheet) {
  const count = sheet.constituents ?? sheet.indexFacts?.targetConstituents
  const countText = Number.isFinite(count) ? `${count.toLocaleString('fr-FR')} ${sheet.constituents === null ? 'sociétés visées' : 'titres'}` : 'les titres de son univers'
  const scopes = {
    world: 'Il couvre les grandes et moyennes entreprises des pays développés.',
    acwi: 'Il couvre 23 pays développés et 24 marchés émergents.',
    'ftse-all-world': 'Il couvre les grandes et moyennes entreprises des pays développés et émergents.',
    'acwi-imi': 'Il couvre les grandes, moyennes et petites entreprises des pays développés et émergents.',
    'world-small-cap': 'Il couvre les petites entreprises des pays développés.',
    'world-ex-usa': 'Il couvre les grandes et moyennes entreprises des pays développés, hors États-Unis.',
    'em-standard': 'Il couvre les grandes et moyennes entreprises des marchés émergents.',
    'em-esg': 'Il couvre les marchés émergents hors Égypte, avec des filtres ESG et climatiques.',
    'msci-em-ex-china': 'Il couvre les grandes et moyennes entreprises des marchés émergents, hors Chine.',
    stoxx600: 'Il couvre les grandes, moyennes et petites entreprises de plusieurs pays européens.',
    mscieurope: 'Il couvre les grandes et moyennes entreprises des pays développés européens.',
    topix: 'Il couvre un large ensemble d’entreprises japonaises.',
    nikkei225: 'Il couvre une sélection d’entreprises cotées à Tokyo.',
    'sp500-pea': 'Il couvre de grandes entreprises américaines.',
    'nasdaq-pea': 'Il couvre de grandes entreprises non financières cotées au Nasdaq.',
    'sp500-equal-weight': 'Il reprend les entreprises du S&P 500, avec un poids égal à chaque rééquilibrage.',
    'russell-2000': 'Il couvre les petites entreprises américaines.',
    'msci-world-momentum': 'Il sélectionne des entreprises du World selon les tendances récentes de leurs cours.',
    'msci-world-minimum-volatility-usd': 'Il sélectionne des entreprises du World pour chercher à réduire les variations de l’ensemble.',
    'msci-world-sector-neutral-quality': 'Il sélectionne des entreprises du World selon leur rentabilité, leur dette et la stabilité de leurs bénéfices.',
    'msci-world-enhanced-value': 'Il sélectionne des entreprises du World selon leur prix rapporté à leurs données financières.',
    'ftse-epra-nareit-developed-dividend-plus': 'Il sélectionne des sociétés immobilières des pays développés hors Grèce, avec un critère de dividendes.',
    'ftse-global-core-infrastructure': 'Il sélectionne des entreprises d’infrastructures des pays développés et émergents.',
  }
  const universe = sheet.id === 'eurostoxx50'
    ? 'Cet indice regroupe 50 grandes entreprises de la zone euro. Le Royaume-Uni et la Suisse n’en font donc pas partie.'
    : `Le ${sheet.index} regroupe ${countText}. ${scopes[sheet.id] ?? ''} Voici sa répartition 👇`
  const lines = [indexHook(sheet), '', universe]


  const countries = sortedRows(sheet.countries)
  const named = countries.filter(([name]) => !/autres|others/i.test(name))
  const shownCountries = named.slice(0, 5)
  const rest = sumRows(countries) - sumRows(shownCountries)
  if (shownCountries.length) {
    lines.push('', '🌍 Les principaux pays')
    for (const [name, value] of shownCountries) lines.push(`${countryLabel(name)} : ${weight(value)}`)
    if (rest > 0.005) lines.push(`🌍 Autres pays : ${weight(rest)}`)
    if (sheet.id === 'eurostoxx50') {
      const franceGermany = named.filter(([name]) => /France|Allemagne|Germany/i.test(name))
      if (franceGermany.length === 2) lines.push('', `La France et l’Allemagne représentent ensemble ${weight(sumRows(franceGermany))} de l’indice.`)
    }
  }

  const sectors = sortedRows(sheet.sectors).slice(0, 3)
  if (sectors.length) {
    lines.push('', '🧩 Les principaux secteurs')
    for (const [name, value] of sectors) lines.push(`${plainLabel(name)} : ${weight(value)}`)
    if (sheet.indexFacts?.sectorMethod) lines.push(`La classification utilisée est celle de la fiche : ${sheet.indexFacts.sectorMethod}.`)
  }
  for (const [title, text] of sheet.methodologyPanels ?? []) lines.push('', `🔎 ${title.charAt(0) + title.slice(1).toLowerCase()}`, text)

  const holdings = sortedRows(sheet.holdings).slice(0, 4)
  if (holdings.length) {
    lines.push('', 'Voici les entreprises qui pèsent le plus :')
    for (const [i, [name, value]] of holdings.entries()) lines.push(`${['🥇', '🥈', '🥉', '📍'][i]} ${companyLabel(name)} : ${weight(value)}`)
    // Catégories d’actions : on parle de lignes pour ne pas compter deux fois une entreprise.
    const names = holdings.map(([name]) => companyLabel(name).replace(/ \(classe [AC]\)$/, ''))
    const noun = new Set(names).size === holdings.length ? 'entreprises' : 'lignes'
    const words = ['zéro', 'une', 'deux', 'trois', 'quatre'][holdings.length]
    lines.push('', holdings.length === 1
      ? `Cette première ligne représente ${weight(sumRows(holdings))} de l’indice.`
      : `À elles seules, ces ${words} ${noun} représentent ${weight(sumRows(holdings))} de l’indice.`)
  }
  lines.push('', indexObservation(sheet))
  // Conserver les réserves spécifiques ; les anciennes phrases de top 10 sont remplacées
  // par la somme des lignes réellement présentées ci-dessus.
  if (sheet.takeaway && !/Les principales lignes publiées représentent/.test(sheet.takeaway)) lines.push('', sheet.takeaway)

  lines.push('', `📈 Les performances ${sheet.performance.kind === 'ETF' ? `de l’ETF ${sheet.isin}` : `de l’indice ${sheet.index}`} :`)
  lines.push(`${sheet.performance.detail.replace(/\.$/, '')}.`)
  for (const [year, value] of sheet.returns ?? []) lines.push(`${value >= 0 ? '📈' : '📉'} ${year} : ${pct(value)}`)
  if (sheet.performance.tenYear != null) lines.push(`Sur dix ans : ${pct(sheet.performance.tenYear)} par an pour l’indice.`)
  if (sheet.performance.annualizedFiveYear != null) lines.push(`Sur cinq ans : ${pct(sheet.performance.annualizedFiveYear)} par an pour l’indice.`)
  if (sheet.performance.historyNote) lines.push('', `⚠️ ${sheet.performance.historyNote.replace('Les poids sont ceux de l’indice au 31 août 2026 ; les rendements', 'Les rendements')}`)
  if (sheet.performance.kind === 'indice') {
    const priceReturn = /hors dividendes|Price Return/i.test(sheet.performance.detail)
    const dollars = /USD|dollars/i.test(sheet.performance.detail)
    lines.push('', priceReturn
      ? 'Les dividendes ne sont pas comptés dans ces chiffres : leur réinvestissement aurait donné un résultat différent.'
      : dollars
        ? 'Pour un ETF en euros, le change et les frais peuvent modifier ces résultats.'
        : 'Les frais et le suivi de l’indice peuvent modifier le résultat d’un ETF.')
  }
  const question = ['em-standard', 'em-esg', 'msci-em-ex-china'].includes(sheet.id)
    ? 'Cette répartition correspond à ce que tu recherches dans les marchés émergents ?'
    : questions[sheet.id] ?? 'Quel détail de cette composition retient ton attention ?'
  const firstHolding = sortedRows(sheet.holdings)[0]
  const closing = sheet.id === 'eurostoxx50' && firstHolding?.[1] >= 10
    ? `Tu savais que ${companyLabel(firstHolding[0])} prenait autant de place dans l’EURO STOXX 50 ?` : question
  lines.push('', `💬 ${closing}`)
  return lines.join('\n')
}

function countryLabel(name) {
  if (/^[^\p{L}\p{N}]/u.test(name)) return name
  const flags = { 'États-Unis': '🇺🇸', Japon: '🇯🇵', 'Royaume-Uni': '🇬🇧', France: '🇫🇷', Suisse: '🇨🇭', Allemagne: '🇩🇪', 'Pays-Bas': '🇳🇱', Espagne: '🇪🇸', Italie: '🇮🇹', Canada: '🇨🇦' }
  return flags[name] ? `${flags[name]} ${name}` : name
}
