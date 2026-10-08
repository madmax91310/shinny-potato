import assert from 'node:assert/strict'
import { SCPI } from '../src/data/scpi.js'
import { DATA_CATALOG, searchData } from '../src/data/catalog.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'
import { buildTweet, allocation } from '../src/pages/scpi-presentation/lib.js'
assert.equal(SCPI.length, 8)
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
  assert(DATA_CATALOG.find(row => row.id === `scpi:${record.id}`).fields.length >= 4)
}
assert(buildTweet(SCPI[0]).includes('14,4 % TTC'))
assert(buildTweet(SCPI[0]).includes('date des graphiques non précisée'))
assert(allocation([{label:'A',value:20},{label:'B',value:30},{label:'C',value:40},{label:'D',value:10}]).endsWith('autres 10 %'))
const changed = structuredClone(SCPI.find(row => row.id === 'remake-live'))
changed.snapshot.countries = [{ label: 'France', value: 60 }, { label: 'Allemagne', value: 40 }]
assert(buildTweet(changed).includes('France représente 60 %'))
assert(!buildTweet(changed).includes('marché britannique'))
console.log('SCPI: shared observations, differentiated tweets, fees, dates and catalogue OK.')

const corumXl = SCPI.find(row => row.id === 'corum-xl')
assert(buildTweet(corumXl).includes('12,4 % TTC en zone euro et 15,9 % TTC hors zone euro'))

for (const record of SCPI) {
  assert(record.portfolio?.buildings && record.portfolio?.occupancy)
  assert(buildTweet(record).includes('Taux d’occupation financier'))
  const changed=structuredClone(record)
  changed.portfolio.buildings.value=321
  changed.portfolio.occupancy.value=91.25
  assert(buildTweet(changed).includes('321 au') && buildTweet(changed).includes('91,25 %'))
}
const activimmo=SCPI.find(row => row.id === 'activimmo')
assert.equal(activimmo.price.asOf,'2026-07-01')
assert(buildTweet(activimmo).includes('613,5 €') && buildTweet(activimmo).includes('10,6 % HT'))
assert(buildTweet(activimmo).includes('2025') && buildTweet(activimmo).includes('2026'))
assert.equal(SCPI.find(row => row.id === 'corum-eurion').snapshot.asOf,'2026-06-30')

const epargne=SCPI.find(row => row.id === 'epargne-pierre')
assert(buildTweet(epargne).includes('ne représente pas une baisse de valeur'))
assert(!buildTweet(epargne).includes('208 € au 31/12/2023 → 20,8'))
assert(buildTweet(epargne).includes('📍 En France'))
const remake=SCPI.find(row => row.id === 'remake-live')
assert(remake.priceHistory.years.some(row => row.asOf === '2024-12-31'))
assert(!remake.priceHistory.years.some(row => row.asOf === '2025-12-31'))

const waiting = structuredClone(SCPI[0])
waiting.annual.publication = {latestPublishedYear:2025,expectedYear:2026,awaitingPublication:true}
assert(buildTweet(waiting).includes('Dernier exercice publié : 2025'))
assert(buildTweet(waiting).includes('Les chiffres 2026 restent en attente'))
assert(!buildTweet(waiting).includes('2026 :'))
