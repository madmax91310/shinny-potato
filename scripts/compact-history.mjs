// Encode only strictly consecutive, exact monthly observations. This changes
// transport size, not precision, dates, currency or return convention.
export function compactHistory(records) {
  const encode = points => {
    if (!Array.isArray(points) || !points.length) return JSON.stringify(points)
    const start = points[0].date
    if (!/^\d{4}-\d{2}$/.test(start)) return JSON.stringify(points)
    const index = Number(start.slice(0,4))*12+Number(start.slice(5))-1
    if (!points.every((p,i) => Object.keys(p).length === 2 && Number.isFinite(p.price) && p.date === `${Math.floor((index+i)/12)}-${String((index+i)%12+1).padStart(2,'0')}`)) return JSON.stringify(points)
    return `p(${index},${JSON.stringify(points.map(p=>p.price))})`
  }
  const rows = Object.entries(records).map(([id,record]) => `${JSON.stringify(id)}:{${Object.entries(record).map(([key,value]) => `${JSON.stringify(key)}:${['points','anniversaryPoints'].includes(key)?encode(value):JSON.stringify(value)}`).join(',')}}`)
  return `const p=(start,values)=>values.map((price,i)=>({date:Math.floor((start+i)/12)+'-'+String((start+i)%12+1).padStart(2,'0'),price}));\nexport default {${rows.join(',')}};`
}
