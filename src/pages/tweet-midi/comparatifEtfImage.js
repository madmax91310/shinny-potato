import { loadArtImage, loadEditorialFont } from './anniversaryArt.js'
import { getPaperArt } from './stylizedArt.js'
import { getComparisonPerformance, getComparisonYears } from './comparisonPerformance.js'

const W = 2000, H = 1250
const INK = '#f1f4ff', MUTED = '#b9c6d5', GREEN = '#9cebc5', RED = '#ffafa0'
const pct = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
function text(ctx, value, x, y, size, { width = W, color = INK, align = 'left', serif = false, weight = 700 } = {}) {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `${weight} ${fitted}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`; if (ctx.measureText(value).width <= width) break; fitted-- } while (fitted > 12)
  ctx.fillText(value, x, y)
}
function wrap(ctx, value, width, size) {
  ctx.font = `700 ${size}px Arial, sans-serif`
  const rows = []; let row = ''
  for (const word of value.split(/\s+/)) {
    const next = row ? `${row} ${word}` : word
    if (row && ctx.measureText(next).width > width) { rows.push(row); row = word } else row = next
  }
  if (row) rows.push(row)
  return rows
}
function lines(ctx, value, x, y, width, maxRows, startSize, options = {}) {
  let size = startSize, rows
  do { rows = wrap(ctx, value, width, size); if (rows.length <= maxRows) break; size-- } while (size > 16)
  rows.forEach((row, i) => text(ctx, row, x, y + i * (size + 6), size, { width, ...options }))
}
function detail(fund) {
  return fund.differenciateur.replace(/(?:non[ -]éligible\s+|éligible\s+|hors\s+|en\s+)?\bPEA\b(?: selon [^,;]+)?|\bCTO\b/gi, '').replace(/\s+([,;])/g, '$1').replace(/[,;]\s*[,;]/g, ',').replace(/^[\s·,;:|–—-]+|[\s·,;:|–—-]+$/g, '').trim()
}

