import { modelNatureLabel } from '../../data/investor-models.js'
import { ATTRIBUTION, dateFR, holdingName, percentage } from './data.js'
import { loadArtImage, loadEditorialFont } from '../../lib/art-resources.js'
import { publicationPlan, cash, labelLines } from './publication.js'
import { portfolioPortrait, positionLogo } from './media.js'

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
  if (portfolio?.kind === 'model') return renderModelImage(portfolio)
  if (!portfolio) throw new Error('Charge un portefeuille avant de créer le visuel.')
  const plan = publicationPlan(portfolio)
  const [portrait, logos] = await Promise.all([portfolioPortrait(portfolio.identity), Promise.all(plan.entries.map(positionLogo))])
  const canvas = document.createElement('canvas'); canvas.width=1080; canvas.height=1350
  const ctx = canvas.getContext('2d'); if(!ctx) throw new Error('Impossible de créer le visuel.')
  ctx.fillStyle='#f7f8f2'; ctx.fillRect(0,0,1080,1350)
  const ink='#183b2d', green='#186447'
  function label(value,x,y,size=30,color=ink,align='left') {
    ctx.font=`600 ${size}px monospace`; ctx.fillStyle=color; ctx.textAlign=align; ctx.fillText(value,x,y)
  }
  label('Le portefeuille de',540,65,36,ink,'center')
  // Long names wrap at a fixed readable size, never shrink to microscopic text.
  const title = labelLines(portfolio.identity.displayName, 29)
  title.forEach((line,i)=>label(line,540,126+i*44,40,ink,'center'))
  label(`Positions au ${dateFR(portfolio.snapshot.periodEnd)}`,540,278,29,green,'center')
  const entity = labelLines(portfolio.identity.entityName || portfolio.identity.displayName, 50)
  entity.slice(0,2).forEach((line,i)=>label(line,540,210+i*27,24,ink,'center'))
  const cx=540,cy=638,outer=235,inner=145
  plan.entries.forEach(entry=>{
    ctx.beginPath(); ctx.arc(cx,cy,outer,entry.start,entry.end); ctx.arc(cx,cy,inner,entry.end,entry.start,true); ctx.closePath()
    ctx.fillStyle=entry.color; ctx.fill()
  })
  // Cutout always stays inside the central hole; no percentage can be hidden.
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,inner-7,0,Math.PI*2); ctx.clip()
  ctx.fillStyle='#e4ecdf';ctx.fillRect(cx-inner,cy-inner,inner*2,inner*2)
  if(portrait.image) {
    const photo=portrait.image, scale=Math.min(282/photo.width,282/photo.height)
    ctx.drawImage(photo,cx-photo.width*scale/2,cy+inner-8-photo.height*scale,photo.width*scale,photo.height*scale)
  } else {
    const initials=portfolio.identity.displayName.split(/\s+/).slice(0,2).map(w=>w[0]).join('')
    label(initials,cx,cy+22,62,green,'center')
  }
  ctx.restore()
  function mark(image,row,x,y,size,support='light') {
    ctx.fillStyle=image&&support==='dark'?'#183b2d':'#fff';ctx.beginPath();ctx.roundRect(x,y,size,size,8);ctx.fill()
    if(image) { const k=Math.min((size-10)/image.width,(size-10)/image.height);ctx.drawImage(image,x+(size-image.width*k)/2,y+(size-image.height*k)/2,image.width*k,image.height*k) }
    else label(row.other?'…':(row.ticker||row.label).slice(0,3),x+size/2,y+size/2+6,18,green,'center')
  }
  plan.entries.forEach((entry,i)=>{
    const {x,y,height}=entry, image=logos[i].image
    const anchorX=cx+Math.cos(entry.mid)*(outer+3),anchorY=cy+Math.sin(entry.mid)*(outer+3)
    const edge=entry.side==='left'?x+268:x, elbow=entry.side==='left'?302:778
    ctx.strokeStyle=entry.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(anchorX,anchorY);ctx.lineTo(elbow,anchorY);ctx.lineTo(edge,y+height/2);ctx.stroke()
    ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(x,y,268,height,14);ctx.fill()
    ctx.fillStyle=entry.color;ctx.fillRect(x,y+12,5,height-24)
    mark(image,entry,x+12,y+14,42,logos[i].identity?.support)
    entry.lines.forEach((line,j)=>label(line,x+63,y+33+j*29,28))
    label(cash(entry.value,plan.currency),x+15,y+height-49,28)
    label(percentage(entry.weight),x+15,y+height-16,29,green)
    if(entry.inside) {
      const r=190,px=cx+Math.cos(entry.mid)*r,py=cy+Math.sin(entry.mid)*r
      mark(image,entry,px-23,py-40,46,logos[i].identity?.support)
      ctx.fillStyle='#fff';ctx.beginPath();ctx.roundRect(px-53,py+10,106,32,6);ctx.fill()
      label(percentage(entry.weight),px,py+34,21,ink,'center')
    }
  })
  label('Valeur des positions déclarées',540,1065,30,ink,'center')
  label(cash(plan.total,plan.currency),540,1122,49,green,'center')
  label('13F · hors options · valeurs à la date du relevé',540,1168,24,ink,'center')
  label(`${portfolio.holdings.length} lignes · détail intégral dans l’export`,540,1202,24,ink,'center')
  label('Épargnant libre',540,1320,34,green,'center')
  if(portrait.image && /^CC BY/.test(portrait.license)) {
    const credit=labelLines(`Photo : ${portrait.author} · ${portrait.license} · détourée`,65)
    credit.slice(0,2).forEach((line,i)=>label(line,540,1238+i*28,24,ink,'center'))
  }
  if (!['SEC','FolioFact'].includes(portfolio.identity.dataProvider)) label(ATTRIBUTION,540,1280,24,ink,'center')
  return canvas.toDataURL('image/png')
}


// The approved glass background and cards also frame allocation models. All
// classes remain visible; a model never inherits a person's portrait or 13F date.
async function renderModelImage(portfolio) {
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
