import { MONTHS_FULL } from '../investment-calculator/data.js'
import { getHistoricalPrice, ymForYearsBack, fmtYm } from './data/marketHistory.js'
import { getMarketAsset, MODES, TODAY } from './lib.js'

const W = 1600
const C = { bg: '#101719', white: '#F7F8F3', orange: '#F7931A', muted: '#BCCAC6', line: '#435454', past: '#778986', down: '#E57869' }
const valid = (raw) => raw !== '' && raw !== null && raw !== undefined && Number.isFinite(Number(raw)) && Number(raw) > 0
const currency = (n, code) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)} ${code === 'USD' ? '$' : '€'}`
const percentage = (n) => `${n >= 0 ? '+' : '−'}${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(n))} %`

function txt(ctx, value, x, y, size, color = C.white, align = 'left') {
  ctx.textBaseline = 'top'; ctx.textAlign = align; ctx.fillStyle = color
  ctx.font = `700 ${size}px Arial, sans-serif`
  ctx.fillText(value, x, y)
}
function fit(ctx, value, x, y, maxSize, width, color = C.white, align = 'left', min = 32) {
  let size = maxSize
  do {
    ctx.font = `700 ${size}px Arial, sans-serif`
    if (ctx.measureText(value).width <= width) break
    size -= 4
  } while (size > min)
  txt(ctx, value, x, y, size, color, align)
}
function rule(ctx, y) { ctx.fillStyle = C.line; ctx.fillRect(95, y, 1410, 3) }

function snapshot(item, raw, assetId) {
  if (!valid(raw)) throw new Error('Saisir un niveau actuel valide avant de télécharger l’image')
  const asset = getMarketAsset(assetId)
  if (!asset) throw new Error('Actif inconnu')
  const date = ymForYearsBack(item.yearsBack, TODAY)
  return { asset, past: getHistoricalPrice(assetId, date), current: Number(raw), dateLabel: fmtYm(date, { monthLabels: MONTHS_FULL }) }
}

function comparison(ctx, snap, top, compact = false) {
  const { asset, past, current, dateLabel } = snap
  const change = (current / past - 1) * 100
  const color = change >= 0 ? C.orange : C.down
  const left = 97; const width = 1406
  txt(ctx, `${dateLabel.toUpperCase()}  →  AUJOURD’HUI`, left, top, compact ? 34 : 39, C.muted)
  rule(ctx, top + (compact ? 74 : 88))
  fit(ctx, currency(current, asset.currency), left - 8, top + (compact ? 111 : 134), compact ? 178 : 250, width, C.white, 'left', 75)
  txt(ctx, 'NIVEAU ACTUEL', left, top + (compact ? 333 : 424), compact ? 34 : 42, C.muted)
  const badgeY = top + (compact ? 416 : 532)
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(left, badgeY, width, compact ? 156 : 195, 20); ctx.fill()
  fit(ctx, percentage(change), left + 30, badgeY + 19, compact ? 111 : 145, width - 80, C.bg, 'left', 70)
  txt(ctx, 'ÉVOLUTION DU COURS', left, top + (compact ? 630 : 788), compact ? 32 : 38, C.white)
  const firstY = top + (compact ? 694 : 864)
  const secondY = firstY + (compact ? 186 : 236)
  txt(ctx, dateLabel.toUpperCase(), left, firstY, 35, C.muted)
  fit(ctx, currency(past, asset.currency), 1503, firstY, 39, 630, C.white, 'right')
  txt(ctx, 'AUJOURD’HUI', left, secondY, 35, C.muted)
  fit(ctx, currency(current, asset.currency), 1503, secondY, 39, 630, C.white, 'right')
  const max = Math.max(past, current)
  for (const [y, value, fill] of [[firstY + 73, past, C.past], [secondY + 73, current, color]]) {
    ctx.fillStyle = fill; ctx.beginPath()
    ctx.roundRect(left, y, Math.max(6, width * value / max), 69, 9); ctx.fill()
  }
}

export function renderAnniversaryImage(item, currentRaw, currentRawB = '') {
  const comparative = item.mode === MODES.COMPARATIF
  const a = snapshot(item, currentRaw, comparative ? item.assetIdA : item.assetId)
  const b = comparative ? snapshot(item, currentRawB, item.assetIdB) : null
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = comparative ? 3000 : 2050
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, canvas.height)
  ctx.fillStyle = C.orange; ctx.fillRect(0, 0, W, 20)
  txt(ctx, `IL Y A ${item.yearsBack} AN${item.yearsBack > 1 ? 'S' : ''}`, 96, 87, 58, C.orange)
  if (comparative) {
    fit(ctx, `${a.asset.label.toUpperCase()}  /  ${b.asset.label.toUpperCase()}`, 96, 190, 112, 1406)
    txt(ctx, a.asset.label.toUpperCase(), 96, 359, 61, C.orange)
    comparison(ctx, a, 457, true)
    rule(ctx, 1764)
    txt(ctx, b.asset.label.toUpperCase(), 96, 1811, 61, C.orange)
    comparison(ctx, b, 1909, true)
  } else {
    fit(ctx, a.asset.label.toUpperCase(), 96, 195, 132, 1406)
    comparison(ctx, a, 414)
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
