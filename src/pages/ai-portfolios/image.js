import { money,percent } from './lib.js'
// Coded templates: same computed report as the tweet. No external image generation.
const PAPER='#f6f1e5',INK='#123e32',MUTED='#566c61',GOLD='#c7a35e'
function text(ctx,str,x,y,size=34,color=INK,weight=400,max=1000) {
  ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial`;ctx.textBaseline='top'
  // Shrink only long identities, never the figures; cap width and wrap to two lines.
  const words=String(str).split(/\s+/);let line='',lines=[]
  for(const word of words) {const next=line?line+' '+word:word;if(ctx.measureText(next).width>max&&line){lines.push(line);line=word}else line=next}
  if(line) lines.push(line)
  lines.slice(0,2).forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.15,max))
}
export function renderImage(report,comp,market,participant=null,chart=false) {
  if(!report?.complete) throw Error('Bilan incomplet : export financier bloqué.')
  const focus=participant?report.rows.find(r=>r.id===participant):null
  const rows=focus?focus.positions:[...report.rows].sort((a,b)=>b.value-a.value)
  const count=rows.length,height=chart?1050:focus?Math.max(850,620+count*160):Math.max(800,365+count*210)
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=height
  const ctx=canvas.getContext('2d');ctx.fillStyle=PAPER;ctx.fillRect(0,0,1200,height)
  ctx.fillStyle=INK;ctx.fillRect(0,0,1200,16)
  ctx.strokeStyle=GOLD;ctx.lineWidth=2;ctx.strokeRect(22,30,1156,height-56)
  text(ctx,'ÉPARGNANT LIBRE  /  PORTEFEUILLES IA',58,55,24,MUTED,700)
  const title=focus?focus.name:chart?'La course au fil des jours':'Qui mène la course ?'
  let titleSize=62;ctx.font=`700 ${titleSize}px Arial`;while(ctx.measureText(title).width>1084&&titleSize>36){titleSize--;ctx.font=`700 ${titleSize}px Arial`}
  ctx.fillStyle=INK;ctx.textBaseline='top';ctx.fillText(title,58,105,1084)
  text(ctx,`Arrêté ${report.date} · ${comp.config.currency}${report.partialWeek?' · semaine partielle':''}`,58,188,29,MUTED)
  if(chart) {
    const daily=(market.daily??[]).filter(s=>s.date<=report.date)
    if(daily.filter(s=>s.complete).length<2) text(ctx,'La courbe sera disponible après deux arrêtés.',58,390,38)
    else {
      const values=daily.filter(s=>s.complete).flatMap(s=>s.rows.map(r=>r.performance)),min=Math.min(0,...values),max=Math.max(1,...values),span=max-min||1
      for(const [index,row] of report.rows.entries()) {
        ctx.strokeStyle=row.color;ctx.lineWidth=5;ctx.beginPath()
        let open=false
        daily.forEach((s,i)=>{if(!s.complete){open=false;return}const r=s.rows.find(r=>r.id===row.id),x=100+i/(daily.length-1)*1000,y=720-(r.performance-min)/span*420;if(open)ctx.lineTo(x,y);else ctx.moveTo(x,y);open=true})
        ctx.stroke();text(ctx,`${row.name} ${percent(row.performance)}`,64+(index%3)*375,810+Math.floor(index/3)*50,25,row.color,700,345)
      }
      text(ctx,`${percent(max)}  ↑`,60,255,26,MUTED);text(ctx,`${percent(min)}  ↓`,60,740,26,MUTED)
    }
  } else if(focus) {
    text(ctx,money(focus.value,comp.config.currency),58,245,58,focus.color,700)
    text(ctx,`Semaine ${percent(focus.weekly)}  ·  Départ ${percent(focus.performance)}`,58,315,31,INK,700)
    if(!rows.length) {text(ctx,'Le portefeuille conserve ses liquidités.',58,400,40,INK,700);text(ctx,'Aucune position ouverte à cet arrêté.',58,462,32,MUTED)}
    rows.forEach((r,i)=>{
      const a=market.universe.find(a=>a.id===r.id),y=385+i*160
      ctx.fillStyle='#e7e8dc';ctx.fillRect(58,y+112,1084,9);ctx.fillStyle=focus.color;ctx.fillRect(58,y+112,1084*r.weight/100,9)
      text(ctx,`${a?.ticker??r.id} · ${r.weight.toFixed(1)} %`,58,y,42,INK,700,700)
      text(ctx,`${money(r.value,comp.config.currency)}  ·  résultat ${money(r.pnl,comp.config.currency)}`,58,y+55,32,MUTED)
    })
    const last=comp.decisions.filter(d=>d.participant===participant&&d.status==='executed'&&d.executionDate<=report.date).sort((a,b)=>a.executionDate.localeCompare(b.executionDate)).at(-1)
    if(last)text(ctx,`Dernière décision · ${last.executionDate} · ${last.kind==='hold'?'Conserver':last.execution.trades.length+' mouvements'}`,58,height-245,28,MUTED,400,1084)
    text(ctx,`Liquidités ${money(focus.cash,comp.config.currency)}`,58,height-168,30,INK,700)
  } else rows.forEach((r,i)=>{
    const y=265+i*210
    ctx.fillStyle=r.color;ctx.fillRect(58,y,8,185)
    const name=`${i+1}. ${r.name}`;ctx.font='700 45px Arial';const nameSize=ctx.measureText(name).width>640?36:45
    text(ctx,name,85,y,nameSize,INK,700,650)
    text(ctx,money(r.value,comp.config.currency),780,y,44,r.color,700,360)
    text(ctx,`Semaine ${percent(r.weekly)}`,85,y+100,34,INK,700)
    text(ctx,`Depuis le départ ${percent(r.performance)}`,85,y+150,31,MUTED)
  })
  text(ctx,'Portefeuilles fictifs',58,height-79,30,INK,700)
  text(ctx,`${report.weekStart} → ${report.date} · ${comp.config.currency}`,650,height-74,25,MUTED,400,480)
  return canvas
}
