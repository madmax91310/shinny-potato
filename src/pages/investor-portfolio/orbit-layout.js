import {leaderPath} from './leader-layout.js'
import widths from './type-metrics.json' with {type:'json'}
export const POSTER={cx:540,cy:720,outer:380,inner:185,badgeRadius:50,badgeOrbit:400,top:202,bottom:1244}
export const measure=(s,size)=>[...String(s)].reduce((n,c)=>n+(widths[c]??.7),0)*size+4
export function wordLines(value,width,size=36) {
  const lines=[];let line=''
  for(const word of String(value).split(/\s+/)) {
    if(measure(word,size)>width)return null
    if(line && measure(line+' '+word,size)>width){lines.push(line);line=''}
    line=line?line+' '+word:word
  }
  if(line)lines.push(line)
  return lines.length<=2?lines:null
}
const clash=(a,b,gap=20)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b))
const delta=a=>Math.atan2(Math.sin(a),Math.cos(a))
function circleClash(box,x,y,r){return Math.hypot(x-clamp(x,box.x,box.x+box.width),y-clamp(y,box.y,box.y+box.height))<r}
export function arrangeOrbit(rows,start,_currency,top=POSTER.top) {
  const {cx,cy,outer,badgeRadius:br,badgeOrbit:r}=POSTER
  let angle=start
  const entries=rows.map(row=>{const e={...row,start:angle,end:angle+row.weight*Math.PI*2,mid:angle+row.weight*Math.PI};angle=e.end;return e})
  const min=2*Math.asin((br*2+10)/(2*r)),shift=.65
  // Allow modest angular displacement of annotations, without changing sectors.
  // Start after the largest angular gap; this opens the circular ordering at
  // its uncongested edge, without changing any sector or security weight.
  const mids=entries.map(e=>((e.mid%(2*Math.PI))+2*Math.PI)%(2*Math.PI)).sort((a,b)=>a-b)
  const gaps=mids.map((a,i)=>(mids[(i+1)%mids.length]+(i===mids.length-1?2*Math.PI:0))-a)
  const begin=mids[(gaps.indexOf(Math.max(...gaps))+1)%mids.length]
  const order=[...entries].sort((a,b)=>((a.mid-begin+8*Math.PI)%(2*Math.PI))-((b.mid-begin+8*Math.PI)%(2*Math.PI)))
  const native=order.map(e=>begin+((e.mid-begin+8*Math.PI)%(2*Math.PI))),lo=[],hi=[]
  for(let i=0;i<order.length;i++)lo[i]=Math.max(native[i]-shift,i?lo[i-1]+min:-Infinity)
  for(let i=order.length-1;i>=0;i--)hi[i]=Math.min(native[i]+shift,i<order.length-1?hi[i+1]-min:Infinity)
  if(lo.some((v,i)=>v>hi[i]))return null
  for(let i=0;i<order.length;i++) {
    const a=Math.max(clamp(native[i],lo[i],hi[i]),i?order[i-1].badgeAngle+min:-Infinity)
    order[i].badgeAngle=a;order[i].badge={x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r,radius:br}
  }
  if(order.length>1 && order[0].badgeAngle+2*Math.PI-order.at(-1).badgeAngle<min)return null
  const candidates=entries.map(e=>{
    const result=[]
    for(const width of [220,180,150,260,130]) {
      const lines=wordLines(e.label,width)
      if(!lines)continue
      const w=Math.max(...lines.map(s=>measure(s,36))),h=lines.length*40
      for(const turn of [0,-.12,.12,-.24,.24,-.38,.38,-.55,.55])for(const extra of [0,25,50,80]) {
        const a=e.badgeAngle+turn,c=Math.cos(a),s=Math.sin(a)
        const reach=r+br+9+Math.abs(c)*w/2+Math.abs(s)*h/2+extra
        const box={x:clamp(cx+c*reach-w/2,20,1060-w),y:clamp(cy+s*reach-h/2,top,POSTER.bottom-h),width:w,height:h,lines}
        const px=clamp(e.badge.x,box.x,box.x+w),py=clamp(e.badge.y,box.y,box.y+h)
        const distance=Math.hypot(px-e.badge.x,py-e.badge.y)-br
        if(distance<7||distance>170||circleClash(box,cx,cy,outer+5)||entries.some(o=>circleClash(box,o.badge.x,o.badge.y,br+3)))continue
        box.angle=e.mid+delta(Math.atan2(box.y+h/2-cy,box.x+w/2-cx)-e.mid)
        box.score=distance+Math.abs(turn)*50+extra*.1+(width===260?5:0)
        result.push(box)
      }
    }
    const unique=new Set()
    return result.sort((a,b)=>a.score-b.score).filter(b=>{const key=[b.x,b.y,b.width,b.height].map(n=>Math.round(n/3)).join(',');if(unique.has(key))return false;unique.add(key);return true}).slice(0,90)
  })
  if(candidates.some(c=>!c.length))return null
  // Place constrained labels first, then backtrack locally when neighbors block
  // their preferred radial position. Labels never turn into lateral columns.
  let attempts=0
  function place(remaining) {
    if(!remaining.length)return true
    if(++attempts>6500)return false
    let index,choices
    for(const i of remaining) {
      const valid=candidates[i].filter(box=>!entries.some((o,j)=>o.box&&(clash(box,o.box)||(j<i?o.box.angle>=box.angle:box.angle>=o.box.angle))))
      if(!valid.length)return false
      if(!choices||valid.length<choices.length){index=i;choices=valid}
    }
    for(const box of choices) {
      entries[index].box=box
      if(place(remaining.filter(i=>i!==index)))return true
      delete entries[index].box
    }
    return false
  }
  if(!place(entries.map((_,i)=>i)))return null
  const routes=[]
  for(const e of entries){
    const b=e.box,end={x:clamp(e.badge.x,b.x,b.x+b.width),y:clamp(e.badge.y,b.y,b.y+b.height)}
    e.leader=leaderPath(e,entries,POSTER,[],routes)
    if(Math.hypot(end.x-e.badge.x,end.y-e.badge.y)-e.badge.radius>=24&&!e.leader)return null
    if(e.leader)routes.push(e.leader)
  }
  return {entries}
}
