// Affiche 3:4 pour un post X. Toutes les valeurs affichées viennent de la fiche sélectionnée.
const W = 1080
const H = 1440
const INK = '#0d1012'
const WHITE = '#f4f1eb'
const SOFT = '#b7b6b2'
const BRONZE = '#c6a474'
const LINE = '#464644'
const RED = '#d59687'

function write(ctx, value, x, y, size = 18, color = WHITE, weight = 400, align = 'left', family = 'Arial, sans-serif') {
  ctx.fillStyle = color
  ctx.font = `${weight} ${size}px ${family}`
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.fillText(String(value), x, y)
  ctx.textAlign = 'left'
}

function fit(ctx, value, width, size = 18, min = 12, weight = 400) {
  let current = size
  while (current > min) {
    ctx.font = `${weight} ${current}px Arial, sans-serif`
    if (ctx.measureText(value).width <= width) break
    current--
  }
  let result = value
  while (ctx.measureText(result).width > width && result.length > 2) result = `${result.slice(0, -2).trimEnd()}…`
  return [result, current]
}

function rule(ctx, y, color = LINE) {
  ctx.fillStyle = color
  ctx.fillRect(52, y, 976, 1)
}

function section(ctx, y, number, title) {
  write(ctx, number, 52, y + 1, 14, BRONZE, 700)
  write(ctx, title, 93, y - 3, 20, WHITE, 700)
  rule(ctx, y + 30)
}

function value(value, sign = false) {
  return `${sign && value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`
}

function countryName(name) {
  return name.replace(/[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]/gu, '').trim()
}

function heroTitle(sheet) {
  if (sheet.id === 'acwi') return ['47 MARCHÉS', '23 développés + 24 émergents']
  const title = sheet.markets.replace(/^grandes entreprises de /i, '').replace(/^grandes sociétés /i, '')
  return [title.toLocaleUpperCase('fr-FR'), 'COMPOSITION DE L’INDICE']
}

function sourceLabel(sheet) {
  return [...new Set(sheet.source.map((entry) => new URL(entry.url).hostname.replace(/^www\./, '').replace(/^research\./, '')))].join(' · ')
}

