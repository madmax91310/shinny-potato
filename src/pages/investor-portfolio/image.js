import {pngCredits} from './png-credits.js'
import { modelNatureLabel } from '../../data/investor-models.js'
import { holdingName, percentage } from './data.js'
import { loadArtImage, loadEditorialFont } from '../../lib/art-resources.js'
import { publicationPlan, editorialSeries, weightLabel, portfolioOwner, cash, POSTER } from './publication.js'
import { loadPortfolioFont, posterFont } from './type.js'
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
const prepared=new WeakMap()
export function transparentLogo(image) {
  if(!image)return null
  if(prepared.has(image))return prepared.get(image)
  const scale=Math.min(/\.svg(?:\?|$)/.test(image.src || '')?Infinity:1,640/image.width,640/image.height),c=document.createElement('canvas')
  c.width=Math.round(image.width*scale);c.height=Math.round(image.height*scale)
  const x=c.getContext('2d');x.drawImage(image,0,0,c.width,c.height)
  const pixels=x.getImageData(0,0,c.width,c.height),d=pixels.data
  let border=0,white=0,gray=0,ink=0
  for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++) {
    const i=(y*c.width+xx)*4
    if(!xx||!y||xx===c.width-1||y===c.height-1){border++;if(d[i]>242&&d[i+1]>242&&d[i+2]>242&&d[i+3]>240)white++}
    if(d[i+3]>32&&Math.min(d[i],d[i+1],d[i+2])<230){ink++;if(Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])<24)gray++}
  }
  const grayOnly=ink>0&&gray/ink>.96
  if(white/border>.85) {
    // Remove an opaque website matte, not the brand's white lettering.
    // Monochrome wordmarks also have transparent letter counters.
    const seen=new Uint8Array(c.width*c.height),queue=[]
    const add=(xx,y)=>{if(xx<0||y<0||xx>=c.width||y>=c.height)return;const n=y*c.width+xx,i=n*4;if(!seen[n]&&Math.min(d[i],d[i+1],d[i+2])>242){seen[n]=1;queue.push(n)}}
    if(grayOnly){for(let i=0;i<d.length;i+=4)if(Math.min(d[i],d[i+1],d[i+2])>242)d[i+3]=0}
    else {for(let xx=0;xx<c.width;xx++){add(xx,0);add(xx,c.height-1)}for(let y=0;y<c.height;y++){add(0,y);add(c.width-1,y)}
      for(let q=0;q<queue.length;q++){const n=queue[q],xx=n%c.width,y=Math.floor(n/c.width);d[n*4+3]=0;add(xx-1,y);add(xx+1,y);add(xx,y-1);add(xx,y+1)}}
    x.putImageData(pixels,0,0)
  }
  let l=c.width,t=c.height,r=0,b=0
  const alpha=x.getImageData(0,0,c.width,c.height).data,colors=new Map();let opaque=0,transparent=0
  for(let i=0;i<alpha.length;i+=4){if(alpha[i+3]<32)transparent++;if(alpha[i+3]>220){opaque++;const key=[alpha[i],alpha[i+1],alpha[i+2]].map(v=>Math.round(v/24)).join(',');colors.set(key,(colors.get(key)||0)+1)}}
  const mono=opaque>0&&transparent>c.width*c.height*.02&&Math.max(...colors.values())/opaque>.94
  for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++)if(alpha[(y*c.width+xx)*4+3]>24){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,y);b=Math.max(b,y)}
  const result=document.createElement('canvas');result.width=Math.max(1,r-l+1);result.height=Math.max(1,b-t+1)
  result.getContext('2d').drawImage(c,l,t,result.width,result.height,0,0,result.width,result.height)
  const rgba=result.getContext('2d').getImageData(0,0,result.width,result.height).data,points=[]
  for(let y=0;y<result.height;y+=6)for(let xx=0;xx<result.width;xx+=6)if(rgba[(y*result.width+xx)*4+3]>40)points.push([xx-result.width/2,y-result.height/2])
  const value={image:result,mono,points};prepared.set(image,value);c.width=c.height=1;return value
}
const lightness=color=>{const v=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return v[0]*.2126+v[1]*.7152+v[2]*.0722}

