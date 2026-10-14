// Dispersion-based stress scenarios, never confidence/probability intervals.
export const SCENARIO_VERSION=2
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x))
export const median=xs=>quantile(xs,.5)
export function quantile(xs,p) {
  const a=xs.filter(Number.isFinite).sort((a,b)=>a-b),k=(a.length-1)*p,i=Math.floor(k)
  return a.length?a[i]+(a[Math.min(i+1,a.length-1)]-a[i])*(k-i):null
}
export function dispersion(xs) {
  if(xs.length<2||xs.some(x=>!Number.isFinite(x)))return null
  const mean=xs.reduce((a,b)=>a+b,0)/xs.length
  return Math.sqrt(xs.reduce((s,x)=>s+(x-mean)**2,0)/(xs.length-1))
}
function growths(rows,key) {
  return rows.slice(1).flatMap((r,i)=>{
    const a=rows[i][key],b=r[key],years=(Date.parse(r.end)-Date.parse(rows[i].end))/86400000/365.25
    return a>0&&b>0&&years>.9&&years<1.1?[Math.log(b/a)/years]:[]
  })
}
export function calibrateScenarios(rows,multiples,method,cashHistory=[]) {
  const revenues=growths(rows,'revenue'),incomes=growths(rows,'netIncome'),cash=growths(cashHistory,'value')
  const observations=method==='cash'?cash:incomes.length>=2?incomes:revenues
  const raw=Math.max(dispersion(revenues)??0,dispersion(observations)??0)
  const incomplete=observations.length<3,losses=rows.some(r=>r.netIncome<=0)
  // Short series and loss-making years do not justify artificially narrow bands.
  const sigma=clamp(raw*(incomplete?1.25:1),losses ? .12 : .04,.40)
  const centre=median(multiples),low=quantile(multiples,.2),high=quantile(multiples,.8)
  if(!(centre>0)||observations.length<2)return null
  const lower=clamp(low/centre,.40,.95),upper=clamp(high/centre,1.05,2.0)
  return {version:SCENARIO_VERSION,method,sigma,rawDispersion:raw,observations:observations.length,shortHistory:incomplete,losses,
    multiples:{count:multiples.length,median:centre,p20:low,p80:high,lower,upper},
    explanation:`Dispersion annuelle maximale du CA et ${method==='cash'?'du FCF/action':'des résultats (ou du CA si les bénéfices sont non comparables)'} : ${(raw*100).toFixed(1)} %, sur ${observations.length} variations. Écart retenu ${(sigma*100).toFixed(1)} % en logarithme${incomplete?' ; historique court, majoration de 25 %':''}${losses?' ; exercices déficitaires, plancher renforcé':''}. Multiples : quantiles historiques 20–80 %, soit ${(lower*100).toFixed(0)}–${(upper*100).toFixed(0)} % du multiple central.`,
    convention:'Choc sur le fondamental = exp(± dispersion × racine de l’horizon). Plancher 4 % (12 % avec pertes), plafond 40 % ; multiples bornés entre 40–95 % et 105–200 % de la référence. Sensibilités historiques, pas probabilités.'}
}
export function scenarioFactor(calibration,direction,years) {
  return Math.exp(direction*calibration.sigma*Math.sqrt(years))
}
