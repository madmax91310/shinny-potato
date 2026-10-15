import { formatValue as n } from './valuationPresentation.js'
import { dateLabel } from './lib.js'
const positive=x=>Number.isFinite(x)&&x>0
const pct=x=>`${n(x*100)} %`

// Compare like-for-like fundamentals only. Published GAAP EPS is never used
// as the history of an adjusted EPS forecast; split-qualified FCF comes from inputs.
export function historicalGrowth(rows) {
  if(rows.length<3||rows.some((r,i)=>!positive(r.value)||!Number.isFinite(Date.parse(r.end))||(i&&((Date.parse(r.end)-Date.parse(rows[i-1].end))/86400000<330||(Date.parse(r.end)-Date.parse(rows[i-1].end))/86400000>400))))return null
  const first=rows[0],last=rows.at(-1),years=(Date.parse(last.end)-Date.parse(first.end))/86400000/365.25
  return {value:(last.value/first.value)**(1/years)-1,start:first.end,end:last.end,count:rows.length}
}
export function scenarioContext(company,model,index,method) {
  const e=model.evidence[method],a=model.scenarios[index]?.[method+'Assumptions']
  if(!e||!a)return null
  const cash=method==='cash'
  const rows=cash?model.inputs.history:company.targetForecast.points.filter(p=>p.kind==='observed-adjusted').map(p=>({end:p.end,value:p.eps}))
  const history=historicalGrowth(rows)
  const delta=history?a.growth-history.value:null
  const pace=history?(Math.abs(delta)<.005?'un rythme proche de celui observé':delta>0?'une croissance plus élevée que celle observée':'une croissance plus faible que celle observée'):null
  const growthText=history?`Sur les ${history.count} exercices du ${dateLabel(history.start)} au ${dateLabel(history.end)}, ${cash?'le FCF':'le bénéfice ajusté'} par action a évolué de ${pct(history.value)} par an en moyenne. Avec ${pct(a.growth)} par an, ce scénario retient ${pace}. Le passé sert de repère, pas de prévision.`:null
  const median=e.historical,relative=a.multiple/median-1
  const position=Math.abs(relative)<.005?'proche de':relative>0?'au-dessus de':'en dessous de'
  const multipleText=`Le multiple retenu (${n(a.multiple)}×) est ${position} la médiane historique (${n(median)}×), calculée sur ${e.calibration.multiples.count} références comparables.${Math.abs(relative)>=.005?` L’écart est de ${pct(Math.abs(relative))}.`:''} Cela situe l’hypothèse sans dire que l’action est bon marché ou chère.`
  return {history,growthText,multipleText,relative,pace}
}
export function reverseComparison(required,scenarioGrowth) {
  if(!Number.isFinite(required)||!Number.isFinite(scenarioGrowth))return null
  const gap=required-scenarioGrowth
  if(Math.abs(gap)<.0005)return 'La croissance nécessaire est proche de celle du scénario sélectionné.'
  return `Il faudrait une croissance ${gap>0?'supérieure':'inférieure'} de ${n(Math.abs(gap)*100)} point${Math.abs(gap*100)>=2?'s':''} par an à celle du scénario sélectionné (${pct(scenarioGrowth)}). Cette comparaison porte sur le même multiple final, hors dividendes.`
}
