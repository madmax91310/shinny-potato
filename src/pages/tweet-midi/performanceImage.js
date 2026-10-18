import { formatPerformancePct } from './performanceFormat.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { performanceBasis } from './data/performanceHistory.js'
import { getPerformanceEntries, MODES } from './engines/performance.js'
import { performanceDisplayBasis } from './performanceCurrency.js'
import { loadArtImage, loadEditorialFont } from './anniversaryArt.js'

const W = 1600, INK = '#151c26', BLUE = '#123da7', PAPER = '#f7f2e9', RED = '#a92c2c'
export const cumulativePerformance = rows => (rows.reduce((acc, row) => acc * (1 + row.pct / 100), 1) - 1) * 100
const font = (size, serif) => `600 ${size}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`
function text(ctx, value, x, y, size, { width = 1400, color = INK, align = 'center', serif = false, raised = false } = {}) {
  while (size > 22) {
    ctx.font = font(size, serif)
    if (ctx.measureText(value).width <= width) break
    size--
  }
  if (ctx.measureText(value).width > width) throw new Error(`Texte de performance trop long : ${value}`)
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  ctx.save()
  if (raised) { ctx.shadowColor = 'rgba(0,12,55,.45)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 6 }
  ctx.fillText(value, x, y); ctx.restore()
}
function wrap(ctx, value, size, width, serif = true) {
  ctx.font = font(size, serif)
  const lines = ['']
  for (const word of value.split(/\s+/)) {
    const i = lines.length - 1, next = [lines[i], word].filter(Boolean).join(' ')
    if (lines[i] && ctx.measureText(next).width > width) lines.push(word)
    else lines[i] = next
  }
  return lines
}
function titleLayout(ctx, value, width, compact) {
  for (let size = compact ? 62 : 120; size >= 30; size -= 2) {
    const lines = wrap(ctx, value, size, width)
    if (lines.length <= 2 && lines.every(line => ctx.measureText(line).width <= width)) return { lines, size }
  }
  throw new Error(`Nom de performance trop long : ${value}`)
}
export function performanceLayout(count, compact = false) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Actif ou performances annuelles absents')
  const columns = Math.min(compact ? 2 : 5, count), rows = Math.ceil(count / columns)
  const gridTop = compact ? 650 : rows === 1 ? 1000 : 900
  const rowStep = compact ? 146 : rows === 1 ? 320 : 220
  const cellHeight = rowStep - 20
  return { columns, rows, gridTop, rowStep, cellHeight, height: Math.max(1600, gridTop + rows * rowStep + 220) }
}
function paperCell(ctx, background, x, y, w, h) {
  ctx.save()
  // Recessed paper compartments: a dark upper edge and bright lower edge.
  ctx.fillStyle = '#cec4b6'; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(x + 2, y + 3, w - 1, h - 1)
  ctx.fillStyle = PAPER; ctx.fillRect(x + 5, y + 6, w - 9, h - 9)
  ctx.globalAlpha = .22
  ctx.drawImage(background, background.width * .2, background.height * .2, background.width * .6, background.height * .6, x + 5, y + 6, w - 9, h - 9)
  ctx.globalAlpha = 1
  const shade = ctx.createLinearGradient(x, y, x + 12, y + 12)
  shade.addColorStop(0, 'rgba(78,58,32,.16)'); shade.addColorStop(1, 'rgba(78,58,32,0)')
  ctx.fillStyle = shade; ctx.fillRect(x + 3, y + 4, w - 6, h - 7)
  ctx.restore()
}
const assetTitle = asset => (asset.label || asset.tweetPhrase).replace(/^Indice\s+/i, '')
function panel(ctx, entry, background, plan, height) {
  const { asset, returns } = entry
  const { x, width, compact, title, extra, layout, basisLines } = plan, center = x + width / 2
  title.lines.forEach((line, i) => text(ctx, line, center, 75 + i * (title.size + 10), title.size, { width, serif: true }))
  text(ctx, `${returns[0].year} — ${returns.at(-1).year} · EN ${asset.currency}`, center, 250 + extra, compact ? 32 : 51, { width, serif: true })
  const top = 330 + extra, bandH = compact ? 270 : 480
  ctx.save()
  ctx.shadowColor = 'rgba(22,27,65,.28)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 12
  ctx.fillStyle = BLUE; ctx.fillRect(x - 28, top, width + 56, bandH)
  ctx.shadowColor = 'transparent'
  ctx.globalAlpha = .25; ctx.globalCompositeOperation = 'multiply'
  // Texture is decorative only: every figure is drawn from the calculated entry.
  ctx.drawImage(background, background.width * .2, background.height * .2, background.width * .6, background.height * .6, x - 28, top, width + 56, bandH)
  ctx.globalAlpha = 1
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(x - 28, top + 2); ctx.lineTo(x + width + 28, top + 2); ctx.stroke()
  ctx.restore()
  const total = cumulativePerformance(returns)
  text(ctx, formatPerformancePct(total), center, top + (compact ? 30 : 55), compact ? 118 : 235,
    { width: width - 30, color: total < 0 ? '#ffd0cc' : PAPER, serif: true, raised: true })
  text(ctx, `Cumul sur ${returns.length} an${returns.length > 1 ? 's' : ''}`, center, top + (compact ? 185 : 350), compact ? 35 : 60,
    { width: width - 30, color: PAPER, serif: true, raised: true })
  const gap = compact ? 15 : 18, cellW = (width - gap * (layout.columns - 1)) / layout.columns
  returns.forEach(({ year, pct }, i) => {
    const row = Math.floor(i / layout.columns), col = i % layout.columns
    const onRow = Math.min(layout.columns, returns.length - row * layout.columns)
    const left = x + (width - onRow * cellW - (onRow - 1) * gap) / 2 + col * (cellW + gap)
    const y = layout.gridTop + extra + row * layout.rowStep
    paperCell(ctx, background, left, y, cellW, layout.cellHeight)
    text(ctx, String(year), left + cellW / 2, y + 22, compact ? 32 : 39, { width: cellW - 24, serif: true })
    text(ctx, formatPerformancePct(pct), left + cellW / 2, y + (compact ? 73 : layout.cellHeight > 220 ? 140 : 95), compact ? 48 : 66,
      { width: cellW - 20, color: pct < 0 ? RED : BLUE, serif: true })
  })
  basisLines.forEach((line, i) => text(ctx, line, center, height - plan.footerHeight + i * (compact ? 31 : 40), compact ? 25 : 32, { width, serif: false }))
}
export async function renderPerformanceImage(item) {
  const entries = getPerformanceEntries(item)
  if (!entries.length || entries.some(entry => !entry.returns.length)) throw new Error('Actif ou performances annuelles absents')
  const [background] = await Promise.all([loadArtImage('performance-cobalt/ivory-folds.webp'), loadEditorialFont()])
  const canvas = document.createElement('canvas'); canvas.width = W
  const ctx = canvas.getContext('2d'), compact = entries.length > 1
  const plans = entries.map((entry, i) => {
    const width = compact ? 670 : 1400, x = compact ? 85 + i * 760 : 100
    const title = titleLayout(ctx, assetTitle(entry.asset), width, compact)
    // Match the text engine's method, removing only duplicate currency tokens.
    const basis = performanceDisplayBasis(entry.asset, performanceBasis(entry.asset.id)).split(' · ')
      .filter(part => ![entry.asset.currency, entry.asset.sourceCurrency].includes(part)).join(' · ')
    const basisLines = wrap(ctx, basis, compact ? 25 : 32, width, false)
    const footerHeight = Math.max(175, basisLines.length * (compact ? 31 : 40) + 95)
    return { x, width, compact, title, basisLines, footerHeight, extra: Math.max(0, (title.lines.length - 1) * (title.size + 10)), layout: performanceLayout(entry.returns.length, compact) }
  })
  // Share the baseline in comparisons, including long names and unequal histories.
  const extra = Math.max(...plans.map(plan => plan.extra))
  plans.forEach(plan => { plan.extra = extra })
  canvas.height = Math.max(...plans.map(plan => plan.layout.height + extra + plan.footerHeight - 175))
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, canvas.height)
  ctx.drawImage(background, 0, 0, W, canvas.height)
  entries.forEach((entry, i) => panel(ctx, entry, background, plans[i], canvas.height))
  text(ctx, 'Épargnant Libre', W / 2, canvas.height - 65, 42, { serif: true })
  return canvas
}
export async function downloadPerformanceImage(item) {
  const canvas = await renderPerformanceImage(item)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `performance-depuis-${item.currency || 'native'}-${item.year}-${item.mode === MODES.COMPARATIF ? `${item.assetIdA}-${item.assetIdB}` : item.assetId}.png`
  document.body.appendChild(link); startPublicationDownload(link); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
