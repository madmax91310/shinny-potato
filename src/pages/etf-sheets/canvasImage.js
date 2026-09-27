// Carte ETF : ticker, ISIN et frais lisibles immédiatement dans le fil mobile.
// Toutes les valeurs proviennent de la fiche et sont réutilisées sans les dupliquer.
const W = 1080
const H = 1350
const C = { paper: '#F6F3EA', ink: '#122E42', blue: '#193DB6', accent: '#D55C42', soft: '#C7D3EE', muted: '#697C87', white: '#FFFFFF', line: '#B8C6CA' }

function text(ctx, value, x, y, size, color = C.ink, family = 'Arial, sans-serif', align = 'left', weight = 700) {
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.font = `${weight} ${size}px ${family}`
  ctx.fillText(String(value), x, y)
}

function fit(ctx, value, maxWidth, startSize, family = 'Arial, sans-serif', minSize = 22) {
  let size = startSize
  do {
    ctx.font = `700 ${size}px ${family}`
    if (ctx.measureText(String(value)).width <= maxWidth) break
    size -= 2
  } while (size > minSize)
  return size
}

function wrapped(ctx, value, maxWidth, maxLines, size) {
  ctx.font = `700 ${size}px Georgia, serif`
  const lines = ['']
  for (const word of value.split(/\s+/)) {
    const index = lines.length - 1
    const next = lines[index] ? `${lines[index]} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && lines[index] && lines.length < maxLines) lines.push(word)
    else lines[index] = next
  }
  return lines
}

function card(ctx, x, y, w, h, color, radius = 10) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.fill()
}

export function renderETFImage(etf) {
  const canvas = document.createElement('canvas')
  canvas.width = W * 2
  canvas.height = H * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  ctx.fillStyle = C.paper
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = C.blue
  ctx.fillRect(0, 0, W, 16)
  text(ctx, '@Epargnantlibre', 60, 43, 30)
  text(ctx, 'FICHE ETF', 1020, 46, 27, C.blue, 'monospace', 'right')
  ctx.fillStyle = C.ink
  ctx.fillRect(60, 105, 960, 3)

  const fullName = etf.name.replace(/\s+UCITS\s+ETF(?:\s+Acc)?$/i, '')
  let nameSize = 66
  let nameLines = wrapped(ctx, fullName, 960, 3, nameSize)
  while (nameSize > 48 && nameLines.some((line) => ctx.measureText(line).width > 960)) {
    nameSize -= 2
    nameLines = wrapped(ctx, fullName, 960, 3, nameSize)
  }
  nameLines.forEach((line, i) => text(ctx, line, 60, 143 + i * 76, nameSize, C.ink, 'Georgia, serif'))
  text(ctx, etf.category.toUpperCase(), 60, 391, fit(ctx, etf.category.toUpperCase(), 950, 30), C.muted)

  card(ctx, 56, 455, 968, 258, C.blue, 14)
  for (let x = 846; x < 1012; x += 16) {
    ctx.strokeStyle = '#385BCC'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x, 465); ctx.lineTo(x - 107, 703); ctx.stroke()
  }
  text(ctx, etf.tickers.length > 1 ? 'TICKERS' : 'TICKER', 81, 480, 34, C.soft, 'monospace')
  const tickers = etf.tickers.join(' / ')
  text(ctx, tickers, 78, 537, fit(ctx, tickers, 914, 139, 'Arial, sans-serif', 56), C.white)

  card(ctx, 59, 754, 962, 151, C.ink, 9)
  text(ctx, 'CODE ISIN', 84, 771, 30, '#B6C6D2', 'monospace')
  text(ctx, etf.isin, 83, 816, fit(ctx, etf.isin, 911, 55, 'monospace', 40), C.white, 'monospace')

  text(ctx, 'FRAIS ANNUELS', 60, 939, 35)
  text(ctx, etf.ter, 58, 976, fit(ctx, etf.ter, 970, 135), C.accent)
  ctx.fillStyle = C.line
  ctx.fillRect(60, 1149, 960, 2)

  // Certaines fiches (or, bitcoin) ont une longue précision après « : » ou « — ».
  // Le bandeau affiche le nombre d'actifs ; la précision demeure dans la fiche complète.
  const positions = etf.positions.split(/\s*(?:—|:|\()\s*/)[0].toUpperCase()
  const tags = [etf.pea ? 'PEA' : 'CTO', etf.distribution.toUpperCase(), positions]
  const slots = [{ x: 60, width: 135 }, { x: 225, width: 390 }, { x: 650, width: 370 }]
  tags.forEach((tag, index) => {
    const { x, width } = slots[index]
    const size = fit(ctx, tag, width, 28, 'Arial, sans-serif', 20)
    text(ctx, tag, x, 1171, size, index === 0 ? C.blue : C.ink)
  })
  text(ctx, etf.location, 60, 1242, fit(ctx, etf.location, 960, 26), C.muted, 'Arial, sans-serif', 'left', 400)
  text(ctx, 'Informations à vérifier avant publication · Pas un conseil en investissement', 60, 1300, 19, C.muted, 'Arial, sans-serif', 'left', 400)
  return canvas
}
