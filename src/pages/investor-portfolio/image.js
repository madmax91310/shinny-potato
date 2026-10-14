import { ATTRIBUTION, dateFR, holdingName, percentage } from './data.js'
import { loadArtImage, loadEditorialFont } from '../tweet-midi/anniversaryArt.js'
import { investorPortrait } from './portrait.js'

const W = 1600, H = 2000, INK = '#f4f5ff', CYAN = '#9ee8ff', GOLD = '#ecd8b0'
function block(ctx, value, x, y, width, height, size, color = INK, serif = false, align = 'left') {
  let rows, lineHeight
  for (; size >= 24; size--) {
    ctx.font = `${serif ? '500' : '600'} ${size}px ${serif ? 'Georgia' : 'Arial'}, serif`
    rows=[]; let line=''
    for (const word of String(value).split(/\s+/)) {
      const next=line?`${line} ${word}`:word
      if(line && ctx.measureText(next).width>width) {rows.push(line);line=word} else line=next
    }
    if(line)rows.push(line)
    lineHeight=Math.ceil(size*1.24)
    if(rows.length*lineHeight<=height && rows.every(row=>ctx.measureText(row).width<=width))break
  }
  if(size<24)throw new Error(`Texte investisseur trop long : ${value}`)
  ctx.textBaseline='top';ctx.textAlign=align;ctx.fillStyle=color
  rows.forEach((row,i)=>ctx.fillText(row,x,y+i*lineHeight));ctx.textAlign='left'
}
function glass(ctx, x, y, w, h) {
  ctx.fillStyle='rgba(11,35,56,.9)';ctx.strokeStyle='#35657b';ctx.lineWidth=1.5
  ctx.beginPath();ctx.roundRect(x,y,w,h,20);ctx.fill();ctx.stroke()
}
export async function renderPortfolioImage(portfolio) {
  if (!portfolio) throw new Error('Charge un portefeuille avant de créer le visuel.')
  const { identity, snapshot, holdings } = portfolio
  const portrait = investorPortrait(identity.slug)
  const [photo, , studio] = await Promise.all([loadArtImage(portrait.file), loadEditorialFont(),loadArtImage('approved/investor-glass.webp')])
  const canvas = document.createElement('canvas'); canvas.width=W; canvas.height=H
  const ctx = canvas.getContext('2d'); if(!ctx) throw new Error('Impossible de créer le visuel.')
  ctx.drawImage(studio,0,0,W,H)
  ctx.fillStyle='rgba(3,18,32,.93)';ctx.fillRect(0,0,W,H)
  ctx.save();ctx.beginPath();ctx.rect(0,40,570,660);ctx.clip()
  const scale=Math.max(570/photo.width,660/photo.height)
  const photoX=Math.max(570-photo.width*scale,Math.min(0,285-photo.width*scale*(portrait.focusX??.5)))
  ctx.drawImage(photo,photoX,40+(660-photo.height*scale)/2,photo.width*scale,photo.height*scale)
  const tint=ctx.createLinearGradient(0,400,0,700);tint.addColorStop(0,'transparent');tint.addColorStop(1,'#061522')
  ctx.fillStyle=tint;ctx.fillRect(0,40,570,660);ctx.restore()
  block(ctx,'ÉPARGNANT LIBRE',640,55,880,60,32,GOLD)
  block(ctx,portrait.person,640,145,880,250,88,GOLD,true)
  block(ctx,identity.entityName || identity.displayName,640,420,880,130,51,INK,true)
  block(ctx,`Positions déclarées au ${dateFR(snapshot.periodEnd)}`,640,585,880,90,36,CYAN)
  const top=holdings.slice(0,5), topWeight=top.reduce((sum,row)=>sum+row.weight,0)
  glass(ctx,70,725,1460,185)
  block(ctx,percentage(topWeight),110,770,490,110,96,CYAN,true)
  block(ctx,`du portefeuille déclaré dans les ${top.length} premières lignes`,650,760,830,80,36,INK,true)
  block(ctx,`${holdings.length} lignes · Poids hors options`,650,850,830,50,30,CYAN)
  block(ctx,'PRINCIPALES POSITIONS',80,950,1440,65,38,GOLD)
  const rows=[...top.map(row=>[holdingName(row),percentage(row.weight)]),['Autres positions',percentage(Math.max(0,1-topWeight))]]
  rows.forEach(([name,weight],i)=>{
    const y=1040+i*118
    glass(ctx,70,y,1460,103)
    block(ctx,name,105,y+19,1070,77,48,INK,true)
    block(ctx,weight,1495,y+17,290,78,57,CYAN,true,'right')
  })
  ctx.fillStyle='#35657b';ctx.fillRect(80,1795,1440,2)
  block(ctx,'Périmètre 13F : ce relevé ne représente pas tous les actifs de l’entité.',80,1825,1440,85,29,INK)
  const credit=identity.dataProvider==='FolioFact'?'Données : FolioFact · SEC 13F':identity.dataProvider==='SEC'?'Données : SEC EDGAR · 13F':ATTRIBUTION
  block(ctx,credit,80,1910,740,70,26,CYAN)
  block(ctx,'Pas un conseil financier',1520,1910,650,40,26,GOLD,false,'right')
  block(ctx,`Photo : ${portrait.author} · ${portrait.license}`,80,1960,1440,35,24,INK)
  return canvas.toDataURL('image/png')
}
