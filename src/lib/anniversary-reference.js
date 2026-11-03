// A dated NAV belongs to its actual valuation month, including at a month roll.
// A comparison uses one historical month for both participants.
export function anniversaryReferenceDate(entries, today) {
 const dates=entries.map(({asset,observation})=>{
  const basis=asset?.anniversaryValuationBasis??asset?.historyConvention
  if(!['fund-nav-price','fund-nav-total-return'].includes(basis)||observation?.manual||!observation?.asOf)return today
  const [year,month,day=1]=observation.asOf.split('-').map(Number)
  return new Date(year,month-1,day,12)
 })
 return new Date(Math.min(...dates.map(date=>date.getTime())))
}
