import { formatHouseholdNumber, getHouseholdVisual } from '../../data/household-statistics.js'
import { loadHouseholdArt } from './visualIdentity.js'
const W=1600,H=1080,C={text:'#FAF3FF',accent:'#FFB09B',muted:'#D3BCD9',secondary:'#D8B9FF'}
function write(ctx,text,x,y,size,color=C.text,weight=400){ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.textBaseline='top';ctx.textAlign='left';ctx.fillStyle=color;ctx.fillText(String(text),x,y)}
function paragraph(ctx,text,x,y,width,size,color=C.text,weight=400){ctx.font=`${weight} ${size}px Arial`;let line='',top=y;for(const word of (String(text).match(/\d+(?:[,.]\d+)?(?:\s+\d{3})*(?:\s+[€%])?|\S+(?:\s+[?!:;])?/g)??[])){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>width&&line){write(ctx,line,x,top,size,color,weight);top+=size*1.25;line=word}else line=next}if(line)write(ctx,line,x,top,size,color,weight);return top+size*1.25}
function fitted(ctx,text,x,y,width,size,color=C.accent){while(size>25){ctx.font=`700 ${size}px Arial`;if(ctx.measureText(text).width<=width)break;size--}write(ctx,text,x,y,size,color,700)}
export async function renderSculpturalHouseholdImage(record){
 const art=await loadHouseholdArt(record),canvas=document.createElement('canvas');canvas.width=W*1.5;canvas.height=H*1.5
 const ctx=canvas.getContext('2d');ctx.scale(1.5,1.5)
 const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#291338');bg.addColorStop(.58,'#21102e');bg.addColorStop(1,'#130b1f');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H)
 const layer=document.createElement('canvas');layer.width=950;layer.height=1030;const l=layer.getContext('2d'),scale=Math.min(950/art.width,1030/art.height),aw=art.width*scale,ah=art.height*scale
 l.drawImage(art,(950-aw)/2,(1030-ah)/2,aw,ah);l.globalCompositeOperation='destination-in'
 const fade=l.createLinearGradient(0,0,950,0);fade.addColorStop(0,'transparent');fade.addColorStop(.08,'white');fade.addColorStop(.80,'white');fade.addColorStop(1,'transparent');l.fillStyle=fade;l.fillRect(0,0,950,1030)
 const vertical=l.createLinearGradient(0,(1030-ah)/2,0,(1030+ah)/2);vertical.addColorStop(0,'transparent');vertical.addColorStop(.12,'white');vertical.addColorStop(.86,'white');vertical.addColorStop(1,'transparent');l.fillStyle=vertical;l.fillRect(0,0,950,1030);ctx.drawImage(layer,-65,0)
 // Topic title only. No series heading, decorative numeral or invented statistics.
 paragraph(ctx,record.title,850,65,695,67,C.text,700)
 if(record.kind==='comparison'){
  const rows=getHouseholdVisual(record)
  rows.forEach((row,i)=>{const y=355+i*275;fitted(ctx,row.exact,850,y,695,125,i?C.secondary:C.accent);paragraph(ctx,row.label,850,y+145,695,40,C.text,700)})
  paragraph(ctx,record.population==='ménages'?'Taux parmi les ménages':'Taux parmi les personnes',850,925,695,30,C.muted)
 }else{
  const metric=`${formatHouseholdNumber(record.value)} ${record.unit==='EUR'?'€':'%'}`
  fitted(ctx,metric,850,355,695,record.unit==='EUR'?120:158)
  const populationLabel=record.population==='personnes'?`des personnes ${record.metricLabel}`:record.metricLabel
  const bottom=paragraph(ctx,populationLabel,850,545,695,40,C.secondary,700)
  let context
  if(record.kind==='rate')context=`Soit environ ${Math.round(record.value)} ${record.population} sur 100`
  else if(record.kind==='share')context='50 ménages les moins dotés en patrimoine brut'
  else context=getHouseholdVisual(record)[0].label
  paragraph(ctx,context,850,Math.max(775,bottom+35),695,32,C.muted)
 }
 // A clean footer: signature only. Source details remain available in the tool.
 ctx.font='400 27px Arial';const signature='Épargnant Libre';write(ctx,signature,1545-ctx.measureText(signature).width,1024,27,C.muted)
 return canvas.toDataURL('image/png')
}
