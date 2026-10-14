import { valuationInputs } from './valuation.js'
import { formatValue as n } from './valuationPresentation.js'
import { dateLabel } from './lib.js'

export const TARGET_POLICY = Object.freeze({version:1, horizons:[1,3,5], defaultYears:5, growthSpread:.03, multipleSpread:.20})
const bounded=(v,lo,hi)=>Math.max(lo,Math.min(hi,v))
const signed=v=>`${v>=0?'+':'−'}${n(Math.abs(v)*100)} %`
export function priceTarget(a,price) {
  if(!Number.isFinite(a.base)||a.base<=0||!Number.isFinite(price)||price<=0||!TARGET_POLICY.horizons.includes(a.years)
    ||!Number.isFinite(a.growth)||a.growth<-.5||a.growth>.5||!Number.isFinite(a.multiple)||a.multiple<=0||a.multiple>500) throw new RangeError('Hypothèses hors limites : croissance −50 à 50 %, multiple > 0 à 500, horizon 1, 3 ou 5 ans.')
  const fundamental=a.base*(1+a.growth)**a.years, value=fundamental*a.multiple
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
  const multiples={cash:inputs.cashReady?inputs.price/inputs.cashBase:null,earnings:inputs.earningsReady?inputs.price/inputs.eps:null}
  // Preserve quoted bases: no invented multiple when current fundamentals cannot support it.
  inputs.cashReady=Boolean(inputs.cashReady&&multiples.cash>0&&multiples.cash<=500)
  inputs.earningsReady=Boolean(inputs.earningsReady&&multiples.earnings>0&&multiples.earnings<=500)
  const central={cash:inputs.cashReady?bounded(inputs.historicalGrowth,-.30,.30):null,
    earnings:inputs.earningsReady?bounded(inputs.estimatedGrowth,-.30,.30):null}
  const scenarios=['Prudent','Central','Favorable'].map((name,index)=>{
    const user=overrides[index]??{}, direction=index-1
    const assumptions=method=>{
      if(!inputs[method==='cash'?'cashReady':'earningsReady'])return null
      return {base:method==='cash'?inputs.cashBase:inputs.eps,years,
        growth:user[method==='cash'?'cashGrowth':'earningsGrowth']??bounded(central[method]+direction*TARGET_POLICY.growthSpread,-.5,.5),
        multiple:user[method==='cash'?'cashMultiple':'earningsMultiple']??bounded(multiples[method]*(1+direction*TARGET_POLICY.multipleSpread),.01,500),
        discount:.10}
    }
    const cashAssumptions=assumptions('cash'), earningsAssumptions=assumptions('earnings')
    const cashTarget=cashAssumptions?priceTarget(cashAssumptions,inputs.price):null
    const earningsTarget=earningsAssumptions?priceTarget(earningsAssumptions,inputs.price):null
    return {name,customised:Object.keys(user).length>0,cashAssumptions,earningsAssumptions,cashTarget,earningsTarget}
  })
  return {inputs,scenarios,years,targetDate:inputs.price?targetDate(company.quote.asOf,years):null,multiples,central,
    orderChanged:['cashTarget','earningsTarget'].some(key=>scenarios.some((s,i)=>i>0&&s[key]&&scenarios[i-1][key]&&s[key].value<scenarios[i-1][key].value)),
    growthSource:{cash:'Croissance annualisée du FCF/action publié sur les exercices comparables',earnings:'Croissance annuelle du BPA sur cinq ans estimée par Finviz'},
    rules:'Scénario central : croissance disponible bornée entre −30 et +30 % par an et multiple actuel maintenu. Prudent / favorable : croissance −/+3 points et multiple actuel −/+20 %. Ces écarts sont des conventions modifiables, pas des probabilités ni des objectifs d’analystes.',
    note:'Objectif futur = BPA ou FCF/action projeté × multiple de sortie. Potentiel et progression annualisée du cours hors dividendes, frais et fiscalité. FCF : nombre d’actions constant. Les estimations de BPA peuvent utiliser une base différente des comptes publiés.'}
}
export function targetReading(model,index=1,method='earnings') {
  const scenario=model?.scenarios[index],cash=method==='cash'
  const a=cash?scenario?.cashAssumptions:scenario?.earningsAssumptions, result=cash?scenario?.cashTarget:scenario?.earningsTarget
  if(!a||!result)return null
  const sourceGrowth=cash?model.inputs.historicalGrowth:model.inputs.estimatedGrowth
  const lowerMultiple=Math.max(.01,a.multiple*.8),upperMultiple=Math.min(500,a.multiple*1.2)
  const low=priceTarget({...a,multiple:lowerMultiple},model.inputs.price).value,high=priceTarget({...a,multiple:upperMultiple},model.inputs.price).value
  return {...result,
    title:`À ${model.years} an${model.years>1?'s':''}, ce scénario donne un potentiel de ${signed(result.upside)}.`,
    explanation:`L’objectif au ${dateLabel(model.targetDate)} repose sur ${n(a.growth*100)} % de croissance annuelle ${cash?'du FCF par action':'du bénéfice par action'} et un multiple de sortie de ${n(a.multiple)}.`,
    expectation:`Cela correspond à ${signed(result.annualised)} par an pour le cours, hors dividendes. La trajectoire reste hypothétique.`,
    historical:`Point de départ automatique : ${n(sourceGrowth*100)} % de croissance ${cash?'historique du FCF/action':'annuelle du BPA estimée sur cinq ans'} ; multiple actuel de ${n(model.multiples[method])}. La croissance automatique est bornée à ±30 %.`,
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
      return {time:Date.parse(date),end:date,label:dateLabel(date),value:a.base*(1+a.growth)**t*multiple}
    })]}]
  })
  return {history,forecast,unit:company.currency,title:'Cours et objectifs',
    caption:`${valid?'Trait plein : clôtures hebdomadaires':'Point initial : dernière clôture'} · pointillés : trajectoires hypothétiques, hors dividendes.`,
    historyLabel:'Cours de clôture',hasPriceHistory:valid}
}
