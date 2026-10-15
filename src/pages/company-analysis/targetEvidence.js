import { projectCash } from './cashProjection.js'
import { calibrateScenarios } from './scenarioCalibration.js'
import { COMPANY_PEERS } from '../../data/company-peers.js'
import { fresh, activeDecision } from './lib.js'
const day=86400000,positive=x=>Number.isFinite(x)&&x>0
export const median=xs=>{const a=[...xs].sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null}
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x))
export const PEER_GROUPS=[['microsoft','adobe','salesforce','servicenow','intuit'],['costco','walmart'],['visa','mastercard'],['coca-cola','pepsico'],['caterpillar','deere'],['nvidia','amd']]
// Comparable fiscal years only: missing years must not masquerade as annual growth.
function annualPeriods(rows) {
  return Array.isArray(rows)&&rows.length>=3&&rows.every((r,i)=>Number.isFinite(Date.parse(r.end))&&(!i||
    (Date.parse(r.end)-Date.parse(rows[i-1].end))/day>=330&&(Date.parse(r.end)-Date.parse(rows[i-1].end))/day<=400))
}
export function validForecast(c,now) {
  const f=c.targetForecast
  return Boolean(f?.version===1&&f.symbol===c.symbol&&f.currency===c.currency&&f.basis==='adjusted-non-gaap'&&f.multipleBasis==='forward-adjusted-eps'
    &&f.sourceUrl?.startsWith('https://')&&fresh(f.asOf,35,now)&&fresh(f.observedAt,35,now)
    &&annualPeriods(f.points)&&f.points.some(p=>p.kind==='estimate')&&f.points.every((p,i)=>positive(p.eps)&&['estimate','observed-adjusted'].includes(p.kind)&&(p.kind!=='observed-adjusted'||p.end<=f.asOf)&&Number.isFinite(Date.parse(p.end))&&(!i||p.end>f.points[i-1].end))
    &&!(c.quote?.splits??[]).some(s=>(typeof s==='string'?s:s.asOf??s.date)>f.asOf)
    &&f.points.at(-2).end>=c.annual?.end
    &&f.points.at(-1).end>c.quote?.asOf&&f.historicalMultiples?.length>=3
    &&f.historicalMultiples.every((r,i)=>positive(r.multiple)&&Number.isFinite(Date.parse(r.end))&&r.end<f.points.at(-2).end&&(!i||r.end>f.historicalMultiples[i-1].end)))
}
function normalGrowth(c,now) {
  const rows=activeDecision(c,now)?.years??[],rates=rows.slice(1).flatMap((r,i)=>positive(r.revenue)&&positive(rows[i].revenue)?[r.revenue/rows[i].revenue-1]:[])
  return annualPeriods(rows)&&rates.length>=2?clamp(median(rates),0,.10):null
}
// Annual EPS estimates stay at their explicit fiscal dates. Beyond the last
// disclosed estimate, the growth rate converges in 3 years to a revenue anchor.
export function annualCurve(points,anchor) {
  const out=points.map(p=>({...p,value:p.eps??p.value})),last=out.at(-1),previous=out.at(-2)
  const initial=clamp((last.value/previous.value)**(365.25*day/(Date.parse(last.end)-Date.parse(previous.end)))-1,-.3,.3)
  for(let i=1;i<=7;i++) {
    const date=new Date(`${last.end}T00:00:00Z`);const month=date.getUTCMonth();date.setUTCFullYear(date.getUTCFullYear()+i);if(date.getUTCMonth()!==month)date.setUTCDate(0)
    const growth=initial+(anchor-initial)*Math.min(i/3,1)
    out.push({end:date.toISOString().slice(0,10),value:out.at(-1).value*(1+growth),kind:'model',growth})
  }
  return out
}
export function forwardAt(curve,date) {return curve.find(p=>p.end>date)}
function valueAt(curve,date) {
  const time=Date.parse(date),i=curve.findIndex(p=>Date.parse(p.end)>=time)
  if(i<0)return null
  if(i===0)return curve[0].value
  const a=curve[i-1],b=curve[i],t=(time-Date.parse(a.end))/(Date.parse(b.end)-Date.parse(a.end))
  return a.value*(b.value/a.value)**t
}
export function targetEvidence(c,inputs,now,dates,peers=COMPANY_PEERS) {
  const result={cash:null,earnings:null,reasons:[],methodReasons:{cash:[...inputs.cashReasons],earnings:[...inputs.commonReasons]}}
  const block=(message,methods=['cash','earnings'])=>{result.reasons.push(message);for(const method of methods)result.methodReasons[method].push(message)}
  if(c.valuationBusinessType!=='operating-company') {
    block('Méthode non qualifiée pour ce type d’entreprise : une analyse adaptée est nécessaire.');return result
  }
  const anchor=normalGrowth(c,now)
  if(anchor===null){block('Deux variations annuelles de chiffre d’affaires comparables sont nécessaires.');return result}
  if(validForecast(c,now)&&inputs.price) {
    const f=c.targetForecast,curve=annualCurve(f.points,anchor),base=forwardAt(curve,c.quote.asOf),refs=f.historicalMultiples.map(r=>r.multiple)
    const group=PEER_GROUPS.find(g=>g.includes(c.id))??[]
    const peerRows=peers.filter(p=>p.id!==c.id&&group.includes(p.id)&&validForecast(p,now)&&fresh(p.quote?.asOf,10,now)&&positive(p.quote?.price)).map(p=>{
      const eps=p.targetForecast.points.find(r=>r.end>p.quote.asOf)?.eps
      return {id:p.id,name:p.name,multiple:p.quote.price/eps,sourceUrl:p.targetForecast.sourceUrl}
    }).filter(p=>positive(p.multiple)&&p.multiple<=500)
    const historical=median(refs),peerMedian=peerRows.length>=2?median(peerRows.map(p=>p.multiple)):null
    // Historical company anchor dominates. Peer contribution is capped to avoid
    // importing a peer market bubble into the historical reference.
    const multiple=peerMedian?historical*.75+clamp(peerMedian,historical*.75,historical*1.25)*.25:historical
    result.earnings={calibration:calibrateScenarios(c.decision.years,refs,'earnings'),base:base.value,values:dates.map(d=>forwardAt(curve,d).value),periods:dates.map(d=>forwardAt(curve,d).end),curve,anchor,multiple,historical,peerMedian,peerRows,
      sourceUrl:f.sourceUrl,asOf:f.asOf,basis:'BPA ajusté prévisionnel du premier exercice se terminant après chaque échéance',
      rationale:`Médiane de ${refs.length} PER prévisionnels historiques ajustés : ${historical.toFixed(2)}×.${peerMedian?` Référence de ${peerRows.length} comparables : ${peerMedian.toFixed(2)}× (poids 25 %, écart borné à ±25 % de la médiane historique).`:' Comparables homogènes insuffisants : référence historique seule.'} Les perspectives agissent sur le BPA projeté, sans prime de multiple ajoutée.`,
      trajectory:`BPA annuels ajustés datés jusqu’au ${f.points.at(-1).end} ; au-delà, croissance ramenée en trois exercices vers ${(anchor*100).toFixed(1)} % (médiane de croissance du CA, bornée entre 0 et 10 %). Convention modifiable, pas un consensus au-delà des exercices sourcés.`}
  } else block('BPA ajustés datés et PER de même définition manquants ou périmés ; aucune croissance Finviz appliquée au BPA publié.',['earnings'])
  const r=c.targetCashReference
  if(inputs.cashReady&&r?.version===1&&r.currency===c.currency&&r.annualEnd===c.annual.end&&fresh(r.observedAt,35,now)&&r.historicalMultiples?.length>=3&&r.sourceUrl?.startsWith('https://')&&r.historicalMultiples.every(p=>{const h=inputs.history.find(h=>h.end===p.end);return positive(p.multiple)&&h&&positive(p.base)&&Math.abs(p.base-h.value)<1e-8})) {
    const drivers=projectCash(c,inputs,anchor),refs=r.historicalMultiples.map(p=>p.multiple)
    if(drivers) {
      const curve=drivers.curve,base=valueAt(curve,c.quote.asOf),multiple=median(refs)
      result.cash={base,values:dates.map(d=>valueAt(curve,d)),periods:dates.map(d=>curve.find(p=>p.end>=d)?.end),anchor,multiple,historical:multiple,peerRows:[],curve,drivers,
        calibration:calibrateScenarios(c.decision.years,refs,'cash',inputs.history),sourceUrl:r.sourceUrl,asOf:r.observedAt,
        basis:'FCF/action publié ; CA, trésorerie, investissements et actions projetés séparément',
        rationale:`Médiane de ${refs.length} multiples historiques cours/FCF comparables : ${multiple.toFixed(2)}×. Références annuelles rétrospectives, pas une valorisation connue en temps réel à ces dates.`,
        trajectory:drivers.explanation+' '+drivers.limits}
    } else block('Composantes de trésorerie ou actions comparables insuffisantes ; projection FCF suspendue.',['cash'])
  } else block('Références historiques de multiple FCF comparables manquantes ou périmées.',['cash'])
  for(const method of ['cash','earnings'])if(result[method]&&!result[method].calibration){result[method]=null;block('Historique insuffisant pour calibrer les scénarios.',[method])}
  for(const method of ['cash','earnings']) {
    const e=result[method]
    if(e&&(!positive(e.base)||e.values.some(v=>!positive(v))||!positive(e.multiple)||e.multiple>500)){result[method]=null;block('Trajectoire ou multiple hors du domaine de validité.',[method])}
    if(result[method])result.methodReasons[method]=[]
    else result.methodReasons[method]=[...new Set(result.methodReasons[method])]
  }
  return result
}

