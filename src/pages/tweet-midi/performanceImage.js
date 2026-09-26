import { getAnnualReturns } from './data/marketHistory.js'
import { getMarketAsset, MODES } from './lib.js'

const W = 1600
const C = { paper: '#F1ECDF', ink: '#173D38', green: '#257B68', coral: '#C86F61', muted: '#73827A', card: '#FFFCF5', grid: '#E3E7DA' }
const number = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
const cumulative = (rows) => (rows.reduce((acc, row) => acc * (1 + row.pct / 100), 1) - 1) * 100

function text(ctx, value, x, y, size, color = C.ink, face = 'sans', align = 'left', weight = 700) {
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  ctx.font = `${weight} ${size}px ${face === 'serif' ? 'Georgia, "Times New Roman", serif' : 'Arial, sans-serif'}`
  ctx.fillText(value, x, y)
}

function rounded(ctx, x, y, w, h, radius, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.fill()
}

function header(ctx, title, year, comparative) {
  ctx.fillStyle = C.coral; ctx.fillRect(0, 0, W, 22)
  ctx.fillStyle = C.ink; ctx.fillRect(0, 22, W, 5)
  ctx.fillStyle = '#C2C8B8'; ctx.fillRect(78, 88, 1444, 2)
  text(ctx, '@Epargnantlibre', 83, 107, 36)
  text(ctx, 'SÉRIE / PERFORMANCE DEPUIS', 1518, 107, 29, C.muted, 'sans', 'right')
  let titleSize = comparative ? 94 : 148
  while (titleSize > 55) {
    ctx.font = `700 ${titleSize}px Georgia, serif`
    if (ctx.measureText(title).width <= 1390) break
    titleSize -= 4
  }
  text(ctx, title, 800, comparative ? 217 : 197, titleSize, C.ink, 'serif', 'center')
  text(ctx, `DEPUIS ${year}`, 800, comparative ? 373 : 402, 52, C.coral, 'sans', 'center')
  ctx.fillStyle = C.ink; ctx.fillRect(80, 477, 1440, 4)
}

function summary(ctx, pct, y = 545) {
  rounded(ctx, 83, y, 14, 320, 7, C.coral)
  text(ctx, 'PERFORMANCE CUMULÉE', 131, y, 43, C.muted)
  text(ctx, number(pct), 119, y + 82, 181)
}

function plot(ctx, returns, x, top, width, height) {
  if (!returns.length) return
  const bottom = top + height
  const max = Math.max(...returns.map((r) => Math.abs(r.pct)), 25)
  // Keep the longest negative bar clear of the year labels, including volatile assets.
  const range = Math.min(240, height * 0.36)
  const axis = top + range + 90
  const gap = width / returns.length
  const barW = Math.min(156, gap * 0.67)
  const labelFont = returns.length > 8 ? 30 : returns.length > 6 ? 36 : 43
  const yearFont = returns.length > 8 ? 34 : 48
  for (const offset of [-range, -range / 2, range / 2]) {
    ctx.fillStyle = C.grid; ctx.fillRect(x, axis + offset, width, 2)
  }
  ctx.fillStyle = C.ink; ctx.fillRect(x, axis, width, 5)
  returns.forEach(({ year, pct }, i) => {
    const center = x + gap * (i + 0.5)
    const h = Math.max(5, Math.abs(pct) / max * range)
    const positive = pct >= 0
    const barTop = positive ? axis - h : axis + 4
    rounded(ctx, center - barW / 2, barTop, barW, h, 11, positive ? C.green : C.coral)
    rounded(ctx, center - barW / 2 + 11, barTop + 9, 6, Math.max(4, h - 18), 3, positive ? '#54A38A' : '#E49A89')
    text(ctx, number(pct), center, positive ? barTop - labelFont - 18 : barTop + Math.min(h - labelFont - 12, 36), labelFont, positive ? C.ink : C.card, 'sans', 'center')
    text(ctx, String(year), center, bottom - 72, yearFont, C.ink, 'sans', 'center')
  })
}

