import { integerPercentages, exposurePercentage } from './image.js'
import { radialDonutLayout, wrapDonutLabel, shortDonutName, holdingColor, holdingPercentage } from './donut-layout.js'
export function holdingImageRows(lines){return lines.filter(l=>l.weight>0).sort((a,b)=>b.weight-a.weight).map((l,i)=>({...l,name:shortDonutName(l.label),color:holdingColor(i)}))}
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
 text(ctx,title,canvas.width/2,183,54,'center',true)
 return ctx
}
export function renderIndividualDonut(title,rows,{allocation=false,scope=''}={}){
 const canvas=document.createElement('canvas')
 if(allocation){
  const probe=canvas.getContext('2d');probe.font='400 46px Arial'
  const plan=radialDonutLayout(rows,value=>probe.measureText(value).width)
  // A dense legend is more legible than metre-long crossing leaders. Keep every holding.
  if(plan.height>1800||rows.length>18)return renderLegendDonut(title,rows,{allocation:true})
  canvas.width=plan.width;canvas.height=plan.height
  const ctx=canvas.getContext('2d');ctx.fillStyle='#071d36';ctx.fillRect(0,0,plan.width,plan.height)
  text(ctx,'Épargnant Libre',plan.cx,83,46,'center',true)
  text(ctx,title,plan.cx,167,54,'center',true)
  let angle=-Math.PI/2
  for(const row of plan.rows){
   const end=angle+row.weight/100*Math.PI*2,pad=Math.min(.003,(end-angle)/8)
   ctx.beginPath();ctx.arc(plan.cx,plan.cy,plan.outer,angle+pad,end-pad);ctx.arc(plan.cx,plan.cy,plan.inner,end-pad,angle+pad,true);ctx.closePath();ctx.fillStyle=row.color;ctx.fill();angle=end
  }
  for(const label of plan.labels){
   const cos=Math.cos(label.angle),sin=Math.sin(label.angle),r=(plan.outer+plan.inner)/2
   const inRing=label.weight>=5
   if(inRing){ctx.save();ctx.translate(plan.cx+r*cos,plan.cy+r*sin)
   if(label.weight<8){let rotation=label.angle;if(cos<0)rotation+=Math.PI;ctx.rotate(rotation)}
   ctx.font=`700 ${label.weight<8?32:44}px Arial`;ctx.textAlign='center';ctx.fillStyle='#071d36';ctx.fillText(holdingPercentage(label.weight).replace(label.weight<8?' ':'',''),0,10);ctx.restore()}
   ctx.strokeStyle=label.color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(plan.cx+(plan.outer+5)*cos,plan.cy+(plan.outer+5)*sin);ctx.lineTo(plan.cx+(plan.outer+25)*cos,plan.cy+(plan.outer+25)*sin);ctx.lineTo(label.x+(label.anchor==='left'?-10:10),plan.cy+(plan.outer+25)*sin);ctx.lineTo(label.x+(label.anchor==='left'?-10:10),label.y);ctx.stroke()
   label.lines.forEach((line,i)=>text(ctx,line,label.x,label.top+43+i*label.gap,label.font,label.anchor))
  }
  return canvas
 }

 return renderLegendDonut(title,rows,{allocation,scope})
}
function renderLegendDonut(title,rows,{allocation=false,scope=''}={}){
 const canvas=document.createElement('canvas')
 canvas.width=1600
 const measure=canvas.getContext('2d');measure.font='400 46px Arial'
 const layout=rows.map(row=>{const lines=wrapDonutLabel(value=>measure.measureText(value).width,row.name,allocation?1160:520);return {...row,lines,height:Math.max(96,lines.length*55+28)}})
 const totalHeight=layout.reduce((sum,row)=>sum+row.height,0)
 canvas.height=Math.max(1000,(allocation?900:330)+totalHeight+50)
 const ctx=base(canvas,title),cy=allocation?520:330+totalHeight/2
 if(scope)text(ctx,scope,800,226,24,'center',false,'#aec8df')
 const rounded=integerPercentages(rows)
 ring(ctx,rows,allocation?800:440,cy,255,85)
 if(!allocation&&rows.length&&rows[0].name!=='Sans objet'){
  text(ctx,exposurePercentage(rows[0].weight,rounded[0]),440,cy-2,48,'center',true)
  text(ctx,rows[0].name,440,cy+45,25,'center',true)
 }
 let y=allocation?900:330
 for(const [i,row] of layout.entries()){
  ctx.fillStyle=row.color;ctx.beginPath();ctx.arc(allocation?100:810,y-12,8,0,Math.PI*2);ctx.fill()
  row.lines.forEach((line,j)=>text(ctx,line,allocation?125:835,y+j*55,46))
  text(ctx,allocation?holdingPercentage(row.weight):exposurePercentage(row.weight,rounded[i]),1510,y,46,'right')
  y+=row.height
 }
 return canvas
}

