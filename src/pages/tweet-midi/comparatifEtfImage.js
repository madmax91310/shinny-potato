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
  'Information Technology': 'Technologie', Technology: 'Technologie', Financials: 'Finance', 'Consumer Discretionary': 'Conso. cyclique',
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
export function comparisonLayout(count) {
  const columns = count <= 3 ? count : Math.min(3, Math.ceil(count / 2))
  const rows = Math.ceil(count / columns)
  return { columns, rows, compact: count >= 4, height: count <= 3 ? H : 260 + rows * 850 + 40 }
}
function card(ctx, fund, performance, years, i, count, scaleMax, image, themeId) {
  const layout = comparisonLayout(count), gap = 24, x0 = 68
  const row = Math.floor(i / layout.columns), col = i % layout.columns
  const rowCount = Math.min(layout.columns, count - row * layout.columns)
  const cardW = (W - 136 - gap * (rowCount - 1)) / rowCount
  const x = x0 + col * (cardW + gap), y = 260 + row * 850, h = layout.compact ? 824 : 1660
  const surface = ctx.createLinearGradient(x, y, x + cardW, y + h)
  const colors = [['#075ac5','#063f94'],['#08794f','#055437'],['#ce4b00','#963600'],['#7240ae','#4f297e']][i % 4]
  surface.addColorStop(0, colors[0]); surface.addColorStop(1, colors[1])
  ctx.save(); ctx.shadowColor = 'rgba(31,25,18,.13)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10
  ctx.fillStyle = surface; roundedRect(ctx, x, y, cardW, h, 26); ctx.fill()
  ctx.restore()
  const name = fund.nom.replace(/ UCITS ETF S.*$/i, ' · S').replace(/ UCITS ETF.*$/i, '').replace(/ ETF$/i, '')
  const ticker = getPreferredInstrumentListing(fund.isin)?.ticker
  if (layout.compact) {
    lines(ctx, name, x + 27, y + 25, cardW - 54, 3, cardW < 700 ? 30 : 39, { serif: true })
    if (ticker) text(ctx, ticker, x + 27, y + 151, 30, { width: 105 })
    text(ctx, fund.isin, x + (ticker ? 142 : 27), y + 154, 26, { width: cardW - (ticker ? 169 : 54), weight: 400 })
    text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, x + cardW - 27, y + 200, 40, { align: 'right', width: 160 })
    text(ctx, 'FRAIS / AN', x + cardW - 27, y + 245, 20, { align: 'right' })
    lines(ctx, detail(fund), x + 27, y + 207, cardW - 240, 2, 26, { weight: 400 })
    const artSide = cardW < 700 ? 205 : 265
    scene(ctx, image, themeId, fund, x + 27, y + 285, artSide, artSide)
    const perfX = x + artSide + 55, perfW = cardW - artSide - 82
    text(ctx, performance ? `PERFORMANCES · ${performance.currency}` : 'HISTORIQUE', perfX, y + 288, 23, { width: perfW })
    if (performance && years.length) {
      years.forEach((year, j) => {
        const observation = performance.rows.find(value => value.year === year)
        text(ctx, String(year), perfX, y + 338 + j * 62, 25, { weight: 400 })
        text(ctx, observation ? pct(observation.pct) : 'N/D', x + cardW - 27, y + 334 + j * 62, 33, { align: 'right', width: perfW - 76, color: observation?.pct < 0 ? RED : GREEN })
      })
    } else lines(ctx, 'Historique annuel non disponible', perfX, y + 347, perfW, 3, 29)
    const compW = (cardW - 81) / 2
    composition(ctx, fund, 'sectors', x + 27, y + 568, compW)
    composition(ctx, fund, 'countries', x + 54 + compW, y + 568, compW)
    return
  }
  lines(ctx, name, x + cardW / 2, y + 40, cardW - 54, 3, 39, { align: 'center', serif: true })
  text(ctx, 'FRAIS / AN', x + 27, y + 182, 23, { weight: 400 })
  text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, x + cardW - 27, y + 173, 38, { align: 'right', width: cardW - 195 })
  if (ticker) text(ctx, ticker, x + 27, y + 233, 26, { width: 100 })
  text(ctx, fund.isin, x + (ticker ? 142 : 27), y + 235, 25, { width: cardW - (ticker ? 169 : 54), weight: 400 })
  scene(ctx, image, themeId, fund, x + 27, y + 300, cardW - 54, 245)
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + 27, y + 574, cardW - 54, 2)
  text(ctx, performance ? `PERFORMANCES · ${performance.currency}` : 'HISTORIQUE', x + 27, y + 604, 24, { width: cardW - 54 })
  if (performance && years.length) {
    years.forEach((year, j) => {
      const observation = performance.rows.find(value => value.year === year), yy = y + 664 + j * 80
      text(ctx, String(year), x + 27, yy, 26, { weight: 400 })
      text(ctx, observation ? pct(observation.pct) : 'N/D', x + cardW - 27, yy - 6, 42, { align: 'right', width: cardW - 130, color: observation?.pct < 0 ? RED : GREEN })
      ctx.fillStyle = 'rgba(255,255,255,.2)'; roundedRect(ctx, x + 27, yy + 46, cardW - 54, 9, 4); ctx.fill()
      if (observation) { ctx.fillStyle = '#fff'; roundedRect(ctx, x + 27, yy + 46, Math.max(6, (cardW - 54) * Math.abs(observation.pct) / scaleMax), 9, 4); ctx.fill() }
    })
  } else lines(ctx, 'Historique annuel non disponible', x + 27, y + 684, cardW - 54, 3, 30)
  lines(ctx, detail(fund), x + 27, y + 935, cardW - 54, 2, 24, { weight: 400 })
  composition(ctx, fund, 'sectors', x + 27, y + 1060, cardW - 54)
  composition(ctx, fund, 'countries', x + 27, y + 1330, cardW - 54)
}

export async function renderComparatifEtfImage(theme) {
  await loadEditorialFont()
  const years = getComparisonYears(theme.etfs.map(fund => fund.isin))
  const series = theme.etfs.map(fund => getComparisonPerformance(fund.isin, years))
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = comparisonLayout(theme.etfs.length).height
  const ctx = canvas.getContext('2d')
  const background = ctx.createLinearGradient(0, 0, W, canvas.height)
  background.addColorStop(0, '#fffdf8'); background.addColorStop(1, '#f3ede3')
  ctx.fillStyle = background; ctx.fillRect(0, 0, W, canvas.height)
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
