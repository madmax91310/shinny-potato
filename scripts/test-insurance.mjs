import assert from 'node:assert/strict'
import { HOME_TOOLS, WEEKLY_ORDER } from '../src/tools.js'
import { INSURANCE } from '../src/data/insurance.js'
import { buildTweet } from '../src/pages/insurance-presentation/lib.js'
import { searchData } from '../src/data/catalog.js'
assert.equal(INSURANCE.length, 6)
assert(HOME_TOOLS.some(tool => tool.to === '/presentations'))
assert(WEEKLY_ORDER.includes('/presentations'))
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
assert.equal(vie.euroFunds.find(fund => fund.name === 'Eurossima').guarantee, 99.25)
assert(buildTweet(vie).includes('Minimum annuel calculé'))
const missingGuarantee = structuredClone(vie)
missingGuarantee.euroFunds.find(fund => fund.name === 'Eurossima').guarantee = null
assert(buildTweet(missingGuarantee).includes('La garantie nette annuelle n’est pas chiffrée'))
const zen=INSURANCE.find(row => row.id === 'linxea-zen')
assert(buildTweet(zen).includes('2 % de pénalité') && buildTweet(zen).includes('rachat total'))

const lucya=INSURANCE.find(row => row.id === 'lucya-cardif')
assert(buildTweet(lucya).includes('Au plus un tiers'))
assert(buildTweet(lucya).includes('quote-part maximale actuelle n’est pas chiffrée'))
assert(buildTweet(lucya).includes('Adhésion UFEP : 10 €'))
const placement=INSURANCE.find(row => row.id === 'placement-direct-vie')
assert(buildTweet(placement).includes('1,9 à 3,45 %'))
assert(buildTweet(placement).includes('selon la part d’unités de compte et l’encours'))
assert(buildTweet(placement).includes('0,8 %/an'))

assert(buildTweet(placement).includes('Garantie annuelle : 99,4 %'))
assert(buildTweet(placement).includes('plancher décès'))
assert(buildTweet(placement).includes('allocation déléguée : +0,4 %/an'))
assert(buildTweet(placement).includes('allocation opportunités 100 % Trackers : +0,7 %/an'))
const { fundAllocation, fundOperations } = await import('../src/pages/insurance-presentation/lib.js')
const datedAccess = vie.euroFunds.find(f => f.name === 'Netissima')
assert(fundAllocation(datedAccess, '2026-12-31').includes('100 %'))
assert(fundAllocation(datedAccess, '2027-01-01').includes('échues le 31/12/2026'))
assert.equal(fundOperations(datedAccess, '2027-01-01'), '')
assert(fundOperations({...datedAccess, accessValidUntil:'2027-12-31'}, '2027-01-01').includes('sans quota'))
const waiting = structuredClone(placement)
waiting.euroFunds[0].publication = {latestPublishedYear:2025,expectedYear:2026,awaitingPublication:true}
assert(buildTweet(waiting).includes('Les chiffres 2026 restent en attente'))
assert(!buildTweet(waiting).includes('2026 :'))
