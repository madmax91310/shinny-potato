import { ROUTING_PRESENTATIONS } from './routing-presentations.js'
import { AUTOMATED_ETF } from './automated-etf.js'
import { frenchCharacteristic } from './french-characteristics.js'
// Only observed structural fields are published. No domicile inferred from ISIN,
// no ETF replication inferred from its benchmark or collateral holdings.
const policies = new Map([
 ['Capitalisation',['accumulating','Capitalisant']], ['Accumulation',['accumulating','Capitalisant']],
 ['Accumulating',['accumulating','Capitalisant']], ['Capitalizing',['accumulating','Capitalisant']],
 ['Distributing',['distributing','Distribuant']], ['Distribution',['distributing','Distribuant']],
 ['Capitalisation and/or distribution',['capitalisation-and-or-distribution','Capitalisation et/ou distribution']],
 ['No Income',['none','Aucun revenu distribué']],
])
export const ROUTING_PRESENTATION_FACTS = Object.fromEntries(ROUTING_PRESENTATIONS.map(row => {
 const record = AUTOMATED_ETF[row.isin], c = record.characteristics
 const [incomePolicy, distribution] = policies.get(c.distribution) ?? [null,null]
 const benchmark = c.index?.replace(/<[^>]*>/g,'') || null
 const source = {url:c.sourceUrl??record.sourceUrl,checkedAt:c.checkedAt,...(c.asOf?{asOf:c.asOf}:{})}
 const location = [c.domicile,c.replicationMethod].filter(Boolean).map(frenchCharacteristic).join(', ') || null
 return [row.isin,{benchmark, incomePolicy, distribution, location, domicile:c.domicile??null,
  replicationMethod:c.replicationMethod??null, positionsLabel:benchmark?`Exposition suivie : ${benchmark}`:row.verdict,
  instrumentType:/\bETC\b|Copper/.test(row.whatIs+' '+row.hook)?'ETC':'ETF',
  reviewedAt:c.checkedAt.split('-').reverse().join('/'), characteristicsSource:source,
  observedFields:['index','distribution','domicile','replicationMethod'].filter(key=>c[key]!=null),
 }]
}))
