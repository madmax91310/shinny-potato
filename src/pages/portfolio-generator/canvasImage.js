import { CATEGORIES, YEARS } from './data.js'

const GOLD = '#ecc36d'
const WHITE = '#f8f5ec'
const MUTED = '#abb8c4'
const BACK = '#09121c'

function percent(value) {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

export function annualizedReturn(perf) {
  if (!YEARS.every((year) => Number.isFinite(perf[year]))) return null
  const growth = YEARS.reduce((product, year) => product * (1 + perf[year] / 100), 1)
  return growth > 0 ? (Math.pow(growth, 1 / YEARS.length) - 1) * 100 : null
}

function colorOf(asset) {
  if (asset.id.includes('bitcoin')) return '#e9872f'
  if (asset.id.includes('silver') || asset.id.includes('argent')) return '#b6c2cd'
  if (asset.id.includes('or_') || asset.id === 'or') return '#e7bb58'
  if (asset.id === 'lqq' || asset.id === 'cl2') return '#f4d44f'
  return CATEGORIES[asset.cat]?.color || '#58baaf'
}

function chartSelection(selection) {
  const variants = {
    obligataire: ['#3987e5', '#75a8e8', '#4473b8'],
    actions_larges: ['#199e70', '#48bd91', '#26755d'],
    matieres_premieres: ['#d95926', '#efb454', '#b56832'],
    dividendes: ['#c98500', '#e3b44e', '#b28a32'],
    immobilier: ['#d55181', '#e181a2', '#a84474'],
    emergents: ['#5ead51', '#90c770', '#397e50'],
    crypto: ['#e66767', '#f09358', '#bd536a'],
  }
  const seen = {}
  return selection.map((asset) => {
    const position = seen[asset.cat] || 0
    seen[asset.cat] = position + 1
    const special = colorOf(asset)
    return { ...asset, chartColor: special !== CATEGORIES[asset.cat]?.color ? special : variants[asset.cat]?.[position % 3] || special }
  })
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function fit(ctx, text, width, size, min = 17, family = 'Georgia, serif') {
  let current = size
  while (current > min) {
    ctx.font = `bold ${current}px ${family}`
    if (ctx.measureText(text).width <= width) return current
    current -= 1
  }
  ctx.font = `bold ${min}px ${family}`
  return min
}

function textLines(ctx, text, width, maxLines = 3) {
  const lines = ['']
  for (const word of text.split(' ')) {
    const index = lines.length - 1
    const next = `${lines[index]} ${word}`.trim()
    if (lines[index] && ctx.measureText(next).width > width) lines.push(word)
    else lines[index] = next
  }
  if (lines.length > maxLines) {
    const keep = lines.slice(0, maxLines - 1)
    let last = lines.slice(maxLines - 1).join(' ')
    while (last.length && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1)
    return [...keep, `${last.trimEnd()}…`]
  }
  return lines
}

function backdrop(ctx, height) {
  const gradient = ctx.createLinearGradient(0, 0, 1080, height)
  gradient.addColorStop(0, '#14202a')
  gradient.addColorStop(.45, BACK)
  gradient.addColorStop(1, '#0d1824')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1080, height)
  // Discreet gold circuit traces echo the reference without copying its fixed labels or assets.
  ctx.strokeStyle = 'rgba(223, 164, 67, .20)'
  ctx.lineWidth = 2
  for (let index = 0; index < 9; index++) {
    const offset = index * 19
    for (const side of [0, 1]) {
      const x = side ? 1080 : 0
      const sign = side ? -1 : 1
      ctx.beginPath()
      ctx.moveTo(x, 130 + offset)
      ctx.lineTo(x + sign * (68 + index * 8), 130 + offset)
      ctx.lineTo(x + sign * (100 + index * 8), 96 + offset)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x + sign * (100 + index * 8), 96 + offset, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(235, 180, 82, .35)'
      ctx.fill()
    }
  }
  const glow = ctx.createRadialGradient(535, 585, 35, 535, 585, 530)
  glow.addColorStop(0, 'rgba(166, 123, 47, .21)')
  glow.addColorStop(1, 'rgba(166, 123, 47, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 180, 1080, 860)
}

function allocationBars(ctx, selection) {
  ctx.fillStyle = GOLD
  ctx.font = 'bold 25px Arial, sans-serif'
  ctx.fillText('ALLOCATION DU PORTEFEUILLE', 68, 305)
  selection.forEach((asset, index) => {
    const y = 354 + index * 91
    ctx.fillStyle = WHITE
    const size = fit(ctx, asset.name, 790, 31, 22, 'Arial, sans-serif')
    ctx.font = `bold ${size}px Arial, sans-serif`
    ctx.fillText(asset.name, 68, y)
    ctx.fillStyle = GOLD
    ctx.font = 'bold 35px Arial, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`${asset.pct} %`, 1012, y)
    ctx.textAlign = 'left'
    ctx.fillStyle = '#263849'
    ctx.fillRect(68, y + 15, 944, 22)
    ctx.fillStyle = asset.chartColor
    ctx.fillRect(68, y + 15, 944 * asset.pct / 100, 22)
  })
}

export function renderPortfolioImage(portfolio) {
  const selection = chartSelection(portfolio.selection.filter((asset) => asset.pct > 0).slice().sort((a, b) => b.pct - a.pct))
  const panelY = 385 + selection.length * 91
  const height = panelY + 565
  const canvas = document.createElement('canvas')
  canvas.width = 2160
  canvas.height = height * 2
  const ctx = canvas.getContext('2d')
  ctx.scale(2, 2)
  backdrop(ctx, height)
  ctx.textAlign = 'center'
  ctx.fillStyle = WHITE
  fit(ctx, 'EXEMPLE DE RÉPARTITION', 960, 55, 37)
  ctx.fillText('EXEMPLE DE RÉPARTITION', 540, 105)
  ctx.fillText('DE PATRIMOINE', 540, 168)
  const annualized = annualizedReturn(portfolio.perf)
  ctx.fillStyle = GOLD
  const heading = annualized === null ? 'Historique annuel incomplet' : `${percent(annualized)} annualisé de 2020 à 2025`
  fit(ctx, heading, 940, 47, 32)
  ctx.fillText(heading, 540, 234)
  ctx.textAlign = 'left'

  allocationBars(ctx, selection)

  ctx.fillStyle = 'rgba(7, 16, 25, .84)'
  roundedRect(ctx, 45, panelY, 990, 360, 28)
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.stroke()
  YEARS.forEach((year, index) => {
    const col = index % 3
    const row = Math.floor(index / 3)
    const x = 210 + col * 330
    const y = panelY + 84 + row * 164
    ctx.textAlign = 'center'
    ctx.fillStyle = WHITE
    ctx.font = 'bold 38px Georgia, serif'
    ctx.fillText(String(year), x, y)
    const value = portfolio.perf[year]
    ctx.fillStyle = Number.isFinite(value) && value < 0 ? '#e8a49a' : GOLD
    ctx.font = 'bold 45px Georgia, serif'
    ctx.fillText(Number.isFinite(value) ? percent(value) : 'n.d.', x, y + 61)
  })
  ctx.strokeStyle = 'rgba(236, 195, 109, .35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(87, panelY + 180)
  ctx.lineTo(993, panelY + 180)
  ctx.stroke()
  for (const col of [375, 705]) {
    ctx.beginPath()
    ctx.moveTo(col, panelY + 42)
    ctx.lineTo(col, panelY + 316)
    ctx.stroke()
  }

  const worst = portfolio.worst
  ctx.fillStyle = 'rgba(7, 16, 25, .86)'
  roundedRect(ctx, 87, panelY + 393, 906, 116, 25)
  ctx.fill()
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.fillStyle = WHITE
  const worstText = Number.isFinite(worst.value) ? `Pire année : ${percent(worst.value)} en ${worst.year}` : 'Pire année : non disponible'
  fit(ctx, worstText, 840, 43, 30)
  ctx.fillText(worstText, 540, panelY + 468)
  ctx.fillStyle = MUTED
  ctx.font = '17px Arial, sans-serif'
  ctx.fillText('Performances historiques simulées · Allocations repondérées chaque année · Devises non converties', 540, height - 23)
  return canvas
}
