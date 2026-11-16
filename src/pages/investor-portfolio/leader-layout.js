// Uniform badges are annotations, not another quantitative scale. Their optional
// connectors stay outside the donut and never pass through a neighboring label.
export function leaderPath(entry,entries,poster,logos=[],previous=[]) {
  const {badge:b,box}=entry,{cx,cy,outer}=poster
  const end={x:Math.max(box.x,Math.min(b.x,box.x+box.width)),y:Math.max(box.y,Math.min(b.y,box.y+box.height))}
  if(Math.hypot(end.x-b.x,end.y-b.y)-b.radius<24)return null
  const towards=Math.atan2(end.y-b.y,end.x-b.x),routes=[]
  const clear=(a,z)=>{
    const steps=Math.ceil(Math.hypot(z.x-a.x,z.y-a.y)/2)
    for(let i=0;i<=steps;i++) {
      const x=a.x+(z.x-a.x)*i/Math.max(1,steps),y=a.y+(z.y-a.y)*i/Math.max(1,steps)
      if(x<8||x>1072||y<poster.top||y>poster.bottom||Math.hypot(x-cx,y-cy)<outer+3)return false
      if(logos.some(r=>x>r.x-5&&x<r.x+r.width+5&&y>r.y-5&&y<r.y+r.height+5))return false
      for(const route of previous)for(let j=1;j<route.length;j++) {
        const a=route[j-1],b=route[j],dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy || 1)))
        if(Math.hypot(x-a.x-t*dx,y-a.y-t*dy)<4)return false
      }
      for(const e of entries) {
        const r=e.box
        if(e===entry&&x>r.x+1&&x<r.x+r.width-1&&y>r.y+1&&y<r.y+r.height-1)return false
        if(e!==entry&&x>r.x-6&&x<r.x+r.width+6&&y>r.y-6&&y<r.y+r.height+6)return false
        if(Math.hypot(x-e.badge.x,y-e.badge.y)<e.badge.radius+3)return false
      }
    }
    return true
  }
  for(const turn of [0,-.4,.4,-.8,.8,-1.2,1.2]) {
    const a=towards+turn,start={x:b.x+Math.cos(a)*(b.radius+6),y:b.y+Math.sin(a)*(b.radius+6)}
    const candidates=[[start,end],[start,{x:start.x,y:end.y},end],[start,{x:end.x,y:start.y},end]]
    for(const x of [b.x-b.radius-12,b.x+b.radius+12,box.x-12,box.x+box.width+12])candidates.push([start,{x,y:start.y},{x,y:end.y},end])
    for(const route of candidates) {
      const length=route.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-route[i].x,p.y-route[i].y),0)
      if(length<=230&&route.slice(1).every((p,i)=>clear(route[i],p)))routes.push({route,score:length+route.length*6})
    }
  }
  return routes.sort((a,b)=>a.score-b.score)[0]?.route || null
}
