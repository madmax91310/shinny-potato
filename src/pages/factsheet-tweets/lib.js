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
  acwi: 'Tu connaissais la place des États-Unis dans le MSCI ACWI ?',
  'ftse-all-world': 'Tu pensais que les États-Unis pesaient autant dans le FTSE All-World ?',
  'world-small-cap': 'Tu ajouterais ces petites capitalisations à un ETF World classique ?',
  'world-ex-usa': 'Tu envisagerais un indice World sans les États-Unis ?',
  world: 'Quelle partie de cette répartition te surprend le plus ?',
  stoxx600: 'Tu connaissais cette répartition du STOXX Europe 600 ?',
  eurostoxx50: 'Tu pensais que l’EURO STOXX 50 était aussi concentré ?',
  mscieurope: 'Tu imaginais que la finance prenait autant de place dans le MSCI Europe ?',
  'em-esg': 'Tu connaissais la concentration de cet indice émergent ESG ?',
  'sp500-pea': 'Tu connaissais le poids de la technologie dans le S&P 500 ?',
  'nasdaq-pea': 'Tu pensais que le Nasdaq 100 était aussi concentré ?',
}

export function buildFactsheetTweet(sheet) {
  const lines = [
    sheet.intro,
    '',
    `📊 ${sheet.index} en chiffres`,
    '',
    `📊 ${(sheet.constituents ?? sheet.indexFacts.targetConstituents).toLocaleString('fr-FR') + (sheet.constituents === null ? ' sociétés visées' : ' valeurs')}`,
    `🌍 ${sheet.markets}`,
  ]
  if (sheet.marketCap) lines.push(`💰 ${sheet.marketCap}`)
  if (sheet.isin) lines.push(`📍 ETF cité : ${sheet.isin}`)
  lines.push('', '🌍 La répartition géographique de l’indice :')
  for (const [name, value] of sheet.countries) lines.push(`${name} → ${weight(value)}`)
  if (sheet.id === 'world') lines.push('', `Sur 100 € investis dans un ETF qui suit cet indice, environ ${Math.round(sheet.countries[0][1])} € correspondent donc aux entreprises américaines.`)
  else lines.push('', sheet.insight.replace(' au 31 août 2026', ''))
  lines.push('', sheet.sectors.length === 0 ? '⚖️ La pondération :' : sheet.sectors.reduce((sum, [, value]) => sum + value, 0) < 99 ? '🧩 Les principaux secteurs :' : '🧩 Les secteurs :')
  for (const [name, value] of sheet.sectors) lines.push(`${name} → ${weight(value)}`)
  if (!sheet.methodologyPanels) lines.push('', '🏢 Les principales entreprises de l’indice :')
  for (const [title, text] of sheet.methodologyPanels ?? []) lines.push('', title + ' :', text)
  if (sheet.methodologyPanels && sheet.holdings.length) lines.push('', '🏢 Les principales entreprises de l’indice :')
  for (const [name, value] of sheet.holdings) lines.push(`• ${name} : ${weight(value)}`)
  if (sheet.id === 'world') {
    const topWeight = sheet.holdings.reduce((sum, [, value]) => sum + value, 0)
    lines.push('', `Ces dix lignes représentent ensemble ${weight(topWeight)} de l’indice. Alphabet apparaît deux fois, avec deux catégories d’actions.`)
  }
  lines.push('', `📈 Les performances ${sheet.performance.kind === 'ETF' ? `de l’ETF ${sheet.isin}` : `de l’indice ${sheet.index}`} :`)
  lines.push(`${sheet.performance.detail}.`)
  for (const [year, value] of sheet.returns ?? []) lines.push(`${value >= 0 ? '📈' : '📉'} ${year} : ${pct(value)}`)
  if (sheet.performance.tenYear != null) lines.push(`Sur dix ans : ${pct(sheet.performance.tenYear)} par an pour l’indice.`)
  if (sheet.performance.annualizedFiveYear != null) lines.push(`Sur cinq ans : ${pct(sheet.performance.annualizedFiveYear)} par an pour l’indice.`)
  if (sheet.performance.historyNote) lines.push('', `⚠️ ${sheet.performance.historyNote.replace('Les poids sont ceux de l’indice au 31 août 2026 ; les rendements', 'Les rendements')}`)
  lines.push('', '📌 Ce que ça signifie pour ton placement', sheet.takeaway, '', `💬 ${questions[sheet.id]}`, '', '⚠️ Pas un conseil financier.')
  return lines.join('\n')
}
