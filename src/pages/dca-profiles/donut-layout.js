// Alternate large and small slices to spread small holdings around the ring.
// Drawing order changes; financial weights and classification never do.
export function balancedDonutRows(rows) {
 const sorted=rows.filter(row=>row.weight>0).map((row,index)=>({...row,index})).sort((a,b)=>b.weight-a.weight||a.index-b.index)
 const result=[]
 for(let left=0,right=sorted.length-1;left<=right;left++,right--){result.push(sorted[left]);if(left<right)result.push(sorted[right])}
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
// Remove legal share-class boilerplate, retaining the index and strategy.
export function shortDonutName(value) {
 const original=String(value),isEtf=/\bETF\b/i.test(original)
 const name=original.replace(/\b(?:iShares|Xtrackers|WisdomTree|State Street|SPDR|BNP Paribas Easy|Amundi|Vanguard|Invesco|Core)\b/gi,'').replace(/\bUCITS ETF\b/gi,'').replace(/\bETF\b/gi,'').replace(/\b(?:USD|EUR|Acc|Dist|1C|Advanced)\b/gi,'').replace(/[()]/g,'').replace(/Consumer Staples Sector/gi,'consommation de base').replace(/Consumer Discretionary Sector/gi,'consommation discrétionnaire').replace(/Energy Sector/gi,'énergie').replace(/Artificial Intelligence and Big Data/gi,'IA et Big Data').replace(/Automation & Robotics/gi,'robotique').replace(/Cloud Computing/gi,'cloud').replace(/Emerging Markets/gi,'émergents').replace(/Small Cap\b/gi,'Small Caps').replace(/Minimum Volatility/gi,'Min Volatility').replace(/Weighted/gi,'').replace(/\s+/g,' ').trim()
 return name ? `${isEtf?'ETF ':''}${name}` : original
}
export function radialDonutLayout(rows,measure) {
 const ordered=balancedDonutRows(rows),cx=800,outer=330,font=32,gap=38
 let angle=-Math.PI/2
 const labels=ordered.map(row=>{
  const mid=angle+row.weight/100*Math.PI;angle+=row.weight/100*Math.PI*2
  const anchor=Math.cos(mid)>=0?'left':'right',x=anchor==='left'?1200:400
  const lines=wrapDonutLabel(measure,shortDonutName(row.name),350)
  const width=Math.max(...lines.map(measure),measure(`${Number(row.weight.toFixed(2))} %`)),height=(lines.length+1)*gap
  return {...row,angle:mid,lines,x,anchor,left:anchor==='left'?x:x-width,right:anchor==='left'?x+width:x,height,font,gap}
 })
 const sides=['left','right'].map(anchor=>labels.filter(l=>l.anchor===anchor).sort((a,b)=>Math.sin(a.angle)-Math.sin(b.angle)))
 const contentHeight=Math.max(800,...sides.map(side=>side.reduce((sum,l)=>sum+l.height+28,0)-28))
 const cy=260+contentHeight/2
 for(const side of sides){
  const occupied=side.reduce((sum,l)=>sum+l.height+28,0)-28
  let y=260+(contentHeight-occupied)/2
  for(const label of side){label.top=y;label.bottom=y+label.height;label.y=y+label.height/2;y=label.bottom+28}
 }
 return {width:1600,height:Math.ceil(330+contentHeight),cx,cy,outer,labels,rows:ordered}
}
