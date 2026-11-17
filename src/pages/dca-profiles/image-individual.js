import { integerPercentages, exposurePercentage } from './image.js'
import { radialDonutLayout, shortDonutName, individualColor, holdingPercentage, INDIVIDUAL_LABEL_FONT } from './donut-layout.js'
import { fitImageCanvas } from './image-canvas.js'
import { polygonIndex } from './image-collisions.js'

const NAVY='#071d36',IVORY='#fff4df'
// Separating-axis collision test uses the rotated text rectangle, not its much
// larger axis-aligned box (which would displace readable small percentages).
function intersects(a,b){
 for(const polygon of [a,b])for(let i=0;i<4;i++){
  const p=polygon[i],q=polygon[(i+1)%4],axis={x:p.y-q.y,y:q.x-p.x}
  const pa=a.map(v=>v.x*axis.x+v.y*axis.y),pb=b.map(v=>v.x*axis.x+v.y*axis.y)
  if(Math.max(...pa)<Math.min(...pb)||Math.max(...pb)<Math.min(...pa))return false
 }
 return true
}
export function holdingImageRows(lines){return lines.filter(l=>l.weight>0).sort((a,b)=>b.weight-a.weight).map((l,i)=>({...l,name:shortDonutName(l.label),color:individualColor(i)}))}
function text(ctx,value,x,y,size=56,align='left',serif=false,color=IVORY){
 ctx.font=`${serif?400:600} ${size}px ${serif?'DcaEditorial, Georgia':'Arial'}`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(value,x,y)
}
// Neutral coverage slices retain their meaning instead of receiving an asset colour.
function imageRows(rows,allocation){
 const rounded=allocation?null:integerPercentages(rows)
 return rows.map((row,i)=>{
  const neutral=['Non ventilé ici','Écart d’arrondi','Sans objet','Autres expositions'].includes(row.name)
  return {...row,color:allocation||neutral?row.color:individualColor(i),percentage:allocation?holdingPercentage(row.weight):exposurePercentage(row.weight,rounded[i])}
 }).filter(row=>row.weight>0)
}
export function renderIndividualDonut(title,rows,{allocation=false,scope=''}={}){
 const canvas=document.createElement('canvas'),probe=canvas.getContext('2d')
 probe.font=`600 ${INDIVIDUAL_LABEL_FONT}px Arial`
 const plan=radialDonutLayout(imageRows(rows,allocation),value=>probe.measureText(value).width)
 const fitted=fitImageCanvas(plan.width,plan.height),{scale}=fitted
 canvas.width=fitted.width;canvas.height=fitted.height
 const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle=NAVY;ctx.fillRect(0,0,plan.width,plan.height)
 text(ctx,'Épargnant Libre',plan.cx,78,46,'center',true)
 text(ctx,title,plan.cx,155,52,'center',true)
 if(scope)text(ctx,scope,plan.cx,211,26,'center',false,'#aec8df')
 let angle=-Math.PI/2
 for(const row of plan.rows){
  const end=angle+row.weight/100*Math.PI*2
  // No minimum angle or enlarged small slice: geometry always uses the true weight.
  ctx.beginPath();ctx.arc(plan.cx,plan.cy,plan.outer,angle,end);ctx.arc(plan.cx,plan.cy,plan.inner,end,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill()
  ctx.strokeStyle=NAVY;ctx.lineWidth=1.5;ctx.stroke();angle=end
 }
 // Percentages stay inside the annulus, including tiny holdings. Closely spaced
 // labels use an internal callout so their text never covers neighbouring values.
 const placed=polygonIndex(intersects),radius=(plan.outer+plan.inner)/2
 for(const label of [...plan.labels].sort((a,b)=>b.weight-a.weight)){
  const size=label.weight<5?32:40,rotation=label.weight<5?label.angle+(Math.cos(label.angle)<0?Math.PI:0):0
  ctx.font=`700 ${size}px Arial`
  const width=ctx.measureText(label.percentage).width+12,height=size+10
  const boxAt=a=>{
   const x=plan.cx+radius*Math.cos(a),y=plan.cy+radius*Math.sin(a)
   const c=Math.cos(rotation),s=Math.sin(rotation)
   const points=[[-width/2,-height/2],[width/2,-height/2],[width/2,height/2],[-width/2,height/2]].map(([dx,dy])=>({x:x+dx*c-dy*s,y:y+dx*s+dy*c}))
   return {x,y,points}
  }
  let at=label.angle,box=boxAt(at)
  const overlaps=b=>placed.overlaps(b.points)
  for(let step=1;overlaps(box)&&step<720;step++){
   at=label.angle+(step%2?1:-1)*Math.ceil(step/2)*.012;box=boxAt(at)
  }
  placed.add(box.points)
  const shifted=Math.abs(at-label.angle)>.001
  if(shifted){
   ctx.strokeStyle=label.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(plan.cx+(plan.outer-12)*Math.cos(label.angle),plan.cy+(plan.outer-12)*Math.sin(label.angle));ctx.lineTo(box.x,box.y);ctx.stroke()
  }
  ctx.save();ctx.translate(box.x,box.y);ctx.rotate(rotation)
  if(shifted){ctx.fillStyle=NAVY;ctx.beginPath();ctx.roundRect(-width/2,-height/2,width,height,6);ctx.fill()}
  ctx.font=`700 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=shifted?IVORY:NAVY;ctx.fillText(label.percentage,0,1);ctx.restore()
 }
 for(const label of plan.labels){
  const cos=Math.cos(label.angle),sin=Math.sin(label.angle),sign=label.anchor==='left'?1:-1
  const start={x:plan.cx+(plan.outer+6)*cos,y:plan.cy+(plan.outer+6)*sin},end={x:label.x-sign*12,y:label.y}
  ctx.strokeStyle=label.color;ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(start.x,start.y)
  if(Math.abs(end.y-start.y)>35)ctx.lineTo(plan.cx+(plan.outer+22)*cos,start.y+16*sin)
  ctx.lineTo(end.x,end.y);ctx.stroke()
  label.lines.forEach((line,i)=>text(ctx,line,label.x,label.top+label.gap*.77+i*label.gap,label.font,label.anchor))
 }
 return canvas
}
