import { exposureRecords } from './records.js'
import { exposureView } from './exposure.js'
import { analyzeProfile, prepareProfile, euro, pct, references } from './engine.js'
import { incomeLabel, sortHoldings, sortContributions } from './lib.js'
import { portfolioAnalytics, analyzedLines, analysisView, selectConcentrationGroup } from './analytics.js'
const C={navy:'#071d36',ivory:'#fff4df',yellow:'#ffd342',muted:'#9eb7d2',panel:'#0d263e'}
const colors=['#ffd342','#3899ff','#63dfbd','#bd9eff','#ff9b70','#b7ce6e','#ec99cd','#aec8df']
export function allocationRows(lines){
 const ordered=sortHoldings(lines).map(l=>({name:l.label,weight:l.weight}))
 if(ordered.length<=8)return ordered.map((r,i)=>({...r,color:colors[i]}))
 return [...ordered.slice(0,7),{name:`${ordered.length-7} autres positions`,weight:ordered.slice(7).reduce((s,l)=>s+l.weight,0)}].map((r,i)=>({...r,color:colors[i]}))
}
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
export function donutData(analysis,field='countries',limit=4){
 const view=exposureView(analysis[field]),{group}=view
 if(!view.eligible)return {...view,group:null,rows:[{name:'Sans objet',weight:100,color:'#57718e'}]}
 const count=[3,4,6].includes(Number(limit))?Number(limit):4
 const known=view.rows.filter(r=>r.weight>0)
 const named=known.filter(r=>!/^autres?$|^other$/i.test(r.name))
 const rows=named.slice(0,count).map((r,i)=>({...r,color:colors[i]}))
 const rest=known.reduce((s,r)=>s+r.weight,0)-rows.reduce((s,r)=>s+r.weight,0)
 if(rest>1e-9)rows.push({name:'Autres expositions',weight:rest,color:'#aec8df'})
 const missing=Math.max(0,100-rows.reduce((s,r)=>s+r.weight,0))
 if(missing>1e-9)rows.push({name:missing<.01?'Écart d’arrondi':'Non ventilé ici',weight:missing,color:'#57718e'})
 return {...view,group,rows}
}
function exposurePanel(ctx,a,field,x,y,width,limit){
 const {rows,scope}=donutData(a,field,limit)
 centered(ctx,field==='countries'?'Exposition géographique':'Exposition sectorielle',x+width/2,y,width,36)
 const cx=x+width/2,cy=y+280,r=220,inner=150
 let angle=-Math.PI/2
 for(const row of rows){const end=angle+row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,end);ctx.arc(cx,cy,inner,end,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle=end}
 const percentages=integerPercentages(rows)
 const lead=rows.findIndex(r=>!['Non ventilé ici','Écart d’arrondi','Sans objet'].includes(r.name))
 if(lead>=0){centered(ctx,exposurePercentage(rows[lead].weight,percentages[lead]),cx,cy+5,270,52);centered(ctx,rows[lead].name,cx,cy+47,260,23,C.muted,400)}
 rows.forEach((row,i)=>{
  const left=rows.length===1?cx-110:x+65+(i%2)*(width-80)/2,top=y+(rows.length>6?530:540)+Math.floor(i/2)*(rows.length>6?48:65)
  ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(left+8,top-7,7,0,Math.PI*2);ctx.fill()
  text(ctx,row.name,left+24,top,width/2-35,rows.length>6?18:22,C.ivory,400)
  text(ctx,exposurePercentage(row.weight,percentages[i]),left+24,top+(rows.length>6?23:28),width/2-35,rows.length>6?20:25)
 })
 ctx.save();ctx.textAlign='center';text(ctx,scope,x+width/2,y+32,width,18,C.muted,400);ctx.restore()
}
function ring(ctx,rows,cx,cy,r,inner){
 let angle=-Math.PI/2
 for(const row of rows){const end=angle+row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,end);ctx.arc(cx,cy,inner,end,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle=end}
}
function panel(ctx,x,y,width,height){ctx.fillStyle=C.panel;ctx.strokeStyle='#23425e';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x,y,width,height,24);ctx.fill();ctx.stroke()}
function centered(ctx,value,x,y,width,size,color=C.ivory,weight=700){ctx.save();ctx.textAlign='center';text(ctx,value,x,y,width,size,color,weight,'DcaEditorial');ctx.restore()}
function wrappedLabel(ctx,value,x,y,width,size){
 ctx.font=`400 ${size}px Arial`
 if(ctx.measureText(value).width<=width){text(ctx,value,x,y,width,size,C.ivory,400);return}
 const words=value.split(' ');let first=''
 while(words.length&&ctx.measureText((first+' '+words[0]).trim()).width<=width)first=(first+' '+words.shift()).trim()
 text(ctx,first||words.shift(),x,y-8,width,size,C.ivory,400)
 text(ctx,words.join(' '),x,y+size-8,width,size,C.ivory,400)
}
function fullPortfolio(ctx,p,a){
 centered(ctx,'Épargnant Libre',800,83,1480,49)
 panel(ctx,35,125,665,815)
 panel(ctx,725,125,840,395);panel(ctx,725,545,840,395)
 text(ctx,'Répartition des actifs',70,190,595,40,C.ivory,700,'DcaEditorial')
 const holdings=allocationRows(p.lines)
 const crowded=holdings.length>4
 // Keep identity and monthly contributions in the tweet; reserve this panel for holdings.
 const lift=p.imageOnly?0:90
 const cy=(crowded?435:p.imageOnly?469:490)-lift,r=crowded?120:p.imageOnly?230:185
 ring(ctx,holdings,368,cy,r,r*.67)
 centered(ctx,'100 %',368,cy+12,r*1.7,crowded?42:64)
 centered(ctx,'du portefeuille',368,cy+48,r*1.55,crowded?18:26,C.muted,400)
 const percentages=integerPercentages(holdings),top=(crowded?575:holdings.length===4?725:775)-lift
 const gap=Math.min(62,(915-top)/Math.max(holdings.length-1,1)),size=crowded?(p.imageOnly?19:23):holdings.length===4?23:28
 holdings.forEach((row,i)=>{
  const y=top+i*gap
  ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(83,y-9,7,0,Math.PI*2);ctx.fill()
  wrappedLabel(ctx,row.name,103,y,445,size)
  text(ctx,exposurePercentage(row.weight,percentages[i]),574,y,90,size+2)
 })
 for(const [field,y] of [['countries',125],['sectors',545]]){
  const {rows}=donutData(a,field,p.exposureLimit)
  text(ctx,field==='countries'?'Exposition géographique':'Exposition sectorielle',755,y+59,780,37,C.ivory,700,'DcaEditorial')
  ring(ctx,rows,899,y+235,140,94)
  const rounded=integerPercentages(rows),lead=rows.findIndex(r=>!['Non ventilé','Non ventilé ici','Écart d’arrondi'].includes(r.name))
  if(lead>=0){centered(ctx,exposurePercentage(rows[lead].weight,rounded[lead]),899,y+231,173,41);centered(ctx,rows[lead].name,899,y+273,168,17,C.muted,400)}
  else centered(ctx,'Non ventilé',899,y+239,170,23,C.muted)
  const gap=rows.length>6?34:rows.length>5?37:49,legendSize=rows.length>6?24:27
  rows.forEach((row,i)=>{
   const top=y+137+i*gap
   ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(1076,top-9,6,0,Math.PI*2);ctx.fill()
   text(ctx,row.name,1095,top,322,legendSize,C.ivory,400)
   text(ctx,exposurePercentage(row.weight,rounded[i]),1454,top,85,legendSize)
  })
 }
}
async function overlapPortfolio(ctx,p){
 const {loadHoldings}=await import('./holdings-loader.js')
 const holdings=await loadHoldings(p.lines.map(l=>l.asset))
 const view=analysisView(p),result=portfolioAnalytics(analyzedLines(p),references,holdings)
 const g=selectConcentrationGroup(result.groups,view.groupKey)
 centered(ctx,'Épargnant Libre',800,80,1480,49)
 panel(ctx,35,125,485,815);panel(ctx,545,125,1020,815)
 text(ctx,'Sous les ETF',70,190,415,44,C.ivory,700,'DcaEditorial')
 text(ctx,view.mode==='flows'?`Versements mensuels de ${p.name}`:view.mode==='future'?`Après les versements · ${p.name}`:p.imageOnly?'Le portefeuille en détail':`Le portefeuille de ${p.name}`,70,238,415,25,C.muted,400)
 text(ctx,'PART IDENTIFIÉE',70,320,415,21,C.muted)
 text(ctx,pct(g?.coverage||0),65,413,425,85,C.yellow,700,'DcaEditorial')
 text(ctx,`${g?.identified||0} titres identifiés`,70,458,415,26,C.ivory,400)
 rule(ctx,70,500,415)
 text(ctx,'Les 5 premiers titres',70,548,415,26,C.muted,400)
 text(ctx,pct(g?.top5||0),70,613,415,53,C.ivory,700,'DcaEditorial')
 text(ctx,'Les 10 premiers titres',70,674,415,26,C.muted,400)
 text(ctx,pct(g?.top10||0),70,739,415,53,C.ivory,700,'DcaEditorial')
 wrappedLabel(ctx,g?.complete?'Couverture complète':'Couverture partielle',70,809,415,23)
 text(ctx,g?`${g.oldest===g.asOf?g.asOf:g.oldest+' → '+g.asOf}`:'Aucune liste compatible',70,895,415,19,C.muted,400)
 text(ctx,'Les principales détentions cumulées',580,192,950,40,C.ivory,700,'DcaEditorial')
 text(ctx,'Actions en direct + positions détenues via les fonds',580,235,950,24,C.muted,400)
 const top=(g?.rows||[]).slice(0,7),max=Math.max(1,...top.map(r=>r.weight))
 top.forEach((r,i)=>{
  const y=300+i*79
  text(ctx,r.name,580,y,745,27,C.ivory,700)
  text(ctx,pct(r.weight),1390,y,140,29,C.yellow)
  ctx.fillStyle='#213c53';ctx.beginPath();ctx.roundRect(580,y+15,950,9,4);ctx.fill()
  const width=950*r.weight/max,direct=width*r.direct/r.weight
  if(direct>0){ctx.fillStyle=C.yellow;ctx.fillRect(580,y+15,direct,9)}
  ctx.fillStyle='#63dfbd';ctx.fillRect(580+direct,y+15,width-direct,9)
  text(ctx,`${r.contributions.length} support${r.contributions.length>1?'s':''} · ${r.isin}`,580,y+48,950,16,C.muted,400)
 })
 if(!top.length)wrappedLabel(ctx,'Les compositions disponibles ne permettent pas de calculer les détentions cumulées.',580,400,950,30)
 text(ctx,'En direct',580,900,170,21,C.yellow)
 text(ctx,'Via les fonds',780,900,220,21,'#63dfbd')
 text(ctx,g?.scope==='index'?'Périmètre : indices suivis':'Périmètre : positions publiées',1090,900,440,18,C.muted,400)
}
async function companiesPanel(ctx,p,y){
 const {loadHoldings}=await import('./holdings-loader.js')
 const {portfolioCompanies}=await import('./companies.js')
 const holdings=await loadHoldings(p.lines.map(l=>l.asset))
 const result=portfolioCompanies(p.lines,references,holdings)
 panel(ctx,35,y-20,1530,270)
 centered(ctx,result.complete?'Les 10 premières entreprises':'Principales entreprises identifiées',800,y+27,1450,34)
 // Portfolio percentages retain the full denominator, including assets without holdings.
 const subtitle=result.complete?`${pct(result.topWeight)} du portefeuille`:`Composition partielle · ${pct(result.coverage)} du portefeuille identifié`
 ctx.save();ctx.textAlign='center';text(ctx,subtitle,800,y+58,1450,20,C.muted,400);ctx.restore()
 result.rows.forEach((r,i)=>{
  const x=65+(i%5)*298,top=y+108+Math.floor(i/5)*84
  text(ctx,`${i+1}. ${r.name}`,x,top,270,22,C.ivory,400)
  text(ctx,pct(r.weightPct),x,top+33,270,30,C.yellow)
 })
 if(!result.rows.length)centered(ctx,'Aucune composition exploitable pour cette sélection',800,y+150,1400,26,C.muted,400)
 if(!p.imageOnly)centered(ctx,'Épargnant Libre',800,y+284,1480,32)
}
let fontReady
async function loadDcaFont(){
 if(!fontReady)fontReady=new FontFace('DcaEditorial',`url("${import.meta.env.BASE_URL}asset-art/editorial.woff2")`,{weight:'500'}).load().then(font=>document.fonts.add(font)).catch(()=>{fontReady=undefined;return false})
 return fontReady
}
export async function renderDcaImage(input,field='countries'){
 await loadDcaFont()
 const p=input.lines.every(l=>Number.isFinite(l.weight))?input:prepareProfile(input)
 await Promise.all([...new Set(p.lines.map(line=>line.asset))].map(id=>exposureRecords.load(id)))
 const a=analyzeProfile(p)
 if(a.errors.length)throw Error(a.errors.join(' '))
 const baseHeight=['all','overlap'].includes(field)?1000:p.imageOnly?960:1067
 const includeCompanies=p.showCompanies===true&&field!=='overlap'
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=baseHeight+(includeCompanies?300:0);const ctx=canvas.getContext('2d')
 const bg=ctx.createLinearGradient(0,0,1600,1067);bg.addColorStop(0,'#071b36');bg.addColorStop(.5,'#03152c');bg.addColorStop(1,'#092952');ctx.fillStyle=bg;ctx.fillRect(0,0,1600,canvas.height)
 const finish=async()=>{if(includeCompanies)await companiesPanel(ctx,p,baseHeight);return canvas}
 if(field==='overlap'){await overlapPortfolio(ctx,p);return canvas}
 if(field==='all'){fullPortfolio(ctx,p,a);return finish()}
 if(p.imageOnly||field==='both'){
  centered(ctx,p.imageOnly?'Épargnant Libre':`Le DCA de ${p.name}`,800,83,1472,49)
  if(!p.imageOnly)centered(ctx,`${euro(a.monthly)} investis par mois`,800,158,1470,34,C.yellow)
  if(field==='all'){
   fullPortfolio(ctx,p,a)
  }else if(field==='both'){
   exposurePanel(ctx,a,'countries',66,218,700,p.exposureLimit)
   exposurePanel(ctx,a,'sectors',834,218,700,p.exposureLimit)
  }else exposurePanel(ctx,a,field,450,218,700,p.exposureLimit)
  if(!includeCompanies&&!p.imageOnly)centered(ctx,'Épargnant Libre',800,1035,1472,36)
  return finish()
 }
 text(ctx,'LE DCA DE',64,62,710,26,C.muted,700)
 text(ctx,p.name,62,161,710,96,C.ivory,700,'DcaEditorial')
 text(ctx,[p.age&&`${p.age} ans`,p.job].filter(Boolean).join(' · '),66,212,710,30,C.ivory,400)
 if(p.income)text(ctx,`${incomeLabel(p)} : ${euro(p.income)} / mois`,66,263,710,32,C.ivory,400)
 text(ctx,'CHAQUE MOIS',66,341,710,26,C.muted)
 text(ctx,euro(a.monthly),56,495,720,160,C.yellow,700,'DcaEditorial')
 text(ctx,'investis par mois',66,552,710,40,C.ivory,700,'DcaEditorial')
 const contributions=sortContributions(p.lines)
 const displayLines=contributions.length>8?[...contributions.slice(0,7),{label:`${contributions.length-7} autres positions`,amount:contributions.slice(7).reduce((s,l)=>s+l.amount,0),weight:contributions.slice(7).reduce((s,l)=>s+l.weight,0)}]:contributions
 const rowHeight=Math.min(112,366/displayLines.length),top=597
 displayLines.forEach((l,i)=>{
  const y=top+i*rowHeight
  rule(ctx,66,y,710)
  text(ctx,euro(l.amount),66,y+rowHeight*.66,220,Math.min(49,rowHeight*.55),C.yellow,700,'DcaEditorial')
  text(ctx,l.label,312,y+rowHeight*.62,464,Math.min(31,rowHeight*.45),C.ivory,700,'DcaEditorial')
 })
 text(ctx,'Son portefeuille',865,112,670,65,C.ivory,700,'DcaEditorial')
 text(ctx,field==='sectors'?'Exposition sectorielle':'Exposition géographique',880,163,650,32,C.muted,400)
 const {rows,scope}=donutData(a,field,p.exposureLimit),cx=1197,cy=508,r=280,inner=195
 let angle=-Math.PI/2
 for(const row of rows){const span=row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,angle+span);ctx.arc(cx,cy,inner,angle+span,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle+=span}
 const percentages=integerPercentages(rows)
 rows.forEach((row,i)=>{
  const x=860+(i%3)*226,y=(rows.length>6?820:839)+Math.floor(i/3)*(rows.length>6?49:73)
  ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(x+10,y-8,9,0,Math.PI*2);ctx.fill()
  text(ctx,row.name,x+28,y,190,rows.length>6?18:23,C.ivory,400)
  text(ctx,exposurePercentage(row.weight,percentages[i]),x+28,y+(rows.length>6?24:32),190,rows.length>6?23:29,C.ivory,700)
 })
 text(ctx,scope,880,195,650,18,C.muted,400)


 if(!includeCompanies)centered(ctx,'Épargnant Libre',800,1035,1472,36)
 return finish()
}
