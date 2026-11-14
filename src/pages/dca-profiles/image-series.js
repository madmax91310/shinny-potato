import { analyzeProfile, profilePositionLimit, pct, euro } from './engine.js'
import { donutData, renderDcaImage } from './image.js'
import { exposureRecords } from './records.js'

export const imageFields = field => field === 'all' ? ['allocation','countries','sectors'] : field === 'both' ? ['countries','sectors'] : [field]
const titles={allocation:'Répartition par actif',countries:'Exposition géographique',sectors:'Exposition sectorielle'}
const percentage = value => value>0&&value<.01?'< 0,01 %':pct(value)
function wrap(ctx,value,width){
 const result=[];let line=''
 for(const char of String(value)){if(line&&ctx.measureText(line+char).width>width){const space=line.lastIndexOf(' ');if(space>0){result.push(line.slice(0,space));line=line.slice(space+1)}else{result.push(line);line=''}}line+=char}
 if(line)result.push(line)
 return result
}
export async function renderImageSeries(profile,field,maxPositions=profilePositionLimit(profile)){
 await Promise.all(profile.lines.map(line=>exposureRecords.load(line.asset)))
 const analysis=analyzeProfile(profile,maxPositions)
 if(analysis.errors.length)throw Error(analysis.errors.join(' '))
 const pages=[]
 for(const id of imageFields(field)){
  if(id==='overlap'){pages.push({id,label:'Recouvrement',canvas:await renderDcaImage(profile,id,maxPositions)});continue}
  const data=id==='allocation'?null:donutData(analysis,id,profile.exposureLimit)
  const rows=id==='allocation'?[...profile.lines].sort((a,b)=>b.weight-a.weight||b.amount-a.amount).map((line,i)=>({...line,name:line.label,color:`hsl(${(45+i*137.508)%360} 75% 65%)`})) : data.rows
  const canvas=document.createElement('canvas');canvas.width=1200
  const ctx=canvas.getContext('2d');ctx.font='400 34px Arial'
  const layout=rows.map(row=>{const lines=wrap(ctx,row.name,820);return {...row,lines,height:Math.max(75,lines.length*44+25)+(id==='allocation'&&!profile.imageOnly&&row.amount>0?36:0)}})
  const height=1160+layout.reduce((sum,row)=>sum+row.height,0)
  canvas.height=Math.max(1500,height)
  ctx.fillStyle='#071d36';ctx.fillRect(0,0,1200,canvas.height)
  function text(value,x,y,size=34,color='#fff4df'){ctx.font=`400 ${size}px Arial`;ctx.fillStyle=color;ctx.fillText(value,x,y)}
  function center(value,y,size=34,color){ctx.save();ctx.textAlign='center';text(value,600,y,size,color);ctx.restore()}
  center('Épargnant Libre',65,30,'#9eb7d2')
  const heading=profile.imageOnly?'Mon portefeuille':`Le DCA de ${profile.name}`
  ctx.font='400 44px Arial'
  const headings=wrap(ctx,heading,1060);headings.forEach((line,i)=>center(line,130+i*54,44))
  const shift=(headings.length-1)*54
  // Name length is bounded by profile validation; preserve it without shrinking the legend.
  center(titles[id],210+shift,42)
  const scope=id==='allocation'?`${profile.scope} · 100 % du portefeuille`:data.scope
  center(scope,265+shift,26,'#9eb7d2')
  if(!profile.imageOnly)center(`${euro(analysis.monthly)} investis par mois`,310+shift,30,'#ffd342')
  let angle=-Math.PI/2
  const cy=620+shift
  for(const row of rows){if(row.weight<=0)continue;const end=angle+row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(600,cy,255,angle,end);ctx.arc(600,cy,175,end,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle=end}
  center(id==='allocation'?'100 %':data.eligible?'Périmètre':'Sans objet',cy+10,38)
  let y=965+shift
  for(const row of layout){
   ctx.fillStyle=row.color;ctx.fillRect(65,y-25,20,20)
   row.lines.forEach((line,i)=>text(line,105,y+i*44))
   ctx.save();ctx.textAlign='right';text(percentage(row.weight),1135,y,34,'#ffd342');ctx.restore()
   if(id==='allocation'&&!profile.imageOnly&&row.amount>0)text(`${euro(row.amount)} / mois`,105,y+row.lines.length*44,26,'#9eb7d2')
   y+=row.height
  }
  pages.push({id,label:titles[id],canvas})
 }
 // The optional company table stays a separate image, so every donut page has one donut.
 if(profile.showCompanies&&field!=='overlap'){
  const source=await renderDcaImage(profile,'both',maxPositions)
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=300
  canvas.getContext('2d').drawImage(source,0,source.height-300,1600,300,0,0,1600,300)
  pages.push({id:'companies',label:'Principales entreprises',canvas})
 }
 return pages
}