// Reference 11: emerald glass / amber sculpture, never the former paper art.
export function comparisonArt(themeId, isin) {
  const exposure = getPaperArt(themeId, isin)
  if (exposure==='world' || exposure==='america') return `approved/comparison-${exposure}.webp`
  const neon = ['world','america','europe','emerging','luxury','chip','gold','silver']
  if (neon.includes(exposure)) return `neon/${exposure}.webp`
  const studio = { dividends:'finance', quantum:'chip', blockchain:'chip', copper:'resources', japan:'asia' }
  return `etf-night/${studio[exposure] || exposure}.webp`
}
function roundedRect(ctx, x, y, w, h, radius) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
}
function sceneAccent(ctx, image) {
  // One atmospheric illustration for the subject, not the same picture on every ETF.
  if (!image) return
  ctx.save()
  ctx.globalAlpha = .32
  const x = 1290, y = 35, w = 650, h = 285
  const scale = Math.max(w / image.width, h / image.height)
  const sw = w / scale, sh = h / scale
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, w, h)
  const shade = ctx.createLinearGradient(x, 0, x + w, 0)
  shade.addColorStop(0, '#061729'); shade.addColorStop(.6, 'rgba(6,23,41,.3)'); shade.addColorStop(1, '#061729')
  ctx.fillStyle = shade; ctx.fillRect(x, y, w, h)
  ctx.restore()
}
function card(ctx, fund, performance, years, i, count, scaleMax) {
  const gap = 24, x0 = 68, cardW = (W - 136 - gap * (count - 1)) / count
  const x = x0 + i * (cardW + gap), y = 325, h = 744
  const accent = ['#78e0be', '#e9bc79', '#9ab6f2', '#e5a6ba'][i % 4]
  const surface = ctx.createLinearGradient(x, y, x + cardW, y + h)
  surface.addColorStop(0, '#102c3c'); surface.addColorStop(1, '#0b1c30')
  ctx.fillStyle = surface; roundedRect(ctx, x, y, cardW, h, 26); ctx.fill()
  ctx.strokeStyle = 'rgba(177,218,223,.22)'; ctx.lineWidth = 2
  roundedRect(ctx, x, y, cardW, h, 26); ctx.stroke()
  ctx.fillStyle = accent; roundedRect(ctx, x + 25, y + 26, 72, 6, 3); ctx.fill()
  text(ctx, String(i + 1).padStart(2, '0'), x + cardW - 26, y + 20, 37, { align: 'right', width: 70, color: accent, serif: true })
  const name = fund.nom.replace(/ UCITS ETF.*$/i, '').replace(/ ETF$/i, '')
  lines(ctx, name, x + 27, y + 78, cardW - 54, 3, count > 3 ? 34 : 39, { color: INK })
  ctx.fillStyle = 'rgba(177,218,223,.22)'; ctx.fillRect(x + 27, y + 215, cardW - 54, 2)
  text(ctx, performance ? `PERFORMANCES · ${performance.currency}` : 'EXPOSITION', x + 27, y + 241, 22, { width: cardW - 54, color: accent, weight: 700 })
  if (performance && years.length) {
    years.forEach((year, j) => {
      const row = performance.rows.find(value => value.year === year)
      const yy = y + 304 + j * 99
      text(ctx, String(year), x + 27, yy, 26, { color: MUTED, weight: 400 })
      if (row) text(ctx, pct(row.pct), x + cardW - 27, yy - 6, count > 3 ? 36 : 42, { align: 'right', width: cardW - 130, color: row.pct < 0 ? RED : GREEN })
      else text(ctx, 'N/D', x + cardW - 27, yy - 6, 30, { align: 'right', color: MUTED })
      ctx.fillStyle = '#223a49'; roundedRect(ctx, x + 27, yy + 50, cardW - 54, 12, 6); ctx.fill()
      if (row) {
        ctx.fillStyle = row.pct < 0 ? RED : accent
        roundedRect(ctx, x + 27, yy + 50, Math.max(6, (cardW - 54) * Math.abs(row.pct) / scaleMax), 12, 6); ctx.fill()
      }
    })
    lines(ctx, detail(fund), x + 27, y + 568, cardW - 54, 2, 20, { color: MUTED, weight: 400 })
  } else {
    lines(ctx, detail(fund) || 'Données de performance non disponibles', x + 27, y + 315, cardW - 54, 5, 27, { color: MUTED, weight: 400 })
  }
  ctx.fillStyle = 'rgba(177,218,223,.22)'; ctx.fillRect(x + 27, y + 628, cardW - 54, 2)
  text(ctx, 'FRAIS / AN', x + 27, y + 653, 21, { color: MUTED, weight: 400 })
  text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, x + cardW - 27, y + 642, 35, { align: 'right', width: cardW - 195, color: accent })
  text(ctx, fund.isin, x + 27, y + 695, 21, { width: cardW - 54, color: MUTED, weight: 400 })
}

export async function renderComparatifEtfImage(theme) {
  await loadEditorialFont()
  const years = getComparisonYears(theme.etfs.map(fund => fund.isin))
  const series = theme.etfs.map(fund => getComparisonPerformance(fund.isin, years))
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const background = ctx.createLinearGradient(0, 0, W, H)
  background.addColorStop(0, '#061729'); background.addColorStop(1, '#081e33')
  ctx.fillStyle = background; ctx.fillRect(0, 0, W, H)
  const art = theme.id === 'etc-metaux' ? null : await loadArtImage(comparisonArt(theme.id, theme.etfs[0].isin))
  sceneAccent(ctx, art)
  text(ctx, 'ÉPARGNANT LIBRE', W / 2, 48, 26, { color: '#e9bc79', weight: 700, align: 'center' })
  text(ctx, theme.nom.toLocaleUpperCase('fr-FR'), W / 2, 112, 73, { width: W - 136, serif: true, align: 'center' })
  const scaleMax = Math.max(1, ...series.flatMap(item => item ? item.rows.map(row => Math.abs(row.pct)) : []))
  theme.etfs.forEach((fund, i) => card(ctx, fund, series[i], years, i, theme.etfs.length, scaleMax))
  text(ctx, '@Epargnantlibre', W - 68, 1174, 25, { align: 'right', color: INK })
  return canvas
}
export async function downloadComparatifEtfImage(theme) {
  const canvas = await renderComparatifEtfImage(theme)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Échec de la génération du PNG')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `comparatif-etf-${theme.id}.png`
  document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
