import { analyzeProfile, prepareProfile, euro } from './engine.js'
import { incomeLabel } from './lib.js'
const C={navy:'#071d36',ivory:'#fff4df',yellow:'#ffd342',muted:'#9eb7d2',panel:'#0d263e'}
const colors=['#ffd342','#3899ff','#63dfbd','#bd9eff','#ff9b70','#b7ce6e','#ec99cd','#aec8df']
function text(ctx,value,x,y,width,size,color=C.ivory,weight=700,family='Arial'){
 value=String(value);ctx.font=`${weight} ${size}px ${family}`
 while(ctx.measureText(value).width>width && size>10)ctx.font=`${weight} ${--size}px ${family}`
 ctx.fillStyle=color;ctx.fillText(value,x,y)
}
function rule(ctx,x,y,width){ctx.strokeStyle='#304d70';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width,y);ctx.stroke()}
// Largest-remainder display rounding: true geometry is untouched, labels sum to 100.
export function integerPercentages(rows){
 const values=rows.map(r=>Math.floor(r.weight))
 const order=rows.map((r,i)=>({i,fraction:r.weight-values[i]})).sort((a,b)=>b.fraction-a.fraction||a.i-b.i)
 const remaining=100-values.reduce((s,v)=>s+v,0)
 for(let i=0;i<remaining;i++)values[order[i%order.length].i]++
 return values
}
// A single compatible snapshot, never a blend of dates or classifications.
// Missing coverage keeps its true weight in grey; never renormalize known countries to 100%.
export function donutData(analysis){
 const group=[...analysis.countries.groups].sort((a,b)=>b.coverage-a.coverage)[0]
 if(!group)return {group:null,rows:[{name:'Non ventilé',weight:100,color:'#57718e'}]}
 const raw=group.rows.filter(r=>r.weight>0),total=raw.reduce((s,r)=>s+r.weight,0)
 // Source rounding can marginally exceed covered weight. Scale only that excess.
 const scale=total>group.coverage?group.coverage/total:1
 const known=raw.map(r=>({...r,weight:r.weight*scale})).sort((a,b)=>b.weight-a.weight)
 const named=known.filter(r=>!/^autres?$|^other$/i.test(r.name))
 const rows=named.slice(0,4).map((r,i)=>({...r,color:colors[i]}))
 const rest=known.reduce((s,r)=>s+r.weight,0)-rows.reduce((s,r)=>s+r.weight,0)
 if(rest>1e-9)rows.push({name:'Autres expositions',weight:rest,color:colors[4]})
 const missing=Math.max(0,100-rows.reduce((s,r)=>s+r.weight,0))
 if(missing>.000001)rows.push({name:'Non ventilé ici',weight:missing,color:'#57718e'})
 return {group,rows}
}
let fontReady
async function loadDcaFont(){
 if(!fontReady)fontReady=new FontFace('DcaEditorial',`url("${import.meta.env.BASE_URL}asset-art/editorial.woff2")`,{weight:'500'}).load().then(font=>document.fonts.add(font)).catch(error=>{fontReady=undefined;throw error})
 return fontReady
}
export async function renderDcaImage(input){
 await loadDcaFont()
 const p=input.lines.every(l=>Number.isFinite(l.weight))?input:prepareProfile(input),a=analyzeProfile(p)
 if(a.errors.length)throw Error(a.errors.join(' '))
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1067;const ctx=canvas.getContext('2d')
 const bg=ctx.createLinearGradient(0,0,1600,1067);bg.addColorStop(0,'#071b36');bg.addColorStop(.5,'#03152c');bg.addColorStop(1,'#092952');ctx.fillStyle=bg;ctx.fillRect(0,0,1600,1067)
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
 text(ctx,'Exposition géographique',880,163,650,32,C.muted,400)
 const {group,rows}=donutData(a),cx=1197,cy=508,r=280,inner=195
 let angle=-Math.PI/2
 for(const row of rows){const span=row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(cx,cy,r,angle,angle+span);ctx.arc(cx,cy,inner,angle+span,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle+=span}
 const percentages=integerPercentages(rows)
 rows.forEach((row,i)=>{
  const x=860+(i%3)*226,y=839+Math.floor(i/3)*73
  ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(x+10,y-8,9,0,Math.PI*2);ctx.fill()
  text(ctx,row.name,x+28,y,190,23,C.ivory,400)
  text(ctx,`${percentages[i]} %`,x+28,y+32,190,29,C.ivory,700)
 })
 const source=group?`${group.asOf} · ${group.basis==='fund'?'Fonds':'Indice'} · couverture ${Math.round(group.coverage)} %`:'Aucune ventilation qualifiée'
 text(ctx,source,860,982,670,18,C.muted,400)
 if(group?.classification==='Pays d’enregistrement DWS')text(ctx,'Pays d’enregistrement',860,1004,670,16,C.muted,400)
 rule(ctx,64,1013,1472)
 text(ctx,p.scope,64,1050,1000,20,C.muted,400)
 text(ctx,'Épargnant Libre',1205,1051,330,32,C.ivory,700,'DcaEditorial')
 return canvas
}
