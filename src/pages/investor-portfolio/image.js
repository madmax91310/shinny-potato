import { modelNatureLabel } from '../../data/investor-models.js'
import { holdingName, percentage } from './data.js'
import { loadArtImage, loadEditorialFont } from '../../lib/art-resources.js'
import { publicationPlan, portfolioOwner, cash, POSTER, posterCash } from './publication.js'
import { loadPortfolioFont, posterFont } from './type.js'
import { companyInitials, portfolioPortrait, positionLogo } from './media.js'

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
// Wrap unusually wide wordmarks at a transparent word gap. Original glyphs
// and proportions are preserved; no letter or logo is cropped to fit a card.
const wordmarks = new WeakMap()
function readableLogo(image) {
  if(!image || image.width/image.height<6)return image
  if(wordmarks.has(image))return wordmarks.get(image)
  const probe=document.createElement('canvas');probe.width=Math.ceil(image.width);probe.height=Math.ceil(image.height)
  const ctx=probe.getContext('2d');ctx.drawImage(image,0,0,probe.width,probe.height)
  const {data}=ctx.getImageData(0,0,probe.width,probe.height),w=probe.width,h=probe.height
  let best={start:0,end:0},start=null
  for(let x=Math.floor(w*.3);x<=Math.ceil(w*.7);x++) {
    let blank=true
    for(let y=0;y<h;y++)if(data[(y*w+x)*4+3]>5){blank=false;break}
    if(blank && start===null)start=x
    if(!blank && start!==null){if(x-start>best.end-best.start)best={start,end:x};start=null}
  }
  let result=image
  if(best.end-best.start>=Math.max(2,w*.008)) {
    const wrapped=document.createElement('canvas');wrapped.width=Math.max(best.start,w-best.end);wrapped.height=h*2+Math.ceil(h*.2)
    const c=wrapped.getContext('2d')
    c.drawImage(probe,0,0,best.start,h,(wrapped.width-best.start)/2,0,best.start,h)
    c.drawImage(probe,best.end,0,w-best.end,h,(wrapped.width-w+best.end)/2,wrapped.height-h,w-best.end,h)
    result=wrapped
  }
  probe.width=probe.height=1;wordmarks.set(image,result);return result
}

