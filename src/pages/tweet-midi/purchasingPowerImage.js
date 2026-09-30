import { CURRENT_YEAR, computeBrut, computePoste, fmtEUR, fmtPct } from '../purchasing-power/lib.js'
import { POSTES } from '../../data/purchasing-power.js'

const W = 1200
const H = 1500
const C = { paper: '#EADFCB', ink: '#172223', accent: '#ED522E', white: '#FFF4DC' }

function label(ctx, value, x, y, size, color = C.ink, font = 'Arial, sans-serif') {
  ctx.fillStyle = color
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.font = `700 ${size}px ${font}`
  ctx.fillText(value, x, y)
}

function fitted(ctx, value, x, y, size, maxWidth, color = C.ink) {
  while (size > 38) {
    ctx.font = `700 ${size}px Arial, sans-serif`
    if (ctx.measureText(value).width <= maxWidth) break
    size -= 2
  }
  label(ctx, value, x, y, size, color)
}

export function renderPurchasingPowerImage(item) {
  if (!Number.isFinite(item.amount) || item.amount <= 0 || !Number.isInteger(item.startYear) || item.startYear >= CURRENT_YEAR) {
    throw new Error('Montant ou année invalide')
  }
  const general = item.mode === 'brut'
  if (!general && !POSTES[item.posteId]) throw new Error('Poste inconnu')
  const result = general
    ? computeBrut(item.amount, item.startYear)
    : computePoste(item.amount, item.startYear, item.posteId)
  const delta = result.newAmount - item.amount
  const pct = general ? result.inflationCumPct : result.posteCumPct
  const difference = `${delta >= 0 ? '+' : '−'}${fmtEUR(Math.abs(delta))}`
  const indicators = {
    loyer: ['SI CE MONTANT SUIVAIT', 'L’IRL,', 'QUEL ÉCART ?'],
    alimentation: ['SI CE MONTANT SUIVAIT', 'LES PRIX ALIMENTAIRES,', 'QUEL ÉCART ?'],
    carburant: ['SI CE MONTANT SUIVAIT', 'L’INDICE ÉNERGIE,', 'QUEL ÉCART ?'],
  }
  const lines = general
    ? ['POUR GARDER LE MÊME', 'POUVOIR D’ACHAT,', delta >= 0 ? 'COMBIEN EN PLUS ?' : 'COMBIEN EN MOINS ?']
    : indicators[item.posteId]

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = C.ink
  ctx.beginPath()
  ctx.moveTo(870, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 450); ctx.lineTo(1010, 305)
  ctx.closePath(); ctx.fill()
  label(ctx, 'ÉPARGNANT LIBRE  /  POUVOIR D’ACHAT', 76, 75, 25, C.ink, 'monospace')
  ctx.fillRect(76, 124, 1048, 3)
  fitted(ctx, lines[0], 74, 177, 78, 1050)
  fitted(ctx, lines[1], 74, 263, 89, 1050)
  fitted(ctx, lines[2], 74, 358, 89, 1050)

  ctx.fillStyle = C.accent; ctx.fillRect(0, 525, W, 600)
  fitted(ctx, difference, 65, 579, 232, 1070, C.white)
  label(ctx, `DE ${fmtEUR(item.amount)} EN ${item.startYear}`, 76, 916, 42, C.white, 'monospace')
  label(ctx, `À ${fmtEUR(result.newAmount)} EN ${CURRENT_YEAR}`, 76, 973, 42, C.white, 'monospace')

  ctx.fillStyle = C.ink
  ctx.beginPath()
  ctx.moveTo(0, 1125); ctx.lineTo(W, 1125); ctx.lineTo(W, 1240); ctx.lineTo(0, 1190)
  ctx.closePath(); ctx.fill()
  fitted(ctx, fmtPct(pct), 80, 1258, 105, 1040)
  const note = general
    ? 'Inflation générale · 2026 estimée'
    : item.posteId === 'loyer'
      ? 'Indice IRL · projection théorique · 2026 en cours'
      : item.posteId === 'carburant'
        ? 'Indice Énergie, pas prix à la pompe · 2026 provisoire'
        : 'Indice alimentaire · 2026 provisoire'
  fitted(ctx, note, 80, 1392, 26, 1050)
  return canvas
}

export async function downloadPurchasingPowerImage(item) {
  const canvas = renderPurchasingPowerImage(item)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export PNG impossible')
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pouvoir-achat-${item.startYear}-${CURRENT_YEAR}-${item.mode === 'brut' ? 'general' : item.posteId}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
