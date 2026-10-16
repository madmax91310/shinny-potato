import { formatPerformancePct } from './performanceFormat.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'
import { performanceBasis } from './data/performanceHistory.js'
import { getPerformanceEntries, MODES } from './engines/performance.js'
import { loadPerformanceArt, drawPerformanceArt } from './performanceArt.js'

const W = 1600
const INK = '#fbf4e5', MUTED = '#c0d0dc', GREEN = '#c2efff', RED = '#ffb5aa'
export const cumulativePerformance = rows => (rows.reduce((acc, row) => acc * (1 + row.pct / 100), 1) - 1) * 100
function gradient(ctx, x, y, w, h, stops) {
  const result = ctx.createLinearGradient(x, y, x + w, y + h)
  stops.forEach(([offset, color]) => result.addColorStop(offset, color))
  return result
}
const gold = ctx => gradient(ctx, 100, 0, 1400, 0, [[0,'#a77b40'],[.25,'#f4dfac'],[.6,'#d3aa64'],[1,'#fff0cc']])
function text(ctx, value, x, y, size, { width = 1400, color = INK, align = 'center', serif = false } = {}) {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  let fitted = size
  do { ctx.font = `400 ${fitted}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`; if (ctx.measureText(value).width <= width) break; fitted-- } while (fitted > 24)
  ctx.fillText(value, x, y)
}
function titleLines(ctx, title) {
  ctx.font = '400 112px Georgia, serif'
  if (ctx.measureText(title).width <= 1400) return [title]
  const words = title.split(/\s+/)
  let split = Math.ceil(words.length / 2), best = Infinity
  for (let i = 1; i < words.length; i++) {
    const maximum = Math.max(ctx.measureText(words.slice(0,i).join(' ')).width, ctx.measureText(words.slice(i).join(' ')).width)
    if (maximum < best) { split = i; best = maximum }
  }
  return [words.slice(0,split).join(' '), words.slice(split).join(' ')]
}
function glass(ctx, x, y, w, h) {
  ctx.save()
  ctx.fillStyle = gradient(ctx,x,y,w*.6,h,[[0,'#274c65'],[.42,'#11283d'],[1,'#0d1d2e']])
  ctx.shadowColor = '#00040d'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 15
  ctx.beginPath(); ctx.roundRect(x,y,w,h,26); ctx.fill()
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
  ctx.strokeStyle = gradient(ctx,x,y,w,h,[[0,'#daeeff'],[.15,'#7396b0'],[.4,'#284153'],[.8,'#e2c38a'],[1,'#425b70']]); ctx.lineWidth = 3; ctx.stroke()
  ctx.fillStyle = gradient(ctx,x,y,0,70,[[0,'rgba(234,246,255,.10)'],[1,'rgba(234,246,255,0)']])
  ctx.beginPath(); ctx.roundRect(x+8,y+8,w-16,66,20); ctx.fill()
  ctx.strokeStyle = 'rgba(220,238,255,.45)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(x+36,y+2); ctx.lineTo(x+w*.6,y+2); ctx.stroke()
  ctx.restore()
}
export function performanceLayout(count) {
  if (!Number.isInteger(count) || count < 1) throw new Error('Actif ou performances annuelles absents')
  const columns = Math.min(2, count), rows = Math.ceil(count / columns)
  return { columns, rows, gridTop: 816, rowStep: 182, cellHeight: 156, height: Math.max(1260, 816 + rows * 182 + 274) }
}
const assetTitle = asset => (asset.label || asset.tweetPhrase).replace(/^Indice\s+/i, '')
function panel(ctx, { asset, returns }, art, offsetY) {
  const layout = performanceLayout(returns.length), { columns, height } = layout
  const lines = titleLines(ctx, assetTitle(asset)), extra = (lines.length - 1) * 104
  ctx.save(); ctx.translate(0, offsetY)
  ctx.fillStyle = gradient(ctx,0,0,W,height,[[0,'#132d45'],[.55,'#061322'],[1,'#0e2132']]); ctx.fillRect(0,0,W,height+extra)
  const halo = ctx.createRadialGradient(800,500,0,800,500,950)
  halo.addColorStop(0,'rgba(50,127,185,.25)'); halo.addColorStop(1,'rgba(50,127,185,0)')
  ctx.fillStyle = halo; ctx.fillRect(0,0,W,1100)
  const illustration = document.createElement('canvas'); illustration.width = 1000; illustration.height = 680
  const artCtx = illustration.getContext('2d')
  drawPerformanceArt(artCtx,art,0,0,1000,680)
  artCtx.globalCompositeOperation = 'destination-in'
  artCtx.fillStyle = gradient(artCtx,0,0,1000,0,[[0,'transparent'],[.25,'#000'],[.8,'#000'],[1,'transparent']])
  artCtx.fillRect(0,0,1000,680)
  ctx.save(); ctx.globalAlpha = .16; ctx.drawImage(illustration,650,90); ctx.restore()
  if (!offsetY) text(ctx,'ÉPARGNANT LIBRE',800,78,51,{color:gold(ctx)})
  ctx.strokeStyle = 'rgba(226,195,138,.3)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(420,174); ctx.lineTo(1180,174); ctx.stroke()
  lines.forEach((line,i) => text(ctx,line,800,224+i*104,lines.length > 1 ? 88 : 128,{serif:true}))
  text(ctx,`${returns[0].year} — ${returns.at(-1).year} · EN ${asset.currency}`,800,382+extra,52,{color:MUTED})
  const total = cumulativePerformance(returns)
  ctx.save(); ctx.shadowColor = total < 0 ? '#b44c49' : '#5fbcf2'; ctx.shadowBlur = 23
  text(ctx,formatPerformancePct(total),800,480+extra,204,{color:total < 0 ? RED : GREEN,serif:true}); ctx.restore()
  text(ctx,`Cumul sur ${returns.length} an${returns.length > 1 ? 's' : ''}`,800,720+extra,56,{color:MUTED})
  const gap = 24, cellW = (1400 - gap * (columns - 1)) / columns
  returns.forEach(({ year, pct }, i) => {
    const row = Math.floor(i / columns), col = i % columns
    const onRow = Math.min(columns, returns.length - row * columns)
    const x = (W - onRow * cellW - (onRow - 1) * gap) / 2 + col * (cellW + gap)
    const y = layout.gridTop + extra + row * layout.rowStep
    glass(ctx,x,y,cellW,layout.cellHeight)
    text(ctx,String(year),x+44,y+39,60,{color:gold(ctx),serif:true,align:'left',width:170})
    ctx.strokeStyle = 'rgba(169,198,218,.16)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(x+220,y+42); ctx.lineTo(x+220,y+116); ctx.stroke()
    text(ctx,formatPerformancePct(pct),x+cellW-44,y+36,72,{color:pct < 0 ? RED : GREEN,align:'right',width:cellW-290})
  })
  // Keep the return convention; source credits stay in the app/data.
  const basis = performanceBasis(asset.id).split(' · ').filter(part => ![asset.currency,asset.sourceCurrency].includes(part)).join(' · ')
  text(ctx,basis,800,height+extra-172,46,{color:MUTED})
  ctx.strokeStyle = 'rgba(164,123,66,.35)'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(-120,height+extra-60); ctx.quadraticCurveTo(800,height+extra-160,1720,height+extra-60); ctx.stroke()
  ctx.restore()
  return height + extra
}
export async function renderPerformanceImage(item) {
  const entries = getPerformanceEntries(item)
  if (!entries.length || entries.some(entry => !entry.returns.length)) throw new Error('Actif ou performances annuelles absents')
  const images = await Promise.all(entries.map(entry => loadPerformanceArt(entry.asset.id)))
  await document.fonts.ready
  const canvas = document.createElement('canvas'); canvas.width = W
  const ctx = canvas.getContext('2d')
  canvas.height = entries.reduce((sum, entry) => sum + performanceLayout(entry.returns.length).height + (titleLines(ctx,assetTitle(entry.asset)).length - 1) * 104, 0)
  let y = 0
  entries.forEach((entry,i) => { y += panel(ctx,entry,images[i],y) })
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
