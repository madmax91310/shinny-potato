import { MONTHS_FULL } from '../investment-calculator/data.js'
import { getHistoricalPrice, ymForYearsBack, fmtYm } from './data/marketHistory.js'
import { getMarketAsset, MODES, TODAY } from './lib.js'

const W = 1600
const C = { paper: '#F3F0E6', ink: '#163C40', accent: '#B8553A', quiet: '#687C79', line: '#C9CEBF', past: '#9DBBB1' }
const valid = (raw) => raw !== '' && raw !== null && raw !== undefined && Number.isFinite(Number(raw)) && Number(raw) > 0
const currency = (n, code) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)} ${code === 'USD' ? '$' : '€'}`
const percentage = (n) => `${n >= 0 ? '+' : '−'}${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(n))} %`

function txt(ctx, value, x, y, size, color = C.ink, family = 'Arial, sans-serif', weight = 700, align = 'left') {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  ctx.font = `${weight} ${size}px ${family}`
  ctx.fillText(value, x, y)
}

function fit(ctx, value, x, y, maxSize, width, family, color = C.ink, min = 57, align = 'center') {
  let size = maxSize
  do {
    ctx.font = `700 ${size}px ${family}`
    if (ctx.measureText(value).width <= width) break
    size -= 4
  } while (size > min)
  txt(ctx, value, x, y, size, color, family, 700, align)
}

function bar(ctx, x, y, width, color) {
  ctx.fillStyle = color
  ctx.beginPath(); ctx.roundRect(x, y, width, 87, 12); ctx.fill()
}

function header(ctx, assetLabel, yearsBack, dateLabel, secondLabel = '') {
  ctx.fillStyle = C.accent; ctx.fillRect(0, 0, 41, ctx.canvas.height)
  txt(ctx, '@Epargnantlibre', 95, 64, 39)
  txt(ctx, `ARCHIVES / ${yearsBack} AN${yearsBack > 1 ? 'S' : ''}`, 1490, 70, 31, C.quiet, 'monospace', 700, 'right')
  if (secondLabel) {
    fit(ctx, assetLabel.toUpperCase(), 800, 196, 97, 1350, 'Georgia, serif')
    fit(ctx, `VS ${secondLabel.toUpperCase()}`, 800, 300, 97, 1350, 'Georgia, serif')
  } else {
    fit(ctx, assetLabel.toUpperCase(), 800, 197, 147, 1350, 'Georgia, serif')
  }
  txt(ctx, `${dateLabel.toUpperCase()} / AUJOURD’HUI`, 800, secondLabel ? 425 : 376, 39, C.accent, 'monospace', 700, 'center')
  ctx.fillStyle = C.line; ctx.fillRect(93, 528, 1405, 4)
}

function pricePair(ctx, historical, current, code, yearsBack, top, chartWidth = 1404) {
  const past = currency(historical, code)
  const now = currency(current, code)
  const gain = (current / historical - 1) * 100
  const nowColor = gain >= 0 ? C.accent : '#A84945'
  fit(ctx, past, 96, top, 178, 1310, 'Arial, sans-serif', C.ink, 70, 'left')
  txt(ctx, `IL Y A ${yearsBack} AN${yearsBack > 1 ? 'S' : ''}`, 98, top + 214, 42, C.quiet, 'monospace')
  bar(ctx, 95, top + 290, Math.max(6, chartWidth * historical / Math.max(historical, current)), C.past)
  fit(ctx, now, 96, top + 410, 192, 1310, 'Arial, sans-serif', nowColor, 70, 'left')
  txt(ctx, 'AUJOURD’HUI', 98, top + 632, 42, C.quiet, 'monospace')
  bar(ctx, 95, top + 717, Math.max(6, chartWidth * current / Math.max(historical, current)), nowColor)
  ctx.fillStyle = C.line; ctx.fillRect(94, top + 860, 1404, 3)
  fit(ctx, percentage(gain), 96, top + 897, 183, 1350, 'Georgia, serif', C.ink, 66, 'left')
  txt(ctx, gain >= 0 ? 'DE HAUSSE' : 'DE BAISSE', 99, top + 1140, 46, nowColor, 'monospace')
}

function snapshot(item, raw, assetId) {
  if (!valid(raw)) throw new Error('Saisir un niveau actuel valide avant de télécharger l’image')
  const asset = getMarketAsset(assetId)
  if (!asset) throw new Error('Actif inconnu')
  const date = ymForYearsBack(item.yearsBack, TODAY)
  return { asset, past: getHistoricalPrice(assetId, date), current: Number(raw), dateLabel: fmtYm(date, { monthLabels: MONTHS_FULL }) }
}

export function renderAnniversaryImage(item, currentRaw, currentRawB = '') {
  const comparative = item.mode === MODES.COMPARATIF
  const a = snapshot(item, currentRaw, comparative ? item.assetIdA : item.assetId)
  const b = comparative ? snapshot(item, currentRawB, item.assetIdB) : null
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = comparative ? 3290 : 2000
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, canvas.height)
  header(ctx, a.asset.label, item.yearsBack, a.dateLabel, b?.asset.label)
  if (!comparative) {
    pricePair(ctx, a.past, a.current, a.asset.currency, item.yearsBack, 578)
  } else {
    txt(ctx, a.asset.label.toUpperCase(), 96, 579, 57, C.accent)
    pricePair(ctx, a.past, a.current, a.asset.currency, item.yearsBack, 660)
    ctx.fillStyle = C.line; ctx.fillRect(94, 1942, 1404, 4)
    txt(ctx, b.asset.label.toUpperCase(), 96, 1990, 57, C.accent)
    pricePair(ctx, b.past, b.current, b.asset.currency, item.yearsBack, 2070)
  }
  return canvas
}

export async function downloadAnniversaryImage(item, currentRaw, currentRawB) {
  const canvas = renderAnniversaryImage(item, currentRaw, currentRawB)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `il-y-a-${item.yearsBack}-ans-${item.mode === MODES.COMPARATIF ? `${item.assetIdA}-${item.assetIdB}` : item.assetId}.png`
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
