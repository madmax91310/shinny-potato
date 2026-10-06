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
function drawScene(ctx,image,x,y,w,h) {
  const layer=document.createElement('canvas'); layer.width=Math.ceil(w); layer.height=h
  const c=layer.getContext('2d'), scale=Math.min(w/image.width,h/image.height)
  const iw=image.width*scale,ih=image.height*scale
  c.drawImage(image,(w-iw)/2,(h-ih)/2,iw,ih)
  c.globalCompositeOperation='destination-in'
  const fade=c.createLinearGradient(0,0,0,h);fade.addColorStop(0,'transparent');fade.addColorStop(.12,'white');fade.addColorStop(.8,'white');fade.addColorStop(1,'transparent');c.fillStyle=fade;c.fillRect(0,0,w,h)
  ctx.drawImage(layer,x,y)
}

export async function renderComparatifEtfImage(theme) {
  await loadEditorialFont()
  const art = await Promise.all(theme.etfs.map(fund => loadArtImage(comparisonArt(theme.id, fund.isin))))
  const years = getComparisonYears(theme.etfs.map(fund => fund.isin))
  const series = theme.etfs.map(fund => getComparisonPerformance(fund.isin, years))
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d'); const background = ctx.createLinearGradient(0,0,W,H); background.addColorStop(0,'#041b31'); background.addColorStop(.5,'#021026'); background.addColorStop(1,'#1e2030'); ctx.fillStyle=background; ctx.fillRect(0,0,W,H)
  text(ctx, `${theme.nom.toLocaleUpperCase('fr-FR')} : QUEL ${theme.id === 'etc-metaux' ? 'PRODUIT' : 'ETF'} CHOISIR ?`, W / 2, 52, 66, { width: W - 120, align: 'center', serif: true })
  const count = theme.etfs.length, labelWidth = count > 1 ? 245 : 0, left = 65 + labelWidth, available = W - left - 65, cell = available / count
  const hasPerformance = series.some(Boolean)
  if (hasPerformance) {
    text(ctx, 'PERFORMANCES', 65, 540, 25, { width: 225, color: '#eac788' })
    for (const [i, year] of years.entries()) text(ctx, String(year), 80, 605 + i * 75, 35, { color: MUTED })
    text(ctx, 'FRAIS / AN', 65, 860, 28, { width: 225, color: MUTED })
  }
  theme.etfs.forEach((fund, i) => {
    const center = left + cell * (i + .5), width = cell - 35
    const side = Math.min(510, cell - 12)
    const glow = ctx.createRadialGradient(center,335,10,center,335,side*.6); glow.addColorStop(0,i%2 ? 'rgba(255,169,43,.18)' : 'rgba(53,255,193,.15)'); glow.addColorStop(1,'transparent'); ctx.fillStyle=glow; ctx.fillRect(center-side/2,145,side,380)
    drawScene(ctx,art[i],center-side/2,150,side,300)
    // Full product identity remains readable beneath the exposure illustration.
    lines(ctx, fund.nom.replace(/ UCITS ETF.*$/i, '').replace(/ ETF$/i, ''), center, 448, width, 3, 31, { align: 'center' })
    const current = series[i]
    if (current) {
      text(ctx, `${current.label} · ${current.currency}`, center, 552, 24, { width, align: 'center', color: MUTED })
      for (const [j, year] of years.entries()) {
        const row = current.rows.find(row => row.year === year)
        if (row) text(ctx, pct(row.pct), center, 600 + j * 75, 47, { width, align: 'center', color: row.pct < 0 ? RED : GREEN })
        else text(ctx, 'Non disponible', center, 607 + j * 75, 22, { width, align: 'center', color: MUTED, weight: 400 })
      }
    } else {
      lines(ctx, detail(fund), center, hasPerformance ? 630 : 580, width - 15, 5, 27, { align: 'center', color: MUTED, weight: 400 })
      if (hasPerformance) text(ctx, 'Performances non disponibles', center, 552, 24, { width, align: 'center', color: MUTED })
    }
    text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, center, hasPerformance ? 845 : 820, 48, { width, align: 'center', color: GREEN })
    if (!hasPerformance) text(ctx, 'Frais annuels', center, 886, 25, { width, align: 'center', color: MUTED })
    text(ctx, fund.isin, center, 935, 25, { width, align: 'center', color: MUTED })
    if (current) lines(ctx, detail(fund), center, 984, width, 3, 23, { align: 'center', color: MUTED, weight: 400 })
    if (i) { ctx.strokeStyle = 'rgba(229,190,115,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left + i * cell, 430); ctx.lineTo(left + i * cell, 1100); ctx.stroke() }
  })
  ctx.fillStyle = 'rgba(229,190,115,.45)'; ctx.fillRect(65, 1114, W - 130, 2)
  if (hasPerformance) text(ctx, 'Performances des ETF cités · années civiles · devises indiquées', W / 2, 1140, 24, { width: W - 130, align: 'center', color: MUTED, weight: 400 })
  text(ctx, 'Les performances passées ne préjugent pas des performances futures.', W / 2, 1180, 22, { width: W - 130, align: 'center', color: MUTED, weight: 400 })
  text(ctx, '@Epargnantlibre', W / 2, 1215, 23, { align: 'center' })
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
