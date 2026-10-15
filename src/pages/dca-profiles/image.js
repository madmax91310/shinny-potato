import { analyzeProfile, prepareProfile, pct, euro } from './engine.js'
const C={navy:'#071d36',blue:'#0759dc',ivory:'#fff4d8',yellow:'#ffcf36',muted:'#a8bed6'}
const colors=['#ffcf36','#53b5ff','#71dbb2','#c7a2ff','#ff9877','#b7ce6e','#ec99cd','#aec8df']
function text(ctx,value,x,y,width,size,color=C.ivory,weight=700){
  value=String(value);ctx.font=`${weight} ${size}px Arial`;
  while(ctx.measureText(value).width>width && size>12)ctx.font=`${weight} ${--size}px Arial`;
  ctx.fillStyle=color;ctx.fillText(value,x,y)
}
function box(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,18);ctx.fill()}
export function renderDcaImage(input){
 const p=input.lines.every(l=>Number.isFinite(l.weight))?input:prepareProfile(input),a=analyzeProfile(p)
 if(a.errors.length)throw Error(a.errors.join(' '))
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1067;const ctx=canvas.getContext('2d')
 ctx.fillStyle=C.navy;ctx.fillRect(0,0,1600,1067)
 // Brand geometry, no portraits or invented testimony.
 ctx.strokeStyle='#153959';ctx.lineWidth=2
 for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(1480,0,180+i*52,0,Math.PI);ctx.stroke()}
 text(ctx,'PORTEFEUILLE & DCA',55,55,900,25,C.muted)
 text(ctx,p.name,55,147,1020,88)
 text(ctx,[p.age&&`${p.age} ans`,p.job,p.location].filter(Boolean).join(' · '),58,195,1000,28)
 box(ctx,1130,65,415,135,C.yellow);text(ctx,euro(a.monthly),1155,132,365,62,C.navy,900);text(ctx,'VERSÉS CHAQUE MOIS',1155,173,365,23,C.navy)
 text(ctx,p.scope,55,252,1000,27,C.muted)
 const top=285,height=460,row=height/p.lines.length
 text(ctx,'PLACEMENTS',75,top+30,650,22,C.muted)
 text(ctx,'POIDS ACTUEL',790,top+30,320,22,C.muted)
 text(ctx,'DCA / MOIS',1270,top+30,260,22,C.muted)
 p.lines.forEach((l,i)=>{
  const y=top+48+i*(row-6)
  box(ctx,55,y,1490,row-12,i%2?'#102c48':'#0b2540')
  ctx.fillStyle=colors[i];ctx.fillRect(72,y+12,6,row-36)
  const baseline=y+(row-12)/2+10
  text(ctx,l.label,95,baseline,655,Math.min(38,row*.42))
  const barWidth=280,by=baseline+10
  ctx.fillStyle='#29415a';ctx.fillRect(790,by,barWidth,5);ctx.fillStyle=colors[i];ctx.fillRect(790,by,barWidth*l.weight/100,5)
  text(ctx,pct(l.weight),790,baseline,310,Math.min(40,row*.45),colors[i],900)
  text(ctx,euro(l.amount),1270,baseline,245,Math.min(40,row*.45),C.ivory,900)
 })
 const panels=[['countries','PAYS'],['sectors','SECTEURS']]
 panels.forEach(([field,label],i)=>{
  const x=55+i*755;box(ctx,x,810,735,175,'#102c48')
  const g=[...a[field].groups].sort((x,y)=>y.coverage-x.coverage)[0]
  text(ctx,label,x+22,842,690,23,C.muted)
  if(g){
   text(ctx,`${g.asOf} · ${pct(g.coverage)} du portefeuille · ${g.basis==='fund'?'fonds':'indice'}`,x+22,872,690,20,C.muted)
   g.rows.slice(0,3).forEach((r,j)=>text(ctx,`${r.name}  ${pct(r.weight)}`,x+22,905+j*29,690,24,j===0?C.yellow:C.ivory))
  }else text(ctx,'Pas de ventilation qualifiée sur ce périmètre',x+22,907,690,24)
 })
 text(ctx,'Expositions : photographie principale, poids rapportés au portefeuille total.',55,1025,1120,23,C.muted)
 text(ctx,'Épargnant Libre',1215,1025,330,31,C.ivory,900)
 return canvas
}