// One code-generated PNG is used unchanged by the preview and every download.
export async function renderPortfolioImage(portfolio) {
  if(portfolio?.kind==='model')return renderModelImage(portfolio)
  if(!portfolio)throw Error('Charge un portefeuille avant de créer le visuel.')
  const plan=publicationPlan(portfolio),owner=portfolioOwner(portfolio)
  const [,portrait,logos]=await Promise.all([loadPortfolioFont(),portfolioPortrait({...portfolio.identity,displayName:owner},portfolio.media?.portrait),Promise.all(plan.entries.map(positionLogo))])
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Impossible de créer le visuel.')
  const bg='#d7d7d7',ink='#080808',green='#006d26'
  ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1350)
  function label(value,x,y,size=36,color=ink,align='center',weight=850) {
    ctx.font=posterFont(size,weight);ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(value,x,y)
  }
  let titleSize=94;ctx.font=posterFont(titleSize,900)
  while(ctx.measureText(owner).width>1000&&titleSize>60){titleSize-=2;ctx.font=posterFont(titleSize,900)}
  const title=[];let line=''
  for(const word of owner.split(/\s+/)){if(line&&ctx.measureText(line+' '+word).width>1000){title.push(line);line=''}line=line?line+' '+word:word}if(line)title.push(line)
  title.forEach((line,i)=>label(line,540,(title.length>1?82:108)+i*65,titleSize,'#008c30','center',900))
  const date=new Date(portfolio.snapshot.periodEnd+'T12:00:00Z')
  label(`Portefeuille · T${Math.ceil((date.getUTCMonth()+1)/3)} ${date.getUTCFullYear()}`,540,title.length>1?218:190,title.length>1?48:55,ink,'center',900)
  const {cx,cy,outer,inner,badgeRadius:br}=POSTER
  plan.entries.forEach((e,i)=>{
    ctx.beginPath();ctx.arc(cx,cy,outer,e.start,e.end);ctx.arc(cx,cy,inner,e.end,e.start,true);ctx.closePath();ctx.fillStyle=e.color;ctx.fill()
    const prior=plan.entries[(i+plan.entries.length-1)%plan.entries.length]
    if(e.weight>=.003&&prior.weight>=.003){ctx.strokeStyle=bg;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+Math.cos(e.start)*inner,cy+Math.sin(e.start)*inner);ctx.lineTo(cx+Math.cos(e.start)*outer,cy+Math.sin(e.start)*outer);ctx.stroke()}
  })
  const occupied=new Uint8Array(1080*1350)
  if(portrait.image) {
    const image=portrait.image,k=Math.min(600/image.width,530/image.height)
    const left=cx-image.width*k/2,top=cy+inner+40-image.height*k
    const mask=document.createElement('canvas');mask.width=1080;mask.height=1350
    const m=mask.getContext('2d');m.beginPath();m.arc(cx,cy,inner+20,0,Math.PI*2);m.rect(0,0,1080,cy+60);m.clip();m.drawImage(image,left,top,image.width*k,image.height*k)
    ctx.drawImage(mask,0,0)
    const pixels=m.getImageData(0,0,1080,1350).data
    for(let i=0;i<occupied.length;i++)if(pixels[i*4+3]>12)occupied[i]=1
    mask.width=mask.height=1
  } else {
    const words=owner.split(/\s+/),lines=[];let current=''
    ctx.font=posterFont(40,800)
    for(const word of words){if(current&&ctx.measureText(current+' '+word).width>330){lines.push(current);current=''}current=current?current+' '+word:word}if(current)lines.push(current)
    lines.forEach((line,i)=>label(line,cx,cy+(i-(lines.length-1)/2)*48-30,40,ink,'center',800))
    const series=editorialSeries(portfolio)
    if(series.coverage<.5){label(`Les ${series.topCount} premières`,cx,cy+100,27,ink);label(`${weightLabel(series.coverage)} du portefeuille`,cx,cy+136,27,ink)}
  }
  for(const e of plan.entries)for(let y=Math.floor(e.badge.y-br-5);y<=e.badge.y+br+5;y++)for(let x=Math.floor(e.badge.x-br-5);x<=e.badge.x+br+5;x++)if(Math.hypot(x-e.badge.x,y-e.badge.y)<br+5)occupied[y*1080+x]=1
  // Reserve validated leader routes before placing any external logo.
  for(const e of plan.entries)for(let i=1;i<(e.leader?.length || 0);i++){
    const a=e.leader[i-1],b=e.leader[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y))
    for(let n=0;n<=steps;n++){const x=Math.round(a.x+(b.x-a.x)*n/Math.max(1,steps)),y=Math.round(a.y+(b.y-a.y)*n/Math.max(1,steps));for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++)if(x+dx>=0&&x+dx<1080&&y+dy>=0&&y+dy<1350)occupied[(y+dy)*1080+x+dx]=1}
  }
  const routeOccupied=(x,y,w,h)=>{for(let yy=Math.floor(y);yy<y+h;yy+=2)for(let xx=Math.floor(x);xx<x+w;xx+=2)if(occupied[yy*1080+xx])return true;return false}
  const extraLogos=[]
  plan.entries.forEach((e,i)=>{
    const logo=transparentLogo(logos[i].image)
    if(logo&&!e.other) {
      const image=logo.image,ratio=image.width/image.height
      let placement=null
      for(const width of [270,240,220,200,190,175,160,145,130,115,100,85,70,60]) {
        const k=Math.min(width/image.width,150/image.height)
        if(image.width*k<56||image.height*k<26)continue
        logoSearch: for(const r of [270,286,305,325])for(const turn of [0,-.05,.05,-.1,.1])for(const radial of ratio>2.6?[true,false]:[false]) {
          let a=radial?e.mid+turn:0;if(radial&&Math.cos(a)<0)a+=Math.PI
          const c=Math.cos(a),sn=Math.sin(a),x=cx+Math.cos(e.mid+turn)*r,y=cy+Math.sin(e.mid+turn)*r
          const fits=logo.points.every(([px,py])=>{
            const xx=x+(px*c-py*sn)*k,yy=y+(px*sn+py*c)*k,d=Math.hypot(xx-cx,yy-cy)
            const da=Math.abs(Math.atan2(Math.sin(Math.atan2(yy-cy,xx-cx)-e.mid),Math.cos(Math.atan2(yy-cy,xx-cx)-e.mid)))
            return d>inner+8&&d<outer-6&&da<e.weight*Math.PI-.006&&!occupied[Math.round(yy)*1080+Math.round(xx)]
          })
          if(fits){placement={x,y,a,k};break logoSearch}
        }
        if(placement)break
      }
      let external=false
      if(!placement) {
        const k=Math.min(112/image.width,68/image.height),w=image.width*k,h=image.height*k
        if(w>=56&&h>=26)externalSearch: for(const x of [e.box.x-w-12,e.box.x+e.box.width+12,e.box.x+(e.box.width-w)/2])for(const y of [e.box.y,e.box.y-h-10,e.box.y+e.box.height+10]) {
          const overlaps=b=>x<b.x+b.width+7&&x+w+7>b.x&&y<b.y+b.height+7&&y+h+7>b.y
          if(x<20||x+w>1060||y<230||y+h>1244||plan.entries.some(o=>overlaps(o.box)||Math.hypot(o.badge.x-Math.max(x,Math.min(o.badge.x,x+w)),o.badge.y-Math.max(y,Math.min(o.badge.y,y+h)))<br+6)||extraLogos.some(overlaps)||routeOccupied(x,y,w,h))continue
          if(Math.hypot(cx-Math.max(x,Math.min(cx,x+w)),cy-Math.max(y,Math.min(cy,y+h)))<outer+6)continue
          placement={x:x+w/2,y:y+h/2,a:0,k};extraLogos.push({x,y,width:w,height:h});external=true;break externalSearch
        }
      }
      if(placement) {
        const {x,y,a,k}=placement,paint=document.createElement('canvas');paint.width=image.width;paint.height=image.height
        const p=paint.getContext('2d');p.drawImage(image,0,0)
        if(logo.mono){p.globalCompositeOperation='source-in';p.fillStyle=!external&&lightness(e.color)<.179?'#fff':'#111';p.fillRect(0,0,paint.width,paint.height)}
        ctx.save();ctx.translate(x,y);ctx.rotate(a)
        if(!logo.mono&&!external){ctx.shadowColor='rgba(255,255,255,.65)';ctx.shadowBlur=3}
        ctx.drawImage(paint,-image.width*k/2,-image.height*k/2,image.width*k,image.height*k);ctx.restore();paint.width=paint.height=1
        const c=Math.cos(a),sn=Math.sin(a)
        for(const [px,py] of logo.points){const xx=Math.round(x+(px*c-py*sn)*k),yy=Math.round(y+(px*sn+py*c)*k);for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(xx+dx>=0&&xx+dx<1080&&yy+dy>=0&&yy+dy<1350)occupied[(yy+dy)*1080+xx+dx]=1}
      }
    }
  })
  // Draw all sector associations beneath every badge, so later lines cannot cross a percentage.
  plan.entries.forEach(e=>{const {badge}=e
    // Only ambiguous displaced associations receive a short connector.
    if(Math.abs(Math.atan2(Math.sin(e.badgeAngle-e.mid),Math.cos(e.badgeAngle-e.mid)))>.015) {
      ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+Math.cos(e.mid)*(outer-2),cy+Math.sin(e.mid)*(outer-2));ctx.lineTo(badge.x,badge.y);ctx.stroke()
    }
  })
  plan.entries.forEach(e=>{
    const {badge,box}=e
    const leader=e.leader
    if(leader){ctx.strokeStyle='#5c5c5c';ctx.lineWidth=1.5;ctx.beginPath();leader.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke()}
    ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(badge.x,badge.y,br,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#161616';ctx.lineWidth=2.5;ctx.stroke()
    const pct=percentage(e.weight).replace(/\s/g,'')
    let size=32;ctx.font=posterFont(size,900);while(ctx.measureText(pct).width>br*1.72&&size>25){size--;ctx.font=posterFont(size,900)}
    label(pct,badge.x,badge.y+size*.35,size,lightness(e.color)<.179?'#fff':ink,'center',900)
    box.lines.forEach((line,j)=>label(line,box.x+box.width/2,box.y+34+j*40,36,green,'center',850))
  })
  label(`Valeur déclarée : ${cash(plan.total,plan.currency)}`,540,1284,39,ink,'center',850)
  const coverage=editorialSeries(portfolio)
  if(portrait.image&&coverage.coverage<.5){ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(cx-166,cy+110,332,42,12);ctx.fill();label(`${coverage.topCount} premières · ${weightLabel(coverage.coverage)}`,cx,cy+140,27,ink)}
  if(portrait.image&&portrait.illustration?.caption){ctx.fillStyle=bg;ctx.fillRect(cx-240,cy+155,480,34);label(portrait.illustration.caption,cx,cy+181,24,ink,'center',750)}
  if(portrait.image&&/^CC BY/.test(portrait.license))label(`Photo : ${portrait.author} · ${portrait.license} · détourée`,540,1309,22,'#343434','center',550)
  const series=editorialSeries(portfolio)
  label(`Épargnant libre${series.pages.length>1?` · 1/${series.pages.length}`:''}`,540,1343,27,ink,'center',750)
  const photo=portrait.image?Object.fromEntries(['person','title','source','url','author','license','licenseUrl','adaptation','sourceDigest','illustration'].map(key=>[key,portrait[key]])):null
  if(photo&&!photo.licenseUrl){const match=photo.license.match(/^CC BY(-SA)? ([0-9.]+)/);if(match)photo.licenseUrl=`https://creativecommons.org/licenses/by${match[1]?'-sa':''}/${match[2]}/`}
  return pngCredits(canvas.toDataURL('image/png'),{owner,periodEnd:portfolio.snapshot.periodEnd,scope:'Positions déclarées hors options ; poids sur le portefeuille admissible complet.',portrait:photo,positions:plan.entries.map(({label,value,weight,count})=>({label,value,weight,count})),total:plan.total,currency:plan.currency})
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
