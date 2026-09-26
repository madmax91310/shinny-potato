const number = (value, digits = 2) => value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const pct = (value, digits = 2) => `${value > 0 ? '+' : ''}${number(value, digits)} %`
const weight = (value) => `${number(value, value % 1 === 0 ? 0 : 2)} %`

const questions = {
  acwi: 'Tu connaissais la place des États-Unis dans le MSCI ACWI ?',
  'ftse-all-world': 'Tu pensais que les États-Unis pesaient autant dans le FTSE All-World ?',
  'world-small-cap': 'Tu connaissais cet indice de petites capitalisations ?',
  'world-ex-usa': 'Tu envisagerais un indice World sans les États-Unis ?',
  world: 'Tu connaissais le poids des dix premières entreprises du MSCI World ?',
  stoxx600: 'Tu connaissais cette répartition du STOXX Europe 600 ?',
  eurostoxx50: 'Tu pensais que l’EURO STOXX 50 était aussi concentré ?',
  mscieurope: 'Tu connaissais cet indice ?',
  'em-esg': 'Tu connaissais la concentration de cet indice émergent ESG ?',
  'sp500-pea': 'Tu connaissais le poids de la technologie dans le S&P 500 ?',
  'nasdaq-pea': 'Tu pensais que le Nasdaq 100 était aussi concentré ?',
}

export function buildFactsheetTweet(sheet) {
  const lines = [
    sheet.intro,
    '',
    `${sheet.index} en chiffres 👇`,
    '',
    `📊 ${sheet.constituents.toLocaleString('fr-FR')} valeurs`,
    `🌍 ${sheet.markets}`,
  ]
  if (sheet.marketCap) lines.push(`💰 ${sheet.marketCap}`)
  if (sheet.isin) lines.push(`📍 ETF cité : ${sheet.isin}`)
  lines.push('', 'La répartition géographique de l’indice :')
  for (const [name, value] of sheet.countries) lines.push(`${name} → ${weight(value)}`)
  lines.push('', sheet.insight, '', sheet.sectors.reduce((sum, [, value]) => sum + value, 0) < 99 ? 'Les principaux secteurs :' : 'Les secteurs :')
  for (const [name, value] of sheet.sectors) lines.push(`${name} → ${weight(value)}`)
  lines.push('', `Les principales entreprises de l’indice (au ${sheet.snapshot.split(' (')[0].split(' · ')[0]}) :`)
  for (const [name, value] of sheet.holdings) lines.push(`• ${name} : ${weight(value)}`)
  lines.push('', `Les performances ${sheet.performance.kind === 'ETF' ? `de l’ETF ${sheet.isin}` : `de l’indice ${sheet.index}`} :`)
  lines.push(`${sheet.performance.detail}.`)
  for (const [year, value] of sheet.returns ?? []) lines.push(`${value >= 0 ? '📈' : '📉'} ${year} : ${pct(value)}`)
  if (sheet.performance.tenYear != null) lines.push(`Sur dix ans, au ${sheet.performance.date} : ${pct(sheet.performance.tenYear)} par an pour l’indice.`)
  if (sheet.performance.annualizedFiveYear != null) lines.push(`Sur cinq ans, au ${sheet.performance.date} : ${pct(sheet.performance.annualizedFiveYear)} par an pour l’indice.`)
  if (sheet.performance.historyNote) lines.push('', `⚠️ ${sheet.performance.historyNote}`)
  lines.push('', sheet.takeaway, '', `💬 ${questions[sheet.id]}`, '', '⚠️ Pas un conseil financier.')
  return lines.join('\n')
}
