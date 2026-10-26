import { presentationReliefModel } from './image-model.js'
// Preserve the established public entry point; non-rendering consumers use image-model directly.
export { presentationImageModel, presentationCardModel, presentationReliefModel, presentationBrands } from './image-model.js'

const SERIF = 'Georgia, serif', SANS = 'Arial, sans-serif'
function font(ctx,size,weight=400,family=SANS){ctx.font=`${weight} ${size}px ${family}`}
function wrap(ctx,text,width) {
  const result=[]
  for(const paragraph of String(text).split('\n')) {
    let line=''
    for(const word of paragraph.split(/\s+/).filter(Boolean)) {
      if(ctx.measureText(word).width>width) {
        if(line){result.push(line);line=''}
        for(const letter of word){if(ctx.measureText(line+letter).width>width){result.push(line);line=''}line+=letter}
      } else if(line && ctx.measureText(`${line} ${word}`).width>width){result.push(line);line=word}
      else line=line?`${line} ${word}`:word
    }
    if(line)result.push(line)
  }
  return result
}
function text(ctx,value,x,y,width,size=29,color=INK,weight=400,family=SANS){font(ctx,size,weight,family);ctx.fillStyle=color;const lines=wrap(ctx,value,width);lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.35));return y+lines.length*size*1.35}
const brandAssets = {
  tudigo: ['tudigo.svg'], lendosphere: ['lendosphere.svg'],
  fundora:['fundora.svg'], anaxago:['anaxago.svg'], mymarguerit:['mymarguerit.png'],
  bacchus:['bacchus.png'], 'france-valley':['france-valley.svg'], enerfip:['enerfip.svg'],
  hectarea:['hectarea.svg'], bricks:['bricks.svg'], matis:['matis.svg'],
  'iroko-zen':['iroko-zen.svg'], 'remake-live':['remake-live.png'],
  'corum-origin':['corum.svg'], 'corum-xl':['corum.svg'], 'corum-eurion':['corum.svg'],
  'transitions-europe':['arkea.png'], 'activimmo':['activimmo.png'], 'epargne-pierre':['epargne-pierre.svg'],
  'linxea-spirit-2':['linxea-spirit-2.svg'], 'linxea-avenir-2':['linxea-avenir-2.svg'], 'linxea-avenir-2-plus':['linxea-avenir-2-plus.svg'],
  'linxea-vie':['linxea-vie.svg'], 'linxea-zen':['linxea-zen.svg'],
  'lucya-cardif':['lucya.png','cardif.png'], 'placement-direct-vie':['placement-direct-vie.svg'],
}
const managerMarks = new Set(['corum-origin','corum-xl','corum-eurion','transitions-europe','activimmo','placement-direct-vie'])
const assets=new Map()
function loadLogo(file) {
  if(!assets.has(file))assets.set(file,new Promise((resolve,reject)=>{
    const img=new Image()
    img.onload=()=>resolve(img)
    img.onerror=()=>{assets.delete(file);reject(new Error('Logo indisponible. Réessaie l’export.'))}
    img.src=`${import.meta.env.BASE_URL}asset-art/presentation-logos/${file}`
  }))
  return assets.get(file)
}
function loadBackdrop(kind) {
  const file=`relief-${kind}.webp`
  if(!assets.has(file))assets.set(file,new Promise((resolve,reject)=>{
    const img=new Image()
    img.onload=()=>resolve(img)
    img.onerror=()=>{assets.delete(file);reject(new Error('Décor indisponible. Réessaie l’export.'))}
    img.src=`${import.meta.env.BASE_URL}asset-art/presentation-relief/${file}`
  }))
  return assets.get(file)
}
function logoMask(img,width,height) {
  const layer=document.createElement('canvas');layer.width=Math.ceil(width);layer.height=Math.ceil(height)
  const ctx=layer.getContext('2d');ctx.drawImage(img,0,0,width,height)
  const pixels=ctx.getImageData(0,0,layer.width,layer.height)
  // Only flatten white paper on opaque PNGs; preserve official white SVG marks.
  if(img.src.endsWith('.png'))for(let i=0;i<pixels.data.length;i+=4){
    const light=Math.min(pixels.data[i],pixels.data[i+1],pixels.data[i+2])
    pixels.data[i+3]*=1-Math.max(0,(light-215)/40)
  }
  if(/linxea-/.test(img.src))for(let i=0;i<pixels.data.length;i+=4){
    const light=Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2])
    pixels.data[i+3]*=Math.max(0,(light-160)/95)
  }
  ctx.putImageData(pixels,0,0)
  return layer
}
function tintMask(mask,colors) {
  const layer=document.createElement('canvas');layer.width=mask.width;layer.height=mask.height
  const ctx=layer.getContext('2d');ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-in'
  const gradient=ctx.createLinearGradient(0,0,layer.width,layer.height)
  colors.forEach((color,i)=>gradient.addColorStop(i/(colors.length-1),color))
  ctx.fillStyle=gradient;ctx.fillRect(0,0,layer.width,layer.height)
  return layer
}
function sculpture(ctx,img,x,y,width,height,brand) {
  const mask=logoMask(img,width,height)
  const edge=tintMask(mask,[brand.dark,brand.color,brand.dark])
  const face=tintMask(mask,[brand.light,brand.color,brand.dark,brand.color,brand.light])
  ctx.save();ctx.shadowColor=brand.color;ctx.shadowBlur=35
  ctx.globalAlpha=.45;ctx.drawImage(face,x,y);ctx.globalAlpha=1;ctx.shadowBlur=0
  // Actual extrusion of the official contour rather than a generic initial.
  for(let depth=20;depth>0;depth--)ctx.drawImage(edge,x+depth*.8,y+depth)
  ctx.drawImage(tintMask(mask,[brand.light,brand.light]),x-1.5,y-2)
  ctx.drawImage(face,x,y)
  ctx.save();ctx.translate(x,y+height*2+32);ctx.scale(1,-1);ctx.globalAlpha=.12;ctx.drawImage(face,0,0);ctx.restore()
  ctx.restore()
}
function fittedText(ctx,value,x,y,width,size,min,color,weight=400,family=SANS,maxLines=1) {
  while(size>min){font(ctx,size,weight,family);if(wrap(ctx,value,width).length<=maxLines)break;size-=2}
  font(ctx,size,weight,family)
  if(wrap(ctx,value,width).length>maxLines)throw new Error(`Texte trop long pour le visuel de ce placement : ${value}`)
  return text(ctx,value,x,y,width,size,color,weight,family)
}
export async function renderPresentationImage(record,kind) {
  await document.fonts.ready
  const model=presentationReliefModel(record,kind),files=brandAssets[record.id]
  if(!files)throw new Error('Logo de ce placement non référencé.')
  const [logos,backdrop]=await Promise.all([Promise.all(files.map(loadLogo)),loadBackdrop(kind==='actor' ? (['immobilier','vignobles'].includes(record.family)?'scpi':'insurance') : kind)])
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000
  const ctx=canvas.getContext('2d');ctx.textBaseline='top'
  ctx.drawImage(backdrop,0,0,1600,1000)
  ctx.save();ctx.globalCompositeOperation='color';ctx.globalAlpha=.45
  ctx.fillStyle=model.brand.color;ctx.fillRect(0,0,1600,1000);ctx.restore()
  const glow=ctx.createRadialGradient(850,430,10,850,430,640)
  glow.addColorStop(0,model.brand.color+'40');glow.addColorStop(1,model.brand.color+'00')
  ctx.fillStyle=glow;ctx.fillRect(0,0,1600,700)
  const shade=ctx.createLinearGradient(0,590,0,1000)
  shade.addColorStop(0,'#04102000');shade.addColorStop(.3,'#041020e8');shade.addColorStop(1,'#040b15')
  fittedText(ctx,model.title,80,70,1420,82,48,'#ffffff',500,SERIF)
  text(ctx,model.subtitle,84,171,1300,30,model.brand.light)
  // Every official logo gets its own slot, including the Lucya / Cardif pair.
  for(let i=0;i<logos.length;i++) {
    const img=logos[i],slot=1260/logos.length
    const scale=Math.min((slot-60)/img.width,240/img.height)
    const w=img.width*scale,h=img.height*scale
    sculpture(ctx,img,170+i*slot+(slot-w)/2,420-h/2,w,h,model.brand)
  }
  if(managerMarks.has(record.id)) {
    ctx.textAlign='center'
    fittedText(ctx,record.name,800,570,1280,36,28,model.brand.light,500,SERIF)
  }
  ctx.fillStyle=shade;ctx.fillRect(0,590,1600,410)
  const metricWidth=450
  for(let i=0;i<model.highlights.length;i++) {
    const r=model.highlights[i],x=80+i*500
    ctx.textAlign='left'
    // Long qualitative values keep their complete wording above the label.
    font(ctx,56,600,SERIF)
    const twoLines=wrap(ctx,r.value,metricWidth).length>1
    fittedText(ctx,r.value,x,twoLines?640:688,metricWidth,twoLines?56:90,56,'#ffffff',600,SERIF,twoLines?2:1)
    fittedText(ctx,r.label,x,797,metricWidth,30,26,'#dbe9ef',400,SANS,2)
    if(i<2){ctx.fillStyle=model.brand.light+'60';ctx.fillRect(x+470,706,1,105)}
  }
  ctx.textAlign='left'
  fittedText(ctx,model.qualifier,80,875,1440,30,28,'#bed0dc',400,SANS,2)
  text(ctx,model.compactFooter,80,952,1180,28,'#bed0dc')
  ctx.textAlign='right';font(ctx,24,400,SERIF);ctx.fillStyle='#e1edf3';ctx.fillText('Épargnant Libre',1520,952)
  return canvas
}
