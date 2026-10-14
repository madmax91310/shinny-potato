import { buildPriceScenarios, targetChart, targetReading } from './priceTargets.js'
import { formatValue as n } from './valuationPresentation.js'
import { dateLabel, calculatedRatios } from './lib.js'
const signed=v=>`${v>=0?'+':'−'}${n(Math.abs(v)*100)} %`
export function valuationPublication(company,overrides,selected,method,now=new Date(),years=5) {
  if(!['cash','earnings'].includes(method)||![0,1,2].includes(selected))throw new Error('Choisis un modèle et un scénario disponibles.')
  const model=buildPriceScenarios(company,overrides,now,years),cash=method==='cash'
  if(!(cash?model.inputs.cashReady:model.inputs.earningsReady))throw new Error('Les données de ce modèle sont incomplètes ou trop anciennes pour publier.')
  const reading=targetReading(model,selected,method),scenario=model.scenarios[selected],assumptions=cash?scenario.cashAssumptions:scenario.earningsAssumptions
  const currency=company.currency,price=model.inputs.price
  const metrics=[
    {label:'PER',value:n(model.inputs.pe),hint:calculatedRatios(company,now).peTTM?'Bénéfices sur 12 mois':`Exercice ${company.annual.end.slice(0,4)}`},
    {label:'PER prév. ajusté',value:n(model.evidence.earnings?price/model.evidence.earnings.base:null),hint:'Base du modèle bénéfices'},
    {label:'FCF / action',value:model.inputs.cashReady?`${n(model.inputs.cashBase,2)} ${currency}`:'—',hint:`Exercice ${company.annual.end.slice(0,4)}`},
    {label:'Rendement FCF',value:model.inputs.cashReady?`${n(model.inputs.cashBase/price*100)} %`:'—',hint:'FCF annuel / cours'},
  ]
  const scenarios=model.scenarios.map(s=>({name:s.name,customised:s.customised,...(cash?s.cashTarget:s.earningsTarget),assumptions:cash?s.cashAssumptions:s.earningsAssumptions}))
  const text=[
    `Où pourrait être l’action ${company.name} dans ${years} an${years>1?'s':''} ?`,
    `Elle clôturait à ${n(price,2)} ${currency} le ${dateLabel(company.quote.asOf)}. Voici trois prévisions conditionnelles, calculées à partir ${cash?'du FCF par action publié':'de BPA ajustés prévisionnels comparables'}.`,
    `Objectifs au ${dateLabel(model.targetDate)} :\n${scenarios.map(s=>`${s.name} : ${n(s.value,2)} ${currency} (${signed(s.upside)}, soit ${signed(s.annualised)} / an)`).join('\n')}`,
    `Le scénario ${scenario.name.toLowerCase()} retient ${n(assumptions.growth*100)} % de croissance annualisée équivalente ${cash?'du FCF/action':'du BPA ajusté prévisionnel'} et un multiple de sortie de ${n(assumptions.multiple)}. Il donne un objectif de ${n(reading.value,2)} ${currency}.`,
    `${reading.historical}${model.orderChanged?' Avec ces réglages personnalisés, les objectifs ne suivent plus l’ordre prudent → central → favorable.':''}`,
    `À croissance identique, un multiple de sortie de ${n(reading.sensitivity.lowerMultiple)} à ${n(reading.sensitivity.upperMultiple)} ferait varier cet objectif de ${n(reading.sensitivity.low,2)} à ${n(reading.sensitivity.high,2)} ${currency}.`,
    'Potentiels et progressions annualisées du cours hors dividendes. Les écarts entre scénarios sont des hypothèses, pas des probabilités ni un consensus d’analystes.',
    `Source : ${model.evidence[method].sourceUrl} · données du ${dateLabel(model.evidence[method].asOf)}.`,
    cash?model.evidence.cash.drivers.limits:'Le BPA ajusté et le PER prévisionnel ajusté sont distincts des ratios sur bénéfices publiés.',
    'Ces prévisions dépendent des hypothèses retenues. Pas un conseil financier.',
  ].join('\n\n')
  return {name:company.name,symbol:company.symbol,currency,quoteDate:company.quote.asOf,price,method,selected,years,targetDate:model.targetDate,
    metrics,scenarios,reading,assumptions,chart:targetChart(company,model,method),text,
    filename:`objectifs-${company.id}-${method}-${years}ans-${scenario.name.toLowerCase()}-${company.quote.asOf}.png`}
}
