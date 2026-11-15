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
// Remove legal share-class boilerplate, retaining the index and strategy.
export function shortDonutName(value) {
 const original=String(value),isEtf=/\bETF\b/i.test(original)
 if(!isEtf)return original
 const name=original.replace(/\b(?:iShares|Xtrackers|WisdomTree|State Street|SPDR|BNP Paribas Easy|Amundi|Vanguard|Invesco|Core)\b/gi,'').replace(/\bUCITS ETF\b/gi,'').replace(/\bETF\b/gi,'').replace(/\b(?:USD|EUR|Acc|Dist|1C|Advanced)\b/gi,'').replace(/[()]/g,'').replace(/Consumer Staples Sector/gi,'consommation de base').replace(/Consumer Discretionary Sector/gi,'consommation discrétionnaire').replace(/Energy Sector/gi,'énergie').replace(/Artificial Intelligence and Big Data/gi,'IA et Big Data').replace(/Automation & Robotics/gi,'robotique').replace(/Cloud Computing/gi,'cloud').replace(/Emerging Markets/gi,'émergents').replace(/Small Cap\b/gi,'Small Caps').replace(/Minimum Volatility/gi,'Min Volatility').replace(/Weighted/gi,'').replace(/Min Volatility/gi,'Min Vol.').replace(/consommation de base/gi,'conso. de base').replace(/Equal Weight/gi,'équipondéré').replace(/\s+/g,' ').trim()
 return name ? `${isEtf?'ETF ':''}${name}` : original
}
export function radialDonutLayout(rows,measure) {
 const ordered=balancedDonutRows(rows),cx=950,outer=520,inner=240,font=34,gap=41
 let angle=-Math.PI/2
 const labels=ordered.map(row=>{
  const mid=angle+row.weight/100*Math.PI;angle+=row.weight/100*Math.PI*2
  const anchor=Math.cos(mid)>=0?'left':'right',lines=wrapDonutLabel(measure,shortDonutName(row.name),310)
  return {...row,angle:mid,lines,anchor,height:lines.length*gap,width:Math.max(...lines.map(measure)),font,gap}
 })
 const sides=['left','right'].map(anchor=>labels.filter(l=>l.anchor===anchor).sort((a,b)=>Math.sin(a.angle)-Math.sin(b.angle)))
 const span=Math.max(1245,...sides.map(side=>side.reduce((sum,l)=>sum+l.height+14,0)-14)),height=Math.ceil(315+span),cy=(245+height-70)/2,vertical=Math.max(575,(span-80)/2)
 for(const side of sides){
  let bottom=245
  for(const l of side){l.y=Math.max(cy+vertical*Math.sin(l.angle),bottom+l.height/2);bottom=l.y+l.height/2+14}
  let top=height-70
  for(const l of [...side].reverse()){l.y=Math.min(l.y,top-l.height/2);top=l.y-l.height/2-14}
  for(const l of side){
   const dy=Math.max(-555,Math.min(555,(l.y-cy)*575/vertical)),sign=l.anchor==='left'?1:-1
   l.x=cx+sign*(Math.sqrt(Math.max(0,575**2-dy**2))+18)
   l.left=sign>0?l.x:l.x-l.width;l.right=l.left+l.width;l.top=l.y-l.height/2;l.bottom=l.top+l.height
  }
 }
 return {width:1900,height,cx,cy,outer,inner,labels,rows:ordered}
}
