// Only nearby percentage boxes need the existing exact polygon intersection test.
// Candidate order cannot affect placement: the query is a boolean overlap check.
export function polygonIndex(intersects,cellSize=256){
 const cells=new Map()
 function keys(points){
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y),result=[]
  for(let x=Math.floor(Math.min(...xs)/cellSize);x<=Math.floor(Math.max(...xs)/cellSize);x++)
   for(let y=Math.floor(Math.min(...ys)/cellSize);y<=Math.floor(Math.max(...ys)/cellSize);y++)result.push(`${x},${y}`)
  return result
 }
 return {
  add(points){for(const key of keys(points)){if(!cells.has(key))cells.set(key,[]);cells.get(key).push(points)}},
  overlaps(points){
   const seen=new Set()
   for(const key of keys(points))for(const other of cells.get(key)||[]){
    if(seen.has(other))continue
    seen.add(other)
    if(intersects(points,other))return true
   }
   return false
  },
 }
}
