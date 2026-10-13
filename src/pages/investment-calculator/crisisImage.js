import { fmtEUR, fmtPct, pct } from './lib.js'
import { crisisDateLabel, crisisMethodNote } from './crisis.js'

export async function renderCrisisImage(comparison) {
  if (!comparison.available) throw new Error(comparison.message)
  const { asset, crisis, amount, mode, endYm, entries } = comparison
  const canvas = document.createElement('canvas')
  canvas.width = 1600; canvas.height = 1100
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#092126'; ctx.fillRect(0, 0, 1600, 1100)
  function text(value, x, y, size = 30, color = '#fff1cf', width = 1460) {
    ctx.fillStyle = color
    while (size > 12) { ctx.font = `700 ${size}px Arial, sans-serif`; if (ctx.measureText(value).width <= width) break; size-- }
    ctx.fillText(value, x, y)
  }
  function wrap(value, y, width = 1460) {
    ctx.font = '24px Arial, sans-serif'; ctx.fillStyle = '#afc3c5'
    let line = ''
    for (const word of value.split(/\s+/)) {
      if (ctx.measureText(`${line} ${word}`).width > width && line) { ctx.fillText(line, 70, y); y += 32; line = word }
      else line = line ? `${line} ${word}` : word
    }
    if (line) { ctx.fillText(line, 70, y); y += 32 }
    return y
  }
  text('Et si tu avais commencé au mauvais moment ?', 70, 95, 58)
  text(`${asset.label} · ${crisis.label}`, 70, 165, 38, '#87f0c8')
  text(`${fmtEUR(amount, asset.currency)} ${mode === 'dca' ? 'par mois' : 'en une fois'} · résultats en ${crisisDateLabel(endYm)}`, 70, 222, 30, '#afc3c5')
  entries.forEach(({ label, startYm, result, loss }, i) => {
    const x = 70 + i * 495, width = 470
    ctx.fillStyle = '#15343a'; ctx.beginPath(); ctx.roundRect(x, 270, width, 455, 24); ctx.fill()
    text(label, x + 25, 325, 36, '#87f0c8', width - 50)
    text(crisisDateLabel(startYm), x + 25, 370, 28, '#afc3c5', width - 50)
    text('Capital final', x + 25, 435, 26, '#afc3c5')
    text(fmtEUR(result.finalValue, asset.currency), x + 25, 487, 48, '#fff1cf', width - 50)
    text(`Versé : ${fmtEUR(result.totalInvested, asset.currency)}`, x + 25, 535, 28, '#afc3c5', width - 50)
    text(`${fmtPct(pct(result.finalValue, result.totalInvested))} sur les versements`, x + 25, 580, 27, '#e8c377', width - 50)
    text(`${loss.total} mois en perte au total`, x + 25, 637, 28, '#fff1cf', width - 50)
    text(`Maximum : ${loss.longest} mois consécutifs`, x + 25, 680, 25, '#afc3c5', width - 50)
  })
  let y = 780
  if (mode === 'dca') y = wrap('Même versement mensuel ; durées et sommes totales versées différentes.', y)
  y = wrap('Dates de départ fixes, pas les sommets ou creux exacts de l’actif. Mois en perte : capital inférieur aux versements cumulés à la clôture mensuelle.', y + 8)
  y = wrap(crisisMethodNote(asset), y + 8)
  if (asset.sourceCredit) y = wrap(asset.sourceCredit, y + 8)
  text('Épargnant Libre · Pas un conseil financier', 70, Math.max(1050, y + 20), 26, '#87f0c8')
  return canvas
}
