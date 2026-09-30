import { formatHouseholdNumber, getHouseholdVisual } from '../../data/household-statistics.js'
const INK = '#f1f5f9', MUTED = '#b6c3d4', GREEN = '#38d5af', GOLD = '#e7c97c'
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
export function renderHouseholdImage(record) {
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1440
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Le navigateur ne permet pas de générer cette image.')
  ctx.fillStyle = '#0b1424'; ctx.fillRect(0, 0, 1080, 1440)
  ctx.fillStyle = GREEN; ctx.fillRect(64, 65, 54, 5)
  ctx.font = '600 29px Arial, sans-serif'; ctx.fillStyle = GOLD; ctx.fillText('LA FRANCE EN 100 MÉNAGES', 64, 120)
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
    ctx.fillStyle = MUTED; ctx.font = '28px Arial, sans-serif'; wrap(ctx, 'Deux grilles indépendantes : un ménage peut détenir les deux placements.', 64, 1170, 950, 38)
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
  ctx.fillStyle = MUTED; ctx.font = '25px Arial, sans-serif'
  const note = record.kind === 'comparison' ? 'Chaque grille représente 100 ménages. Silhouettes arrondies.'
    : record.kind === 'share' ? `Silhouettes : ${record.populationPercent} % des ménages. Barre : ${formatHouseholdNumber(record.value)} % du patrimoine brut.`
    : record.kind === 'threshold' ? 'Immobilier et autres biens inclus, après déduction des dettes.'
    : record.id === 'homeowners' ? 'Usufruitiers inclus. Silhouettes arrondies.'
    : record.id === 'donation' ? 'Donations déclarées, reçues au cours de la vie.'
    : record.id === 'inheritance' ? 'Au moins un membre a hérité au cours de sa vie.'
    : record.id === 'debt' ? 'Crédits privés ou professionnels. Silhouettes arrondies.'
    : 'Détention d’un PEA par le ménage. Silhouettes arrondies.'
  wrap(ctx, note, 64, record.kind === 'share' ? 1320 : 1286, 950, 32)
  ctx.fillStyle = '#344155'; ctx.fillRect(64, 1350, 952, 1)
  ctx.fillStyle = MUTED; ctx.font = '24px Arial, sans-serif'; ctx.fillText('Source : Insee · Début 2024 · France hors Mayotte', 64, 1396)
  ctx.textAlign = 'right'; ctx.fillStyle = GOLD; ctx.font = 'bold 24px Arial, sans-serif'; ctx.fillText('@epargnantlibre', 1016, 1430)
  return canvas.toDataURL('image/png')
}
