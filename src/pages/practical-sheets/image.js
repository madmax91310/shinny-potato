import { imageCopy } from './imageCopy.js'

// Approved variant 3: ivory paper, shallow relief, green criterion gutter and
// aligned cells. Every label and number is drawn live, never baked into artwork.
const C={ink:'#103728',paper:'#f8f3e8',green:'#214a37',sage:'#e4e7d3',gold:'#b49750',rule:'#cec4a9'}
const W=1600,PAD=54
export function wrapLines(ctx,text,width) {
 const lines=[]
 for(const paragraph of String(text).split('\n')){
  let line=''
  for(const word of paragraph.match(/\S+(?:[ \u00a0\u202f]+(?:%|€|M€)(?=\s|$))?/g) ?? []){
   const next=line?line+' '+word:word
   if(ctx.measureText(next).width<=width){line=next;continue}
   if(line){lines.push(line);line=''}
   // Even unusually long references wrap without disappearing or clipping.
   for(const char of word){
    if(line && ctx.measureText(line+char).width>width){lines.push(line);line=''}
    line+=char
   }
  }
  if(line)lines.push(line)
 }
 return lines
}
function font(ctx,size,weight=400,serif=false){ctx.font=`${weight} ${size}px ${serif?'Georgia, serif':'Arial, sans-serif'}`}
function block(ctx,text,width,size,weight=400,serif=false){
 font(ctx,size,weight,serif)
 const lines=wrapLines(ctx,text,width)
 return {lines,size,weight,serif,height:lines.length*size*1.24}
}
function draw(ctx,b,x,y,align='left',color=C.ink){
 font(ctx,b.size,b.weight,b.serif);ctx.textBaseline='top';ctx.textAlign=align;ctx.fillStyle=color
 b.lines.forEach((line,i)=>ctx.fillText(line,x,y+i*b.size*1.24))
}
function rectangle(ctx,x,y,w,h,fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h)}
let grain
function paper(ctx,width,height){
 rectangle(ctx,0,0,width,height,C.paper)
 if(!grain){
  const tile=document.createElement('canvas');tile.width=tile.height=96
  const g=tile.getContext('2d'),pixels=g.createImageData(96,96);let seed=78
  for(let i=0;i<pixels.data.length;i+=4){
   seed=(Math.imul(seed,1664525)+1013904223)>>>0
   const white=seed&256
   pixels.data[i]=white?255:91;pixels.data[i+1]=white?255:72;pixels.data[i+2]=white?255:34
   pixels.data[i+3]=(seed>>>24)%5
  }
  g.putImageData(pixels,0,0)
  grain=tile
 }
 ctx.fillStyle=ctx.createPattern(grain,'repeat');ctx.fillRect(0,0,width,height)
}
function relief(ctx,x,y,w,h,fill){
 const wash=ctx.createLinearGradient(x,y,x+w,y+h);wash.addColorStop(0,fill);wash.addColorStop(1,'#f5efdf')
 rectangle(ctx,x,y,w,h,wash)
 rectangle(ctx,x,y,w,2,'#ffffffaa');rectangle(ctx,x,y,2,h,'#ffffff77')
 rectangle(ctx,x+w-2,y,2,h,'#b0a58155');rectangle(ctx,x,y+h-2,w,2,'#b0a58155')
}
function corner(ctx,x,y,size,flip=false,bottom=false){
 ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);if(bottom)ctx.scale(1,-1)
 ctx.shadowColor='#7a694230';ctx.shadowBlur=8;ctx.shadowOffsetY=4
 ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(size,0);ctx.lineTo(0,size);ctx.closePath();ctx.fillStyle=C.green;ctx.fill()
 ctx.shadowBlur=0;ctx.strokeStyle=C.gold;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(size,0);ctx.lineTo(0,size);ctx.stroke();ctx.restore()
}
function cellSize(label,value,n){
 if(label==='ISIN')return 36
 if(label==='Frais annuels' && /^[\d\s,.]+ %$/.test(value))return 92
 if(/^(Frais annuels|Capital final|Encours|Titres|Plafond de versement)$/.test(label) && /^[+−\-\d\s,.]+(?:%|M€|M EUR|€|ans)?$/.test(value))return n===3?68:76
 return n===3?34:39
}
export function drawSheet(canvas,sheet){
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Impossible de créer l’image')
 const copy=imageCopy(sheet),n=copy.columns.length,usable=W-2*PAD
 if(n<1 || n>3)throw Error('La fiche doit contenir un à trois éléments')
 const gutter=n===3?230:n===2?290:360,colW=(usable-gutter)/n,inner=colW-48
 const title=block(ctx,copy.title,usable-120,n===3?86:82,700,true)
 const sub=block(ctx,copy.subtitle,usable-110,37,400,true)
 const tableY=64+title.height+(sub.height?24+sub.height:0)+55
 const heads=copy.columns.map((name,i)=>({name:block(ctx,name,inner,n===3?49:58,700,true),ticker:block(ctx,copy.tickers[i],inner,65,700,true)}))
 const headerH=Math.max(145,...heads.map(h=>h.name.height+(h.ticker.height?h.ticker.height+25:0)+64))
 const rows=copy.rows.map(row=>{
  const label=block(ctx,row[0],gutter-44,31,700,true)
  const cells=row.slice(1).map(value=>{
   let size=cellSize(row[0],value,n)
   // Numeric values keep a single line whenever possible; source precision and
   // units are preserved, with no extrapolation or currency conversion.
   if(size>40){font(ctx,size,700,true);while(ctx.measureText(value).width>inner&&size>42){size--;font(ctx,size,700,true)}}
   return block(ctx,value,inner,size,size>40?700:400,size>40 || row[0]==='ISIN')
  })
  return {label,cells,height:Math.max(126,label.height+56,...cells.map(b=>b.height+56))}
 })
 const footer=block(ctx,copy.caption,usable-350,29,400,true)
 const natural=tableY+headerH+rows.reduce((sum,r)=>sum+r.height,0)+footer.height+148
 const H=Math.ceil(Math.max(n===1?1280:1600,natural))
 const extra=(H-natural)/Math.max(1,rows.length)
 rows.forEach(row=>{row.height+=extra})
 const tableH=headerH+rows.reduce((sum,r)=>sum+r.height,0)
 canvas.width=W;canvas.height=H
 paper(ctx,W,H);corner(ctx,0,0,100);corner(ctx,W,0,100,true);corner(ctx,W,H,80,true,true)
 draw(ctx,title,W/2,64,'center')
 if(sub.height)draw(ctx,sub,W/2,64+title.height+24,'center')
 ctx.save();ctx.shadowColor='#725d3433';ctx.shadowBlur=17;ctx.shadowOffsetY=10
 rectangle(ctx,PAD,tableY,usable,tableH,'#fffaf0');ctx.restore()
 // Green labels on the left, pale raised product headers above the shared grid.
 rectangle(ctx,PAD,tableY,gutter,tableH,C.green)
 heads.forEach((head,i)=>{
  const x=PAD+gutter+i*colW,center=x+colW/2
  relief(ctx,x,tableY,colW,headerH,C.sage)
  const contentH=head.name.height+(head.ticker.height?head.ticker.height+25:0)
  const y=tableY+(headerH-contentH)/2
  draw(ctx,head.name,center,y,'center')
  if(head.ticker.height){
   const by=y+head.name.height+20
   rectangle(ctx,x+25,by,colW-50,head.ticker.height+10,C.green)
   draw(ctx,head.ticker,center,by+5,'center',C.paper)
  }
 })
 let y=tableY+headerH
 rows.forEach(row=>{
  rectangle(ctx,PAD,y,usable,1.5,C.gold)
  draw(ctx,row.label,PAD+22,y+(row.height-row.label.height)/2,'left',C.paper)
  rectangle(ctx,PAD+22,y+row.height-25,52,2,C.gold)
  row.cells.forEach((cell,i)=>{
   const x=PAD+gutter+i*colW
   relief(ctx,x,y,colW,row.height,i%2?'#f9f5eb':'#faf7ee')
   draw(ctx,cell,n===1?x+24:x+colW/2,y+(row.height-cell.height)/2,n===1?'left':'center')
  })
  y+=row.height
 })
 const footerY=H-59-Math.max(0,footer.lines.length-1)*footer.size*1.24
 if(footer.height)draw(ctx,footer,PAD,footerY)
 const signature=block(ctx,'Épargnant Libre',usable,32,400,true)
 draw(ctx,signature,W-PAD,H-59,'right')
 return {width:W,height:H}
}