export function renderFactsheetImage(sheet) {
  const canvas = document.createElement('canvas')
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#191b1c')
  bg.addColorStop(0.4, INK)
  bg.addColorStop(1, '#0b0d0e')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(280, 170, 20, 280, 170, 650)
  glow.addColorStop(0, 'rgba(105,100,90,.13)')
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, 650)

  rule(ctx, 35, BRONZE)
  write(ctx, 'ÉPARGNANT LIBRE', 52, 53, 14, BRONZE, 700)
  write(ctx, `FICHE INDICE  /  ${sheet.snapshot.replaceAll(' ', ' ')}`, 1028, 54, 12, SOFT, 400, 'right')
  const [title, titleSize] = fit(ctx, sheet.title.toLocaleUpperCase('fr-FR'), 920, 57, 40)
  write(ctx, title, 540, 91, titleSize, WHITE, 400, 'center', 'Georgia, serif')
  rule(ctx, 173, BRONZE)

  const countries = [...sheet.countries].sort((a, b) => b[1] - a[1])
  const main = countries.find(([name]) => countryName(name).toLowerCase() !== 'autres') ?? countries[0]
  const otherCountries = sheet.countries.filter((entry) => entry !== main)
  ctx.lineWidth = 26
  ctx.strokeStyle = '#3a3b3b'
  ctx.beginPath()
  ctx.arc(215, 343, 127, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = BRONZE
  ctx.beginPath()
  ctx.arc(215, 343, 127, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * main[1] / 100)
  ctx.stroke()
  write(ctx, value(main[1]).replace(' %', ''), 215, 294, 44, WHITE, 700, 'center')
  write(ctx, '%', 215, 352, 22, BRONZE, 700, 'center')
  const [countryLabel, countrySize] = fit(ctx, countryName(main[0]).toLocaleUpperCase('fr-FR'), 210, 15, 12, 700)
  write(ctx, countryLabel, 215, 391, countrySize, SOFT, 700, 'center')

  const [heading, subheading] = heroTitle(sheet)
  const [headingText, headingSize] = fit(ctx, heading, 602, 29, 20, 700)
  write(ctx, headingText, 424, 216, headingSize, WHITE, 700)
  write(ctx, subheading, 424, 259, 17, SOFT)
  ctx.fillStyle = LINE
  ctx.fillRect(424, 303, 604, 1)
  const topTen = sheet.topWeight ?? sheet.holdings.slice(0, 10).reduce((sum, [, weight]) => sum + weight, 0)
  const horizon = sheet.performance.tenYear != null
    ? [value(sheet.performance.tenYear), 'SUR 10 ANS / AN']
    : sheet.performance.annualizedFiveYear != null
      ? [value(sheet.performance.annualizedFiveYear), 'SUR 5 ANS / AN']
      : [value(sheet.returns[0][1], true), 'EN 2025']
  const stats = [
    [sheet.constituents.toLocaleString('fr-FR'), 'ENTREPRISES'],
    [sheet.marketCap?.split(' de ')[0] ?? sheet.markets, sheet.marketCap ? 'CAPITALISATION' : 'MARCHÉS'],
    [value(topTen), 'TOP 10'],
    horizon,
  ]
  stats.forEach(([stat, label], i) => {
    const x = i % 2 ? 736 : 424
    const y = i < 2 ? 325 : 413
    const [statText, size] = fit(ctx, stat, i % 2 ? 292 : 282, 36, 23, 700)
    write(ctx, statText, x, y, size, WHITE, 700)
    write(ctx, label, x, y + 43, 16, BRONZE, 700)
  })

  section(ctx, 514, '01', 'PAYS')
  otherCountries.forEach(([name, weight], i) => {
    const x = 52 + (i % 3) * 333
    const y = 561 + Math.floor(i / 3) * 38
    const label = countryName(name)
    const [short, size] = fit(ctx, label, 175, 21, 16)
    write(ctx, short, x, y, size)
    write(ctx, value(weight), x + 289, y, 21, BRONZE, 700, 'right')
  })

  section(ctx, 664, '02', 'SECTEURS')
  sheet.sectors.forEach(([name, weight], i) => {
    const x = 52 + Math.floor(i / 6) * 507
    const y = 710 + (i % 6) * 37
    const [short, size] = fit(ctx, name, 340, 22, 17)
    write(ctx, short, x, y, size)
    write(ctx, value(weight), x + 465, y, 22, BRONZE, 700, 'right')
  })

  section(ctx, 953, '03', 'DIX PREMIÈRES ENTREPRISES')
  sheet.holdings.slice(0, 10).forEach(([name, weight], i) => {
    const x = 52 + Math.floor(i / 5) * 507
    const y = 1001 + (i % 5) * 37
    write(ctx, String(i + 1).padStart(2, '0'), x, y + 1, 14, BRONZE)
    const [short, size] = fit(ctx, name, 330, 22, 17)
    write(ctx, short, x + 35, y, size)
    write(ctx, value(weight), x + 465, y, 21, SOFT, 700, 'right')
  })

  section(ctx, 1222, '04', 'PERFORMANCES ANNUELLES')
  sheet.returns.slice().reverse().forEach(([year, performance], i) => {
    const x = 52 + i * 201
    write(ctx, year, x, 1275, 20, SOFT)
    write(ctx, value(performance, true), x, 1308, 25, performance < 0 ? RED : WHITE, 700)
  })
  rule(ctx, 1352, BRONZE)
  const [method, methodSize] = fit(ctx, sheet.performance.detail, 976, 14, 11)
  write(ctx, method, 52, 1363, methodSize, SOFT)
  if (sheet.performance.historyNote) {
    const [note, noteSize] = fit(ctx, sheet.performance.historyNote, 976, 12, 10)
    write(ctx, note, 52, 1384, noteSize, RED)
  }
  const source = `SOURCE : ${sourceLabel(sheet).toLocaleUpperCase('fr-FR')}  ·  ${sheet.snapshot.toLocaleUpperCase('fr-FR')}`
  const [sourceText, sourceSize] = fit(ctx, source, 976, 13, 10, 700)
  write(ctx, sourceText, 52, 1403, sourceSize, BRONZE, 700)
  write(ctx, 'Données historiques. Pas un conseil financier.', 52, 1424, 11, SOFT)
  write(ctx, `${sheet.index}  /  ${sheet.performance.date}`, 1028, 1424, 11, SOFT, 400, 'right')
  return canvas
}
