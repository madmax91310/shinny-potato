import assert from 'node:assert/strict'
import { SCPI } from '../src/data/scpi.js'
import { DATA_CATALOG, searchData } from '../src/data/catalog.js'
import { TOOLS, HOME_TOOLS } from '../src/tools.js'
import { buildTweet, allocation, dateLabel, historyText, portfolioText } from '../src/pages/scpi-presentation/lib.js'
assert.equal(SCPI.length, 8)
assert.equal(HOME_TOOLS.filter(row => row.to === '/presentations').length, 1)
assert(TOOLS.find(row => row.to === '/presentations'))
for (const record of SCPI) {
  const text = buildTweet(record)
  assert(text.includes(record.name))
  assert(!/undefined|NaN|Infinity/.test(text))
  assert(text.includes('🌍') && text.includes('🏭') && text.includes('💸'))
  assert(text.endsWith('💬 Tu détiens déjà des SCPI ? Lesquelles ?'))
  assert(text.includes('brut de fiscalité étrangère'))
  assert.equal(record.annual.years.length, 3)
  assert(text.includes(String(record.annual.years.at(-1).year)))
  assert(text.length < 1600, record.id)
  assert(searchData(record.name).some(row => row.id === `scpi:${record.id}`))
  assert(DATA_CATALOG.find(row => row.id === `scpi:${record.id}`).fields.length >= 4)
}
const iroko=SCPI.find(row=>row.id==='iroko-zen')
assert.match(iroko.snapshot.asOf,/^\d{4}-(?:03-31|06-30|09-30|12-31)$/)
assert(buildTweet(iroko).includes(`Au ${dateLabel(iroko.snapshot.asOf)}`))
assert(!buildTweet(iroko).includes('date des graphiques non précisée'))
const undatedIroko=structuredClone(iroko);undatedIroko.snapshot.asOf=null
assert(buildTweet(undatedIroko).includes('date des graphiques non précisée'))
assert(allocation([{label:'A',value:20},{label:'B',value:30},{label:'C',value:40},{label:'D',value:10}]).endsWith('autres 10 %'))
const changed = structuredClone(SCPI.find(row => row.id === 'remake-live'))
changed.snapshot.countries = [{ label: 'France', value: 60 }, { label: 'Allemagne', value: 40 }]
assert(buildTweet(changed).includes('France 60 %'))
assert(!buildTweet(changed).includes('marché britannique'))
console.log('SCPI: shared observations, differentiated tweets, fees, dates and catalogue OK.')

// Consumer checks must allow valid new publications. Source fixtures separately
// verify exact historical figures and the collectors reject regressions/invalid data.
for (const record of SCPI) {
  assert(record.portfolio?.buildings && record.portfolio?.occupancy)
  assert.match(record.price.asOf,/^\d{4}-\d{2}-\d{2}$/)
  const next=structuredClone(record)
  next.snapshot.asOf='2026-09-30'
  next.snapshot.countries=[{label:'France',value:60},{label:'Allemagne',value:40}]
  next.conditions.minimum=3333
  next.conditions.subscriptionFee=8.88
  next.conditions.managementFee=13.37
  if (next.conditions.managementZones) next.conditions.managementZones={euro:11.11,outside:14.44}
  next.price.value=777.77
  next.annual.years=[{year:2024,distribution:5.01},{year:2025,distribution:5.02},{year:2026,distribution:5.03}]
  next.annual.publication={latestPublishedYear:2026,expectedYear:2026,awaitingPublication:false}
  next.portfolio.buildings.value=321
  next.portfolio.occupancy.value=91.25
  const text=buildTweet(next).replace(/[\u00a0\u202f]/g,' ')
  for (const expected of ['Au 30/09/2026','France 60 %','3 333 €','777,77 €','8,88 %','Taux de distribution 2026 : 5,03 %','91,25 %']) assert(text.includes(expected),`${record.id}: ${expected}`)
  if (next.conditions.managementZones) assert(text.includes('11,11 % TTC en zone euro et 14,44 % TTC hors zone euro'))
  else assert(text.includes('13,37 %'))
  assert(portfolioText(next).includes('321'))
}

const epargne=SCPI.find(row => row.id === 'epargne-pierre')
assert(buildTweet(epargne).includes('ne représente pas une baisse de valeur'))
assert(!buildTweet(epargne).includes('208 € au 31/12/2023 → 20,8'))
const remake=SCPI.find(row => row.id === 'remake-live')
assert(remake.priceHistory.years.length >= 3)
const rolledHistory=structuredClone(remake)
rolledHistory.priceHistory.years=[{asOf:'2025-12-31',value:204},{asOf:'2026-12-31',value:205},{asOf:'2027-12-31',value:206}]
assert(historyText(rolledHistory).includes('204 € au 31/12/2025 → 206 € au 31/12/2027'))

const waiting = structuredClone(SCPI[0])
waiting.annual.publication = {latestPublishedYear:2025,expectedYear:2026,awaitingPublication:true}
assert(buildTweet(waiting).includes('Dernier exercice publié : 2025'))
assert(buildTweet(waiting).includes('Les chiffres 2026 restent en attente'))
assert(!buildTweet(waiting).includes('2026 :'))
