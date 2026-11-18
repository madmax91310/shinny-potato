const gap=(box,b)=>Math.hypot(b.x-Math.max(box.x,Math.min(b.x,box.x+box.width)),b.y-Math.max(box.y,Math.min(b.y,box.y+box.height)))-b.radius
export function needsLeader(entry,entries){
  const own=gap(entry.box,entry.badge)
  return own>=36 || entries.some(other=>other!==entry&&gap(entry.box,other.badge)<own-8)
}
// Uniform badges are annotations, not another quantitative scale. Their optional
// connectors stay outside the donut and never pass through a neighboring label.
export function leaderPath(entry,entries,poster,previous=[]) {
  const {badge:b,box}=entry,{cx,cy,outer}=poster
  const end={x:Math.max(box.x,Math.min(b.x,box.x+box.width)),y:Math.max(box.y,Math.min(b.y,box.y+box.height))}
  if(!needsLeader(entry,entries))return null
  const towards=Math.atan2(end.y-b.y,end.x-b.x)
  const clear=(a,z)=>{
    const steps=Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)/2)
    for(let i=0;i<=steps;i++) {
      const x=a.x+(z.x-a.x)*i/Math.max(1,steps),y=a.y+(z.y-a.y)*i/Math.max(1,steps)
      if(x<8||x>1072||y<poster.top||y>poster.bottom||Math.hypot(x-cx,y-cy)<outer+3)return false
      for(const [a,b] of previous) {
        const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy || 1)))
        if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<4)return false
      }
      for(const e of entries) {
        const r=e.box
        if(e!==entry&&x>r.x-6&&x<r.x+r.width+6&&y>r.y-6&&y<r.y+r.height+6)return false
        if(Math.hypot(x-e.badge.x,y-e.badge.y)<e.badge.radius+3)return false
      }
    }
    return true
  }
  // Long elbow routes are replaced by a simpler composition with fewer labels.
  const start={x:b.x+Math.cos(towards)*(b.radius+6),y:b.y+Math.sin(towards)*(b.radius+6)}
  if(Math.hypot(end.x-start.x,end.y-start.y)>poster.connectorLimit)return null
  return clear(start,end)?[start,end]:null
}
