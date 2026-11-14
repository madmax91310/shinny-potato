// Alternate large and small slices to spread small holdings around the ring.
// Drawing order changes; financial weights and classification never do.
export function balancedDonutRows(rows) {
 const sorted=rows.filter(row=>row.weight>0).map((row,index)=>({...row,index})).sort((a,b)=>b.weight-a.weight||a.index-b.index)
 const result=[]
 while(sorted.length){result.push(sorted.shift());if(sorted.length)result.push(sorted.pop())}
 return result
}
export function wrapDonutLabel(measure,value,width) {
 const lines=[];let line=''
 for(const word of String(value).split(/\s+/)){
  if(line&&measure(`${line} ${word}`)>width){lines.push(line);line=''}
  for(const char of (line?' ':'')+word){if(line&&measure(line+char)>width){lines.push(line);line=''}line+=char}
 }
 if(line)lines.push(line)
 return lines
}
const intersects=(a,b)=>a.left<b.right+8&&a.right+8>b.left&&a.top<b.bottom+12&&a.bottom+12>b.top
export function radialDonutLayout(rows,measure) {
 const ordered=balancedDonutRows(rows),cx=600,outer=292,font=32,gap=38
 let angle=-Math.PI/2
 const items=ordered.map(row=>{const mid=angle+row.weight/100*Math.PI;angle+=row.weight/100*Math.PI*2;return {...row,angle:mid,lines:wrapDonutLabel(measure,row.name,230)}})
 const top=items.reduce((best,row)=>Math.sin(row.angle)<Math.sin(best.angle)?row:best,items[0])
 const bottom=items.reduce((best,row)=>Math.sin(row.angle)>Math.sin(best.angle)?row:best,items[0])
 const cy=670
 const labels=items.map(row=>{
  const cos=Math.cos(row.angle),sin=Math.sin(row.angle),anchor=row===top||row===bottom?'center':cos>0?'left':'right'
  const x=cx+(outer+52)*cos,y=cy+390*sin
  const width=Math.max(...row.lines.map(measure),measure(`${Number(row.weight.toFixed(2))} %`)),height=(row.lines.length+1)*gap
  const left=anchor==='center'?x-width/2:anchor==='right'?x-width:x
  return {...row,x,y,anchor,left,right:left+width,top:y-height/2,bottom:y+height/2,height,font,gap}
 })
 // Spread nearby labels along their side, without changing slice geometry.
 for(let pass=0;pass<200;pass++){
  let moved=false
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
   const a=labels[i],b=labels[j]
   if(!intersects(a,b))continue
   const upper=a.y<b.y?a:b,lower=upper===a?b:a
   const delta=(upper.bottom-lower.top+14)/2
   upper.y-=delta;upper.top-=delta;upper.bottom-=delta
   lower.y+=delta;lower.top+=delta;lower.bottom+=delta;moved=true
  }
  if(!moved)break
 }
 const shift=Math.max(0,245-Math.min(...labels.map(l=>l.top)))
 labels.forEach(label=>{label.y+=shift;label.top+=shift;label.bottom+=shift})
 return {width:1200,height:Math.ceil(Math.max(cy+shift+outer+100,...labels.map(l=>l.bottom+70))),cx,cy:cy+shift,outer,labels,rows:ordered}
}
