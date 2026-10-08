import { getIndexComparisonComposition } from '../../data/index-comparison-composition.js'
import { getIndexComparisonPerformance } from '../../data/index-comparison-performance.js'
import { fmtPct } from './lib.js'
// Reference 2: ivory ceramic, sculpted counts and aligned composition tables.
// All copy and figures stay dynamic; decorative reliefs encode no financial data.
import { getIndexComparisonEditorial } from '../../data/index-comparison-editorial.js'
import { asIndexComparisonPair } from '../../data/index-comparison-pairs.js'
const BG = '#f4eee3', INK = '#17212b', MUTED = '#62645e'
const COLORS = ['#22614e', '#234e79', '#a64b21', '#6b527d', '#7d6333']
const FONT = 'Arial, "Helvetica Neue", sans-serif', SERIF = 'Georgia, serif'
function font(ctx, size, weight = 400, family = FONT) { ctx.font = `${weight} ${size}px ${family}` }
function lines(ctx, text, width) {
  return String(text).split('\n').flatMap(paragraph => {
    const output = []; let row = ''
    for (const word of paragraph.split(/\s+/)) {
      const next = row ? `${row} ${word}` : word
      if (ctx.measureText(next).width > width && row) { output.push(row); row = word } else row = next
    }
    if (row) output.push(row)
    return output
  })
}
function draw(ctx, rows, x, y, height, color) {
  ctx.fillStyle = color
  rows.forEach((row, i) => ctx.fillText(row, x, y + i * height))
  return y + rows.length * height
}
// Only dated, documented composition snapshots from the shared registry.
export const getIndexImageFacts = getIndexComparisonComposition

const cleanLabel = label => label.replace(/^[^\p{L}\p{N}]+/u, '').trim()
const percent = value => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
function sourceProvider(source) {
  if (!source?.url) return null
  const host = new URL(source.url).hostname
  if (host.endsWith('msci.com')) return 'MSCI'
  if (host.endsWith('ftserussell.com') || host.endsWith('lseg.com')) return 'FTSE Russell'
  if (host.endsWith('amundietf.fr')) return 'Amundi (fiche ETF)'
  if (host.endsWith('spglobal.com')) return 'S&P DJI'
  if (host.endsWith('stoxx.com')) return 'STOXX'
  if (host.endsWith('nikkei.co.jp')) return 'Nikkei'
  if (host.endsWith('ssga.com')) return 'State Street (fiche ETF)'
  return host.replace(/^www\./, '')
}

