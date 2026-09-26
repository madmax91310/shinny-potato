const number = (value, digits = 2) => value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const pct = (value, digits = 2) => `${value > 0 ? '+' : ''}${number(value, digits)} %`
const weight = (value) => `${number(value, value % 1 === 0 ? 0 : 2)} %`

export function buildFactsheetTweet(sheet) {
  const lines = [
    sheet.intro,
    '',
    `${sheet.title} en chiffres :`,
    '',
    `📊 ${sheet.constituents.toLocaleString('fr-FR')} valeurs dans l’indice ${sheet.index}`,
    `🌍 ${sheet.markets}`,
  ]
  if (sheet.marketCap) lines.push(`💰 ${sheet.marketCap}`)
  if (sheet.isin) lines.push(`📍 ETF cité : ${sheet.isin}`)
  lines.push('', `La répartition géographique de l’indice ${sheet.index} :`)
  for (const [name, value] of sheet.countries) lines.push(`${name} → ${weight(value)}`)
  lines.push('', sheet.insight, '', sheet.sectors.reduce((sum, [, value]) => sum + value, 0) < 99 ? 'Les principaux secteurs :' : 'Les secteurs :')
  for (const [name, value] of sheet.sectors) lines.push(`${name} → ${weight(value)}`)
  lines.push('', `Les principales entreprises de l’indice (au ${sheet.snapshot.split(' (')[0].split(' · ')[0]}) :`)
  if (sheet.topWeight) lines.push(`Les dix premières lignes représentent ${weight(sheet.topWeight)} de l’indice.`)
  for (const [name, value] of sheet.holdings) lines.push(`• ${name} : ${weight(value)}`)
  lines.push('', `Les performances ${sheet.performance.kind === 'ETF' ? `de l’ETF ${sheet.isin}` : `de l’indice ${sheet.index}`} :`)
  lines.push(`${sheet.performance.detail}.`)
  for (const [year, value] of sheet.returns ?? []) lines.push(`${value >= 0 ? '📈' : '📉'} ${year} : ${pct(value)}`)
  if (sheet.performance.tenYear != null) lines.push(`Sur dix ans, au ${sheet.performance.date} : ${pct(sheet.performance.tenYear)} par an pour l’indice.`)
  if (sheet.performance.annualizedFiveYear != null) lines.push(`Sur cinq ans, au ${sheet.performance.date} : ${pct(sheet.performance.annualizedFiveYear)} par an pour l’indice.`)
  if (sheet.performance.historyNote) lines.push('', `⚠️ ${sheet.performance.historyNote}`)
  lines.push('', sheet.takeaway, '', 'Partagez à quelqu’un qui investit en ETF 🔁', '', `⚠️ Pas un conseil financier. Composition : ${sheet.snapshot}. Performances : ${sheet.performance.date}. Vérifiez les fiches avant publication.`)
  return lines.join('\n')
}
