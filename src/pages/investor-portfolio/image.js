import { ATTRIBUTION, dateFR, holdingName, percentage } from './data.js'
import { loadArtImage, loadEditorialFont } from '../tweet-midi/anniversaryArt.js'
import { investorPortrait } from './portrait.js'

const NAVY = '#092337', PAPER = '#f3e7cc', RED = '#701b2e', GOLD = '#c7a461'
function text(ctx, value, x, y, maxWidth, size, color, serif = false) {
  ctx.fillStyle = color
  do { ctx.font = `${serif ? '500' : '600'} ${size}px ${serif ? 'ExportEditorial, Georgia' : 'Arial'}, serif`; size-- } while (ctx.measureText(value).width > maxWidth && size > 12)
  ctx.fillText(value, x, y)
}
function torn(ctx, x, y, w, h, color, seed = 0) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 8, y)
  for (let i = 0; i <= w; i += 20) ctx.lineTo(x + i, y + ((i * 7 + seed) % 5))
  ctx.lineTo(x + w, y + h)
  for (let i = w; i >= 0; i -= 20) ctx.lineTo(x + i, y + h - ((i * 3 + seed) % 5))
  ctx.closePath(); ctx.fill()
}
function grain(ctx) {
  let seed = 29
  for (let i = 0; i < 38000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const x = seed % 1600
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    ctx.fillStyle = i % 2 ? 'rgba(255,242,211,.065)' : 'rgba(0,0,0,.055)'
    ctx.fillRect(x, seed % 1100, 1, 1)
  }
}
export async function renderPortfolioImage(portfolio) {
  if (!portfolio) throw new Error('Charge un portefeuille avant de créer le visuel.')
  const { identity, snapshot, holdings } = portfolio
  const portrait = investorPortrait(identity.slug)
  const [photo] = await Promise.all([loadArtImage(portrait.file), loadEditorialFont()])
  const canvas = document.createElement('canvas'); canvas.width = 1600; canvas.height = 1100
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Impossible de créer le visuel.')
  ctx.fillStyle = NAVY; ctx.fillRect(0, 0, 1600, 1100)
  ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(570,0); ctx.lineTo(430,390); ctx.lineTo(610,1100); ctx.lineTo(0,1100); ctx.fill()
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,152); ctx.lineTo(280,0); ctx.stroke()
  for (let y = 50; y < 1080; y += 15) for (let x = 20; x < 520; x += 15) {
    ctx.fillStyle = 'rgba(221,187,120,.22)'; ctx.beginPath(); ctx.arc(x,y,1.3,0,Math.PI*2); ctx.fill()
  }
  // A real photograph, printed on an irregular paper panel: no generated face.
  torn(ctx, 24, 188, 530, 742, PAPER, 3)
  ctx.save(); ctx.beginPath(); ctx.moveTo(42,204); ctx.lineTo(532,210); ctx.lineTo(544,904); ctx.lineTo(36,914); ctx.closePath(); ctx.clip()
  const w = 520, h = 724, scale = Math.max(w / photo.width, h / photo.height)
  ctx.filter = 'grayscale(40%) sepia(22%) contrast(110%)'
  ctx.drawImage(photo, 30 + w / 2 - photo.width * scale * .5, 198 + (h - photo.height * scale) / 2, photo.width * scale, photo.height * scale)
  ctx.filter = 'none'
  ctx.fillStyle = 'rgba(243,231,204,.14)'; ctx.fillRect(30,198,w,h)
  for (let y = 208; y < 922; y += 5) for (let x = 40; x < 546; x += 5) {
    ctx.fillStyle = 'rgba(9,35,55,.11)'; ctx.fillRect(x,y,1,1)
  }
  ctx.restore()
  text(ctx, 'PORTEFEUILLE D’INVESTISSEUR', 600, 55, 940, 22, GOLD)
  text(ctx, identity.displayName, 600, 139, 940, 74, PAPER, true)
  const entity = identity.entityName || 'Positions déclarées'
  text(ctx, entity, 600, 191, 940, 31, GOLD)
  text(ctx, `Positions au ${dateFR(snapshot.periodEnd)}`, 600, 251, 940, 32, PAPER)
  const top = holdings.slice(0,5)
  top.forEach((row, i) => {
    const y = 288 + i * 108
    torn(ctx, 598, y, 944, 92, PAPER, i)
    const label = holdingName(row)
    ctx.font = '500 47px ExportEditorial, Georgia, serif'
    if (ctx.measureText(label).width <= 660) text(ctx, label, 626, y + 61, 660, 47, NAVY, true)
    else {
      const words = label.split(' '); let cut = Math.ceil(words.length / 2)
      const lines = [words.slice(0,cut).join(' '), words.slice(cut).join(' ')]
      text(ctx, lines[0], 626, y + 39, 660, 35, NAVY, true)
      text(ctx, lines[1], 626, y + 77, 660, 35, NAVY, true)
    }
    ctx.fillStyle = GOLD; ctx.fillRect(1328,y+18,2,57)
    ctx.textAlign = 'right'; text(ctx, percentage(row.weight), 1517, y + 61, 165, 46, RED, true); ctx.textAlign = 'left'
  })
  const other = Math.max(0,1-top.reduce((sum,row) => sum+row.weight,0))
  const otherY = 288 + top.length * 108
  torn(ctx, 598, otherY, 944, 84, PAPER, 8)
  text(ctx, 'Autres positions', 626, otherY + 56, 660, 36, NAVY, true)
  ctx.textAlign = 'right'; text(ctx, percentage(other), 1517, otherY+56,165,38,RED,true); ctx.textAlign = 'left'
  text(ctx, portrait.person, 35, 978, 520, 35, PAPER, true)
  const association = identity.slug === 'berkshire' ? 'Figure historique de Berkshire Hathaway' : identity.slug === 'gates-trust' ? 'Portrait associé à la fondation' : 'Portrait de l’investisseur'
  text(ctx, association, 35, 1015, 520, 20, GOLD)
  text(ctx, `${holdings.length} lignes · déclaration SEC 13F · poids hors options`, 600, 981, 940, 24, PAPER)
  text(ctx, 'Épargnant Libre', 600, 1021, 480, 29, GOLD, true)
  const dataCredit = identity.dataProvider === 'FolioFact' ? 'Données : FolioFact · SEC 13F' : identity.dataProvider === 'SEC' ? 'Données : SEC EDGAR · 13F' : ATTRIBUTION
  text(ctx, dataCredit, 35, 1061, 730, 17, PAPER)
  text(ctx, `Photo : ${portrait.author} · ${portrait.license} · recadrée, effet imprimé`, 790, 1061, 755, 16, PAPER)
  grain(ctx)
  return canvas.toDataURL('image/png')
}
