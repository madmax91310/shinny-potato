import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { loadArtImage, loadEditorialFont } from './anniversaryArt.js'
import { getPaperArt } from './stylizedArt.js'
import { getComparisonPerformance, getComparisonYears } from './comparisonPerformance.js'
import { COMPARISON_ETF_DETAILS } from '../../data/comparison-etf-details.js'
import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { getPreferredInstrumentListing } from '../../data/instrument-listings.js'

const W = 2000, H = 2000
const INK = '#10263c', GREEN = '#126047', RED = '#ad3924'
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
  text(ctx, kind, x, y, 24, { width, weight: 700, color: '#fffaf0' })
  if (!rows.length) {
    text(ctx, 'Non disponible', x, y + 42, 22, { width, weight: 400, color: '#fffaf0' })
    return
  }
  text(ctx, `${isIndex ? 'Indice' : 'Fonds'}${asOf ? ` · ${asOf.split('-').reverse().join('/')}` : ''}`, x, y + 35, 21, { width, weight: 400, color: '#fffaf0' })
  rows.forEach(([label, value], i) => {
    const yy = y + 76 + i * 46
    text(ctx, COMPOSITION_LABELS[label] ?? label, x, yy, 23, { width: width - 86, weight: 400, color: '#fffaf0' })
    text(ctx, `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`, x + width, yy, 23, { align: 'right', width: 80, color: '#fffaf0' })
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

// Approved paper-cut direction: textured cream, torn paper and integrated artwork.
export function comparisonArt(themeId, isin) {
  const exposure = getPaperArt(themeId, isin)
  if (['world', 'america', 'chip'].includes(exposure)) return 'graphic/comparison-paper-cut.webp'
  // Keep a relevant 3D subject for every theme, including custom themes.
  if (['europe','emerging','luxury','gold','silver','dividends','quantum','blockchain','copper','japan','robotics','health','renewables','defense','space','resources','finance'].includes(exposure)) return `paper/${exposure}.webp`
  const studio = {}
  return `etf-night/${studio[exposure] || exposure}.webp`
}
// Deterministic torn edges keep exports stable and never affect data placement.
function tornPaper(ctx, x, y, w, h, color, seed = 0) {
  ctx.beginPath()
  const edge = (step, phase) => Math.sin(step * 2.31 + phase + seed) * 4 + Math.sin(step * 5.7 + seed) * 2
  ctx.moveTo(x, y)
  for (let j = 1; j <= 32; j++) ctx.lineTo(x + w * j / 32, y + edge(j, 0))
  ctx.lineTo(x + w, y + h)
  for (let j = 31; j >= 0; j--) ctx.lineTo(x + w * j / 32, y + h + edge(j, 2))
  ctx.closePath()
  ctx.fillStyle = color; ctx.fill()
}
function scene(ctx, image, themeId, fund, x, y, w, h) {
  const exposure = getPaperArt(themeId, fund.isin)
  const panel = /nasdaq/i.test(`${fund.nom} ${fund.differenciateur}`) ? 2 : exposure === 'world' ? 0 : 1
  const atlas = comparisonArt(themeId, fund.isin) === 'graphic/comparison-paper-cut.webp'
  const sw = atlas ? image.width / 3 : image.width, sh = image.height
  ctx.save()
  tornPaper(ctx, x, y, w, h, '#f7f0df', panel); ctx.clip()
  // Cover the art area without stretching the source artwork.
  const sourceRatio = sw / sh, targetRatio = w / h
  const cropW = targetRatio < sourceRatio ? sh * targetRatio : sw
  const cropH = targetRatio < sourceRatio ? sh : sw / targetRatio
  ctx.drawImage(image, (atlas ? panel * sw : 0) + (sw - cropW) / 2, (sh - cropH) / 2, cropW, cropH, x, y, w, h)
  ctx.restore()
}
function paperTexture(ctx, height) {
  // Fine seeded flecks suggest paper fibres without an external texture file.
  let seed = 7411
  ctx.fillStyle = 'rgba(103,77,41,.055)'
  for (let i = 0; i < 18000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const x = seed / 4294967296 * W
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    ctx.fillRect(x, seed / 4294967296 * height, 1.2, 1.2)
  }
}
export function comparisonLayout(count) {
  const columns = count <= 3 ? count : Math.min(3, Math.ceil(count / 2))
  const rows = Math.ceil(count / columns)
  return { columns, rows, compact: count >= 4, height: count <= 3 ? H : 260 + rows * 850 + 40 }
}
function card(ctx, fund, performance, years, i, count, image, themeId) {
  const layout = comparisonLayout(count), gap = 24, x0 = 68
  const row = Math.floor(i / layout.columns), col = i % layout.columns
  const rowCount = Math.min(layout.columns, count - row * layout.columns)
  const cardW = (W - 136 - gap * (rowCount - 1)) / rowCount
  const x = x0 + col * (cardW + gap), y = 260 + row * 850, h = layout.compact ? 824 : 1660
  const accent = ['#173b5b', '#18553f', '#a94723', '#65513e'][i % 4]
  ctx.save(); ctx.shadowColor = 'rgba(54,39,19,.12)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5
  tornPaper(ctx, x, y, cardW, h, '#fbf5e8', i)
  ctx.restore()
  const name = fund.nom.replace(/ UCITS ETF S.*$/i, ' · S').replace(/ UCITS ETF.*$/i, '').replace(/ ETF$/i, '')
  const ticker = getPreferredInstrumentListing(fund.isin)?.ticker
  if (layout.compact) {
    tornPaper(ctx, x, y, cardW, 136, accent, i)
    tornPaper(ctx, x, y + 547, cardW, h - 547, accent, i + 2)
    lines(ctx, name, x + 27, y + 25, cardW - 54, 3, cardW < 700 ? 30 : 39, { serif: true, color: '#fffaf0' })
    if (ticker) text(ctx, ticker, x + 27, y + 151, 30, { width: 105 })
    text(ctx, fund.isin, x + (ticker ? 142 : 27), y + 154, 26, { width: cardW - (ticker ? 169 : 54), weight: 400 })
    text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, x + cardW - 27, y + 200, 52, { align: 'right', width: 180, color: accent })
    text(ctx, 'FRAIS / AN', x + cardW - 27, y + 263, 20, { align: 'right' })
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
  scene(ctx, image, themeId, fund, x, y, cardW, 400)
  tornPaper(ctx, x, y + 345, cardW, 155, accent, i)
  lines(ctx, name, x + cardW / 2, y + 370, cardW - 54, 3, 39, { align: 'center', serif: true, color: '#fffaf0' })
  ctx.save(); ctx.shadowColor = 'rgba(54,39,19,.15)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4
  tornPaper(ctx, x + 15, y + 510, cardW - 30, 64, '#fff9ec', i + 1)
  ctx.restore()
  if (ticker) text(ctx, ticker, x + 27, y + 530, 29, { width: 105, color: accent })
  text(ctx, fund.isin, x + (ticker ? 142 : 27), y + 533, 26, { width: cardW - (ticker ? 169 : 54), weight: 400 })
  text(ctx, 'Frais / an', x + 27, y + 603, 26, { weight: 700 })
  text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, x + cardW / 2, y + 640, 105, { align: 'center', width: cardW - 54, color: accent, serif: true })
  text(ctx, performance ? `Performances · ${performance.currency}` : 'Historique', x + 27, y + 780, 26, { width: cardW - 54 })
  if (performance && years.length) {
    years.forEach((year, j) => {
      const observation = performance.rows.find(value => value.year === year), yy = y + 838 + j * 80
      text(ctx, String(year), x + 27, yy, 28, { weight: 400 })
      text(ctx, observation ? pct(observation.pct) : 'N/D', x + cardW - 27, yy - 6, 46, { align: 'right', width: cardW - 130, color: observation?.pct < 0 ? RED : GREEN })
      ctx.fillStyle = 'rgba(16,38,60,.18)'; ctx.fillRect(x + 27, yy + 52, cardW - 54, 1)
    })
  } else lines(ctx, 'Historique annuel non disponible', x + 27, y + 863, cardW - 54, 3, 32, { color: accent })
  lines(ctx, detail(fund), x + 27, y + 1080, cardW - 54, 2, 24, { weight: 400 })
  tornPaper(ctx, x, y + 1140, cardW, h - 1140, accent, i + 2)
  composition(ctx, fund, 'sectors', x + 27, y + 1172, cardW - 54)
  ctx.fillStyle = 'rgba(255,250,240,.35)'; ctx.fillRect(x + 27, y + 1405, cardW - 54, 1)
  composition(ctx, fund, 'countries', x + 27, y + 1430, cardW - 54)

}

export async function renderComparatifEtfImage(theme) {
  await loadEditorialFont()
  const years = getComparisonYears(theme.etfs.map(fund => fund.isin))
  const series = theme.etfs.map(fund => getComparisonPerformance(fund.isin, years))
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = comparisonLayout(theme.etfs.length).height
  const ctx = canvas.getContext('2d')
  const background = ctx.createLinearGradient(0, 0, W, canvas.height)
  background.addColorStop(0, '#fcf7ec'); background.addColorStop(1, '#f0e5d2')
  ctx.fillStyle = background; ctx.fillRect(0, 0, W, canvas.height)
  paperTexture(ctx, canvas.height)
  const art = await Promise.all(theme.etfs.map(fund => loadArtImage(comparisonArt(theme.id, fund.isin))))
  text(ctx, 'ÉPARGNANT LIBRE', W / 2, 48, 30, { color: '#171717', weight: 700, align: 'center' })
  text(ctx, theme.nom, W / 2, 113, 82, { color: '#171717', width: W - 136, serif: true, align: 'center' })
  theme.etfs.forEach((fund, i) => card(ctx, fund, series[i], years, i, theme.etfs.length, art[i], theme.id))
  return canvas
}
export async function downloadComparatifEtfImage(theme) {
  const canvas = await renderComparatifEtfImage(theme)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Échec de la génération du PNG')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `comparatif-etf-${theme.id}.png`
  document.body.append(link); startPublicationDownload(link); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