// The displayed preview is this very PNG; there is no separate CSS approximation.
export async function renderPortfolioImage(portfolio) {
  if (portfolio?.kind === 'model') return renderModelImage(portfolio)
  if (!portfolio) throw new Error('Charge un portefeuille avant de créer le visuel.')
  const plan=publicationPlan(portfolio), owner=portfolioOwner(portfolio)
  const [,portrait,logos]=await Promise.all([loadPortfolioFont(),portfolioPortrait({...portfolio.identity,displayName:owner},portfolio.media?.portrait),Promise.all(plan.entries.map(positionLogo))])
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Impossible de créer le visuel.')
  const ink='#17191d',green='#16852f',bg='#f5f4f0'
  ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350)
  function label(value,x,y,size=34,color=ink,align='left',weight=750) {
    ctx.font=posterFont(size,weight);ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,y)
  }
  function wrap(value,width,size,maxLines=2) {
    ctx.font=posterFont(size)
    const lines=[];let line=''
    for(const word of String(value).split(/\s+/)) {
      if(line && ctx.measureText(line+' '+word).width>width){lines.push(line);line=''}
      // Break unbroken identifiers instead of drawing beyond the margin.
      for(const char of word) {
        if(ctx.measureText(line+char).width>width){lines.push(line);line=''}
        line+=char
      }
      line+=' '
    }
    if(line.trim())lines.push(line.trim())
    if(lines.length>maxLines){lines.length=maxLines;let last=lines[maxLines-1].trim();while(ctx.measureText(last+'…').width>width)last=last.slice(0,-1);lines[maxLines-1]=last+'…'}
    return lines.map(l=>l.trim())
  }
  let titleSize=86
  ctx.font=posterFont(titleSize,850)
  while(ctx.measureText(owner).width>980 && titleSize>62){titleSize-=2;ctx.font=posterFont(titleSize,850)}
  const title=wrap(owner,980,titleSize)
  title.forEach((line,i)=>label(line,540,110+i*72,titleSize,green,'center',850))
  const headerY=title.length>1?236:178
  label('Son portefeuille',540,headerY,46,ink,'center',800)
  const date=new Date(portfolio.snapshot.periodEnd+'T12:00:00Z'),quarter=Math.ceil((date.getUTCMonth()+1)/3)
  label(`${quarter===1?'1er':quarter+'e'} trimestre ${date.getUTCFullYear()}`,540,headerY+44,32,ink,'center',550)
  // A single secondary line, never a stack of legal names.
  const fund=portfolio.identity.entityName || ''
  if(title.length===1 && fund.toLowerCase()!==owner.toLowerCase())wrap(fund,980,25,1).forEach(line=>label(line,540,headerY+79,25,'#565b61','center',500))
  const {cx,cy,outer,inner}=POSTER
  plan.entries.forEach(entry=>{
    ctx.beginPath();ctx.arc(cx,cy,outer,entry.start,entry.end);ctx.arc(cx,cy,inner,entry.end,entry.start,true);ctx.closePath();ctx.fillStyle=entry.color;ctx.fill()
    // No minimum sector width or seam can erase a sub-pixel holding.
  })
  ctx.fillStyle='#e5e6df';ctx.beginPath();ctx.arc(cx,cy,inner,0,Math.PI*2);ctx.fill()
  // A verified cutout can cross the inner edge by 16px. Its full aspect ratio
  // and face remain intact; sector logos and badges are outside this footprint.
  if(portrait.image) {
    const photo=portrait.image,k=Math.min((inner*2+26)/photo.width,(inner*2+45)/photo.height)
    ctx.drawImage(photo,cx-photo.width*k/2,cy+inner-photo.height*k,photo.width*k,photo.height*k)
  } else label(companyInitials(owner),cx,cy+28,82,green,'center',850)
  function mark(source,row,x,y,width,height,support) {
    const image=readableLogo(source)
    ctx.fillStyle=image&&support==='dark'?ink:'#fff';ctx.beginPath();ctx.roundRect(x,y,width,height,10);ctx.fill()
    if(image){const k=Math.min((width-12)/image.width,(height-12)/image.height);ctx.drawImage(image,x+(width-image.width*k)/2,y+(height-image.height*k)/2,image.width*k,image.height*k)}
    else label(row.other?'…':companyInitials(row.label),x+width/2,y+height/2+11,30,ink,'center',800)
  }
  plan.entries.forEach((entry,i)=>{
    const {x,y}=entry,align=entry.side==='left'?'left':'right',tx=entry.side==='left'?x:x+172
    const names=wrap(entry.label,172,34)
    names.forEach((line,j)=>label(line,tx,y+30+j*35,34,green,align,800))
    label(posterCash(entry.value,plan.currency),tx,y+102,30,ink,align,750)
    const badgeWidth=entry.weight>=.999?136:118,badgeX=entry.side==='left'?x:x+172-badgeWidth,badgeY=y+112
    ctx.fillStyle=entry.color;ctx.beginPath();ctx.roundRect(badgeX,badgeY,badgeWidth,36,18);ctx.fill()
    // Dark text on a pale badge retains a visible, identical color key.
    ctx.fillStyle='#ffffffdf';ctx.beginPath();ctx.roundRect(badgeX+3,badgeY+3,badgeWidth-6,30,15);ctx.fill()
    label(percentage(entry.weight),badgeX+badgeWidth/2,badgeY+28,30,ink,'center',800)
    const image=logos[i].image
    if(entry.inside && !entry.other) {
      const r=257,px=cx+Math.cos(entry.mid)*r,py=cy+Math.sin(entry.mid)*r
      const width=Math.min(118,2*r*Math.sin(Math.min(Math.PI/2,entry.weight*Math.PI))-20)
      mark(image,entry,px-width/2,py-40,width,80,logos[i].identity?.support)
    } else if(!entry.other) {
      if(names.length===1)mark(image,entry,x+41,y+41,90,32,logos[i].identity?.support)
      else {const mx=entry.side==='left'?x+124:x;mark(image,entry,mx,badgeY-4,48,44,logos[i].identity?.support)}
    }
    // Logos and the same colored percentage rim identify sectors directly.
    // No peripheral cards or long leader lines compete with the ring.
    if(entry.weight<.001) {
      const ax=cx+Math.cos(entry.mid)*(outer+3),ay=cy+Math.sin(entry.mid)*(outer+3)
      const ex=entry.side==='left'?x+178:x-6,ey=entry.y+74
      if(Math.hypot(ex-ax,ey-ay)<90){ctx.strokeStyle=entry.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ex,ey);ctx.stroke()}
    }
  })
  const totalLabel='Valeur des positions déclarées',amount=cash(plan.total,plan.currency)
  ctx.font=posterFont(30,600);const a=ctx.measureText(totalLabel).width
  ctx.font=posterFont(44,850);const b=ctx.measureText(amount).width
  const left=(1080-a-b-22)/2
  label(totalLabel,left,1185,30,ink,'left',600);label(amount,left+a+22,1185,44,ink,'left',850)
  if(portrait.image && /^CC BY/.test(portrait.license)) {
    const credit=`Photo : ${portrait.author} · ${portrait.license} · détourée`
    wrap(credit,992,22,2).forEach((line,i)=>label(line,540,1230+i*26,22,'#565b61','center',500))
  }
  label('Épargnant libre',540,1310,32,ink,'center',650)
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
