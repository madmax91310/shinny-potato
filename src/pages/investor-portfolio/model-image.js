import {modelNatureLabel} from '../../data/investor-models.js'
import {holdingName,percentage} from './data.js'
import {loadArtImage,loadEditorialFont} from '../../lib/art-resources.js'
const W = 1600, H = 1100, INK = '#f4f5ff', CYAN = '#9ee8ff', GOLD = '#ecd8b0'
function text(ctx, value, x, y, width, size, color = INK, serif = false) {
  ctx.fillStyle = color
  do { ctx.font = `${serif ? '500' : '600'} ${size}px ${serif ? 'Georgia' : 'Arial'}, serif`; size-- } while (ctx.measureText(value).width > width && size > 12)
  ctx.fillText(value, x, y)
}
function glass(ctx, x, y, w, h, radius = 24) {
  ctx.save()
  const body = ctx.createLinearGradient(x,y,x+w,y+h)
  body.addColorStop(0,'rgba(49,107,151,.38)'); body.addColorStop(.4,'rgba(7,24,44,.82)'); body.addColorStop(1,'rgba(17,42,66,.94)')
  ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(x,y,w,h,radius); ctx.fill()
  const rim = ctx.createLinearGradient(x,y,x+w,y+h)
  rim.addColorStop(0,'#e6faff'); rim.addColorStop(.18,'#58bcff'); rim.addColorStop(.44,'#172d51'); rim.addColorStop(.67,'#f5dbc0'); rim.addColorStop(.8,'#99ddff'); rim.addColorStop(1,'#5882a0')
  ctx.strokeStyle = rim; ctx.lineWidth = 4; ctx.shadowColor = '#34a4ff'; ctx.shadowBlur = 18; ctx.stroke()
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(215,241,255,.45)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.roundRect(x+7,y+7,w-14,h-14,Math.max(4,radius-5)); ctx.stroke(); ctx.restore()
}

// The approved glass background and cards also frame allocation models. All
// classes remain visible; a model never inherits a person's portrait or 13F date.
export async function renderModelImage(portfolio) {
  const { model, holdings } = portfolio
  const [, studio] = await Promise.all([loadEditorialFont(), loadArtImage('approved/investor-glass.webp')])
  const height = Math.max(H, holdings.length * 107 + 440)
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de créer le visuel.')
  ctx.drawImage(studio, 0, 0, W, height)
  ctx.fillStyle = 'rgba(2,10,25,.84)'; ctx.fillRect(45, 40, 1510, 197)
  text(ctx, model.name, 75, 115, 1450, 62, GOLD, true)
  text(ctx, modelNatureLabel(model), 75, 173, 1450, 38, CYAN)
  text(ctx, model.publication, 75, 221, 1450, 30)
  const columns = 1
  const count = Math.ceil(holdings.length / columns)
  const step = (height - 460) / count
  const width = columns === 2 ? 710 : 1450
  holdings.forEach((row, i) => {
    const col = Math.floor(i / count), line = i % count
    const x = 75 + col * 740, y = 265 + line * step
    glass(ctx, x, y, width, step - 14, 16)
    // Long class names wrap at a fixed readable size, rather than shrinking.
    const size = columns === 2 ? 32 : 46
    const maxWidth = width - 180
    ctx.font = `600 ${size}px Arial, serif`
    const words = holdingName(row).split(' '), lines = []; let current = ''
    for (const word of words) {
      const next = current ? current + ' ' + word : word
      if (current && ctx.measureText(next).width > maxWidth) { lines.push(current); current = word }
      else current = next
    }
    if (current) lines.push(current)
    const firstY = y + (step - 14) / 2 - (lines.length - 1) * (size + 3) / 2 + size * .35
    lines.forEach((line, j) => text(ctx, line, x + 23, firstY + j * (size + 3), maxWidth, size))
    ctx.textAlign = 'right'
    text(ctx, percentage(row.weight), x + width - 22, y + (step - 14) / 2 + 15, 140, 43, CYAN, true)
    ctx.textAlign = 'left'
  })
  ctx.fillStyle = 'rgba(2,10,25,.9)'; ctx.fillRect(45, height - 175, 1510, 96)
  text(ctx, 'Cibles théoriques · aucune détention personnelle', 75, height - 141, 1450, 32, CYAN)
  text(ctx, model.denominator === 12 ? 'Chaque poche vaut exactement 1/12 · pourcentages arrondis' : model.nature === 'published-model' ? 'Poids cibles publiés · aucune performance calculée' : 'Poids cibles pédagogiques · aucune performance calculée', 75, height - 94, 1450, 28)
  ctx.fillStyle = 'rgba(2,10,25,.88)'; ctx.fillRect(0, height - 72, W, 72)
  text(ctx, 'Pas un conseil financier', 75, height - 26, 750, 27, GOLD, true)
  ctx.textAlign = 'right'; text(ctx, 'Épargnant Libre', 1525, height - 26, 650, 28, GOLD, true); ctx.textAlign = 'left'
  return canvas.toDataURL('image/png')
}
