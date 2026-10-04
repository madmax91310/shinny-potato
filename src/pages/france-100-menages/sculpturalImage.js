import { formatHouseholdNumber, getHouseholdVisual } from '../../data/household-statistics.js'
import { loadHouseholdArt } from './visualIdentity.js'
const W=1600,H=1080,C={text:'#FAF3FF',accent:'#FFB09B',muted:'#D3BCD9',secondary:'#D8B9FF'}
function write(ctx,text,x,y,size,color=C.text,weight=400){ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.textBaseline='top';ctx.textAlign='left';ctx.fillStyle=color;ctx.fillText(String(text),x,y)}
function paragraph(ctx,text,x,y,width,size,color=C.text,weight=400){ctx.font=`${weight} ${size}px Arial`;let line='',top=y;for(const word of (String(text).match(/\S+(?:\s+[?!:;])?/g)??[])){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>width&&line){write(ctx,line,x,top,size,color,weight);top+=size*1.25;line=word}else line=next}if(line)write(ctx,line,x,top,size,color,weight);return top+size*1.25}
function fitted(ctx,text,x,y,width,size,color=C.accent){while(size>25){ctx.font=`700 ${size}px Arial`;if(ctx.measureText(text).width<=width)break;size--}write(ctx,text,x,y,size,color,700)}
export async function renderSculpturalHouseholdImage(record){
 const art=await loadHouseholdArt(record),canvas=document.createElement('canvas');canvas.width=W*1.5;canvas.height=H*1.5
 const ctx=canvas.getContext('2d');ctx.scale(1.5,1.5)
 const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#291338');bg.addColorStop(.58,'#21102e');bg.addColorStop(1,'#130b1f');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H)
 const layer=document.createElement('canvas');layer.width=830;layer.height=850;const l=layer.getContext('2d'),scale=Math.min(830/art.width,850/art.height),aw=art.width*scale,ah=art.height*scale
 l.drawImage(art,(830-aw)/2,(850-ah)/2,aw,ah);l.globalCompositeOperation='destination-in'
 const fade=l.createLinearGradient(0,0,830,0);fade.addColorStop(0,'transparent');fade.addColorStop(.08,'white');fade.addColorStop(.9,'white');fade.addColorStop(1,'transparent');l.fillStyle=fade;l.fillRect(0,0,830,850)
 const vertical=l.createLinearGradient(0,(850-ah)/2,0,(850+ah)/2);vertical.addColorStop(0,'transparent');vertical.addColorStop(.12,'white');vertical.addColorStop(.86,'white');vertical.addColorStop(1,'transparent');l.fillStyle=vertical;l.fillRect(0,0,830,850);ctx.drawImage(layer,0,0)
 // Topic title only. No series heading, decorative numeral or invented statistics.
 paragraph(ctx,record.title,850,85,695,61,C.text,700)
 if(record.kind==='comparison'){
  const rows=getHouseholdVisual(record)
  rows.forEach((row,i)=>{const y=310+i*230;fitted(ctx,row.exact,850,y,695,107,i?C.secondary:C.accent);paragraph(ctx,row.label,850,y+120,695,34,C.text,700)})
  paragraph(ctx,record.population==='ménages'?'Taux parmi les ménages':'Taux parmi les personnes',850,785,695,25,C.muted)
 }else{
  const metric=`${formatHouseholdNumber(record.value)} ${record.unit==='EUR'?'€':'%'}`
  fitted(ctx,metric,850,320,695,record.unit==='EUR'?103:138)
  const populationLabel=record.population==='personnes'?`des personnes ${record.metricLabel}`:record.metricLabel
  const bottom=paragraph(ctx,populationLabel,850,485,695,34,C.secondary,700)
  let context
  if(record.kind==='rate')context=`Soit environ ${Math.round(record.value)} ${record.population} sur 100`
  else if(record.kind==='share')context='50 ménages les moins dotés en patrimoine brut'
  else context=getHouseholdVisual(record)[0].label
  paragraph(ctx,context,850,Math.max(650,bottom+35),695,27,C.muted)
 }
 ctx.fillStyle='#6C4056';ctx.fillRect(55,877,1490,1)
 // Preserve sourced qualifications (population, gross/net, EQTP, overlapping groups).
 const note=(record.visualNote??record.note).replace('Deux grilles indépendantes : elles', 'Ces taux')
 paragraph(ctx,note,55,907,1490,22,C.muted)
 write(ctx,`Source : Insee · ${record.referencePeriod}${record.provisional?' · Données provisoires':''}`,55,1024,23,C.muted)
 ctx.font='400 23px Arial';const signature='Épargnant Libre';write(ctx,signature,1545-ctx.measureText(signature).width,1024,23,C.muted)
 return canvas.toDataURL('image/png')
}
