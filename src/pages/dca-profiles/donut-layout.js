export const holdingPercentage = n => n>0&&n<.01?'< 0,01 %':`${n.toLocaleString('fr-FR',{maximumFractionDigits:2})} %`
export const holdingColor = i => ['#ffd342','#3899ff','#63dfbd','#bd9eff','#ff9b70','#b7ce6e','#ec99cd','#aec8df','#50c9bc','#f2b85e','#7ba4dc','#d4a4bc','#9cd6b7','#c4bcf0','#dfd18b'][i] || `hsl(${(45+i*137.508)%360} 65% 65%)`
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
 if(!isEtf)return original
 const name=original.replace(/\b(?:iShares|Xtrackers|WisdomTree|State Street|SPDR|BNP Paribas Easy|Amundi|Vanguard|Invesco|Core)\b/gi,'').replace(/\bUCITS ETF\b/gi,'').replace(/\bETF\b/gi,'').replace(/\b(?:USD|EUR|Acc|Dist|1C|Advanced)\b/gi,'').replace(/[()]/g,'').replace(/Consumer Staples Sector/gi,'consommation de base').replace(/Consumer Discretionary Sector/gi,'consommation discrétionnaire').replace(/Energy Sector/gi,'énergie').replace(/Artificial Intelligence and Big Data/gi,'IA et Big Data').replace(/Automation & Robotics/gi,'robotique').replace(/Cloud Computing/gi,'cloud').replace(/Emerging Markets/gi,'émergents').replace(/Small Cap\b/gi,'Small Caps').replace(/Minimum Volatility/gi,'Min Volatility').replace(/Weighted/gi,'').replace(/Min Volatility/gi,'Min Vol.').replace(/consommation de base/gi,'conso. de base').replace(/Equal Weight/gi,'équipondéré').replace(/\s+/g,' ').trim()
 return name ? `${isEtf?'ETF ':''}${name}` : original
}
// Individual PNGs share this palette; the combined editorial image keeps its theme.
export const individualColor = i => ['#f4c542','#2864dc','#35c9ae','#ad61c4','#f49a45','#c0d45b','#d84e88','#a9c9e8','#37b7c6','#e8ad62','#7e9ce4','#eb8d85','#8bd4b3','#bda5e7','#e3d3a0','#91b771','#dc79b1','#91b9df'][i] || `hsl(${(45+i*137.508)%360} 55% 62%)`
export const INDIVIDUAL_LABEL_FONT = 56
export function radialDonutLayout(rows,measure) {
 const ordered=balancedDonutRows(rows),font=INDIVIDUAL_LABEL_FONT,gap=66,labelWidth=460
 let angle=-Math.PI/2
 const labels=ordered.map(row=>{
  const mid=angle+row.weight/100*Math.PI;angle+=row.weight/100*Math.PI*2
  const anchor=Math.cos(mid)>=0?'left':'right',lines=wrapDonutLabel(measure,shortDonutName(row.name),labelWidth)
  return {...row,angle:mid,lines,anchor,height:lines.length*gap,width:Math.max(0,...lines.map(measure)),font,gap}
 })
 const sides=['left','right'].map(anchor=>labels.filter(l=>l.anchor===anchor).sort((a,b)=>Math.sin(a.angle)-Math.sin(b.angle)))
 const span=Math.max(1000,...sides.map(side=>side.reduce((sum,l)=>sum+l.height+18,0)-18))
 // Expand geometry for dense/long portfolios instead of shrinking names or hiding holdings.
 const outer=Math.max(460,(span-80)/2),inner=outer-240,cx=outer+labelWidth+80
 const width=Math.ceil(cx*2),height=Math.ceil(320+span),cy=270+span/2,vertical=outer+34
 for(const side of sides){
  let bottom=270
  for(const l of side){l.y=Math.max(cy+vertical*Math.sin(l.angle),bottom+l.height/2);bottom=l.y+l.height/2+18}
  let top=height-50
  for(const l of [...side].reverse()){l.y=Math.min(l.y,top-l.height/2);top=l.y-l.height/2-18}
  for(const l of side){
   const sign=l.anchor==='left'?1:-1
   const nearest=Math.max(0,Math.abs(l.y-cy)-l.height/2)
   const edge=Math.sqrt(Math.max(0,(outer+22)**2-nearest**2))
   l.x=cx+sign*Math.max(edge+18,Math.abs((outer+22)*Math.cos(l.angle))+25)
   l.left=sign>0?l.x:l.x-l.width;l.right=l.left+l.width;l.top=l.y-l.height/2;l.bottom=l.top+l.height
  }
 }
 return {width,height,cx,cy,outer,inner,labels,rows:ordered}
}