function card(ctx, rows, y, height, label, total) {
  rounded(ctx, 77, y + 13, 1451, height, 32, '#D9D5C9')
  rounded(ctx, 70, y, 1450, height, 32, C.card)
  text(ctx, label, 117, y + 43, 38)
  text(ctx, number(total), 1477, y + 43, 40, C.green, 'sans', 'right')
  ctx.fillStyle = '#D8DCCF'; ctx.fillRect(114, y + 126, 1362, 2)
  plot(ctx, rows, 110, y + 158, 1370, height - 208)
}

export function renderPerformanceImage(item) {
  const comparative = item.mode === MODES.COMPARATIF
  const assets = comparative ? [getMarketAsset(item.assetIdA), getMarketAsset(item.assetIdB)] : [getMarketAsset(item.assetId)]
  if (assets.some((asset) => !asset)) throw new Error('Actif absent')
  const lastYear = comparative ? Math.min(...assets.map((asset) => getAnnualReturns(asset.id, item.year).at(-1)?.year ?? Infinity)) : Infinity
  const rows = assets.map((asset) => ({ asset, returns: getAnnualReturns(asset.id, item.year).filter((r) => r.year <= lastYear) }))
  if (rows.some((row) => !row.returns.length)) throw new Error('Performances annuelles absentes')
  const height = comparative ? 2600 : 2000
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, height)
  header(ctx, comparative ? `${assets[0].label} / ${assets[1].label}` : assets[0].label, item.year, comparative)
  if (comparative) {
    const ordered = rows.map((r) => ({ ...r, total: cumulative(r.returns) })).sort((a, b) => b.total - a.total)
    card(ctx, ordered[0].returns, 558, 880, ordered[0].asset.label, ordered[0].total)
    card(ctx, ordered[1].returns, 1490, 880, ordered[1].asset.label, ordered[1].total)
    const note = assets[0].currency !== assets[1].currency ? `DEVISES ${assets[0].currency} / ${assets[1].currency} · SANS CONVERSION` : `COURS EN ${assets[0].currency} · SANS CONVERSION EN EUR`
    text(ctx, note, 1518, 2490, 31, C.muted, 'sans', 'right')
  } else {
    summary(ctx, cumulative(rows[0].returns))
    text(ctx, `Sur ${rows[0].returns.length} année${rows[0].returns.length > 1 ? 's' : ''} · cours en ${assets[0].currency === 'USD' ? 'dollars' : 'euros'}`, 130, 825, 40, C.muted, 'sans', 'left', 400)
    card(ctx, rows[0].returns, 954, 900, 'RENDEMENT PAR ANNÉE', cumulative(rows[0].returns))
    rounded(ctx, 86, 1910, 21, 21, 11, C.green); text(ctx, 'Hausse', 120, 1904, 31, C.muted, 'sans', 'left', 400)
    rounded(ctx, 290, 1910, 21, 21, 11, C.coral); text(ctx, 'Baisse', 324, 1904, 31, C.muted, 'sans', 'left', 400)
    text(ctx, `EN ${assets[0].currency}${assets[0].currency === 'USD' ? ' · SANS CONVERSION EN EUR' : ''}`, 1518, 1904, 30, C.muted, 'sans', 'right')
  }
  if (assets.some((a) => a.id === 'silver')) {
    // La source « argent » est un future continu : cette précision doit accompagner son image.
    text(ctx, 'ARGENT : FUTURES COMEX CONTINUS, HORS FRAIS ET ROULEMENT', 80, comparative ? 2544 : 1955, 24, C.muted)
  }
  return canvas
}

export async function downloadPerformanceImage(item) {
  const canvas = renderPerformanceImage(item)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `performance-depuis-${item.year}-${item.mode === MODES.COMPARATIF ? `${item.assetIdA}-${item.assetIdB}` : item.assetId}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
