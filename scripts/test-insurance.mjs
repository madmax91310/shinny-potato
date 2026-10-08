import assert from 'node:assert/strict'
import { HOME_TOOLS, WEEKLY_ORDER } from '../src/tools.js'
import { INSURANCE } from '../src/data/insurance.js'
import { buildTweet } from '../src/pages/insurance-presentation/lib.js'
import { searchData } from '../src/data/catalog.js'
assert.equal(INSURANCE.length, 4)
assert(HOME_TOOLS.some(tool => tool.to === '/presentation-assurance-vie'))
assert(WEEKLY_ORDER.includes('/presentation-assurance-vie'))
for (const record of INSURANCE) {
  const text = buildTweet(record)
  assert(!/undefined|NaN|Infinity/.test(text))
  assert(text.includes(record.name) && text.includes(record.insurer))
  assert(text.includes('Les offres de bonus ne sont pas intégrées'))
  assert(text.includes('risque de perte en capital'))
  assert(searchData(record.name, 'insurance').some(row => row.id === `insurance:${record.id}`))
  const changed = structuredClone(record)
  changed.fees.units = 0.77
  changed.euroFunds[0].years.at(-1).return = 3.88
  changed.euroFunds[0].guarantee = 96
  changed.euroFunds[0].maxAllocation = 80
  const updated = buildTweet(changed)
  assert(updated.includes('0,77 %/an') && updated.includes('3,88 %') && updated.includes('Garantie annuelle : 96 %') && updated.includes('Jusqu’à 80 %'))
}
const spirit = buildTweet(INSURANCE.find(row => row.id === 'linxea-spirit-2'))
const avenir = buildTweet(INSURANCE.find(row => row.id === 'linxea-avenir-2'))
assert(spirit.includes('0,06 % par opération') && spirit.includes('3,26 %'))
assert(avenir.includes('0,1 % par opération') && avenir.includes('Au moins 30 %'))
console.log('Insurance: shared records, changed fees/returns/conditions and contract catalogue OK.')

const vie=INSURANCE.find(row => row.id === 'linxea-vie')
assert(buildTweet(vie).includes('3,1 à 4,12 % (selon la part UC détenue)'))
assert(buildTweet(vie).includes('31/12/2026') && buildTweet(vie).includes('25000 €'))
assert(buildTweet(vie).includes('La garantie nette annuelle n’est pas chiffrée'))
const zen=INSURANCE.find(row => row.id === 'linxea-zen')
assert(buildTweet(zen).includes('2 % de pénalité') && buildTweet(zen).includes('rachat total'))
