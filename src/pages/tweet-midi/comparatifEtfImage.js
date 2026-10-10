import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { loadArtImage, loadEditorialFont } from './anniversaryArt.js'
import { getPaperArt } from './stylizedArt.js'
import { getComparisonPerformance, getComparisonYears } from './comparisonPerformance.js'
import { COMPARISON_ETF_DETAILS } from '../../data/comparison-etf-details.js'
import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { getPreferredInstrumentListing } from '../../data/instrument-listings.js'

const W = 2000, H = 2000, PAD = 76
const INK = '#10263c', GREEN = '#126047', RED = '#ad3924', MUTED = '#54605f'
const pct = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
function text(ctx, value, x, y, size, { width = W, color = INK, align = 'left', serif = false, weight = 700 } = {}) {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `${weight} ${fitted}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`; if (ctx.measureText(value).width <= width) break; fitted-- } while (fitted > 12)
  ctx.fillText(value, x, y)
}
function wrap(ctx, value, width, size) {
  ctx.font = `700 ${size}px Georgia, serif`
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
  rows.forEach((row, i) => text(ctx, row, x, y + i * (size + 7), size, { width, serif: true, ...options }))
}
function rule(ctx, x, y, width) {
  ctx.fillStyle = '#bac0b8'; ctx.fillRect(x, y, width, 1.5)
}
function detail(fund) {
  return fund.differenciateur.replace(/(?:non[ -]éligible\s+|éligible\s+|hors\s+|en\s+)?\bPEA\b(?: selon [^,;]+)?|\bCTO\b/gi, '').replace(/\s+([,;])/g, '$1').replace(/[,;]\s*[,;]/g, ',').replace(/^[\s·,;:|–—-]+|[\s·,;:|–—-]+$/g, '').trim()
}
export function getComparisonImageComposition(isin, field) {
  const details = COMPARISON_ETF_DETAILS[isin]
  const observation = AUTOMATED_ETF[isin]?.[field]
  const basis = observation?.basis ?? (field === 'countries' ? details?.countriesBasis : details?.basis)
  return {
    rows: [...(details?.[field] ?? [])].filter(([label, value]) => Number.isFinite(value) && value > 0 && !/^(other|others|autres)$/i.test(label)).sort((a, b) => b[1] - a[1]).slice(0, 3),
    asOf: details?.[`${field}AsOf`] ?? details?.asOf,
    isIndex: basis === 'index' || basis === 'tracked-index',
  }
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
function composition(ctx, fund, field, x, y, width, compact) {
  const { rows, asOf, isIndex } = getComparisonImageComposition(fund.isin, field)
  const size = compact ? 28 : 34, gap = compact ? 48 : 65
  text(ctx, field === 'sectors' ? 'Principaux secteurs' : 'Principaux pays', x, y, size + 2, { width })
  if (!rows.length) { text(ctx, 'Non disponible', x, y + 63, size, { width, weight: 400, color: MUTED }); return }
  // Each field retains its own observation date; never date returns with a composition date.
  text(ctx, `${isIndex ? 'Indice' : 'Fonds'}${asOf ? ` · ${asOf.split('-').reverse().join('/')}` : ''}`, x, y + 44, compact ? 24 : 28, { width, weight: 400, color: MUTED })
  rows.forEach(([label, value], i) => {
    const yy = y + 96 + i * gap, valueW = compact ? 118 : 150
    text(ctx, COMPOSITION_LABELS[label] ?? label, x, yy, size, { width: width - valueW - 12, weight: 400 })
    text(ctx, `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`, x + width, yy, size, { align: 'right', width: valueW })
  })
}
// One relevant illustration in the header. World map is illustrative, never a holdings map.
export function comparisonArt(themeId, isin) {
  const exposure = getPaperArt(themeId, isin)
  if (exposure === 'world') return 'comparison-world-map.svg'
  if (['america', 'chip'].includes(exposure)) return 'graphic/comparison-paper-cut.webp'
  if (['europe','emerging','luxury','gold','silver','dividends','quantum','blockchain','copper','japan','robotics','health','renewables','defense','space','resources','finance'].includes(exposure)) return `paper/${exposure}.webp`
  return `etf-night/${exposure}.webp`
}
export function comparisonLayout(count) {
  const columns = count <= 3 ? Math.max(1, count) : 2
  const rows = Math.ceil(count / columns)
  return { columns, rows, compact: count >= 4, height: count <= 3 ? H : 360 + rows * 1150 + 110 }
}
function card(ctx, fund, performance, years, i, count) {
  const layout = comparisonLayout(count), gap = 60
  const row = Math.floor(i / layout.columns), col = i % layout.columns
  const cardW = (W - 2 * PAD - gap * (layout.columns - 1)) / layout.columns
  const x = PAD + col * (cardW + gap), y = 350 + row * 1150
  const compact = layout.compact, narrow = cardW < 700
  const accent = /ACWI/.test(fund.differenciateur) ? '#b64920' : GREEN
  const name = fund.nom.replace(/ UCITS ETF S.*$/i, ' · S').replace(/ UCITS ETF.*$/i, '').replace(/ ETF$/i, '')
  lines(ctx, name, x, y, cardW, 3, narrow ? 43 : 58)
  const ticker = getPreferredInstrumentListing(fund.isin)?.ticker
  const identityY = y + 200, tickerW = narrow ? 113 : 145
  if (ticker) {
    ctx.fillStyle = accent; ctx.beginPath(); ctx.roundRect(x, identityY - 7, tickerW, 62, 7); ctx.fill()
    text(ctx, ticker, x + tickerW / 2, identityY + 2, narrow ? 29 : 36, { align: 'center', width: tickerW - 12, color: '#fffdf6' })
  }
  text(ctx, fund.isin, x + (ticker ? tickerW + 22 : 0), identityY + 8, narrow ? 27 : 32, { width: cardW - (ticker ? tickerW + 22 : 0), weight: 400 })
  lines(ctx, detail(fund), x, y + 282, cardW, 3, narrow ? 28 : 33, { weight: 400, color: MUTED, serif: false })
  const feeY = y + 408
  text(ctx, fund.isCopperEtc ? 'Frais de gestion' : 'Frais annuels', x, feeY, narrow ? 30 : 36, { width: cardW })
  text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, x + cardW, feeY + 52, narrow ? 80 : 100, { align: 'right', width: cardW, color: accent, serif: true })
  const perfY = y + 578
  text(ctx, performance ? `Performances annuelles · ${performance.currency}` : 'Historique', x, perfY, narrow ? 29 : 34, { width: cardW })
  if (performance && years.length) {
    years.forEach((year, j) => {
      const observation = performance.rows.find(value => value.year === year), yy = perfY + 58 + j * 66
      text(ctx, String(year), x, yy + 7, narrow ? 30 : 34, { width: 100, weight: 400 })
      text(ctx, observation ? pct(observation.pct) : 'N/D', x + cardW, yy, narrow ? 46 : 55, { align: 'right', width: cardW - 120, color: observation?.pct < 0 ? RED : GREEN })
    })
  } else lines(ctx, 'Historique annuel non disponible', x, perfY + 71, cardW, 2, narrow ? 31 : 38, { weight: 400, serif: false })
  const compY = y + 872
  rule(ctx, x, compY - 25, cardW)
  if (compact) {
    const compW = (cardW - 35) / 2
    composition(ctx, fund, 'sectors', x, compY, compW, true)
    composition(ctx, fund, 'countries', x + compW + 35, compY, compW, true)
  } else {
    composition(ctx, fund, 'sectors', x, compY, cardW, false)
    rule(ctx, x, compY + 268, cardW)
    composition(ctx, fund, 'countries', x, compY + 308, cardW, false)
  }
  if (col < layout.columns - 1) { ctx.fillStyle = '#bac0b8'; ctx.fillRect(x + cardW + gap / 2, y, 1.5, compact ? 1100 : 1500) }
  if (row > 0) rule(ctx, x, y - 32, cardW)
}
export async function renderComparatifEtfImage(theme) {
  if (!theme?.etfs?.length) throw new Error('Sélection ETF vide')
  await loadEditorialFont()
  const years = getComparisonYears(theme.etfs.map(fund => fund.isin))
  const series = theme.etfs.map(fund => getComparisonPerformance(fund.isin, years))
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = comparisonLayout(theme.etfs.length).height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#faf6ec'; ctx.fillRect(0, 0, W, canvas.height)
  text(ctx, 'ÉPARGNANT LIBRE', W / 2, 55, 36, { color: INK, align: 'center' })
  const artPath = comparisonArt(theme.id, theme.etfs[0].isin), art = await loadArtImage(artPath)
  // Compact shared art; content remains sourced text drawn dynamically above the background.
  if (artPath.endsWith('.svg')) ctx.drawImage(art, W - PAD - 330, 135, 330, 148)
  else {
    const atlas = artPath === 'graphic/comparison-paper-cut.webp', sw = atlas ? art.width / 3 : art.width
    const sx = atlas ? sw : 0
    ctx.save(); ctx.globalAlpha = .8
    ctx.drawImage(art, sx, 0, sw, art.height, W - PAD - 240, 120, 240, 180)
    ctx.restore()
  }
  lines(ctx, theme.nom, PAD, 144, W - 2 * PAD - 370, 2, 87)
  rule(ctx, PAD, 315, W - 2 * PAD)
  theme.etfs.forEach((fund, i) => card(ctx, fund, series[i], years, i, theme.etfs.length))
  rule(ctx, PAD, canvas.height - 100, W - 2 * PAD)
  text(ctx, 'Pas un conseil financier', W / 2, canvas.height - 66, 28, { color: MUTED, align: 'center', weight: 400 })
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
