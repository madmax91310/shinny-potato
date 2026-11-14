import { pct } from './engine.js'
import { radialDonutLayout, wrapDonutLabel } from './donut-layout.js'
const colors=['#ffd342','#3899ff','#63dfbd','#bd9eff','#ff9b70','#b7ce6e','#ec99cd','#aec8df','#50c9bc','#f2b85e','#7ba4dc','#d4a4bc','#9cd6b7','#c4bcf0','#dfd18b']
export function holdingImageRows(lines){return lines.filter(l=>l.weight>0).sort((a,b)=>b.weight-a.weight).map((l,i)=>({...l,name:l.label,color:colors[i]||`hsl(${(45+i*137.508)%360} 65% 65%)`}))}
function text(ctx,value,x,y,size=34,align='left',serif=false,color='#fff4df'){
 ctx.font=`400 ${size}px ${serif?'DcaEditorial, Georgia':'Arial'}`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(value,x,y)
}
function ring(ctx,rows,x,y,r,width){
 let angle=-Math.PI/2
 for(const row of rows){const end=angle+row.weight/100*Math.PI*2;ctx.beginPath();ctx.arc(x,y,r,angle,end);ctx.arc(x,y,r-width,end,angle,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle=end}
}
function base(canvas,title){
 const ctx=canvas.getContext('2d'),bg=ctx.createLinearGradient(0,0,canvas.width,canvas.height)
 bg.addColorStop(0,'#071b36');bg.addColorStop(1,'#092952');ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height)
 text(ctx,'Épargnant Libre',canvas.width/2,76,44,'center',true)
 ctx.fillStyle='#0d263e';ctx.strokeStyle='#23425e';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(24,116,canvas.width-48,canvas.height-140,24);ctx.fill();ctx.stroke()
 text(ctx,title,canvas.width/2,183,40,'center',true)
 return ctx
}
export function renderIndividualDonut(title,rows,{allocation=false,scope=''}={}){
 const canvas=document.createElement('canvas')
 if(allocation&&rows.length>8){
  const probe=canvas.getContext('2d');probe.font='400 32px Arial'
  const plan=radialDonutLayout(rows,value=>probe.measureText(value).width)
  canvas.width=plan.width;canvas.height=plan.height
  const ctx=base(canvas,title)
  ring(ctx,plan.rows,plan.cx,plan.cy,plan.outer,80)
  for(const label of plan.labels){
   const cos=Math.cos(label.angle),sin=Math.sin(label.angle)
   ctx.strokeStyle=label.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(plan.cx+(plan.outer+3)*cos,plan.cy+(plan.outer+3)*sin);ctx.lineTo(plan.cx+(plan.outer+30)*cos,plan.cy+(plan.outer+30)*sin);ctx.lineTo(label.x+(label.anchor==='left'?-8:label.anchor==='right'?8:0),label.anchor==='center'?(label.y>plan.cy?label.top-8:label.bottom+8):label.y);ctx.stroke()
   const start=label.top+label.font
   label.lines.forEach((line,i)=>text(ctx,line,label.x,start+i*label.gap,label.font,label.anchor))
   text(ctx,pct(label.weight),label.x,start+label.lines.length*label.gap,label.font,label.anchor)
  }
  return canvas
 }
 canvas.width=1600;canvas.height=1000
 const ctx=base(canvas,title)
 if(scope)text(ctx,scope,800,226,24,'center',false,'#aec8df')
 ring(ctx,rows,440,560,255,85)
 if(!allocation&&rows.length&&rows[0].name!=='Sans objet'){
  text(ctx,pct(rows[0].weight),440,558,48,'center',true)
  text(ctx,rows[0].name,440,605,25,'center',true)
 }
 const gap=Math.min(96,600/Math.max(rows.length,1)),top=330
 rows.forEach((row,i)=>{
  const y=top+i*gap;ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(810,y-12,8,0,Math.PI*2);ctx.fill()
  ctx.font='400 34px Arial'
  wrapDonutLabel(value=>ctx.measureText(value).width,row.name,580).forEach((line,j)=>text(ctx,line,835,y+j*39))
  text(ctx,pct(row.weight),1510,y,36,'right')
 })
 return canvas
}
