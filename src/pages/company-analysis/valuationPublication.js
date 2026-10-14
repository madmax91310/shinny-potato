import { buildScenarios } from './valuation.js'
import { valuationChart, valuationReading, formatValue as n } from './valuationPresentation.js'
import { dateLabel, calculatedRatios } from './lib.js'

// One immutable publication snapshot drives text, image and download.
// Rebuild at export time so an old open tab cannot publish expired observations.
export function valuationPublication(company, overrides, selected, method, now = new Date()) {
  if (!['cash','earnings'].includes(method) || ![0,1,2].includes(selected)) throw new Error('Choisis un modèle et un scénario disponibles.')
  const model = buildScenarios(company, overrides, now), cash = method === 'cash'
  if (!(cash ? model.inputs.cashReady : model.inputs.earningsReady)) throw new Error('Les données de ce modèle sont incomplètes ou trop anciennes pour publier.')
  const reading = valuationReading(model, selected, method), scenario = model.scenarios[selected]
  const assumptions = cash ? scenario.cashAssumptions : scenario.earningsAssumptions
  const currency = company.currency, price = model.inputs.price
  const metrics = [
    {label:'PER', value:n(model.inputs.pe), hint:calculatedRatios(company,now).peTTM ? 'Bénéfices sur 12 mois' : `Exercice ${company.annual.end.slice(0,4)}`},
    {label:'PER forward', value:n(model.inputs.forwardPE), hint:'Prochain exercice estimé'},
    {label:'FCF / action', value:model.inputs.cashReady ? `${n(model.inputs.cashBase,2)} ${currency}` : '—', hint:`Exercice ${company.annual.end.slice(0,4)}`},
    {label:'Rendement FCF', value:model.inputs.cashReady ? `${n(model.inputs.cashBase/price*100)} %` : '—', hint:'FCF annuel / cours'},
  ]
  const scenarios = model.scenarios.map(s => ({name:s.name, value:cash?s.cash.value:s.earnings, assumptions:cash?s.cashAssumptions:s.earningsAssumptions}))
  const text = [
    `${company.name} à ${n(price,2)} ${currency} : ${cash?'quelle croissance faudrait-il pour justifier ce prix ?':'que donnent mes hypothèses de valorisation ?'}`,
    `Clôture du ${dateLabel(company.quote.asOf)}. Je regarde ici ${cash?'le FCF par action':'les bénéfices par action'}, avec trois scénarios de simulation.`,
    `${metrics.filter(m=>m.value!=='—').map(m=>`${m.label} : ${m.value}`).join(' · ')}.`,
    scenarios.map(s=>`${s.name} : ${n(s.value,2)} ${currency} par action`).join('\n'),
    `Le scénario ${scenario.name.toLowerCase()} retient ${n(assumptions.growth*100)} % de croissance par an pendant ${assumptions.years} ans, un multiple de sortie de ${n(assumptions.multiple)} et un rendement exigé de ${n(assumptions.discount*100)} %.`,
    reading.title.replace('tes hypothèses','ces hypothèses'),
    reading.expectation,
    `Avec un multiple de sortie de ${n(reading.sensitivity.lowerMultiple)} à ${n(reading.sensitivity.upperMultiple)}, la valeur passe de ${n(reading.sensitivity.low,2)} à ${n(reading.sensitivity.high,2)} ${currency}, toutes les autres hypothèses restant identiques.`,
    cash?'Modèle FCF simplifié : nombre d’actions constant, sans financement net par dette. Dividendes et trésorerie ne sont pas ajoutés.':'Modèle bénéfices : prix de revente actualisé, hors dividendes. La base des estimations peut différer des comptes publiés.',
    'Ces scénarios sont des hypothèses, pas des prévisions. Pas un conseil financier.',
  ].join('\n\n')
  return {name:company.name, symbol:company.symbol, currency, quoteDate:company.quote.asOf, price, method, selected,
    metrics, scenarios, reading, assumptions, chart:valuationChart(company,model,method,now), text,
    filename:`valorisation-${company.id}-${method}-${scenario.name.toLowerCase()}-${company.quote.asOf}.png`}
}
