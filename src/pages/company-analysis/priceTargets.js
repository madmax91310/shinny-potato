import { targetEvidence } from './targetEvidence.js'
import { valuationInputs } from './valuation.js'
import { formatValue as n } from './valuationPresentation.js'
import { dateLabel } from './lib.js'

export const TARGET_POLICY = Object.freeze({version:1, horizons:[1,3,5], defaultYears:5, growthSpread:.03, multipleSpread:.20})
const bounded=(v,lo,hi)=>Math.max(lo,Math.min(hi,v))
const signed=v=>`${v>=0?'+':'−'}${n(Math.abs(v)*100)} %`
export function priceTarget(a,price) {
  if(!Number.isFinite(a.base)||a.base<=0||!Number.isFinite(price)||price<=0||!TARGET_POLICY.horizons.includes(a.years)
    ||!Number.isFinite(a.growth)||(!a.path&&(a.growth<-.5||a.growth>.5))||!Number.isFinite(a.multiple)||a.multiple<=0||a.multiple>500) throw new RangeError('Hypothèses hors limites : croissance −50 à 50 %, multiple > 0 à 500, horizon 1, 3 ou 5 ans.')
  if(a.path&&(!Array.isArray(a.path)||a.path.length!==a.years||a.path.some(v=>!Number.isFinite(v)||v<=0)))throw new RangeError('Trajectoire invalide.')
  const fundamental=a.path?.at(-1)??a.base*(1+a.growth)**a.years, value=fundamental*a.multiple
  return {value,fundamental,upside:value/price-1,annualised:(value/price)**(1/a.years)-1}
}
export function targetDate(asOf,years) {
  const date=new Date(`${asOf}T00:00:00Z`), month=date.getUTCMonth()
  date.setUTCFullYear(date.getUTCFullYear()+years)
  if(date.getUTCMonth()!==month)date.setUTCDate(0)
  return date.toISOString().slice(0,10)
}
export function buildPriceScenarios(company,overrides={},now=new Date(),years=5) {
  if(!TARGET_POLICY.horizons.includes(years))throw new RangeError('Choisis un horizon de 1, 3 ou 5 ans.')
  const inputs=valuationInputs(company,now)
  const dates=Array.from({length:years},(_,i)=>targetDate(company.quote?.asOf??now.toISOString().slice(0,10),i+1))
  const evidence=targetEvidence(company,inputs,now,dates)
  inputs.cashReady=Boolean(evidence.cash)
  inputs.earningsReady=Boolean(evidence.earnings)
  inputs.reasons.push(...evidence.reasons)
  const multiples={cash:evidence.cash?.multiple??null,earnings:evidence.earnings?.multiple??null}
  const central=Object.fromEntries(['cash','earnings'].map(method=>{const e=evidence[method];return [method,e?(e.values.at(-1)/e.base)**(1/years)-1:null]}))
  const scenarios=['Prudent','Central','Favorable'].map((name,index)=>{
    const user=overrides[index]??{}, direction=index-1
    const assumptions=method=>{
      if(!inputs[method==='cash'?'cashReady':'earningsReady'])return null
      const e=evidence[method],field=method==='cash'?'cashGrowth':'earningsGrowth'
      return {base:e.base,years,
        path:user[field]===undefined?e.values.map((v,i)=>v*(1+direction*TARGET_POLICY.growthSpread)**(i+1)):null,
        growth:user[field]??((1+central[method])*(1+direction*TARGET_POLICY.growthSpread)-1),
        multiple:user[method==='cash'?'cashMultiple':'earningsMultiple']??bounded(multiples[method]*(1+direction*TARGET_POLICY.multipleSpread),.01,500),
        discount:.10}
    }
    const cashAssumptions=assumptions('cash'), earningsAssumptions=assumptions('earnings')
    const cashTarget=cashAssumptions?priceTarget(cashAssumptions,inputs.price):null
    const earningsTarget=earningsAssumptions?priceTarget(earningsAssumptions,inputs.price):null
    return {name,customised:Object.keys(user).length>0,cashAssumptions,earningsAssumptions,cashTarget,earningsTarget}
  })
  return {inputs,evidence,scenarios,years,targetDate:inputs.price?targetDate(company.quote.asOf,years):null,multiples,central,
    orderChanged:['cashTarget','earningsTarget'].some(key=>scenarios.some((s,i)=>i>0&&s[key]&&scenarios[i-1][key]&&s[key].value<scenarios[i-1][key].value)),
    growthSource:{cash:'Croissance annualisée du FCF/action publié sur les exercices comparables',earnings:'BPA ajustés annuels datés puis convergence explicite'},
    rules:'Multiples de sortie fondés sur les références historiques comparables ; rapprochement avec des pairs qualifiés lorsqu’ils sont assez nombreux. Croissance annuelle variable selon les exercices. Scénarios ±3 % sur la trajectoire annuelle et ±20 % sur le multiple : conventions, pas probabilités. Une croissance personnalisée remplace la trajectoire par un taux constant.',
    note:'BPA ajustés et PER prévisionnels ajustés restent séparés des BPA et PER publiés. Échéances calendaires et exercices fiscaux sont explicités. Aucun mélange avec la croissance Finviz. FCF : nombre d’actions constant. Potentiels hors dividendes, frais et fiscalité.'}

}
export function targetReading(model,index=1,method='earnings') {
  const scenario=model?.scenarios[index],cash=method==='cash'
  const a=cash?scenario?.cashAssumptions:scenario?.earningsAssumptions, result=cash?scenario?.cashTarget:scenario?.earningsTarget
  if(!a||!result)return null
  const lowerMultiple=Math.max(.01,a.multiple*.8),upperMultiple=Math.min(500,a.multiple*1.2)
  const low=priceTarget({...a,multiple:lowerMultiple},model.inputs.price).value,high=priceTarget({...a,multiple:upperMultiple},model.inputs.price).value
  return {...result,
    title:`À ${model.years} an${model.years>1?'s':''}, ce scénario donne un potentiel de ${signed(result.upside)}.`,
    explanation:`L’objectif au ${dateLabel(model.targetDate)} repose sur ${n(a.growth*100)} % de croissance annualisée équivalente ${cash?'du FCF par action':'du BPA ajusté prévisionnel'} et un multiple de sortie de ${n(a.multiple)}.`,
    expectation:`Cela correspond à ${signed(result.annualised)} par an pour le cours, hors dividendes. La trajectoire reste hypothétique.`,
    historical:`${model.evidence[method].basis}. ${model.evidence[method].trajectory} ${model.evidence[method].rationale}${cash?'':` BPA de sortie : exercice se terminant le ${model.evidence.earnings.periods.at(-1)}.`}`,
    sensitivity:{low,high,lowerMultiple,upperMultiple},delta:result.upside,terminalShare:null}
}
export function targetChart(company,model,method='earnings') {
  const price=model?.inputs.price
  if(!price)return {history:[],forecast:[],unit:company.currency,title:'Cours et objectifs'}
  const quote=company.quote, raw=quote.history??[]
  const valid=raw.length>1&&raw.every((p,i)=>Number.isFinite(p.close)&&p.close>0&&/^\d{4}-\d{2}-\d{2}$/.test(p.asOf)&&Number.isFinite(Date.parse(p.asOf))&&p.asOf<=quote.asOf&&(!i||p.asOf>raw[i-1].asOf))
    &&raw.at(-1).asOf===quote.asOf&&Math.abs(raw.at(-1).close-price)<1e-6
  const rows=valid?raw:[{asOf:quote.asOf,close:price}]
  const history=rows.map(p=>({time:Date.parse(p.asOf),end:p.asOf,label:dateLabel(p.asOf),value:p.close,sourceUrl:quote.sourceUrl}))
  const anchor=history.at(-1)
  const forecast=method==='history'?[]:model.scenarios.flatMap(s=>{
    const a=method==='cash'?s.cashAssumptions:s.earningsAssumptions
    if(!a)return []
    const startMultiple=price/a.base
    return [{name:s.name,points:[anchor,...Array.from({length:a.years},(_,i)=>{
      const t=i+1,date=targetDate(quote.asOf,t)
      // Gradual multiple convergence is a drawing/model convention, not a prediction of the path.
      const multiple=startMultiple*(a.multiple/startMultiple)**(t/a.years)
      return {time:Date.parse(date),end:date,label:dateLabel(date),value:(a.path?.[i]??a.base*(1+a.growth)**t)*multiple}
    })]}]
  })
  return {history,forecast,unit:company.currency,title:method==='earnings'?'Cours et objectifs · BPA ajusté':'Cours et objectifs · FCF/action',
    caption:`${valid?'Trait plein : clôtures hebdomadaires':'Point initial : dernière clôture'} · pointillés : trajectoires hypothétiques, hors dividendes.`,
    historyLabel:'Cours de clôture',hasPriceHistory:valid}
}
