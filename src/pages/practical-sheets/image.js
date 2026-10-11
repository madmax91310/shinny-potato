import { imageCopy } from './imageCopy.js'

// Dynamic canvas version of the approved dark, mint and gold composition.
// All figures, rows, sources and notes come from the existing sheet model.
const ink='#fffaf0', muted='#bed1c8', background='#071b14'
const accents=['#a3f3ba','#ffcf66','#a9cffa']
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
function font(ctx,size,weight=400,serif=false) {ctx.font=`${weight} ${size}px ${serif?'Georgia':'Arial'}, sans-serif`}
function measure(ctx,text,width,size,weight=400,serif=false) {
 font(ctx,size,weight,serif)
 return wrapLines(ctx,text,width).length*size*1.28
}
function write(ctx,text,x,y,width,size=38,color=ink,weight=400,center=false,serif=false) {
 font(ctx,size,weight,serif);ctx.fillStyle=color;ctx.textAlign=center?'center':'left';ctx.textBaseline='top'
 const lines=wrapLines(ctx,text,width)
 lines.forEach((line,i)=>ctx.fillText(line,center?x+width/2:x,y+i*size*1.28))
 return lines.length*size*1.28
}
function rounded(ctx,x,y,w,h,r,fill,stroke) {
 ctx.beginPath();ctx.roundRect(x,y,w,h,r)
 if(fill){ctx.fillStyle=fill;ctx.fill()}
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}
}
function icon(ctx,label,x,y,color) {
 ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3
 ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.stroke()
 if(/frais|coût|capital|versement|revenu|rendement|prix|économie/i.test(label)) {
  for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(-12+i*11,9-i*9,13,5,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(-25+i*11,9-i*9);ctx.lineTo(-25+i*11,19-i*9);ctx.ellipse(-12+i*11,19-i*9,13,5,0,0,Math.PI);ctx.lineTo(1+i*11,9-i*9);ctx.stroke()}
 } else if(/supports|exposition|pays|secteur|indice|titres|performance|écart|hausse|baisse/i.test(label)) {
  for(let i=0;i<3;i++) ctx.strokeRect(-22+i*16,16-i*10,10,9+i*10)
 } else {
  ctx.strokeRect(-17,-23,34,46)
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-9,-9+i*10);ctx.lineTo(9,-9+i*10);ctx.stroke()}
 }
 ctx.restore()
}
export function drawSheet(canvas,sheet) {
 const ctx=canvas.getContext('2d'), W=1600,pad=80,usable=W-pad*2,copy=imageCopy(sheet),n=copy.columns.length
 const gap=68,colW=(usable-gap*(n-1))/n,iconSpace=n===3?0:105
 const bodySize=n===3?32:40,labelSize=n===3?28:32,bodyW=colW-iconSpace-28
 const titleSize=sheet.id==='pea-cto'?146:82
 const titleH=measure(ctx,copy.title,usable,titleSize,700,true)
 const subtitleH=measure(ctx,copy.subtitle,usable-120,39,400,true)
 const tableTop=130+titleH+32+subtitleH+70
 const headSize=n===3?38:n===1?52:64
 const headH=Math.max(125,...copy.columns.map(c=>measure(ctx,c,colW-60,headSize,700,true)+42))
 const rowHeights=copy.rows.map(row=>Math.max(142,...copy.columns.map((_,i)=>measure(ctx,row[0].toUpperCase(),bodyW,labelSize,700)+18+measure(ctx,row[i+1],bodyW,bodySize)+42)))
 const tableH=headH+42+rowHeights.reduce((a,b)=>a+b,0)
 const takeTitleH=measure(ctx,copy.takeawayTitle,usable-80,52,700,true)
 const takeH=takeTitleH+20+measure(ctx,copy.takeaway,usable-130,39,400,true)+70
 const notes=sheet.notes.join(' ')
 const noteH=notes?measure(ctx,notes,usable-30,26)+24:0
 const labels=[...new Set(sheet.sources.map(s=>s.label.split(' · ')[0]))].slice(0,4).join(' · ')
 const sourceText=`Sources : ${labels}`
 const sourceH=measure(ctx,sourceText,usable,24)
 const H=Math.max(2000,tableTop+tableH+45+takeH+34+noteH+sourceH+95)
 canvas.width=W;canvas.height=Math.ceil(H)
 ctx.fillStyle=background;ctx.fillRect(0,0,W,H)
 // Restrained graphic edges, matching the approved image.
 for(const [x,color] of [[-125,'#326649'],[W+125,'#8e7030']]) {ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,225,195,0,Math.PI*2);ctx.fill()}
 write(ctx,'É P A R G N A N T   L I B R E',pad,42,usable,29,ink,600,true)
 ctx.fillStyle=accents[0];ctx.fillRect(W/2-50,100,100,4)
 if(sheet.id==='pea-cto') {
  font(ctx,titleSize,700,true);const parts=[['PEA',accents[0]],[' ou ',ink],['CTO',accents[1]],[' ?',ink]]
  let x=(W-parts.reduce((sum,[t])=>sum+ctx.measureText(t).width,0))/2
  ctx.textAlign='left';ctx.textBaseline='top'
  for(const [text,color] of parts){ctx.fillStyle=color;ctx.fillText(text,x,130);x+=ctx.measureText(text).width}
 } else write(ctx,copy.title,pad,130,usable,titleSize,ink,700,true,true)
 write(ctx,copy.subtitle,pad+60,130+titleH+32,usable-120,39,ink,400,true,true)
 copy.columns.forEach((column,i)=>{
  const x=pad+i*(colW+gap),color=accents[i]
  rounded(ctx,x,tableTop,colW,headH,headH/2,color)
  const h=measure(ctx,column,colW-60,headSize,700,true)
  write(ctx,column,x+30,tableTop+(headH-h)/2,colW-60,headSize,background,700,true,true)
  let y=tableTop+headH+42
  copy.rows.forEach((row,r)=>{
   if(iconSpace) icon(ctx,row[0],x+42,y+44,color)
   const contentX=x+iconSpace
   const labelH=write(ctx,row[0].toUpperCase(),contentX,y,bodyW,labelSize,color,700)
   write(ctx,row[i+1],contentX,y+labelH+18,bodyW,bodySize,ink)
   y+=rowHeights[r]
  })
  if(i<n-1){ctx.fillStyle='#36584a';ctx.fillRect(x+colW+gap/2,tableTop+headH+42,2,tableH-headH-42)}
 })
 let y=tableTop+tableH+45
 rounded(ctx,pad,y,usable,takeH,54,'#102d21','#36584a')
 write(ctx,copy.takeawayTitle,pad+40,y+30,usable-80,52,accents[0],700,true,true)
 write(ctx,copy.takeaway,pad+65,y+30+takeTitleH+20,usable-130,39,ink,400,true,true)
 y+=takeH+34
 if(notes){write(ctx,notes,pad+15,y,usable-30,26,muted,400,true);y+=noteH}
 write(ctx,sourceText,pad,y,usable,24,muted,400,true)
 write(ctx,'Pas un conseil financier',pad,H-46,usable,24,ink,400,true)
 return {width:W,height:Math.ceil(H)}
}