function rule(ctx, x, y, width) {
  ctx.fillStyle = '#c9bda8'; ctx.fillRect(x, y, width, 1)
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(x, y + 1, width, 1)
}
function paper(ctx, w, h) {
  const wash = ctx.createLinearGradient(0, 0, w, h)
  wash.addColorStop(0, '#fffaf1'); wash.addColorStop(.52, BG); wash.addColorStop(1, '#e7decf')
  ctx.fillStyle = wash; ctx.fillRect(0, 0, w, h)
  let seed = 43
  for (let i = 0; i < w * h / 75; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const x = seed % w
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    ctx.fillStyle = i % 2 ? 'rgba(97,77,48,.035)' : 'rgba(255,255,255,.3)'; ctx.fillRect(x, seed % h, 1, 1)
  }
}
// Abstract ceramic globe, not a geographic coverage map or index-provider logo.
function relief(ctx, x, y, color) {
  ctx.save(); ctx.translate(x, y); ctx.shadowColor = '#79664a55'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 6
  const glaze = ctx.createLinearGradient(-48, -48, 48, 48)
  glaze.addColorStop(0, '#fffbef'); glaze.addColorStop(.45, '#eee4d3'); glaze.addColorStop(1, '#cbb99c')
  ctx.fillStyle = glaze; ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.strokeStyle = color; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(0, 0, 15, 34, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(0, 0, 34, 13, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()
}
function ceramicNumber(ctx, text, x, y, width, color) {
  let size = 142
  do { font(ctx, size, 700, SERIF); if (ctx.measureText(text).width <= width) break; size-- } while (size > 40)
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = '#102b2866'
  ctx.shadowColor = '#614b3760'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 8
  for (let depth = 6; depth > 0; depth--) ctx.strokeText(text, x, y + depth)
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
  const glaze = ctx.createLinearGradient(0, y, 0, y + size)
  glaze.addColorStop(0, color); glaze.addColorStop(.22, color); glaze.addColorStop(.46, '#77948a'); glaze.addColorStop(.65, color); glaze.addColorStop(1, color)
  ctx.fillStyle = glaze; ctx.fillText(text, x, y); ctx.restore()
}
export async function renderIndexImage(family) {
  family = asIndexComparisonPair(family)
  await document.fonts.ready
  const editorial = getIndexComparisonEditorial(family)
  const columns = 2, W = 1800, PAD = 62, GAP = 42
  const WIDTH = (W - PAD * 2 - GAP * (columns - 1)) / columns, INNER = WIDTH - 40
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de générer le visuel.')
  const performanceRows = getIndexComparisonPerformance(family)
  const cards = family.indices.map((index, i) => {
    const displayName = (index.indexFacts?.index ?? index.name).replace(' (rappel, non-PEA)', '').replace(' (PEA)', '').replace('Émergents global (indice ESG)', 'Émergents ESG')
    font(ctx, 46, 700, SERIF); const name = lines(ctx, displayName, INNER)
    font(ctx, 29); const points = editorial.visualPoints[i].map(point => lines(ctx, point, INNER))
    const facts = getIndexImageFacts(index), stamp = facts?.asOf ? facts.asOf.split('-').reverse().join('/') : null
    const allocations = [['PRINCIPAUX PAYS', facts?.countries?.length ? facts.countries : facts ? [['Répartition non documentée', null]] : []], ['SECTEURS', facts?.sectors?.length ? facts.sectors : facts ? [['Répartition non documentée', null]] : []]].filter(([, entries]) => entries?.length).map(([label, entries]) => ({ label, rows: entries.map(([name, value]) => {
      font(ctx, 28); return { name: lines(ctx, cleanLabel(name), INNER - 145), value }
    }) }))
    const perf = performanceRows[i]
    const basis = `${perf.currency} · ${perf.method}`
    font(ctx, 24); const perfBasis = lines(ctx, basis, INNER)
    allocations.push({ label: 'PERFORMANCES', rows: perf.years.map(year => ({ name: [String(year)], text: fmtPct(perf[`y${year}`]) })) })
    return { name, points, perfBasis, count: facts?.count ?? facts?.targetCount ?? null, countLabel: Number.isFinite(facts?.count) ? 'titres' : 'sociétés visées', stamp, allocations, source: facts ? sourceProvider(index.indexFacts.source) : null, color: COLORS[i % COLORS.length] }
  })
  const rows = []
  for (let i = 0; i < cards.length; i += columns) {
    const group = cards.slice(i, i + columns), nameHeight = Math.max(...group.map(c => c.name.length * 56))
    const countOffset = 130 + nameHeight + 14, hasCount = group.some(c => Number.isFinite(c.count))
    const pointOffset = countOffset + (hasCount ? 220 : 20)
    const pointHeight = Math.max(...group.map(c => c.points.reduce((sum, p) => sum + p.length * 36 + 12, 0)))
    const hasStamp = group.some(c => c.stamp)
    let sectionOffset = pointOffset + pointHeight + 22 + (hasStamp ? 38 : 0)
    const sections = ['PRINCIPAUX PAYS', 'SECTEURS', 'PERFORMANCES'].map(label => {
      const offset = sectionOffset, maxRows = Math.max(...group.map(c => c.allocations.find(s => s.label === label)?.rows.length ?? 0))
      const heights = Array.from({ length: maxRows }, (_, n) => Math.max(...group.map(c => (c.allocations.find(s => s.label === label)?.rows[n]?.name.length ?? 1) * 36 + 12)))
      if (maxRows) sectionOffset += 53 + heights.reduce((sum, height) => sum + height, 0) + 24 + (label === 'PERFORMANCES' ? Math.max(...group.map(c => c.perfBasis.length)) * 30 + 12 : 0)
      return { label, offset, heights, active: maxRows > 0 }
    })
    rows.push({ nameHeight, countOffset, pointOffset, pointHeight, hasStamp, sections, height: sectionOffset + 24 })
  }
  const heading = editorial.imageTitle
  font(ctx, 60, 700, SERIF); const title = lines(ctx, heading, W - PAD * 2)
  const stamps = [...new Set(cards.map(card => card.stamp).filter(Boolean))]
  const commonStamp = stamps.length === 1 && cards.every(card => card.stamp) ? stamps[0] : null
  const HEADER = 45 + title.length * 74 + (commonStamp ? 68 : 24)
  const takeaway = editorial.insight
  font(ctx, 30, 700, SERIF); const takeawayLines = lines(ctx, takeaway, W - PAD * 2 - 100)
  const sources = [...new Set([...cards.map(c => c.source), ...performanceRows.map(p => sourceProvider(p.source))].filter(Boolean))]
  const sourcesText = sources.length ? `Sources : ${sources.join(' · ')}${cards.some(c => c.allocations.some(a => a.label === 'SECTEURS')) ? ' · Classifications sectorielles propres à chaque fournisseur' : ''}` : null
  font(ctx, 20); const sourceLines = sourcesText ? lines(ctx, sourcesText, W - PAD * 2 - 260) : []
  const footerTop = HEADER + rows.reduce((sum, row) => sum + row.height + GAP, 0)
  const takeawayHeight = takeawayLines.length * 40 + 40
  const H = Math.ceil(footerTop + takeawayHeight + Math.max(54, sourceLines.length * 27 + 28))
  canvas.width = W; canvas.height = H; ctx.textBaseline = 'top'
  paper(ctx, W, H); ctx.textAlign = 'center'; font(ctx, 60, 700, SERIF); draw(ctx, title, W / 2, 45, 74, INK)
  if (commonStamp) { font(ctx, 24); draw(ctx, [`Composition au ${commonStamp}`], W / 2, 45 + title.length * 74 + 8, 30, MUTED) }
  let top = HEADER
  cards.forEach((card, i) => {
    const rowIndex = Math.floor(i / columns), column = i % columns, row = rows[rowIndex]
    if (column === 0 && rowIndex > 0) top += rows[rowIndex - 1].height + GAP
    const x = PAD + column * (WIDTH + GAP), left = x + 20, center = x + WIDTH / 2
    if (column) { rule(ctx, x - GAP / 2, top + 12, 1); ctx.fillStyle = '#c9bda8'; ctx.fillRect(x - GAP / 2, top + 12, 1, row.height - 24); ctx.fillStyle = '#fffaf0'; ctx.fillRect(x - GAP / 2 + 1, top + 12, 1, row.height - 24) }
    relief(ctx, center, top + 55, card.color)
    ctx.textAlign = 'center'; font(ctx, 46, 700, SERIF); draw(ctx, card.name, center, top + 130, 56, card.color)
    if (Number.isFinite(card.count)) {
      ceramicNumber(ctx, card.count.toLocaleString('fr-FR'), center, top + row.countOffset, INNER - 8, card.color)
      font(ctx, 36, 700, SERIF); draw(ctx, [card.countLabel], center, top + row.countOffset + 156, 44, INK)
    }
    rule(ctx, left, top + row.pointOffset - 12, INNER)
    font(ctx, 29); let y = top + row.pointOffset
    for (const point of card.points) y = draw(ctx, point, center, y, 36, INK) + 12
    if (card.stamp && !commonStamp) { font(ctx, 22); draw(ctx, [`Composition au ${card.stamp}`], center, top + row.pointOffset + row.pointHeight + 4, 28, MUTED) }
    ctx.textAlign = 'left'
    for (const sectionLayout of row.sections.filter(s => s.active)) {
      const section = card.allocations.find(s => s.label === sectionLayout.label)
      if (!section) continue
      y = top + sectionLayout.offset
      const tableH = 45 + sectionLayout.heights.reduce((sum, h) => sum + h, 0)
      ctx.fillStyle = '#fffdf340'; ctx.beginPath(); ctx.roundRect(left - 5, y, INNER + 10, tableH, 6); ctx.fill()
      ctx.strokeStyle = `${card.color}60`; ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = `${card.color}20`; ctx.fillRect(left - 4, y + 1, INNER + 8, 38)
      font(ctx, 24, 700); draw(ctx, [section.label], left + 10, y + 6, 32, card.color); y += 46
      for (let n = 0; n < section.rows.length; n++) {
        const entry = section.rows[n]
        font(ctx, 28); draw(ctx, entry.name, left + 10, y, 36, INK)
        font(ctx, 28, 700); ctx.textAlign = 'right'; draw(ctx, [entry.text ?? (Number.isFinite(entry.value) ? percent(entry.value) : '')], left + INNER - 10, y, 36, INK); ctx.textAlign = 'left'
        y += sectionLayout.heights[n]
        if (n < section.rows.length - 1) rule(ctx, left, y - 8, INNER)
      }
      if (section.label === 'PERFORMANCES') { font(ctx, 24); draw(ctx, card.perfBasis, left + 10, y + 8, 30, MUTED) }
    }
  })
  ctx.save(); ctx.shadowColor = '#a18e7150'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 3; ctx.fillStyle = '#f8f3e9'; ctx.beginPath(); ctx.roundRect(PAD, footerTop, W - PAD * 2, takeawayHeight, 28); ctx.fill(); ctx.restore()
  ctx.strokeStyle = '#d6c8b1'; ctx.lineWidth = 1; ctx.stroke()
  ctx.textAlign = 'center'; font(ctx, 30, 700, SERIF); draw(ctx, takeawayLines, W / 2, footerTop + 20, 40, INK)
  ctx.textAlign = 'left'; font(ctx, 20); draw(ctx, sourceLines, PAD, footerTop + takeawayHeight + 16, 27, MUTED)
  ctx.textAlign = 'right'; font(ctx, 25, 700, SERIF); draw(ctx, ['Épargnant Libre'], W - PAD, H - 39, 32, INK)
  return canvas
}
export async function downloadIndexImage(family) {
  const canvas = await renderIndexImage(family)
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Impossible de générer le PNG')
  const url = URL.createObjectURL(blob), link = document.createElement('a')
  link.href = url; link.download = `comparateur-indices-${asIndexComparisonPair(family).pairId}.png`
  document.body.append(link); link.click(); link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
