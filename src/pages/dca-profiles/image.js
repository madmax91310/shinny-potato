import { analyzeProfile, prepareProfile, euro } from './engine.js'
import { incomeLabel } from './lib.js'
const C={navy:'#071d36',ivory:'#fff4df',yellow:'#ffd342',muted:'#9eb7d2',panel:'#0d263e'}
const colors=['#ffd342','#3899ff','#63dfbd','#bd9eff','#ff9b70','#b7ce6e','#ec99cd','#aec8df']
function text(ctx,value,x,y,width,size,color=C.ivory,weight=700,family='Arial'){
 value=String(value);ctx.font=`${weight} ${size}px ${family}`
 while(ctx.measureText(value).width>width && size>10)ctx.font=`${weight} ${--size}px ${family}`
 ctx.fillStyle=color;ctx.fillText(value,x,y)
}
export const exposurePercentage = (weight,rounded) => weight>0&&weight<1?'< 1 %':`${rounded} %`
function rule(ctx,x,y,width){ctx.strokeStyle='#304d70';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y);ctx.stroke()}
// Largest-remainder display rounding: true geometry is untouched, labels sum to 100.
export function integerPercentages(rows){
 const values=rows.map(r=>Math.floor(r.weight))
 const order=rows.map((r,i)=>({i,fraction:r.weight-values[i]})).sort((a,b)=>b.fraction-a.fraction||a.i-b.i)
 const remaining=100-values.reduce((s,v)=>s+v,0)
 for(let i=0;i<remaining;i++)values[order[i%order.length].i]++
 return values
}
// Most-covered compatible synthesis, preserving the actual source date range.
// Missing coverage keeps its true weight in grey; never renormalize known countries to 100%.
export function donutData(analysis,field='countries'){
 const exposure=analysis[field]
 const neutral=exposure.neutralRows||[]
 const neutralWeight=neutral.reduce((s,r)=>s+r.weight,0)
 const group=[...exposure.groups].sort((a,b)=>b.coverage-a.coverage)[0]
 if(!group&&!neutralWeight)return {group:null,rows:[{name:'Non ventilé',weight:100,color:'#57718e'}]}
 if(!group)return {group:null,rows:[{name:neutral.length===1?neutral[0].name:'Métaux / crypto',weight:neutralWeight,color:'#b79b6b'},...(neutralWeight<100?[{name:'Non ventilé ici',weight:100-neutralWeight,color:'#57718e'}]:[])]}
 const raw=group.rows.filter(r=>r.weight>0),total=raw.reduce((s,r)=>s+r.weight,0)
 // Source rounding can marginally exceed covered weight. Scale only that excess.
 const scale=total>group.coverage?group.coverage/total:1
 const known=raw.map(r=>({...r,weight:r.weight*scale})).sort((a,b)=>b.weight-a.weight)
 const named=known.filter(r=>!/^autres?$|^other$/i.test(r.name))
 const rows=named.slice(0,neutralWeight?3:4).map((r,i)=>({...r,color:colors[i]}))
 const rest=known.reduce((s,r)=>s+r.weight,0)-rows.reduce((s,r)=>s+r.weight,0)
 if(rest>1e-9)rows.push({name:'Autres expositions',weight:rest,color:colors[4]})
 if(neutralWeight)rows.push({name:neutral.length===1?neutral[0].name:'Métaux / crypto',weight:neutralWeight,color:'#b79b6b'})
 const missing=Math.max(0,100-rows.reduce((s,r)=>s+r.weight,0))
 if(missing>.000001)rows.push({name:missing<.01?'Écart d’arrondi':'Non ventilé ici',weight:missing,color:'#57718e'})
 return {group,rows}
}
function exposurePanel(ctx,a,field,x,y,width){
 const {group,rows}=donutData(a,field)
 text(ctx,field==='countries'?'Exposition géographique':'Exposition sectorielle',x,y,width,36,C.ivory,700,'DcaEditorial')
 const cx=x+width/2,cy=y+280,r=220,inner=150
 let angle=-Math.PI/2
 for(const row of rows){const end=angle+row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,end);ctx.arc(cx,cy,inner,end,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle=end}
 const percentages=integerPercentages(rows)
 rows.forEach((row,i)=>{
  const left=x+(i%2)*width/2,top=y+540+Math.floor(i/2)*65
  ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(left+8,top-7,7,0,Math.PI*2);ctx.fill()
  text(ctx,row.name,left+24,top,width/2-35,22,C.ivory,400)
  text(ctx,exposurePercentage(row.weight,percentages[i]),left+24,top+28,width/2-35,25)
 })
 const source=group?`${group.oldest!==group.asOf?group.oldest+' → ':''}${group.asOf} · couverture ${Math.round(group.coverage)} %`:'Aucune ventilation qualifiée'
 text(ctx,source,x,y+735,width,18,C.muted,400)
 if(group?.classification==='country-registration')text(ctx,'Pays d’enregistrement',x,y+757,width,16,C.muted,400)
}
function ring(ctx,rows,cx,cy,r,inner){
 let angle=-Math.PI/2
 for(const row of rows){const end=angle+row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,end);ctx.arc(cx,cy,inner,end,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle=end}
}
function fullPortfolio(ctx,p,a){
 const holdings=p.lines.filter(l=>l.weight>0).map((l,i)=>({name:l.label,weight:l.weight,color:colors[i]}))
 text(ctx,'Répartition des actifs',64,240,640,42,C.ivory,700,'DcaEditorial')
 ring(ctx,holdings,370,480,210,145)
 text(ctx,'100 %',286,497,180,54,C.yellow,700,'DcaEditorial')
 const percentages=integerPercentages(holdings)
 holdings.forEach((row,i)=>{
  const y=736+i*33
  ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(75,y-7,7,0,Math.PI*2);ctx.fill()
  text(ctx,row.name,96,y,466,25,C.ivory,400)
  text(ctx,`${percentages[i]} %`,584,y,110,27)
 })
 for(const [field,x] of [['countries',760],['sectors',1170]]){
  const {group,rows}=donutData(a,field),width=366
  text(ctx,field==='countries'?'Exposition géographique':'Exposition sectorielle',x,240,width,30,C.ivory,700,'DcaEditorial')
  ring(ctx,rows,x+width/2,461,153,105)
  const rounded=integerPercentages(rows)
  rows.forEach((row,i)=>{
   const y=666+i*43
   ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(x+7,y-7,6,0,Math.PI*2);ctx.fill()
   text(ctx,row.name,x+22,y,258,23,C.ivory,400)
   text(ctx,exposurePercentage(row.weight,rounded[i]),x+285,y,81,25)
  })
  text(ctx,group?`${group.oldest&&group.oldest!==group.asOf?group.oldest+' → ':''}${group.asOf}`:'Aucune ventilation qualifiée',x,954,width,18,C.muted,400)
  if(group)text(ctx,`Couverture ${Math.round(group.coverage)} %`,x,978,width,18,C.muted,400)
  if(group?.classification==='country-registration')text(ctx,'Pays d’enregistrement',x,1001,width,16,C.muted,400)
 }
}
let fontReady
async function loadDcaFont(){
 if(!fontReady)fontReady=new FontFace('DcaEditorial',`url("${import.meta.env.BASE_URL}asset-art/editorial.woff2")`,{weight:'500'}).load().then(font=>document.fonts.add(font)).catch(error=>{fontReady=undefined;throw error})
 return fontReady
}
export async function renderDcaImage(input,field='countries'){
 await loadDcaFont()
 const p=input.lines.every(l=>Number.isFinite(l.weight))?input:prepareProfile(input),a=analyzeProfile(p)
 if(a.errors.length)throw Error(a.errors.join(' '))
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1067;const ctx=canvas.getContext('2d')
 const bg=ctx.createLinearGradient(0,0,1600,1067);bg.addColorStop(0,'#071b36');bg.addColorStop(.5,'#03152c');bg.addColorStop(1,'#092952');ctx.fillStyle=bg;ctx.fillRect(0,0,1600,1067)
 if(p.imageOnly||field==='both'||field==='all'){
  text(ctx,p.imageOnly?'Expositions du portefeuille':`Le DCA de ${p.name}`,64,100,1472,65,C.ivory,700,'DcaEditorial')
  if(!p.imageOnly)text(ctx,`${euro(a.monthly)} investis par mois`,66,158,1470,34,C.yellow)
  if(field==='all'){
   fullPortfolio(ctx,p,a)
  }else if(field==='both'){
   exposurePanel(ctx,a,'countries',66,218,700)
   exposurePanel(ctx,a,'sectors',834,218,700)
  }else exposurePanel(ctx,a,field,450,218,700)
  rule(ctx,64,1013,1472)
  text(ctx,p.scope,64,1050,1000,20,C.muted,400)
  text(ctx,'Épargnant Libre',1205,1051,330,32,C.ivory,700,'DcaEditorial')
  return canvas
 }
 text(ctx,'LE DCA DE',64,62,710,26,C.muted,700)
 text(ctx,p.name,62,161,710,96,C.ivory,700,'DcaEditorial')
 text(ctx,[p.age&&`${p.age} ans`,p.job].filter(Boolean).join(' · '),66,212,710,30,C.ivory,400)
 if(p.income)text(ctx,`${incomeLabel(p)} : ${euro(p.income)} / mois`,66,263,710,32,C.ivory,400)
 text(ctx,'CHAQUE MOIS',66,341,710,26,C.muted)
 text(ctx,euro(a.monthly),56,495,720,160,C.yellow,700,'DcaEditorial')
 text(ctx,'investis par mois',66,552,710,40,C.ivory,700,'DcaEditorial')
 const rowHeight=Math.min(112,366/p.lines.length),top=597
 p.lines.forEach((l,i)=>{
  const y=top+i*rowHeight
  rule(ctx,66,y,710)
  text(ctx,euro(l.amount),66,y+rowHeight*.66,220,Math.min(49,rowHeight*.55),C.yellow,700,'DcaEditorial')
  text(ctx,l.label,312,y+rowHeight*.62,464,Math.min(31,rowHeight*.45),C.ivory,700,'DcaEditorial')
 })
 text(ctx,'Son portefeuille',865,112,670,65,C.ivory,700,'DcaEditorial')
 text(ctx,field==='sectors'?'Exposition sectorielle':'Exposition géographique',880,163,650,32,C.muted,400)
 const {group,rows}=donutData(a,field),cx=1197,cy=508,r=280,inner=195
 let angle=-Math.PI/2
 for(const row of rows){const span=row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,angle+span);ctx.arc(cx,cy,inner,angle+span,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle+=span}
 const percentages=integerPercentages(rows)
 rows.forEach((row,i)=>{
  const x=860+(i%3)*226,y=839+Math.floor(i/3)*73
  ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(x+10,y-8,9,0,Math.PI*2);ctx.fill()
  text(ctx,row.name,x+28,y,190,23,C.ivory,400)
  text(ctx,exposurePercentage(row.weight,percentages[i]),x+28,y+32,190,29,C.ivory,700)
 })
 const source=group?`${group.oldest&&group.oldest!==group.asOf?group.oldest+' → ':''}${group.asOf} · couverture ${Math.round(group.coverage)} %`:(a[field].neutralWeight===100?'Métaux / crypto : hors classification':'Aucune ventilation qualifiée')
 text(ctx,source,860,982,670,18,C.muted,400)
 if(group?.classification==='country-registration')text(ctx,'Pays d’enregistrement',860,1004,670,16,C.muted,400)
 rule(ctx,64,1013,1472)
 text(ctx,p.scope,64,1050,1000,20,C.muted,400)
 text(ctx,'Épargnant Libre',1205,1051,330,32,C.ivory,700,'DcaEditorial')
 return canvas
}
