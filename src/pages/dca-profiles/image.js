import { analyzeProfile, prepareProfile, pct, euro } from './engine.js'
import { incomeLabel } from './lib.js'
const C={navy:'#071d36',ivory:'#fff4df',yellow:'#ffd342',muted:'#9eb7d2',panel:'#0d263e'}
const colors=['#ffd342','#3899ff','#63dfbd','#bd9eff','#ff9b70','#b7ce6e','#ec99cd','#aec8df']
function text(ctx,value,x,y,width,size,color=C.ivory,weight=700){
  value=String(value);ctx.font=`${weight} ${size}px Arial`
  while(ctx.measureText(value).width>width && size>10)ctx.font=`${weight} ${--size}px Arial`
  ctx.fillStyle=color;ctx.fillText(value,x,y)
}
function box(ctx,x,y,w,h,color,outline){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,24);ctx.fill();if(outline){ctx.strokeStyle=outline;ctx.lineWidth=2;ctx.stroke()}}
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
export function renderDcaImage(input){
 const p=input.lines.every(l=>Number.isFinite(l.weight))?input:prepareProfile(input),a=analyzeProfile(p)
 if(a.errors.length)throw Error(a.errors.join(' '))
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1067;const ctx=canvas.getContext('2d')
 const bg=ctx.createRadialGradient(1330,450,30,1050,480,1200);bg.addColorStop(0,'#102d50');bg.addColorStop(1,'#050f21');ctx.fillStyle=bg;ctx.fillRect(0,0,1600,1067)
 ctx.strokeStyle='#173858';ctx.lineWidth=2
 for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(1430,-15,400+i*48,0,Math.PI);ctx.stroke()}
 ctx.fillStyle=C.yellow;ctx.fillRect(64,53,39,4)
 text(ctx,'PORTEFEUILLE & DCA',119,62,1200,22,C.muted)
 text(ctx,p.name,58,167,1478,92,C.ivory,900)
 text(ctx,[p.age&&`${p.age} ans`,p.job,p.location].filter(Boolean).join(' · '),64,222,1472,29)
 if(p.income){box(ctx,64,244,680,47,'#142c46');text(ctx,`${incomeLabel(p)} : ${euro(p.income)} / mois`,81,276,646,24,C.muted)}
 box(ctx,64,332,662,188,C.yellow)
 text(ctx,euro(a.monthly),92,438,604,100,C.navy,900)
 text(ctx,'INVESTIS CHAQUE MOIS',99,493,590,26,C.navy,800)
 const count=p.lines.length,rowHeight=Math.min(135,386/count),top=551
 p.lines.forEach((l,i)=>{
  const y=top+i*rowHeight,h=rowHeight-12,compact=count>5
  box(ctx,64,y,662,h,['#123e70','#112d4c','#102e3a'][i%3],'#28506e')
  ctx.fillStyle=colors[i];ctx.fillRect(80,y+12,6,h-24)
  text(ctx,euro(l.amount),105,y+h/2+12,200,Math.min(46,h*.48),colors[i],900)
  if(compact){
   text(ctx,l.label,320,y+h/2+7,292,19)
   text(ctx,pct(l.weight),625,y+h/2+7,84,19,C.muted)
  }else{
   text(ctx,l.label,320,y+h*.39,382,Math.min(28,h*.3))
   text(ctx,`${pct(l.weight)} du portefeuille`,320,y+h*.76,382,Math.min(23,h*.25),C.muted,500)
  }
 })
 box(ctx,765,332,771,605,C.panel,'#22425e')
 text(ctx,'Où son portefeuille est investi',802,395,697,34)
 const {group,rows}=donutData(a),cx=1017,cy=637,r=198,inner=136
 ctx.save();ctx.shadowColor='#348de7';ctx.shadowBlur=22;ctx.strokeStyle='#1a4965';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();ctx.restore()
 let angle=-Math.PI/2
 for(const row of rows){const span=row.weight/100*Math.PI*2,gap=Math.min(.018,span*.12);ctx.beginPath();ctx.arc(cx,cy,r,angle+gap/2,angle+span-gap/2);ctx.arc(cx,cy,inner,angle+span-gap/2,angle+gap/2,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle+=span}
 text(ctx,'EXPOSITION',cx-99,cy-9,198,25)
 text(ctx,'géographique',cx-82,cy+29,170,22,C.muted,500)
 const start=rows.length>5?457:485,step=rows.length>5?65:70
 rows.forEach((row,i)=>{const y=start+i*step;box(ctx,1242,y-14,14,14,row.color);text(ctx,row.name,1270,y,234,24);text(ctx,pct(row.weight),1370,y+30,132,27,row.color==='#57718e'?C.muted:row.color,800)})
 if(group){
  text(ctx,`${group.asOf} · ${group.basis==='fund'?'Fonds':'Indice'} · couverture ${pct(group.coverage)}`,802,882,697,21,C.muted,500)
  if(group.classification==='Pays d’enregistrement DWS')text(ctx,'Pays d’enregistrement',802,913,697,20,C.muted,500)
 }else text(ctx,'Aucune ventilation qualifiée',802,892,697,24,C.muted)
 ctx.strokeStyle='#28415c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(64,985);ctx.lineTo(1536,985);ctx.stroke()
 text(ctx,p.scope,64,1035,1060,23,C.muted,500)
 text(ctx,'Épargnant Libre',1215,1035,330,31,C.ivory,900)
 return canvas
}
