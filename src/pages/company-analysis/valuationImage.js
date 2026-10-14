import { formatValue as n } from './valuationPresentation.js'
import { dateLabel } from './lib.js'

const ink='#243b34', muted='#637467', green='#22684f', colors=['#ab8550',green,'#829b65']
export function renderValuationImage(p) {
  const canvas=document.createElement('canvas'); canvas.width=1200;canvas.height=1500
  const c=canvas.getContext('2d')
  c.fillStyle='#faf9f3';c.fillRect(0,0,1200,1500)
  function text(value,x,y,size=28,color=ink,weight=400,max=1088) {
    c.font=`${weight} ${size}px Arial, sans-serif`
    while(c.measureText(String(value)).width>max && size>20) c.font=`${weight} ${--size}px Arial, sans-serif`
    c.fillStyle=color;c.fillText(value,x,y)
  }
  function wrap(value,x,y,width,size=26,line=37) {
    c.font=`400 ${size}px Arial, sans-serif`;let row=''
    for(const word of value.split(' ')) {const next=row?`${row} ${word}`:word;if(c.measureText(next).width>width&&row){text(row,x,y,size,muted);y+=line;row=word}else row=next}
    text(row,x,y,size,muted);return y+line
  }
  function line(x,y,x2,y2,color='#e0e4d8',width=1) {c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke()}
  text('OBJECTIFS DE COURS',56,66,23,muted,600)
  text(p.name,56,140,61,ink,600,760);text(`${n(p.price,2)} ${p.currency}`,850,140,40,ink,600,294)
  text(`${p.symbol} · Clôture du ${dateLabel(p.quoteDate)}`,56,188,26,muted)
  line(56,218,1144,218)
  p.metrics.forEach((m,i)=>{const x=56+i*276;text(m.label,x,264,26,muted,400,258);text(m.value,x,317,38,ink,500,258);text(m.hint,x,356,21,muted,400,258)})
  line(56,388,1144,388)
  text(p.chart.title,56,435,31,ink,600);text(p.chart.unit,900,435,23,muted,400,244)
  const points=[...p.chart.history,...p.chart.forecast.flatMap(s=>s.points)]
  const t0=Math.min(...points.map(v=>v.time)),t1=Math.max(...points.map(v=>v.time))
  const lo=Math.min(0,...points.map(v=>v.value)),hi=Math.max(...points.map(v=>v.value))*1.12
  const x=t=>135+(t-t0)/(t1-t0||1)*960,y=v=>795-(v-lo)/(hi-lo||1)*300
  for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4;line(135,y(v),1095,y(v));text(n(v),56,y(v)+8,23,muted,400,73)}
  const last=p.chart.history.at(-1)
  c.setLineDash([5,7]);line(x(last.time),490,x(last.time),795,'#b3bcae');c.setLineDash([])
  text('Hypothèses →',Math.min(x(last.time)+12,850),477,22,muted)
  function curve(rows,color,dashed,width) {c.setLineDash(dashed?[10,8]:[]);c.strokeStyle=color;c.lineWidth=width;c.beginPath();rows.forEach((v,i)=>i?c.lineTo(x(v.time),y(v.value)):c.moveTo(x(v.time),y(v.value)));c.stroke();c.setLineDash([])}
  curve(p.chart.history,ink,false,4)
  for(const v of p.chart.history.filter((_,i)=>p.chart.history.length<20||i===0||i===p.chart.history.length-1)){c.beginPath();c.arc(x(v.time),y(v.value),5,0,2*Math.PI);c.fillStyle=ink;c.fill()}
  p.chart.forecast.forEach((s,i)=>curve(s.points,colors[i],true,i===p.selected?5:2))
  text(String(new Date(t0).getUTCFullYear()),135,836,24,muted)
  text(String(new Date(t1).getUTCFullYear()),1028,836,24,muted)
  if(p.chart.hasPriceHistory)text(String(new Date(last.time).getUTCFullYear()),x(last.time)-25,836,24,muted)
  text(p.chart.hasPriceHistory?'Trait plein : clôtures · Pointillés : trajectoires hypothétiques':'Dernière clôture puis trajectoires hypothétiques',56,883,25,muted)
  p.scenarios.forEach((s,i)=>{
    const left=56+i*370;c.fillStyle=i===p.selected?'#e8efdf':'#f2f3ea';c.beginPath();c.roundRect(left,916,348,149,16);c.fill()
    text(s.name+(s.customised?' · personnalisé':i===p.selected?' · sélectionné':''),left+20,950,25,colors[i],600,310)
    text(`${n(s.value,2)} ${p.currency}`,left+20,992,39,ink,500,310)
    text(`${n(s.assumptions.growth*100)} % annualisés · sortie ${n(s.assumptions.multiple)}×`,left+20,1027,23,muted,400,310)
    text(`${s.upside>=0?'+':''}${n(s.upside*100)} % · ${s.annualised>=0?'+':''}${n(s.annualised*100)} % / an`,left+20,1053,22,colors[i],600,310)
  })
  text(`Objectifs au ${dateLabel(p.targetDate)} · horizon ${p.years} an${p.years>1?'s':''}`,56,1119,27,ink,600)
  let row=wrap(p.reading.title.replace('tes hypothèses','ces hypothèses'),56,1171,1088,29,40)
  row=wrap(`Croissance annualisée équivalente : ${n(p.assumptions.growth*100)} %. Multiple de sortie : ${n(p.assumptions.multiple)}×. ${p.method==='earnings'?'BPA ajusté prévisionnel, distinct du BPA publié.':'FCF/action : trésorerie, investissements et actions projetés.'}`,56,row+10,1088,25,35)
  text(p.explanation.customGrowth?'Croissance personnalisée':p.method==='cash'?'Flux futurs : projections du modèle':`Estimations sources jusqu’à ${p.explanation.lastEstimate.slice(0,4)} · ${p.explanation.extrapolated}/${p.years} échéances extrapolées`,56,1350,23,muted)
  line(56,1383,1144,1383)
  text('Prévisions conditionnelles · hors dividendes',56,1421,25,muted)
  text('Épargnant Libre',56,1464,24,green,600);text('Pas un conseil financier',820,1464,24,muted,400,324)
  return canvas
}
