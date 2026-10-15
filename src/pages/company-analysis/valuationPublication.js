import { targetExplanation } from './targetExplanation.js'
import { buildPriceScenarios, targetChart, targetReading } from './priceTargets.js'
import { formatValue as n } from './valuationPresentation.js'
import { calculatedRatios } from './lib.js'
import { valuationTweet } from './valuationTweet.js'
export function valuationPublication(company,overrides,selected,method,now=new Date(),years=5) {
  if(!['cash','earnings'].includes(method)||![0,1,2].includes(selected))throw new Error('Choisis un modèle et un scénario disponibles.')
  const model=buildPriceScenarios(company,overrides,now,years),cash=method==='cash'
  if(!(cash?model.inputs.cashReady:model.inputs.earningsReady))throw new Error('Les données de ce modèle sont incomplètes ou trop anciennes pour publier.')
  const reading=targetReading(model,selected,method),scenario=model.scenarios[selected],assumptions=cash?scenario.cashAssumptions:scenario.earningsAssumptions
  const explanation=targetExplanation(company,model,selected,method)
  const currency=company.currency,price=model.inputs.price
  const metrics=[
    {label:'PER',value:n(model.inputs.pe),hint:calculatedRatios(company,now).peTTM?'Bénéfices sur 12 mois':`Exercice ${company.annual.end.slice(0,4)}`},
    {label:'PER prév. ajusté',value:n(model.evidence.earnings?price/model.evidence.earnings.base:null),hint:'Base du modèle bénéfices'},
    {label:'FCF / action',value:Number.isFinite(model.inputs.reportedCashPerShare)?`${n(model.inputs.reportedCashPerShare,2)} ${currency}`:'—',hint:`Exercice ${company.annual.end.slice(0,4)}`},
    {label:'Rendement FCF',value:Number.isFinite(model.inputs.reportedCashPerShare)?`${n(model.inputs.reportedCashPerShare/price*100)} %`:'—',hint:'FCF annuel / cours'},
  ]
  const scenarios=model.scenarios.map(s=>({name:s.name,customised:s.customised,...(cash?s.cashTarget:s.earningsTarget),assumptions:cash?s.cashAssumptions:s.earningsAssumptions}))
  const text=valuationTweet(company,model)
  return {name:company.name,symbol:company.symbol,currency,quoteDate:company.quote.asOf,price,method,selected,years,targetDate:model.targetDate,
    metrics,scenarios,reading,explanation,assumptions,chart:targetChart(company,model,method),text,
    filename:`objectifs-${company.id}-${method}-${years}ans-${scenario.name.toLowerCase()}-${company.quote.asOf}.png`}
}

