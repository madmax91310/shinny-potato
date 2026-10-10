// Exact vector-like layout drawn from the same model as the tweet. No generated data.
const ink='#183d36',green='#267863',muted='#526961',paper='#f6f3e9'
export function wrapLines(ctx,text,width) {
 const lines=[]
 for(const paragraph of String(text).split('\n')) {
  let line=''
  for(const word of paragraph.split(/\s+/)) {
   const next=line?line+' '+word:word
   if(ctx.measureText(next).width>width && line) {lines.push(line);line=word} else line=next
  }
  lines.push(line)
 }
 return lines
}
function write(ctx,text,x,y,width,size=32,color=ink,weight=400) {
 ctx.font=`${weight} ${size}px Arial, sans-serif`;ctx.fillStyle=color
 const lines=wrapLines(ctx,text,width)
 lines.forEach((line,i)=>ctx.fillText(line,x,y+i*size*1.28))
 return lines.length*size*1.28
}
export function drawSheet(canvas,sheet) {
 const ctx=canvas.getContext('2d'),W=1600,pad=86,usable=W-pad*2,n=sheet.columns.length
 const labelW=n===1?360:260,colW=(usable-labelW)/n
 const size=n===3?30:34
 ctx.font=`400 ${size}px Arial`
 const heights=sheet.rows.map(row=>Math.max(100,...row.map((cell,i)=>wrapLines(ctx,cell,(i===0?labelW:colW)-40).length*size*1.28+42)))
 ctx.font='700 74px Arial'
 const titleLines=wrapLines(ctx,sheet.title,usable)
 ctx.font='600 35px Arial'
 const takeLines=wrapLines(ctx,sheet.takeaway,usable-60)
 const notes=sheet.notes.join(' ')
 ctx.font='400 25px Arial'
 const noteLines=wrapLines(ctx,notes,usable)
 ctx.font=`700 ${size}px Arial`
 const headHeight=Math.max(108,...sheet.columns.map(c=>wrapLines(ctx,c,colW-40).length*size*1.28+40))
 const tableTop=130+titleLines.length*95+42
 const H=Math.max(1400,tableTop+headHeight+heights.reduce((a,b)=>a+b,0)+takeLines.length*45+noteLines.length*32+280)
 canvas.width=W;canvas.height=Math.ceil(H)
 ctx.fillStyle=paper;ctx.fillRect(0,0,W,H)
 // Offset paper edge and restrained geometric marks, behind information only.
 ctx.fillStyle='#e1e8d9';ctx.fillRect(W-36,0,36,H)
 ctx.fillStyle=green;ctx.fillRect(pad,56,130,9)
 write(ctx,'ÉPARGNANT LIBRE',pad+150,68,usable-150,25,muted,700)
 write(ctx,sheet.title,pad,160,usable,74,ink,700)
 let y=tableTop
 ctx.fillStyle=ink;ctx.fillRect(pad,y,usable,headHeight)
 write(ctx,sheet.rowLabel ?? 'À comparer',pad+20,y+48,labelW-40,size,'#ffffff',700)
 sheet.columns.forEach((c,i)=>write(ctx,c,pad+labelW+i*colW+20,y+48,colW-40,size,'#ffffff',700))
 y+=headHeight
 sheet.rows.forEach((row,r)=>{
  ctx.fillStyle=r%2?'#ecefE4':'#fffdf6';ctx.fillRect(pad,y,usable,heights[r])
  row.forEach((cell,i)=>write(ctx,cell,pad+(i===0?0:labelW+(i-1)*colW)+20,y+45,(i===0?labelW:colW)-40,size,ink,i===0?700:400))
  y+=heights[r]
  ctx.fillStyle='#c9d3c6';ctx.fillRect(pad,y-1,usable,1)
 })
 y+=35
 const takeHeight=takeLines.length*45+44
 ctx.fillStyle='#dde9d8';ctx.fillRect(pad,y,usable,takeHeight)
 write(ctx,sheet.takeaway,pad+26,y+49,usable-52,35,ink,600)
 y+=takeHeight+45
 write(ctx,notes,pad,y,usable,25,muted)
 const labels=[...new Set(sheet.sources.map(s=>s.label.split(' · ')[0]))].slice(0,4).join(' · ')
 write(ctx,`Sources : ${labels}`,pad,H-78,usable-280,23,muted)
 write(ctx,'Pas un conseil financier',W-365,H-35,300,20,muted)
 return {width:W,height:Math.ceil(H)}
}
