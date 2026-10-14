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
    {label:'FCF / action',value:model.inputs.cashReady?`${n(model.inputs.cashBase,2)} ${currency}`:'—',hint:`Exercice ${company.annual.end.slice(0,4)}`},
    {label:'Rendement FCF',value:model.inputs.cashReady?`${n(model.inputs.cashBase/price*100)} %`:'—',hint:'FCF annuel / cours'},
  ]
  const scenarios=model.scenarios.map(s=>({name:s.name,customised:s.customised,...(cash?s.cashTarget:s.earningsTarget),assumptions:cash?s.cashAssumptions:s.earningsAssumptions}))
  // Export a readable investment argument; the screen keeps the full audit trail.
  const unit=cash?'trésorerie disponible par action après investissements':'bénéfice ajusté par action'
  const watch=company.watch?.replace(/\.$/,'')
  const text=[
    `${company.name} : quel cours dans ${years} an${years>1?'s':''} ?`,
    company.activity,
    `Point de départ : ${n(price,2)} ${currency} à la clôture du ${dateLabel(company.quote.asOf)}.`,
    `Trois scénarios au ${dateLabel(model.targetDate)} :\n${scenarios.map(s=>`${s.name} : ${n(s.value,2)} ${currency} (${signed(s.upside)})`).join('\n')}`,
    `Dans le scénario ${scenario.name.toLowerCase()}, ${cash?'la '+unit:'le '+unit} évolue de ${signed(assumptions.growth)} par an en moyenne. À l’échéance, le marché paierait ${n(assumptions.multiple)} fois ${cash?'ce montant':'le bénéfice ajusté attendu'}. Cela correspond à ${signed(reading.annualised)} par an pour le cours, hors dividendes.`,
    explanation.summary,
    `Ce qui peut changer le résultat : à croissance identique, une valorisation de ${n(reading.sensitivity.lowerMultiple)} à ${n(reading.sensitivity.upperMultiple)} fois ${cash?'la trésorerie par action':'le bénéfice ajusté'} donne un objectif compris entre ${n(reading.sensitivity.low,2)} et ${n(reading.sensitivity.high,2)} ${currency}.`,
    watch?`${watch}.`:company.editorialQuestion,
    explanation.coverage,
    scenario.customised?'Les hypothèses de ce scénario ont été personnalisées.':null,
    model.orderChanged?'Les réglages personnalisés ont modifié l’ordre des objectifs.':null,
    cash?`Comptes : ${company.annual.sourceUrl} · exercice clos le ${dateLabel(company.annual.end)}.`:null,
    `Source du modèle : ${model.evidence[method].sourceUrl} · données du ${dateLabel(model.evidence[method].asOf)}.`,
    'Ces scénarios dépendent des hypothèses retenues ; ils ne mesurent pas des probabilités. Pas un conseil financier.',
  ].filter(Boolean).join('\n\n')
  return {name:company.name,symbol:company.symbol,currency,quoteDate:company.quote.asOf,price,method,selected,years,targetDate:model.targetDate,
    metrics,scenarios,reading,explanation,assumptions,chart:targetChart(company,model,method),text,
    filename:`objectifs-${company.id}-${method}-${years}ans-${scenario.name.toLowerCase()}-${company.quote.asOf}.png`}
}
