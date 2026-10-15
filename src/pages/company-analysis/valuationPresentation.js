import { cashValue, earningsValue } from './valuation.js'
import { activeDecision } from './lib.js'

const valueFormats = new Map()
export const formatValue = (value, digits = 1) => {
  if (!Number.isFinite(value)) return '—'
  if (!valueFormats.has(digits)) valueFormats.set(digits,new Intl.NumberFormat('fr-FR',{maximumFractionDigits:digits}))
  return valueFormats.get(digits).format(value)
}
const pct = value => `${formatValue(value * 100)} %`

// Commentary is derived from exactly the model shown, never from a second forecast.
export function valuationReading(model, index = 1, method = 'cash') {
  const scenario = model?.scenarios[index]
  if (!scenario) return null
  const cash = method === 'cash', assumptions = cash ? scenario.cashAssumptions : scenario.earningsAssumptions
  const value = cash ? scenario.cash?.value : scenario.earnings
  if (!assumptions || !Number.isFinite(value) || !model.inputs.price) return null
  const delta = value / model.inputs.price - 1
  const valueFn = cash ? cashValue : earningsValue
  const evaluate = a => cash ? valueFn(a).value : valueFn(a)
  const lowerMultiple = Math.max(1, assumptions.multiple - 5), upperMultiple = Math.min(60, assumptions.multiple + 5)
  const low = evaluate({...assumptions, multiple: lowerMultiple}), high = evaluate({...assumptions, multiple: upperMultiple})
  const position = Math.abs(delta) < .005 ? 'proche du cours' : `${pct(Math.abs(delta))} ${delta > 0 ? 'au-dessus' : 'en dessous'} du cours`
  return {
    title: `Avec tes hypothèses, la valeur estimée est ${position}.`,
    explanation: `Le scénario ${scenario.name.toLowerCase()} retient ${pct(assumptions.growth)} de croissance annuelle ${cash ? 'du FCF par action' : 'du bénéfice par action'} pendant ${assumptions.years} ans, un multiple de sortie de ${formatValue(assumptions.multiple)} et un rendement exigé de ${pct(assumptions.discount)}.`,
    expectation: cash && scenario.requiredGrowth !== null
      ? `Pour retrouver le cours actuel avec ce rendement exigé et ce multiple, il faudrait ${pct(scenario.requiredGrowth)} de croissance annuelle du FCF. C’est une hypothèse implicite du modèle, pas une prévision du marché.`
      : cash ? 'Le cours ne peut pas être reproduit dans les bornes de croissance testées (−50 % à +50 %).' : 'Cette estimation représente un prix de revente actualisé. Elle exclut les dividendes et ne constitue pas un rendement total attendu.',
    historical: cash ? `Sur l’historique comparable disponible, le FCF par action a progressé de ${pct(model.inputs.historicalGrowth)} par an. Ce rythme passé ne garantit pas la croissance future.` : null,
    sensitivity: {low, high, lowerMultiple, upperMultiple},
    terminalShare: cash ? scenario.cash.terminalShare : null,
    delta, value,
  }
}

export function valuationChart(company, model, method = 'cash', now = new Date()) {
  let history = [], unit, title, forecast = []
  if (method === 'cash' && model?.inputs.cashReady) {
    history = model.inputs.history.map(p => ({...p, time: Date.parse(p.end), label: p.end}))
    unit = company.currency + ' / action'; title = 'FCF par action'
  } else if (method === 'earnings' && model?.inputs.earningsReady) {
    history = [{time:Date.parse(company.quote.asOf), value:model.inputs.eps, label:'BPA de départ', end:company.quote.asOf}]
    unit = company.currency + ' / action'; title = 'Bénéfice par action · projection'
  } else {
    history = (activeDecision(company, now)?.years ?? []).filter(p => Number.isFinite(p.freeCashFlow))
      .map(p => ({time:Date.parse(p.end), value:p.freeCashFlow / 1e9, label:p.end, end:p.end, sourceUrl:p.sourceUrl}))
    unit = 'Md ' + company.currency; title = 'FCF total publié'
  }
  if (history.length && ((method === 'cash' && model?.inputs.cashReady) || (method === 'earnings' && model?.inputs.earningsReady))) {
    const last = history.at(-1), anchor = {time:Date.parse(company.quote.asOf), value:last.value, label:'Base du modèle · '+company.quote.asOf}
    forecast = model.scenarios.map(s => {
      const a = method === 'cash' ? s.cashAssumptions : s.earningsAssumptions
      return {name:s.name, points:[...(last.time===anchor.time?[]:[last]), anchor, ...Array.from({length:a.years}, (_,i) => {
        const date = new Date(anchor.time); date.setUTCFullYear(date.getUTCFullYear()+i+1)
        return {time:date.getTime(), value:a.base*(1+a.growth)**(i+1), label:String(date.getUTCFullYear())}
      })]}
    })
  }
  return {history, forecast, unit, title}
}

export function chartGeometry(chart) {
  const points = [...chart.history, ...chart.forecast.flatMap(s=>s.points)]
  if (!points.length) return null
  const left=56, right=684, top=24, bottom=230
  let minTime=Math.min(...points.map(p=>p.time)), maxTime=Math.max(...points.map(p=>p.time))
  if (maxTime===minTime) maxTime+=365.25*86400000
  const min=Math.min(0,...points.map(p=>p.value)), max=Math.max(0,...points.map(p=>p.value))
  const span=max-min || 1, lo=min<0?min-span*.08:0, hi=max+span*.12
  const x=t=>left+(t-minTime)/(maxTime-minTime)*(right-left)
  const y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top)
  return {x,y,left,right,top,bottom,minTime,maxTime,
    ticks:Array.from({length:5},(_,i)=>lo+(hi-lo)*i/4),
    path:values=>values.map((p,i)=>`${i?'L':'M'}${x(p.time).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ')}
}
