import { ATTRIBUTION, dateFR, holdingName, percentage } from './data.js'
import { loadArtImage, loadEditorialFont } from '../tweet-midi/anniversaryArt.js'
import { investorPortrait } from './portrait.js'

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
export async function renderPortfolioImage(portfolio) {
  if (!portfolio) throw new Error('Charge un portefeuille avant de créer le visuel.')
  const { identity, snapshot, holdings } = portfolio
  const portrait = investorPortrait(identity.slug)
  const [photo, , studio] = await Promise.all([loadArtImage(portrait.file), loadEditorialFont(),loadArtImage('approved/investor-glass.webp')])
  const canvas = document.createElement('canvas'); canvas.width=W; canvas.height=H
  const ctx = canvas.getContext('2d'); if(!ctx) throw new Error('Impossible de créer le visuel.')
  ctx.drawImage(studio,0,0,W,H)
  ctx.save(); ctx.beginPath(); ctx.moveTo(115,115);ctx.lineTo(610,172);ctx.lineTo(610,932);ctx.lineTo(100,958);ctx.closePath();ctx.clip()
  const scale=Math.max(515/photo.width,850/photo.height)
  const photoX = Math.max(100 + 515 - photo.width * scale, Math.min(100, 100 + 515 / 2 - photo.width * scale * (portrait.focusX ?? .5)))
  ctx.drawImage(photo,photoX,110+(850-photo.height*scale)/2,photo.width*scale,photo.height*scale)
  const tint=ctx.createLinearGradient(0,127,0,971); tint.addColorStop(0,'rgba(30,102,180,.05)'); tint.addColorStop(.65,'transparent'); tint.addColorStop(1,'rgba(2,12,28,.65)'); ctx.fillStyle=tint; ctx.fillRect(100,110,515,850); ctx.restore()

  text(ctx,portrait.person,650,174,875,74,GOLD,true)
  // Person and declaring entity are independently named, including Gates Trust.
  text(ctx,identity.entityName || identity.displayName,650,226,875,43,CYAN,true)
  text(ctx,`Positions au ${dateFR(snapshot.periodEnd)}`,650,258,875,25,INK)
  const top=holdings.slice(0,5)
  const rows=[...top.map(row=>[holdingName(row),percentage(row.weight)]),['Autres positions',percentage(Math.max(0,1-top.reduce((sum,row)=>sum+row.weight,0)))]]
  rows.forEach(([name,weight],i)=>{
    const y=270+i*107
    glass(ctx,630,y,900,92,13)
    ctx.save(); ctx.shadowColor='#33ccff'; ctx.shadowBlur=16; ctx.fillStyle='#68e3ff'; ctx.fillRect(631,y+12,4,68); ctx.restore()
    text(ctx,name,650,y+62,645,47,INK,true)
    ctx.textAlign='right'; text(ctx,weight,1504,y+62,170,46,CYAN,true); ctx.textAlign='left'
  })
  text(ctx,`${holdings.length} lignes · poids hors options`,650,932,900,24,CYAN)
  ctx.fillStyle='rgba(2,10,25,.78)';ctx.fillRect(0,1008,W,H-1008)
  text(ctx,portrait.person,40,1035,490,26,GOLD,true)
  ctx.textAlign='right'; text(ctx,'Épargnant Libre',1530,1035,700,27,GOLD,true); ctx.textAlign='left'
  // Keep the signature inside the page for long names and metadata.
  const credit=identity.dataProvider==='FolioFact'?'Données : FolioFact · SEC 13F':identity.dataProvider==='SEC'?'Données : SEC EDGAR · 13F':ATTRIBUTION
  text(ctx,credit,35,1072,700,16,INK)
  text(ctx,`Photo : ${portrait.author} · ${portrait.license}`,770,1072,780,15,INK)
  return canvas.toDataURL('image/png')
}
