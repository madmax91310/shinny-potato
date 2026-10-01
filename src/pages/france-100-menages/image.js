import { renderNewHouseholdImage } from './new-designs.js'
import { formatHouseholdNumber, getHouseholdVisual } from '../../data/household-statistics.js'
const INK = '#f1f5f9', GREEN = '#38d5af', GOLD = '#e7c97c'
function wrap(ctx, text, x, y, width, lineHeight) {
  let line = ''
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) { ctx.fillText(line, x, y); y += lineHeight; line = word }
    else line = next
  }
  if (line) ctx.fillText(line, x, y)
  return y + lineHeight
}
function people(ctx, x, y, width, count, color = GREEN) {
  const step = width / 10, height = step * 1.22
  for (let i = 0; i < 100; i++) {
    const cx = x + (i % 10 + .5) * step, cy = y + Math.floor(i / 10) * height
    ctx.fillStyle = i < count ? color : '#263448'
    ctx.beginPath(); ctx.arc(cx, cy + step * .16, step * .105, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.roundRect(cx - step * .19, cy + step * .31, step * .38, step * .46, [step * .12, step * .12, step * .04, step * .04]); ctx.fill()
    ctx.fillRect(cx - step * .15, cy + step * .72, step * .115, step * .24)
    ctx.fillRect(cx + step * .035, cy + step * .72, step * .115, step * .24)
  }
}
export const DEFAULT_HOUSEHOLD_DESIGN = 'ivory'
export const HOUSEHOLD_DESIGNS = Object.freeze([
  { id: 'ivory', label: '01 · Ivoire & noir' },
  { id: 'blue', label: '02 · Bleu & blanc' },
  { id: 'plum', label: '03 · Prune & sable' },
  { id: 'original', label: 'Original · silhouettes' },
  { id: 'poster', label: '01 · Affiche typographique' },
  { id: 'editorial', label: '02 · Éditorial clair' },
  { id: 'cards', label: '03 · Cartes contrastées' },
])
export function renderHouseholdImage(record, design = DEFAULT_HOUSEHOLD_DESIGN) {
  if (['ivory', 'blue', 'plum'].includes(design)) return renderNewHouseholdImage(record, design)
  if (design !== 'original') return renderAlternative(record, design)
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1440
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Le navigateur ne permet pas de générer cette image.')
  ctx.fillStyle = '#0b1424'; ctx.fillRect(0, 0, 1080, 1440)
  ctx.fillStyle = GREEN; ctx.fillRect(64, 65, 54, 5)
  ctx.fillStyle = INK; ctx.font = 'bold 64px Arial, sans-serif'
  wrap(ctx, record.headline, 64, 207, 952, 74)
  const grids = getHouseholdVisual(record)
  if (record.kind === 'comparison') {
    for (const [i, grid] of grids.entries()) {
      const x = 64 + i * 502
      ctx.font = 'bold 77px Arial, sans-serif'; ctx.fillStyle = i ? GOLD : GREEN; ctx.fillText(grid.exact, x, 442)
      ctx.font = '600 29px Arial, sans-serif'; ctx.fillStyle = INK; wrap(ctx, grid.label, x, 494, 440, 37)
      people(ctx, x, 580, 440, grid.count, i ? GOLD : GREEN)
    }
  } else {
    const metric = record.kind === 'threshold' ? `${formatHouseholdNumber(record.value)} €` : `${formatHouseholdNumber(record.value)} %`
    ctx.font = 'bold 105px Arial, sans-serif'; ctx.fillStyle = GREEN; ctx.fillText(metric, 64, 443)
    ctx.font = '32px Arial, sans-serif'; ctx.fillStyle = INK; wrap(ctx, record.metricLabel, 64, 497, 930, 40)
    people(ctx, 295, 575, 490, grids[0].count)
    ctx.fillStyle = INK; ctx.font = '600 29px Arial, sans-serif'; wrap(ctx, grids[0].label, 64, 1320 - 100, 950, 38)
    if (record.kind === 'share') {
      // Part de la population et part du patrimoine sont deux grandeurs différentes.
      ctx.fillStyle = '#263448'; ctx.fillRect(64, 1350 - 75, 950, 10)
      ctx.fillStyle = GOLD; ctx.fillRect(64, 1350 - 75, 950 * record.value / 100, 10)
    }
  }
  ctx.textAlign = 'right'; ctx.fillStyle = GOLD; ctx.font = 'bold 24px Arial, sans-serif'; ctx.fillText('@epargnantlibre', 1016, 1430)
  return canvas.toDataURL('image/png')
}

function dots(ctx, x, y, width, count, active, inactive) {
  const step = width / 10
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = i < count ? active : inactive
    ctx.beginPath(); ctx.arc(x + (i % 10 + .5) * step, y + (Math.floor(i / 10) + .5) * step, step * .29, 0, Math.PI * 2); ctx.fill()
  }
}
function roundedPanel(ctx, x, y, w, h, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, 26); ctx.fill()
}
function renderAlternative(record, design) {
  if (!HOUSEHOLD_DESIGNS.some(item => item.id === design)) throw new Error('Design inconnu.')
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1440
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Le navigateur ne permet pas de générer cette image.')
  const paper = design === 'editorial', cards = design === 'cards'
  const bg = paper ? '#f4f0e6' : cards ? '#101827' : '#073d35'
  const fg = paper ? '#182f2c' : '#f4f0e6'
  const accent = paper ? '#147860' : cards ? '#38d5af' : '#c6f36a'
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1440)
  ctx.fillStyle = accent; ctx.fillRect(64, 64, 64, 7)
  ctx.fillStyle = fg; ctx.font = `${paper ? '' : 'bold '}62px ${paper ? 'Georgia, serif' : 'Arial, sans-serif'}`
  wrap(ctx, record.headline, 64, 210, 952, 73)
  const grids = getHouseholdVisual(record)
  const comparison = record.kind === 'comparison'
  const metric = record.unit === 'EUR' ? `${formatHouseholdNumber(record.value)} €` : `${formatHouseholdNumber(record.value)} %`
  if (comparison) {
    grids.forEach((grid, i) => {
      const x = 64 + i * 502, color = i ? (paper ? '#a66028' : GOLD) : accent
      if (cards) roundedPanel(ctx, x, 382, 450, 710, '#1c2b3d')
      const pad = cards ? 24 : 0, width = cards ? 400 : 440
      ctx.fillStyle = color; ctx.font = 'bold 78px Arial, sans-serif'; ctx.fillText(grid.exact, x + pad, 485)
      ctx.fillStyle = fg; ctx.font = 'bold 27px Arial, sans-serif'; wrap(ctx, grid.label, x + pad, 539, width, 35)
      dots(ctx, x + pad, 627, width, grid.count, color, paper ? '#d6dbd2' : cards ? '#364359' : '#286055')
    })
  } else if (cards) {
    roundedPanel(ctx, 64, 380, 952, 208, '#38d5af')
    ctx.fillStyle = '#102e29'; ctx.font = 'bold 102px Arial, sans-serif'; ctx.fillText(metric, 94, 487)
    ctx.font = '29px Arial, sans-serif'; wrap(ctx, record.metricLabel, 94, 538, 890, 36)
    roundedPanel(ctx, 64, 612, 952, 573, '#1c2b3d')
    dots(ctx, 76, 650, 470, grids[0].count, accent, '#364359')
    ctx.fillStyle = fg; ctx.font = 'bold 39px Arial, sans-serif'; wrap(ctx, grids[0].label, 592, 781, 370, 48)
    ctx.fillStyle = paper ? '#50645c' : '#b9cec5'; ctx.font = '25px Arial, sans-serif'; wrap(ctx, 'Chaque point représente 1 sur 100.', 592, 1020, 350, 34)
  } else {
    ctx.fillStyle = accent; ctx.font = 'bold 132px Arial, sans-serif'; ctx.fillText(metric, 64, 468)
    ctx.fillStyle = fg; ctx.font = '30px Arial, sans-serif'; wrap(ctx, record.metricLabel, 64, 526, 952, 38)
    dots(ctx, 280, 618, 520, grids[0].count, accent, paper ? '#d6dbd2' : '#286055')
    ctx.fillStyle = fg; ctx.font = 'bold 28px Arial, sans-serif'; wrap(ctx, grids[0].label, 64, 1190, 952, 36)
  }
  ctx.fillStyle = paper ? '#c6cdc3' : '#477366'; ctx.fillRect(64, 1350, 952, 1)
  ctx.textAlign = 'right'; ctx.fillStyle = fg; ctx.font = 'bold 23px Arial, sans-serif'; ctx.fillText('@epargnantlibre', 1016, 1430)
  return canvas.toDataURL('image/png')
}
