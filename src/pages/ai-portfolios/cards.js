import {money,percent} from './lib.js'
const PAPER='#f6f1e5',INK='#123e32',MUTED='#566c61',GRAY='#858b89',GOLD='#c7a35e',W=1200
function label(ctx,value,x,y,size=30,color=INK,width=1080,weight=400){
 ctx.fillStyle=color;ctx.textBaseline='top';ctx.font=`${weight} ${size}px Arial`
 const words=String(value).split(/\s+/);let line='',at=y
 for(const word of words){const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){ctx.fillText(line,x,at,width);at+=size*1.2;line=word}else line=next}
 if(line){ctx.fillText(line,x,at,width);at+=size*1.2}return at
}
function canvas(height,title,model,page,total,subtitle){
 const c=document.createElement('canvas');c.width=W;c.height=height;const x=c.getContext('2d');const probe=label(x,title,54,102,48,INK,1090,700);const sub=subtitle?label(x,subtitle,54,probe+12,26,MUTED):probe;const offset=Math.max(0,sub+25-235);height+=offset;c.height=height;x.fillStyle=PAPER;x.fillRect(0,0,W,height);x.fillStyle=INK;x.fillRect(0,0,W,14);x.strokeStyle=GOLD;x.strokeRect(22,28,1156,height-50)
 label(x,'ÉPARGNANT LIBRE  /  PORTEFEUILLES IA',54,48,23,MUTED,1090,700)
 const y=label(x,title,54,102,48,INK,1090,700)
 if(subtitle)label(x,subtitle,54,y+12,26,MUTED)
 label(x,'Portefeuilles fictifs',54,height-68,26,INK,500,700)
 label(x,`${model.start} → ${model.end} · ${model.currency}${total>1?' · '+page+'/'+total:''}`,580,height-64,23,MUTED,565)
 x.translate(0,offset);return {canvas:c,ctx:x}
}
const chunks=(rows,n)=>Array.from({length:Math.max(1,Math.ceil(rows.length/n))},(_,i)=>rows.slice(i*n,(i+1)*n))
const identity=(market,id)=>market.universe.find(a=>a.id===id)
function chart(model,options){
 if(!model.hasCurve)throw Error('La courbe nécessite au moins deux arrêtés réels. Aucun historique inventé au lancement.')
 const height=1180,{canvas:c,ctx:x}=canvas(height,options.title||'La course sur la période',model,1,1,options.subtitle)
 const rows=model.rows,cols=rows.length>2?2:rows.length,cell=1090/cols
 rows.forEach((r,i)=>{const px=54+(i%cols)*cell,py=235+Math.floor(i/cols)*112;label(x,r.id==='world'?`${model.reference.name} · ${model.reference.ticker}`:r.name,px,py,25,r.color,cell-25,700);label(x,percent(r.periodPerformance),px,py+63,40,r.color,cell-25,700)})
 const top=235+Math.ceil(rows.length/cols)*112+30,bottom=height-158,left=90,right=970
 const values=model.curves.flatMap(p=>p.values.map(v=>v.value)),lo=Math.min(0,...values),hi=Math.max(1,...values),span=hi-lo||1,y=v=>bottom-(v-lo)/span*(bottom-top)
 x.lineWidth=1;x.strokeStyle='#d4dacd'
 for(let i=0;i<=4;i++){const yy=top+(bottom-top)*i/4;x.beginPath();x.moveTo(left,yy);x.lineTo(right,yy);x.stroke();label(x,percent(hi-span*i/4),55,yy-24,21,MUTED,180)}
 const duration=Math.max(86400000,Date.parse(model.end)-Date.parse(model.start)),xx=p=>left+(Date.parse(p.date)-Date.parse(model.start))/duration*(right-left)
 const endpoints=[]
 for(const r of rows){x.strokeStyle=r.color;x.lineWidth=r.id==='world'?4:6;x.beginPath();model.curves.forEach((p,i)=>{const yy=y(p.values.find(v=>v.id===r.id).value);if(i)x.lineTo(xx(p),yy);else x.moveTo(xx(p),yy)});x.stroke();endpoints.push({...r,y:y(r.periodPerformance)})}
 endpoints.sort((a,b)=>a.y-b.y);endpoints.forEach((r,i)=>{r.ly=Math.max(top,i?endpoints[i-1].ly+36:top,r.y)});for(let i=endpoints.length-1;i>=0;i--)endpoints[i].ly=Math.min(endpoints[i].ly,i===endpoints.length-1?bottom:endpoints[i+1].ly-36)
 for(const r of endpoints){x.strokeStyle=r.color;x.lineWidth=2;x.beginPath();x.moveTo(right,r.y);x.lineTo(right+30,r.ly);x.stroke();label(x,percent(r.periodPerformance),right+38,r.ly-14,25,r.color,145,700)}
 label(x,model.start,left,bottom+30,23,MUTED,400);label(x,model.end,760,bottom+30,23,MUTED,400)
 return [c]
}
export function renderCards(model,comp,market,options={}){
 if(!model.complete)throw Error('Données incomplètes : export bloqué.')
 if(['curve','curves'].includes(model.format))return chart(model,options)
 if(model.format==='individual'){
  const r=model.rows[0],positions=[...r.positions,...(r.closedResults??[]).map(p=>({...p,weight:0,value:0,closed:true}))],pages=chunks(positions,5)
  return pages.map((items,index)=>{const h=530+Math.max(1,items.length)*130,{canvas:c,ctx:x}=canvas(h,options.title||r.name,model,index+1,pages.length,options.subtitle||r.model)
   label(x,`${money(r.value,model.currency)} · liquidités ${money(r.cash,model.currency)}`,54,242,35,r.color,1090,700)
   label(x,percent(r.performance),54,306,55,r.color,520,700);label(x,'Depuis le lancement',54,370,25,MUTED)
   label(x,percent(r.periodPerformance),660,306,55,r.color,470,700);label(x,'Sur la période choisie',660,370,25,MUTED)
   label(x,'Positions · poids',54,405,21,MUTED);label(x,'Perf. investissement',860,405,21,MUTED,275);if(!items.length)label(x,'Aucune position · liquidités conservées',54,443,34,INK)
   items.forEach((p,i)=>{const a=identity(market,p.id),y=435+i*130;label(x,`${a?.ticker??p.id} · ${p.closed?'cédée':p.weight.toFixed(1)+' %'}`,54,y,33,INK,600,700);label(x,percent(p.investmentPerformance),860,y,35,r.color,275,700);label(x,a?.name??p.id,54,y+43,27,MUTED,770);label(x,`Résultat net ${p.investmentPnl==null?'indisponible':money(p.investmentPnl,model.currency)}`,860,y+48,27,MUTED,275)})
   return c})
 }
 if(model.format==='comparison'){
  const reference=model.rows.find(r=>r.id==='world'),rows=model.rows.filter(r=>r.id!=='world').sort((a,b)=>b.periodPerformance-a.periodPerformance),h=440+rows.length*175,{canvas:c,ctx:x}=canvas(h,options.title||'Qui mène la course ?',model,1,1,options.subtitle||'Classement sur une période commune')
  rows.forEach((r,i)=>{const y=235+i*175;x.fillStyle=r.color;x.fillRect(54,y,7,145);label(x,`${i+1}. ${r.name}`,78,y,36,INK,670,700);label(x,percent(r.periodPerformance),805,y,48,r.color,330,700);label(x,`${money(r.value,model.currency)} · total ${percent(r.performance)}`,78,y+89,27,MUTED,700);label(x,`${r.vsReference>=0?'+':''}${r.vsReference.toFixed(2)} pt / réf.`,805,y+86,27,r.color,330)})
  const y=235+rows.length*175;label(x,`Référence${model.reference.instrumentType==='ETF'?' ETF':''} · ${model.reference.ticker} · ${percent(reference.periodPerformance)}`,54,y,32,GRAY,1090,700);label(x,model.reference.name,54,y+45,24,MUTED,1090)
  return [c]
 }
 const metrics=document.createElement('canvas').getContext('2d'),measure=(v,size)=>label(metrics,v,0,0,size,INK,1060,700);const collective=model.format==='all-moves',panels=model.rows.flatMap(r=>chunks(r.movements,4).map((moves,i,all)=>({...r,moves,part:all.length>1?`${i+1}/${all.length}`:'',nameHeight:measure(r.name,34),header:Math.max(90,measure(r.name,34)+measure(r.model,23)+16),height:35+Math.max(90,measure(r.name,34)+measure(r.model,23)+16)+Math.max(1,moves.length)*90+(r.pending.length?70:0)}))),pages=[]
 let current=[],used=0
 for(const panel of panels){if(used+panel.height>880&&current.length){pages.push(current);current=[];used=0}current.push(panel);used+=panel.height}if(current.length)pages.push(current)
 return pages.map((items,index)=>{const height=310+items.reduce((s,p)=>s+p.height,0),{canvas:c,ctx:x}=canvas(height,options.title||(collective?'Les mouvements sur la période':model.rows[0].name+' · mouvements'),model,index+1,pages.length,options.subtitle||'Mouvements exécutés · montants en EUR');let y=235
  for(const p of items){x.fillStyle=p.color;x.fillRect(54,y,7,p.height-25);label(x,`${p.name}${p.part?' · '+p.part:''}`,78,y,34,INK,1060,700);label(x,p.model,78,y+p.nameHeight+5,23,MUTED,1060)
   if(!p.moves.length)label(x,'Aucun mouvement exécuté',78,y+p.header,31,MUTED)
   p.moves.forEach((t,i)=>{const yy=y+p.header+i*90,a=identity(market,t.id);label(x,`${t.label} · ${a?.ticker??t.id}`,78,yy,30,INK,665,700);label(x,money(t.amount,'EUR'),825,yy,34,p.color,300,700);label(x,`${t.date} · ${t.before.toFixed(1)} % → ${t.after.toFixed(1)} % · frais ${money(t.fee,'EUR')}`,78,yy+40,24,MUTED,1050)})
   if(p.pending.length)label(x,`Prévu, non exécuté · ${p.pending[0].date} · ${p.pending[0].kind==='hold'?'Conserver':p.pending[0].kind==='target'?'Rééquilibrage':'Achats / ventes'}${p.pending.length>1?' · '+p.pending.length+' propositions':''}`,78,y+p.height-65,23,MUTED,1040)
   y+=p.height
  }return c})
}
