import { targetExplanation } from './targetExplanation.js'
import { buildPriceScenarios, targetChart, targetReading } from './priceTargets.js'
import { formatValue as n } from './valuationPresentation.js'
import { dateLabel, calculatedRatios } from './lib.js'
const signed=v=>`${v>=0?'+':'−'}${n(Math.abs(v)*100)} %`
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
  // Export a readable investment argument; the screen keeps the full audit trail.
  const unit=cash?'trésorerie disponible par action après investissements':'bénéfice ajusté par action'
  const growthText=Math.abs(assumptions.growth)<.00005?'reste stable':`${assumptions.growth<0?'recule':'progresse'} de ${n(Math.abs(assumptions.growth)*100)} % par an en moyenne`
  const watch=company.watch?.replace(/\.$/,'')
  const text=[
    `${company.name} : à quoi pourrait ressembler son cours dans ${years} an${years>1?'s':''} ?`,
    company.activity,
    `L’action clôturait à ${n(price,2)} ${currency} le ${dateLabel(company.quote.asOf)}. Pour regarder ce que ce prix suppose, voici trois trajectoires possibles.`,
    `Trois scénarios au ${dateLabel(model.targetDate)} :\n${scenarios.map(s=>`${s.name} : ${n(s.value,2)} ${currency} (${signed(s.upside)})`).join('\n')}`,
    `Le scénario ${scenario.name.toLowerCase()} suppose que ${cash?'la '+unit:'le '+unit} ${growthText}. Il retient aussi une valorisation de ${n(assumptions.multiple)} fois ${cash?'ce flux':'le bénéfice ajusté attendu'} à l’arrivée. Avec ces hypothèses, l’action atteindrait ${n(reading.value,2)} ${currency}, soit ${signed(reading.annualised)} par an pour le cours, hors dividendes.`,
    explanation.summary,
    `Le prix que le marché acceptera de payer compte aussi. Avec la même croissance, un multiple de ${n(reading.sensitivity.lowerMultiple)} au lieu de ${n(reading.sensitivity.upperMultiple)} ferait passer l’objectif de ${n(reading.sensitivity.high,2)} à ${n(reading.sensitivity.low,2)} ${currency}.`,
    watch?`${watch}.`:company.editorialQuestion,
    explanation.coverage,
    scenario.customised?'Les hypothèses de ce scénario ont été personnalisées.':null,
    model.orderChanged?'Les réglages personnalisés ont modifié l’ordre des objectifs.':null,
    cash?`Comptes : ${company.annual.sourceUrl} · exercice clos le ${dateLabel(company.annual.end)}.`:null,
    `Source du modèle : ${model.evidence[method].sourceUrl} · données du ${dateLabel(model.evidence[method].asOf)}.`,
    'Ce sont des scénarios, pas une promesse sur le cours futur. Pas un conseil financier.',
  ].filter(Boolean).join('\n\n')
  return {name:company.name,symbol:company.symbol,currency,quoteDate:company.quote.asOf,price,method,selected,years,targetDate:model.targetDate,
    metrics,scenarios,reading,explanation,assumptions,chart:targetChart(company,model,method),text,
    filename:`objectifs-${company.id}-${method}-${years}ans-${scenario.name.toLowerCase()}-${company.quote.asOf}.png`}
}

