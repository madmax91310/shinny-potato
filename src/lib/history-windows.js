const month = date => Number(date.slice(0,4))*12+Number(date.slice(5,7))-1
export function historicalWindows(points, years) {
  const horizon = years*12
  if (![1,3,5,10].includes(years) || !Array.isArray(points) || points.length<horizon+1) return null
  const rows=[...points].sort((a,b)=>a.date.localeCompare(b.date))
  if(rows.some(p=>!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.date) || !Number.isFinite(p.price) || p.price<=0)) return null
  const windows=[]
  for(let i=0;i+horizon<rows.length;i++) {
    const sample=rows.slice(i,i+horizon+1)
    if(sample.some((p,j)=>j>0 && month(p.date)!==month(sample[j-1].date)+1)) continue
    let peak=sample[0].price,drawdown=0
    for(const p of sample){peak=Math.max(peak,p.price);drawdown=Math.min(drawdown,p.price/peak-1)}
    const total=sample.at(-1).price/sample[0].price-1
    windows.push({start:sample[0].date,end:sample.at(-1).date,total:total*100,annualized:(Math.pow(1+total,1/years)-1)*100,drawdown:drawdown*100})
  }
  if(!windows.length)return null
  const sorted=[...windows].sort((a,b)=>a.annualized-b.annualized)
  return {count:windows.length,min:sorted[0],max:sorted.at(-1),worstDrawdown:windows.reduce((a,b)=>a.drawdown<b.drawdown?a:b)}
}
