import { loadArtImage, loadEditorialFont } from './anniversaryArt.js'
import { getPaperArt } from './stylizedArt.js'
import { getComparisonPerformance, getComparisonYears } from './comparisonPerformance.js'
import { COMPARISON_ETF_DETAILS } from '../../data/comparison-etf-details.js'
import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { getPreferredInstrumentListing } from '../../data/instrument-listings.js'

const W = 2000, H = 2000
const INK = '#ffffff', MUTED = '#ffffff', GREEN = '#ffffff', RED = '#ffffff'
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

export function getComparisonImageComposition(isin, field) {
  const details = COMPARISON_ETF_DETAILS[isin]
  const observation = AUTOMATED_ETF[isin]?.[field]
  const basis = observation?.basis ?? (field === 'countries' ? details?.countriesBasis : details?.basis)
  return {
    rows: [...(details?.[field] ?? [])].filter(([, value]) => Number.isFinite(value) && value > 0).sort((a, b) => b[1] - a[1]).slice(0, 3),
    asOf: details?.[`${field}AsOf`] ?? details?.asOf,
    isIndex: basis === 'index' || basis === 'tracked-index',
  }
}

function composition(ctx, fund, field, x, y, width) {
  const { rows, asOf, isIndex } = getComparisonImageComposition(fund.isin, field)
  const kind = field === 'sectors' ? 'Principaux secteurs' : 'Principaux pays'
  text(ctx, kind, x, y, 24, { width, weight: 700 })
  if (!rows.length) {
    text(ctx, 'Non disponible', x, y + 42, 22, { width, weight: 400 })
    return
  }
  text(ctx, `${isIndex ? 'Indice' : 'Fonds'}${asOf ? ` · ${asOf.split('-').reverse().join('/')}` : ''}`, x, y + 35, 21, { width, weight: 400 })
  rows.forEach(([label, value], i) => {
    const yy = y + 76 + i * 46
    text(ctx, COMPOSITION_LABELS[label] ?? label, x, yy, 23, { width: width - 86, weight: 400 })
    text(ctx, `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`, x + width, yy, 23, { align: 'right', width: 80 })
  })
}

const COMPOSITION_LABELS = {
  'Information Technology': 'Technologie', Financials: 'Finance', 'Consumer Discretionary': 'Conso. cyclique',
  'Consumer Staples': 'Conso. de base', 'Communication Services': 'Communication', Industrials: 'Industrie',
  'Health Care': 'Santé', Healthcare: 'Santé', Materials: 'Matériaux', Utilities: 'Services publics',
  Energy: 'Énergie', 'Real Estate': 'Immobilier', Other: 'Autres',
  Taiwan: 'Taïwan', 'South Korea': 'Corée du Sud', China: 'Chine', Brazil: 'Brésil', Mexico: 'Mexique',
  'South Africa': 'Afrique du Sud', 'Saudi Arabia': 'Arabie saoudite', UAE: 'Émirats arabes unis',
  'United Arab Emirates': 'Émirats arabes unis', 'United States': 'États-Unis', 'United Kingdom': 'Royaume-Uni',
  Japan: 'Japon', Germany: 'Allemagne', Switzerland: 'Suisse', Netherlands: 'Pays-Bas', India: 'Inde',
}

