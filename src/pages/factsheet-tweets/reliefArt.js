import flags from './countryFlags.json' with { type: 'json' }
import { plainLabel } from './editorial.js'
import { loadArtImage } from '../../lib/art-resources.js'
const countryCodes = new Map(Object.entries(flags).flatMap(([code,names])=>names.map(name=>[name,code])))
export async function countryFlag(name) {
  const code=countryCodes.get(plainLabel(name))
  return code ? loadArtImage(`index-flags/${code}.svg`).catch(()=>null) : null
}
const flagCanvases = new WeakMap()
export function drawFlag(ctx,image,x,y,w,h) {
  if(!image)return
  if(!flagCanvases.has(image)){
    const source=document.createElement('canvas');source.width=336;source.height=252
    const g=source.getContext('2d');g.drawImage(image,0,0,336,252)
    g.globalCompositeOperation='source-atop'
    const shine=g.createLinearGradient(0,0,336,0)
    shine.addColorStop(0,'#ffffff30');shine.addColorStop(.23,'#00000020');shine.addColorStop(.48,'#ffffff50');shine.addColorStop(.73,'#00000020');shine.addColorStop(1,'#ffffff20')
    g.fillStyle=shine;g.fillRect(0,0,336,252)
    const wave=document.createElement('canvas');wave.width=336;wave.height=276
    const target=wave.getContext('2d'),strips=48,sw=source.width/strips
    for(let i=0;i<strips;i++)target.drawImage(source,i*sw,0,sw,source.height,i*sw,12+Math.sin(i/strips*Math.PI*2)*8,sw+.3,252)
    flagCanvases.set(image,wave)
  }
  ctx.save();ctx.shadowColor='#4f211b60';ctx.shadowBlur=9;ctx.shadowOffsetY=8
  ctx.drawImage(flagCanvases.get(image),x,y,w,h);ctx.restore()
}
const sectorKinds={
 'Technologie':'chip',"Technologies de l’info.":'chip',"Technologies de l'info.":'chip',Technology:'chip',
 'Communication':'chat','Services de communication':'chat',
 'Consommation cyclique':'cart','Conso Cyclique':'cart','Conso cyclique':'cart',
 'Consommation de base':'bag','Conso non Cyclique':'bag','Consumer Goods':'bag',
 'Finance':'bank',Financials:'bank','Santé':'health',HealthCare:'health',
 'Énergie':'bolt','Services publics':'bolt','Industrie':'factory',Industrial:'factory',
 'Matériaux':'blocks',Materials:'blocks',
}
export function drawSector(ctx,name,x,y,size) {
  const kind=sectorKinds[plainLabel(name)]??'building'
  ctx.save();ctx.translate(x,y);ctx.scale(size/120,size/120)
  ctx.shadowColor='#331e6260';ctx.shadowBlur=7;ctx.shadowOffsetY=7
  const fill=ctx.createLinearGradient(10,0,105,110);fill.addColorStop(0,'#b39add');fill.addColorStop(.35,'#8e70bf');fill.addColorStop(1,'#52357e')
  ctx.fillStyle=fill;ctx.strokeStyle='#bca5e6';ctx.lineWidth=2.5;ctx.lineJoin='round';ctx.lineCap='round'
  const shape=fn=>{ctx.beginPath();fn();ctx.fill();ctx.stroke()}
  const round=(a,b,w,h,r=9)=>shape(()=>ctx.roundRect(a,b,w,h,r))
  if(kind==='chip'){
    ctx.strokeStyle='#68508b';ctx.lineWidth=7
    for(let i=0;i<4;i++){const p=33+i*18;ctx.beginPath();ctx.moveTo(p,10);ctx.lineTo(p,28);ctx.moveTo(p,94);ctx.lineTo(p,112);ctx.moveTo(9,p);ctx.lineTo(27,p);ctx.moveTo(93,p);ctx.lineTo(111,p);ctx.stroke()}
    ctx.lineWidth=2.5;ctx.strokeStyle='#bca5e6';round(24,24,72,72,10)
    ctx.strokeStyle='#d9c6ef80';ctx.strokeRect(35,35,50,50)
  }else if(kind==='chat'){
    shape(()=>{ctx.ellipse(75,69,37,29,0,0,Math.PI*2);ctx.lineTo(103,108);ctx.lineTo(82,96)})
    shape(()=>{ctx.ellipse(45,43,41,32,0,0,Math.PI*2);ctx.lineTo(17,92);ctx.lineTo(21,67)})
  }else if(kind==='cart'){
    ctx.lineWidth=7;ctx.strokeStyle='#675083';ctx.beginPath();ctx.moveTo(7,19);ctx.lineTo(24,19);ctx.lineTo(37,87);ctx.lineTo(99,87);ctx.stroke()
    shape(()=>{ctx.moveTo(29,31);ctx.lineTo(113,31);ctx.lineTo(98,72);ctx.lineTo(37,72);ctx.closePath()})
    shape(()=>ctx.arc(45,104,9,0,Math.PI*2));shape(()=>ctx.arc(94,104,9,0,Math.PI*2))
  }else if(kind==='bag'){
    ctx.lineWidth=8;ctx.strokeStyle='#68508b';ctx.beginPath();ctx.arc(60,34,22,Math.PI,0);ctx.lineTo(82,58);ctx.moveTo(38,34);ctx.lineTo(38,58);ctx.stroke();ctx.lineWidth=2.5;ctx.strokeStyle='#bca5e6'
    shape(()=>{ctx.moveTo(22,40);ctx.lineTo(98,40);ctx.lineTo(112,111);ctx.lineTo(8,111);ctx.closePath()})
  }else if(kind==='health'){
    round(12,14,96,96,16);ctx.fillStyle='#d6c4ec';ctx.shadowColor='transparent';ctx.fillRect(48,31,24,63);ctx.fillRect(29,50,63,24)
  }else if(kind==='bolt'){
    shape(()=>{ctx.moveTo(66,5);ctx.lineTo(24,68);ctx.lineTo(55,68);ctx.lineTo(43,115);ctx.lineTo(102,46);ctx.lineTo(68,46);ctx.closePath()})
  }else if(kind==='bank'){
    shape(()=>{ctx.moveTo(6,35);ctx.lineTo(60,7);ctx.lineTo(114,35);ctx.closePath()});for(let i=0;i<4;i++)round(17+i*25,44,13,54,3);round(7,101,106,11,3)
  }else if(kind==='factory'){
    shape(()=>{ctx.moveTo(9,110);ctx.lineTo(9,50);ctx.lineTo(43,67);ctx.lineTo(43,42);ctx.lineTo(78,63);ctx.lineTo(78,11);ctx.lineTo(100,11);ctx.lineTo(111,110);ctx.closePath()})
  }else if(kind==='blocks'){
    round(9,66,43,43,6);round(66,66,43,43,6);round(38,12,43,43,6)
  }else{
    round(27,13,67,98,7);ctx.shadowColor='transparent';ctx.fillStyle='#cbb6e7';for(let i=0;i<3;i++)for(let j=0;j<3;j++)ctx.fillRect(38+i*18,30+j*23,9,12)
  }
  ctx.restore()
}
