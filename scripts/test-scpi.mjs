import assert from 'node:assert/strict'
import { SCPI } from '../src/data/scpi.js'
import { DATA_CATALOG, searchData } from '../src/data/catalog.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'
import { buildTweet, allocation } from '../src/pages/scpi-presentation/lib.js'
assert.equal(SCPI.length, 2)
assert.equal(HOME_TOOLS.filter(row => row.to === '/presentation-scpi').length, 1)
assert(TOOLS.find(row => row.to === '/presentation-scpi'))
for (const record of SCPI) {
  const text = buildTweet(record)
  assert(text.includes(record.name))
  assert(!/undefined|NaN|Infinity/.test(text))
  assert(text.includes('🌍') && text.includes('🏭') && text.includes('💸'))
  assert(text.endsWith('💬 Tu détiens déjà des SCPI ? Lesquelles ?'))
  assert(text.includes('bruts de fiscalité étrangère'))
  assert.equal(record.annual.years.length, 3)
  assert(text.includes('2025'))
  assert(searchData(record.name).some(row => row.id === `scpi:${record.id}`))
  assert(DATA_CATALOG.find(row => row.id === `scpi:${record.id}`).fields.length === 4)
}
assert(buildTweet(SCPI[0]).includes('14,4 % TTC'))
assert(buildTweet(SCPI[0]).includes('date des graphiques non précisée'))
assert(allocation([{label:'A',value:20},{label:'B',value:30},{label:'C',value:40},{label:'D',value:10}]).endsWith('autres 10 %'))
console.log('SCPI: shared observations, differentiated tweets, fees, dates and catalogue OK.')
