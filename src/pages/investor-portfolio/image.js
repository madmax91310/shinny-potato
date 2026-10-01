import { ATTRIBUTION, COLORS, dateFR, percentage } from './data.js'

function rounded(ctx, text, x, y, width, size = 34, color = '#f5f1e6') {
  ctx.fillStyle = color
  ctx.font = `600 ${size}px system-ui, sans-serif`
  ctx.fillText(text, x, y, width)
}

export function renderPortfolioImage(portfolio) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de créer le visuel.')
  const bg = ctx.createLinearGradient(0, 0, 1080, 1350)
  bg.addColorStop(0, '#132a35'); bg.addColorStop(1, '#07131d')
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1350)
  const { identity, snapshot, holdings } = portfolio
  const top = holdings.slice(0, 5)
  const other = Math.max(0, 1 - top.reduce((sum, row) => sum + row.weight, 0))
  rounded(ctx, 'ÉPARGNANT LIBRE  /  INVESTISSEURS', 76, 94, 940, 25, '#d9b974')
  rounded(ctx, identity.displayName, 76, 178, 930, 66)
  rounded(ctx, identity.entityName || 'Portefeuille déclaré', 78, 229, 910, 29, '#a8bdc4')
  rounded(ctx, `Positions au ${dateFR(snapshot.periodEnd)}`, 78, 288, 900, 26, '#c4d2d4')
  const cx = 540, cy = 584, radius = 234
  let start = -Math.PI / 2
  const parts = [...top.map((row) => row.weight), other]
  parts.forEach((part, i) => {
    if (part <= 0) return
    ctx.beginPath(); ctx.arc(cx, cy, radius, start, start + part * Math.PI * 2)
    ctx.strokeStyle = COLORS[i]; ctx.lineWidth = 78; ctx.stroke()
    start += part * Math.PI * 2
  })
  ctx.textAlign = 'center'
  rounded(ctx, `${holdings.length} lignes`, cx, cy - 4, 350, 47)
  rounded(ctx, 'déclarées (13F)', cx, cy + 43, 350, 25, '#afc5c9')
  ctx.textAlign = 'left'
  top.forEach((row, i) => {
    const y = 896 + i * 65
    ctx.fillStyle = COLORS[i]; ctx.beginPath(); ctx.arc(90, y - 11, 9, 0, Math.PI * 2); ctx.fill()
    rounded(ctx, row.ticker || row.issuerName, 117, y, 650, 33)
    ctx.textAlign = 'right'; rounded(ctx, percentage(row.weight), 995, y, 280, 34)
    ctx.textAlign = 'left'
  })
  ctx.fillStyle = COLORS[5]; ctx.beginPath(); ctx.arc(90, 1211, 9, 0, Math.PI * 2); ctx.fill()
  rounded(ctx, 'Autres positions', 117, 1222, 650, 29, '#bacad0')
  ctx.textAlign = 'right'; rounded(ctx, percentage(other), 995, 1222, 280, 30, '#bacad0')
  ctx.textAlign = 'left'
  rounded(ctx, identity.dataProvider === 'FolioFact' ? 'Données : FolioFact · déclarations SEC 13F' : ATTRIBUTION, 77, 1308, 930, 22, '#a6bac2')
  return canvas.toDataURL('image/png')
}
