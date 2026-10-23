import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { getInstrumentFacts } from '../../data/instrument-facts.js'
import { frenchCharacteristic, frenchLocation } from '../../data/french-characteristics.js'
import { holdingConcentration } from '../../data/exposure-observations.js'

const date = value => value.split('-').reverse().join('/')
const dated = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '')
const pct = value => `${value.toLocaleString('fr-FR', {maximumFractionDigits:2})} %`
const synthetic = facts => /swap|synthet|indirect|hybrid/i.test(facts.replicationMethod ?? '')
const clean = value => (value ?? '').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim()
const normalized = value => clean(value).toLocaleLowerCase('fr-FR').replace(/[^\p{L}\p{N}]/gu,'')
const excluded = /cash|derivative|liquidit|^autres$|^others?$|unassigned/i
const names = {'COINBASE GLOBAL CLASS A':'Coinbase', 'CIRCLE INTERNET GROUP INC CLASS A':'Circle', 'TAIWAN SEMICONDUCTOR MANUFACTURING':'TSMC'}
const holdingName = name => names[name] ?? clean(name)

// Les titres du panier de substitution ne décrivent pas l'exposition d'un swap.
export function presentationComposition(record, facts) {
  const observation = record?.holdings
  const usable = observation && (['index','tracked-index'].includes(observation.basis) || (!synthetic(facts) && observation.basis === 'fund'))
  const c = usable ? holdingConcentration(record) : null
  if (!c) return ''
  const scope = c.basis === 'index' ? 'de l’indice suivi' : 'du fonds'
  const positions = c.top.map(row => `${holdingName(row.name)} (${pct(row.weightPct)})`).join(', ')
  return `Au ${date(c.asOf)}, les trois premières positions publiées ${scope} sont ${positions}. Ensemble, ces lignes pèsent ${pct(c.weight)}.`
}

export function presentationCountries(record, facts) {
  const observation = record?.countries
  if (!dated(observation?.asOf) || !observation.rows?.length) return ''
  if (synthetic(facts) && !['index','tracked-index'].includes(observation.basis)) return ''
  const rows = observation.rows.filter(row => row.name && !excluded.test(row.name) && Number.isFinite(row.weightPct) && row.weightPct > 0 && row.weightPct <= 100)
    .sort((a,b) => b.weightPct-a.weightPct).slice(0,3)
  if (!rows.length) return ''
  const scope = ['index','tracked-index'].includes(observation.basis) ? 'de l’indice' : 'du fonds'
  return `Répartition par pays publiée ${scope} au ${date(observation.asOf)} : ${rows.map(row => `${frenchCharacteristic(row.name)} ${pct(row.weightPct)}`).join(' · ')}.`
}

export function completePresentation(copy) {
  const facts = getInstrumentFacts(copy.isin)
  const record = AUTOMATED_ETF[copy.isin]
  const active = /active|sans indice|comparaison/i.test(facts.replicationMethod+' '+facts.benchmark)
  const benchmark = clean(record?.characteristics?.index || facts.benchmark)
  const intro = benchmark && !active && !normalized(copy.whatIs).includes(normalized(benchmark).replace(/index(?:usd|eur)?$/,''))
    ? `Indice suivi : ${benchmark}.\n\n` : ''
  const description = synthetic(facts) ? copy.whatIs.replace(/Tu détiens /g, 'Tu t’exposes à ') : copy.whatIs
  const swap = synthetic(facts) && !/swap|contrat d’échange/i.test(description) ? 'La performance est obtenue en tout ou partie par un swap, un contrat d’échange de performances. Les titres du panier de substitution ne sont pas nécessairement ceux de l’indice.' : ''
  const paragraphs = [intro+description, swap, presentationCountries(record,facts), presentationComposition(record,facts)]
  const count = record?.metrics?.numHoldings
  const positions = Number.isInteger(count?.value) && count.value > 0 && dated(count.asOf) && count.sourceUrl && (!facts.positionsAsOf || count.asOf>=facts.positionsAsOf)
    ? `${count.value.toLocaleString('fr-FR')} positions hors liquidités et dérivés au ${date(count.asOf)}`
    : /\d/.test(copy.positions ?? '') && facts.positionsAsOf ? copy.positions : null
  const hedge = facts.currencyHedge === true ? 'Couverture de change' : facts.currencyHedge === false ? 'Sans couverture de change' : null
  // Le domicile est une donnée de structure, la devise de part une unité comptable.
  const location = [facts.domicile && frenchCharacteristic(facts.domicile),facts.replicationMethod && frenchCharacteristic(facts.replicationMethod)].filter(Boolean).join(' · ')
  const duration = record?.metrics?.modelOad
  const riskMetric = Number.isFinite(duration?.value) && duration.value >= 0 && dated(duration.asOf) && duration.sourceUrl
    ? `Duration effective : ${duration.value.toLocaleString('fr-FR',{maximumFractionDigits:2})} ans au ${date(duration.asOf)}. Elle mesure la sensibilité aux taux, pas une durée minimale de détention.` : ''
  const swapFee = record?.characteristics?.annualSwapRatePct
  return {...copy,presentationCompleted:true,riskMetric,whatIs:paragraphs.filter(Boolean).join('\n\n'),positions,
    aum:copy.aum,domicile:facts.domicile??null,replicationMethod:facts.replicationMethod??null,location:location || (copy.location ? frenchLocation(copy.location) : null),
    shareCurrency:record?.currency ?? null,currencyHedge:hedge,
    feeLabel:Number.isFinite(swapFee)?'Frais de gestion annuels':'Frais annuels',
    swapFee:Number.isFinite(swapFee)?`${pct(swapFee)} par an, en plus des frais de gestion`:null,
  }
}
