import { LIFESTRATEGY_RECORDS } from '../../data/lifestrategy.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { loadEditorialFont } from './anniversaryArt.js'
import { getComparisonPerformance, getComparisonYears } from './comparisonPerformance.js'
import { getComparisonComposition as getComparisonImageComposition, COMPOSITION_LABELS } from '../etf-tweets/lib/comparisonComposition.js'
export { getComparisonComposition as getComparisonImageComposition } from '../etf-tweets/lib/comparisonComposition.js'
import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { getPreferredInstrumentListing } from '../../data/instrument-listings.js'
import { getInstrumentPeaStatus } from '../../data/instruments.js'
import { INSTRUMENT_FACTS_BY_ISIN } from '../../data/instrument-facts.js'

const W = 1800, PAD = 80, CARD_H = 1497, CARD_Y = 437, GAP = 31
const INK = '#182e2a', GREEN = '#126047', RED = '#ad3924', MUTED = '#53685a'
const PALETTE = [['#dbe9da', '#1f664e'], ['#eee0cc', '#a05d32'], ['#dde8ed', '#315578']]
const pct = value => `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
function text(ctx, value, x, y, size, { width = W, color = INK, align = 'left', serif = false, weight = 700 } = {}) {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `${weight} ${fitted}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`; if (ctx.measureText(value).width <= width) break; fitted-- } while (fitted > 12)
  ctx.fillText(value, x, y)
}
function wrap(ctx, value, width, size, { serif = false, weight = 700 } = {}) {
  ctx.font = `${weight} ${size}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`
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
  do { rows = wrap(ctx, value, width, size, options); if (rows.length <= maxRows) break; size-- } while (size > 16)
  rows.forEach((row, i) => text(ctx, row, x, y + i * (size + 7), size, { width, ...options }))
}
function rule(ctx, x, y, width) {
  ctx.fillStyle = '#bac0b8'; ctx.fillRect(x, y, width, 1.5)
}
function detail(fund) {
  return fund.differenciateur.replace(/(?:non[ -]éligible\s+|éligible\s+|hors\s+|en\s+)?\bPEA\b(?: selon [^,;]+)?|\bCTO\b/gi, '').replace(/\s+([,;])/g, '$1').replace(/[,;]\s*[,;]/g, ',').replace(/^[\s·,;:|–—-]+|[\s·,;:|–—-]+$/g, '').trim()
}
function rounded(ctx, x, y, width, height, color, radius = 24) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill()
}
function composition(ctx, fund, field, x, y, width, accent) {
  const multi = LIFESTRATEGY_RECORDS[fund.isin]
  if (multi) {
    const observation = field === 'sectors' ? multi.assetAllocation : multi.holdings
    text(ctx, field === 'sectors' ? 'ACTIONS ET OBLIGATIONS' : 'FONDS SOUS-JACENTS', x, y, 30, { width })
    const entries = [...observation.rows].sort((a,b)=>b.weightPct-a.weightPct).slice(0,3)
    entries.forEach((entry,i)=>{
      const label = entry.name.replace(/^Vanguard /,'').replace(/ UCITS ETF.*$/,'')
      lines(ctx,label,x,y+52+i*70,width-120,2,27,{weight:400})
      text(ctx,`${entry.weightPct.toLocaleString('fr-FR')} %`,x+width,y+52+i*70,29,{align:'right',width:116})
    })
    if (field === 'countries' || multi.assetAllocation.asOf !== multi.holdings.asOf) text(ctx,`Fonds · ${observation.asOf.split('-').reverse().join('/')}`,x,y+(field === 'sectors' ? 260 : 225),27,{width,weight:400,color:MUTED})
    return
  }
  const { rows, asOf, isIndex } = getComparisonImageComposition(fund.isin, field)
  // A rate index has no geographic or sector allocation. Keep the same panels,
  // showing its existing benchmark and currency instead of an unavailable portfolio.
  const benchmark = INSTRUMENT_FACTS_BY_ISIN[fund.isin]?.benchmark
  if (!rows.length && /€STR/.test(benchmark ?? '')) {
    text(ctx, field === 'sectors' ? 'EXPOSITION SUIVIE' : 'DEVISE DE L’INDICE', x, y, 30, { width })
    lines(ctx, field === 'sectors' ? benchmark : `Euro · ${AUTOMATED_ETF[fund.isin].currency}`, x, y + 52, width, 3, 29, { weight: 400, color: MUTED })
    return
  }
  text(ctx, field === 'sectors' ? 'PRINCIPAUX SECTEURS' : 'PRINCIPAUX PAYS', x, y, 30, { width })
  if (!rows.length) { text(ctx, 'Non disponible', x, y + 52, 29, { width, weight: 400, color: MUTED }); return }
  rows.forEach(([label, value], i) => {
    const yy = y + 52 + i * (field === 'sectors' ? 82 : 70), valueW = 156
    text(ctx, COMPOSITION_LABELS[label] ?? label, x, yy, 34, { width: width - valueW - 12, weight: 400 })
    text(ctx, `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`, x + width, yy, 36, { align: 'right', width: valueW })
    if (field === 'sectors') {
      rounded(ctx, x, yy + 46, width, 9, '#c4d2c7', 4)
      rounded(ctx, x, yy + 46, width * Math.min(value / 100, 1), 9, accent, 4)
    }
  })
  // Each composition keeps its own date and fund/index scope inside the card.
  const countries = getComparisonImageComposition(fund.isin, 'countries')
  if (field === 'countries' || asOf !== countries.asOf || isIndex !== countries.isIndex) text(ctx, `${isIndex ? 'Indice suivi' : 'Fonds'}${asOf ? ` · ${asOf.split('-').reverse().join('/')}` : ''}`, x, y + (field === 'sectors' ? 287 : 225), 27, { width, weight: 400, color: MUTED })
}
export function comparisonLayout(count) {
  const columns = count <= 3 ? Math.max(1, count) : 2
  const rows = Math.ceil(count / columns)
  return { columns, rows, compact: count >= 4, height: CARD_Y + rows * CARD_H + (rows - 1) * GAP + 166 }
}
function card(ctx, fund, performance, years, i, count) {
  const layout = comparisonLayout(count)
  const row = Math.floor(i / layout.columns), col = i % layout.columns
  const cardW = (W - 2 * PAD - GAP * (layout.columns - 1)) / layout.columns
  const x = PAD + col * (cardW + GAP), y = CARD_Y + row * (CARD_H + GAP)
  const [paper, accent] = PALETTE[i % PALETTE.length], inset = 28, width = cardW - 2 * inset
  rounded(ctx, x, y, cardW, CARD_H, paper)
  const xx = x + inset
  const name = fund.nom.replace(/ UCITS ETF S.*$/i, ' · S').replace(/ UCITS ETF.*$/i, '').replace(/ ETF$/i, '')
  lines(ctx, name, xx, y + 42, width, 3, 39)
  const ticker = getPreferredInstrumentListing(fund.isin)?.ticker
  const tickerW = ticker ? Math.max(116, Math.min(150, width * .28)) : 0
  if (ticker) text(ctx, ticker, xx, y + 175, 29, { width: tickerW, color: accent })
  text(ctx, fund.isin, xx + (ticker ? tickerW + 12 : 0), y + 178, 25, { width: width - (ticker ? tickerW + 12 : 0), weight: 400 })
  const pea = getInstrumentPeaStatus(fund.isin), envelope = pea === true ? 'PEA' : 'CTO'
  if (envelope) {
    rounded(ctx, xx, y + 231, 102, 43, accent, 8)
    text(ctx, envelope, xx + 51, y + 236, 26, { align: 'center', width: 92, color: '#ffffff' })
  }
  lines(ctx, detail(fund), xx + (envelope ? 123 : 0), y + 236, width - (envelope ? 123 : 0), 2, 32, { weight: 400 })
  text(ctx, fund.isCopperEtc ? 'Frais de gestion' : 'Frais annuels', xx, y + 344, 31, { width, weight: 400 })
  text(ctx, `${fund.frais.replace(/\s*%$/, '')} %`, xx + width, y + 394, 79, { width, align: 'right', color: accent })
  const swapRate = AUTOMATED_ETF[fund.isin]?.characteristics?.annualSwapRatePct
  if (fund.isCopperEtc && Number.isFinite(swapRate)) text(ctx, `Swap annuel : + ${swapRate.toLocaleString('fr-FR')} %`, xx, y + 477, 18, { width, weight: 400 })
  rule(ctx, xx, y + 501, width)
  text(ctx, performance ? `PERFORMANCES · ${performance.currency}` : 'HISTORIQUE', xx, y + 541, 27, { width })
  if (performance && years.length) {
    years.forEach((year, j) => {
      const observation = performance.rows.find(value => value.year === year), yy = y + 599 + j * 90
      text(ctx, String(year), xx, yy + 8, 31, { width: 100, weight: 400 })
      text(ctx, observation ? pct(observation.pct) : 'N/D', xx + width, yy, 50, { align: 'right', width: width - 112, color: observation?.pct < 0 ? RED : GREEN })
    })
  } else lines(ctx, 'Historique annuel non disponible', xx, y + 613, width, 2, 32, { weight: 400, color: MUTED })
  rule(ctx, xx, y + 894, width)
  composition(ctx, fund, 'sectors', xx, y + 928, width, accent)
  composition(ctx, fund, 'countries', xx, y + 1243, width, accent)
}
export async function renderComparatifEtfImage(theme) {
  if (!theme?.etfs?.length) throw new Error('Sélection ETF vide')
  await loadEditorialFont()
  const years = getComparisonYears(theme.etfs.map(fund => fund.isin))
  const series = theme.etfs.map(fund => getComparisonPerformance(fund.isin, years))
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = comparisonLayout(theme.etfs.length).height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f8f7f0'; ctx.fillRect(0, 0, W, canvas.height)
  text(ctx, 'ÉPARGNANT LIBRE', W / 2, 55, 36, { color: INK, align: 'center' })
  lines(ctx, `${theme.nom} :`, W / 2, 142, W - 2 * PAD, 1, 85, { align: 'center', serif: true, weight: 400 })
  const title = theme.etfs.length === 1 ? 'un support à découvrir' : theme.etfs.some(fund => /\bET[CP]\b/.test(fund.nom)) ? 'quel support choisir ?' : 'quel ETF choisir ?'
  text(ctx, title, W / 2, 282, 79, { width: W - 2 * PAD, align: 'center', serif: true, weight: 400 })
  rule(ctx, PAD, 385, W - 2 * PAD)
  theme.etfs.forEach((fund, i) => card(ctx, fund, series[i], years, i, theme.etfs.length))
  text(ctx, theme.etfs.every(f=>LIFESTRATEGY_RECORDS[f.isin]) ? 'Actions et obligations peuvent baisser.' : 'Pas un conseil financier', W / 2, canvas.height - 66, 28, { color: MUTED, align: 'center', weight: 400 })
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
