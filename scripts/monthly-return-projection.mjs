export function monthlyCalendarReturns(record,now=new Date()) {
 const points=new Map(record.points),years={}
 for(const [month,price]of record.points){
  if(!month.endsWith('-12'))continue
  const year=Number(month.slice(0,4)),previous=points.get(`${year-1}-12`)
  // All thirteen month-end observations are required; a gap is never bridged.
  const months=[`${year-1}-12`,...Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`)]
  if(year<now.getUTCFullYear() && months.every(m=>Number.isFinite(points.get(m))&&points.get(m)>0))years[year]=(price/previous-1)*100
 }
 return years
}
