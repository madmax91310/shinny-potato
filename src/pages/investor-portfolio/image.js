import {pngCredits} from './png-credits.js'
import { modelNatureLabel } from '../../data/investor-models.js'
import { holdingName, percentage } from './data.js'
import { loadArtImage, loadEditorialFont } from '../../lib/art-resources.js'
import { publicationPlan, portfolioOwner, cash, POSTER } from './publication.js'
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
  title.forEach((line,i)=>label(line,540,(title.length>1?72:98)+i*65,titleSize,'#008c30','center',900))
  const date=new Date(portfolio.snapshot.periodEnd+'T12:00:00Z')
  label(`Portefeuille · T${Math.ceil((date.getUTCMonth()+1)/3)} ${date.getUTCFullYear()}`,540,title.length>1?186:151,title.length>1?36:40,ink,'center',900)
  const shown=plan.entries.filter(e=>!e.other),shownWeight=shown.reduce((sum,e)=>sum+e.value,0)/plan.total
  const {cx,cy,outer,inner,badgeRadius:br}=POSTER
  plan.entries.forEach((e,i)=>{
    ctx.beginPath();ctx.arc(cx,cy,outer,e.start,e.end);ctx.arc(cx,cy,inner,e.end,e.start,true);ctx.closePath();ctx.fillStyle=e.color;ctx.fill()
    const prior=plan.entries[(i+plan.entries.length-1)%plan.entries.length]
    if(e.weight>=.003&&prior.weight>=.003){ctx.strokeStyle=bg;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx+Math.cos(e.start)*inner,cy+Math.sin(e.start)*inner);ctx.lineTo(cx+Math.cos(e.start)*outer,cy+Math.sin(e.start)*outer);ctx.stroke()}
  })
  const occupied=new Uint8Array(1080*1350)
  if(portrait.image) {
    const image=portrait.image,k=Math.min(600/image.width,530/image.height,portrait.maxPublicationScale || Infinity)
    const left=cx-image.width*k/2,top=cy+inner+40-image.height*k,half=Math.min(280,image.width*k*.46)
    const mask=document.createElement('canvas');mask.width=1080;mask.height=1350
    const m=mask.getContext('2d');m.beginPath();m.moveTo(cx,cy+inner+20);m.bezierCurveTo(cx-200,cy+inner+20,cx-half,cy+70,cx-half,cy-70);m.lineTo(cx-300,350);m.lineTo(cx+300,350);m.lineTo(cx+half,cy-70);m.bezierCurveTo(cx+half,cy+70,cx+200,cy+inner+20,cx,cy+inner+20);m.closePath();m.clip();m.drawImage(image,left,top,image.width*k,image.height*k)
    ctx.drawImage(mask,0,0)
    const pixels=m.getImageData(0,0,1080,1350).data
    for(let i=0;i<occupied.length;i++)if(pixels[i*4+3]>12)occupied[i]=1
    mask.width=mask.height=1
  } else {
    const words=owner.split(/\s+/),lines=[];let current=''
    ctx.font=posterFont(40,800)
    for(const word of words){if(current&&ctx.measureText(current+' '+word).width>330){lines.push(current);current=''}current=current?current+' '+word:word}if(current)lines.push(current)
    lines.forEach((line,i)=>label(line,cx,cy+(i-(lines.length-1)/2)*48-30,40,ink,'center',800))
  }
  for(const e of plan.entries)for(let y=Math.floor(e.badge.y-br-5);y<=e.badge.y+br+5;y++)for(let x=Math.floor(e.badge.x-br-5);x<=e.badge.x+br+5;x++)if(Math.hypot(x-e.badge.x,y-e.badge.y)<br+5)occupied[y*1080+x]=1
  const logoReport=[]
  plan.entries.forEach((e,i)=>{
    const audit={label:e.label,id:logos[i].identity?.id || null,status:logos[i].image?'placement-rejected':logos[i].identity?'load-failed':'unavailable'};if(!e.other)logoReport.push(audit)
    const logo=transparentLogo(logos[i].image)
    if(logo&&!e.other) {
      const image=logo.image,ratio=image.width/image.height
      let placement=null
      for(const width of [...(ratio>8?[390,360,330,300]:[]),270,240,220,200,190,175,160,145,130,115,100,85,70,60]) {
        const k=Math.min(width/image.width,150/image.height)
        if(image.width*k<56||image.height*k<(ratio>8?18:26))continue
        logoSearch: for(const r of [245,270,295,320,345,360])for(const turn of [0,-.08,.08,-.16,.16,-.24,.24,-.32,.32,-e.weight*2,e.weight*2,-e.weight*2.6,e.weight*2.6])for(const direction of ratio>2.6?[0,1,2]:[0]) {
          let a=direction?e.mid+turn+(direction===2?Math.PI/2:0):0;if(direction&&Math.cos(a)<0)a+=Math.PI
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
      if(placement) {
        audit.status='sector';audit.placement=placement
        const {x,y,a,k}=placement,paint=document.createElement('canvas');paint.width=image.width;paint.height=image.height
        const p=paint.getContext('2d');p.drawImage(image,0,0)
        if(logo.mono){p.globalCompositeOperation='source-in';p.fillStyle=lightness(e.color)<.179?'#fff':'#111';p.fillRect(0,0,paint.width,paint.height)}
        ctx.save();ctx.translate(x,y);ctx.rotate(a)
        if(!logo.mono){ctx.shadowColor='rgba(255,255,255,.65)';ctx.shadowBlur=3}
        ctx.drawImage(paint,-image.width*k/2,-image.height*k/2,image.width*k,image.height*k);ctx.restore();paint.width=paint.height=1
        const c=Math.cos(a),sn=Math.sin(a)
        for(const [px,py] of logo.points){const xx=Math.round(x+(px*c-py*sn)*k),yy=Math.round(y+(px*sn+py*c)*k);for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)if(xx+dx>=0&&xx+dx<1080&&yy+dy>=0&&yy+dy<1350)occupied[(yy+dy)*1080+xx+dx]=1}
      }
    }
  })
  // Distinct sector/badge colors retain the association without spokes across other parts.
  plan.entries.forEach(e=>{
    const {badge,box}=e
    const leader=e.leader
    if(leader){ctx.strokeStyle='#5c5c5c';ctx.lineWidth=1.5;ctx.beginPath();leader.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke()}
    ctx.fillStyle=e.color;ctx.beginPath();ctx.arc(badge.x,badge.y,br,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#161616';ctx.lineWidth=2.5;ctx.stroke()
    const pct=percentage(e.weight).replace(/\s/g,'')
    let size=32;ctx.font=posterFont(size,900);while(ctx.measureText(pct).width>br*1.72&&size>25){size--;ctx.font=posterFont(size,900)}
    label(pct,badge.x,badge.y+size*.35,size,lightness(e.color)<.179?'#fff':ink,'center',900)
    box.lines.forEach((line,j)=>label(line,box.x+box.width/2,box.y+POSTER.labelSize*.86+j*POSTER.lineHeight,POSTER.labelSize,green,'center',850))
  })
  // A standalone PNG keeps a single visible attribution when the photo requires it.
  // Full source, license URL, adaptation and historical association remain in iTXt/JSON/UI.
  const credit=portrait.image&&/^CC BY/.test(portrait.license)
    ? `Photo : ${portrait.author==='European Commission - Photographer: Lukasz Kobus'?'Commission européenne / Lukasz Kobus':portrait.author} · ${portrait.license}` : null
  label(`Valeur déclarée : ${cash(plan.total,plan.currency)}`,540,credit?1252:1272,39,ink,'center',850)
  if(credit)label(credit,540,1296,28,'#343434','center',550)
  label('Épargnant libre',540,1336,30,ink,'center',750)
  const photo=portrait.image?Object.fromEntries(['person','title','source','url','author','license','licenseUrl','adaptation','sourceDigest','illustration'].map(key=>[key,portrait[key]])):null
  if(photo&&!photo.licenseUrl){const match=photo.license.match(/^CC BY(-SA)? ([0-9.]+)/);if(match)photo.licenseUrl=`https://creativecommons.org/licenses/by${match[1]?'-sa':''}/${match[2]}/`}
  return pngCredits(canvas.toDataURL('image/png'),{owner,periodEnd:portfolio.snapshot.periodEnd,scope:'Positions déclarées hors options ; poids sur le portefeuille admissible complet.',portrait:photo,visual:{displayed:{count:shown.length,weight:shownWeight},logos:logoReport,amounts:[],credit},positions:plan.entries.map(({label,value,weight,count})=>({label,value,weight,count})),total:plan.total,currency:plan.currency})
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
