import { COMPANIES } from '../../data/companies.js'
import { fresh, activeDecision } from './lib.js'
const day=86400000,positive=x=>Number.isFinite(x)&&x>0
export const median=xs=>{const a=[...xs].sort((a,b)=>a-b);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null}
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x))
export const PEER_GROUPS=[['microsoft','adobe','salesforce','servicenow','intuit'],['costco','walmart'],['visa','mastercard'],['coca-cola','pepsico'],['caterpillar','deere'],['nvidia','amd']]
export function validForecast(c,now) {
  const f=c.targetForecast
  return Boolean(f?.version===1&&f.symbol===c.symbol&&f.currency===c.currency&&f.basis==='adjusted-non-gaap'&&f.multipleBasis==='forward-adjusted-eps'
    &&f.sourceUrl?.startsWith('https://')&&fresh(f.asOf,35,now)&&fresh(f.observedAt,35,now)
    &&f.points?.length>=3&&f.points.every((p,i)=>positive(p.eps)&&Number.isFinite(Date.parse(p.end))&&(!i||p.end>f.points[i-1].end))
    &&!(c.quote?.splits??[]).some(s=>(typeof s==='string'?s:s.asOf??s.date)>f.asOf)
    &&f.points.at(-2).end>=c.annual?.end
    &&f.points.at(-1).end>c.quote?.asOf&&f.historicalMultiples?.length>=3
    &&f.historicalMultiples.every(r=>positive(r.multiple)&&r.end<f.points.at(-2).end))
}
function normalGrowth(c,now) {
  const rows=activeDecision(c,now)?.years??[],rates=rows.slice(1).flatMap((r,i)=>positive(r.revenue)&&positive(rows[i].revenue)?[r.revenue/rows[i].revenue-1]:[])
  return rates.length>=2?clamp(median(rates),0,.10):null
}
// Annual EPS estimates stay at their explicit fiscal dates. Beyond the last
// disclosed estimate, the growth rate converges in 3 years to a revenue anchor.
export function annualCurve(points,anchor) {
  const out=points.map(p=>({...p,value:p.eps??p.value})),last=out.at(-1),previous=out.at(-2)
  const initial=clamp((last.value/previous.value)**(365.25*day/(Date.parse(last.end)-Date.parse(previous.end)))-1,-.3,.3)
  for(let i=1;i<=7;i++) {
    const date=new Date(`${last.end}T00:00:00Z`);date.setUTCFullYear(date.getUTCFullYear()+i)
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
export function targetEvidence(c,inputs,now,dates,peers=COMPANIES) {
  const anchor=normalGrowth(c,now),result={cash:null,earnings:null,reasons:[]}
  if(anchor===null){result.reasons.push('Deux variations annuelles de chiffre d’affaires comparables sont nécessaires.');return result}
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
    result.earnings={base:base.value,values:dates.map(d=>forwardAt(curve,d).value),periods:dates.map(d=>forwardAt(curve,d).end),curve,anchor,multiple,historical,peerMedian,peerRows,
      sourceUrl:f.sourceUrl,asOf:f.asOf,basis:'BPA ajusté prévisionnel du premier exercice se terminant après chaque échéance',
      rationale:`Médiane de ${refs.length} PER prévisionnels historiques ajustés : ${historical.toFixed(2)}×.${peerMedian?` Référence de ${peerRows.length} comparables : ${peerMedian.toFixed(2)}× (poids 25 %, écart borné à ±25 % de la médiane historique).`:' Comparables homogènes insuffisants : référence historique seule.'} Les perspectives agissent sur le BPA projeté, sans prime de multiple ajoutée.`,
      trajectory:`BPA annuels ajustés datés jusqu’au ${f.points.at(-1).end} ; au-delà, croissance ramenée en trois exercices vers ${(anchor*100).toFixed(1)} % (médiane de croissance du CA, bornée entre 0 et 10 %). Convention modifiable, pas un consensus au-delà des exercices sourcés.`}
  } else result.reasons.push('BPA ajustés datés et PER de même définition manquants ou périmés ; aucune croissance Finviz appliquée au BPA publié.')
  const r=c.targetCashReference
  if(inputs.cashReady&&r?.version===1&&r.currency===c.currency&&r.annualEnd===c.annual.end&&fresh(r.observedAt,35,now)&&r.historicalMultiples?.length>=3&&r.sourceUrl?.startsWith('https://')&&r.historicalMultiples.every(p=>{const h=inputs.history.find(h=>h.end===p.end);return positive(p.multiple)&&h&&positive(p.base)&&Math.abs(p.base-h.value)<1e-8})) {
    const hist=inputs.history,initial=clamp(inputs.historicalGrowth,-.3,.3)
    // Use the full comparable historical CAGR as the initial cash growth, not
    // just the most recent annual jump. The base remains at its fiscal date.
    const last=hist.at(-1),date=new Date(last.end);date.setUTCFullYear(date.getUTCFullYear()-1)
    const curve=annualCurve([{end:date.toISOString().slice(0,10),value:last.value/(1+initial)},last],anchor)
    const base=valueAt(curve,c.quote.asOf),multiple=median(r.historicalMultiples.map(p=>p.multiple))
    result.cash={base,values:dates.map(d=>valueAt(curve,d)),anchor,multiple,historical:multiple,peerRows:[],curve,sourceUrl:r.sourceUrl,asOf:r.observedAt,
      basis:'FCF/action publié ; base projetée de la date fiscale à la date du cours',
      rationale:`Médiane de ${r.historicalMultiples.length} multiples historiques cours/FCF comparables : ${multiple.toFixed(2)}×. Références annuelles rétrospectives, pas une valorisation connue en temps réel à ces dates. Aucun comparable de FCF suffisamment harmonisé ajouté.`,
      trajectory:`Croissance historique initiale ${(initial*100).toFixed(1)} %, convergence sur trois ans vers ${(anchor*100).toFixed(1)} % (croissance médiane du CA bornée entre 0 et 10 %). Nombre d’actions constant ; cette trajectoire reste une hypothèse.`}
  } else result.reasons.push('Références historiques de multiple FCF comparables manquantes ou périmées.')
  return result
}