// Approved style 2: cream paper, saturated cards and sculptural illustrations.
export function comparisonArt(themeId, isin) {
  const exposure = getPaperArt(themeId, isin)
  if (['world', 'america', 'chip'].includes(exposure)) return 'graphic/comparison-style-2.webp'
  // Keep a relevant 3D subject for every theme, including custom themes.
  if (['europe','emerging','luxury','gold','silver','dividends','quantum','blockchain','copper','japan','robotics','health','renewables','defense','space','resources','finance'].includes(exposure)) return `paper/${exposure}.webp`
  const studio = {}
  return `etf-night/${studio[exposure] || exposure}.webp`
}
function roundedRect(ctx, x, y, w, h, radius) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
}
function scene(ctx, image, themeId, fund, x, y, w, h) {
  const exposure = getPaperArt(themeId, fund.isin)
  // Crop only the sculptures from the approved preview; all labels remain live text.
  const panel = /nasdaq/i.test(`${fund.nom} ${fund.differenciateur}`) ? 2 : exposure === 'world' ? 0 : exposure === 'america' ? 1 : 2
  const atlas = comparisonArt(themeId, fund.isin) === 'graphic/comparison-style-2.webp'
  const sx = atlas ? [30, 530, 1030][panel] : 0
  const sy = atlas ? 450 : 0
  const sw = atlas ? 480 : image.width, sh = atlas ? 480 : image.height
  const side = Math.min(w, h)
  ctx.save()
  roundedRect(ctx, x + (w - side) / 2, y, side, side, 22); ctx.clip()
  ctx.drawImage(image, sx, sy, sw, sh, x + (w - side) / 2, y, side, side)
  ctx.restore()
}
function card(ctx, fund, performance, years, i, count, scaleMax, image, themeId) {
  const gap = 24, x0 = 68, cardW = (W - 136 - gap * (count - 1)) / count
  const x = x0 + i * (cardW + gap), y = 260, h = 1660
  const accent = '#ffffff'
  const surface = ctx.createLinearGradient(x, y, x + cardW, y + h)
  const colors = [['#075ac5','#063f94'],['#08794f','#055437'],['#ce4b00','#963600'],['#7240ae','#4f297e']][i % 4]
  surface.addColorStop(0, colors[0]); surface.addColorStop(1, colors[1])
  ctx.save(); ctx.shadowColor = 'rgba(31,25,18,.13)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10
  ctx.fillStyle = surface; roundedRect(ctx, x, y, cardW, h, 26); ctx.fill()
  ctx.restore()
  const name = fund.nom.replace(/ UCITS ETF S.*$/i, ' · S').replace(/ UCITS ETF.*$/i, '').replace(/ ETF$/i, '')
  lines(ctx, name, x + cardW / 2, y + 40, cardW - 54, 3, count > 3 ? 34 : 39, { color: INK, align: 'center', serif: true })
  scene(ctx, image, themeId, fund, x + 27, y + 210, cardW - 54, 310)
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 27, y + 547, cardW - 54, 2)
  text(ctx, performance ? `PERFORMANCES · ${performance.currency}` : 'EXPOSITION', x + 27, y + 574, 22, { width: cardW - 54, color: accent, weight: 700 })
  if (performance && years.length) {
    years.forEach((year, j) => {
      const row = performance.rows.find(value => value.year === year)
      const yy = y + 631 + j * 80
      text(ctx, String(year), x + 27, yy, 26, { color: MUTED, weight: 400 })
      if (row) text(ctx, pct(row.pct), x + cardW - 27, yy - 6, count > 3 ? 36 : 42, { align: 'right', width: cardW - 130, color: row.pct < 0 ? RED : GREEN })
      else text(ctx, 'N/D', x + cardW - 27, yy - 6, 30, { align: 'right', color: MUTED })
      ctx.fillStyle = 'rgba(255,255,255,.2)'; roundedRect(ctx, x + 27, yy + 46, cardW - 54, 9, 4); ctx.fill()
      if (row) {
        ctx.fillStyle = row.pct < 0 ? RED : accent
        roundedRect(ctx, x + 27, yy + 46, Math.max(6, (cardW - 54) * Math.abs(row.pct) / scaleMax), 9, 4); ctx.fill()
      }
    })
    lines(ctx, detail(fund), x + 27, y + 893, cardW - 54, 2, 24, { color: MUTED, weight: 400 })
  } else {
    lines(ctx, detail(fund) || 'Données de performance non disponibles', x + 27, y + 644, cardW - 54, 5, 27, { color: MUTED, weight: 400 })
  }
  composition(ctx, fund, 'sectors', x + 27, y + 978, cardW - 54)
  composition(ctx, fund, 'countries', x + 27, y + 1223, cardW - 54)
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 27, y + 1477, cardW - 54, 2)
  text(ctx, 'FRAIS / AN', x + 27, y + 1504, 23, { color: MUTED, weight: 400 })
  text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, x + cardW - 27, y + 1493, 38, { align: 'right', width: cardW - 195, color: accent })
  const ticker = getPreferredInstrumentListing(fund.isin)?.ticker
  if (ticker) {
    text(ctx, ticker, x + 27, y + 1570, 24, { width: 88 })
    text(ctx, fund.isin, x + 125, y + 1570, 24, { width: cardW - 152, color: MUTED, weight: 400 })
  } else text(ctx, fund.isin, x + 27, y + 1570, 24, { width: cardW - 54, color: MUTED, weight: 400 })
}

export async function renderComparatifEtfImage(theme) {
  await loadEditorialFont()
  const years = getComparisonYears(theme.etfs.map(fund => fund.isin))
  const series = theme.etfs.map(fund => getComparisonPerformance(fund.isin, years))
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  const background = ctx.createLinearGradient(0, 0, W, H)
  background.addColorStop(0, '#fffdf8'); background.addColorStop(1, '#f3ede3')
  ctx.fillStyle = background; ctx.fillRect(0, 0, W, H)
  const art = await Promise.all(theme.etfs.map(fund => loadArtImage(comparisonArt(theme.id, fund.isin))))
  text(ctx, 'ÉPARGNANT LIBRE', W / 2, 48, 30, { color: '#171717', weight: 700, align: 'center' })
  text(ctx, theme.nom, W / 2, 113, 82, { color: '#171717', width: W - 136, serif: true, align: 'center' })
  const scaleMax = Math.max(1, ...series.flatMap(item => item ? item.rows.map(row => Math.abs(row.pct)) : []))
  theme.etfs.forEach((fund, i) => card(ctx, fund, series[i], years, i, theme.etfs.length, scaleMax, art[i], theme.id))
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
