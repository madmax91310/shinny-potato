import assert from 'node:assert/strict'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { groupTweetVariants, curateTweet } from '../src/lib/tweet-discovery.js'
import { contentValidity } from '../src/pages/tweet-bank/validity.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { getInstrumentPeaStatus } from '../src/data/instruments.js'
import { holdingName, presentationComposition } from '../src/pages/etf-sheets/presentationDetails.js'
import { anniversaryResult } from '../src/pages/tweet-midi/anniversaryEditorial.js'
import { ALL_CATEGORIES, RANKING_ASSETS, ANNUAL_ASSETS } from '../src/pages/performance-rankings/data.js'
import { selectionCategoryLabel, selectionAssetLabel } from '../src/pages/performance-rankings/selectionLabels.js'
const guides = TWEETS.filter(t => curateTweet(t).category === 'Guide ETF')
const groups = groupTweetVariants(guides)
for (const guide of guides) {
  assert(!/undefined|\bNaN\b/.test(guide.text), String(guide.id))
  if ([10,17,21,27,32,48].includes(guide.id)) {
    const isins = [...new Set(guide.text.match(/\b[A-Z]{2}[A-Z0-9]{9}\d\b/g))]
    for (const isin of isins) {
      const segment = guide.text.split(isin)[1].split('\n\n')[0]
      const fee = AUTOMATED_ETF[isin].characteristics.terPct.toLocaleString('fr-FR', {maximumFractionDigits:2})
      assert(segment.includes(`Frais annuels : ${fee} %`), `${guide.id}/${isin}`)
      if (segment.includes('éligible au PEA')) assert.equal(getInstrumentPeaStatus(isin), true)
    }
    assert(guide.sources.length > 0)
  }
  if (guide.image) assert(guide.reviewRestriction && guide.image.note, 'Les images non complètement qualifiées restent des archives explicites')
}
const revised = TWEETS.find(t => t.id === 10)
const oldDraft = {text:'Ancien texte personnalisé',asOf:'2026-11-07',checkedAt:'2026-11-07',verifiedText:'Ancien texte personnalisé',verifiedAsOf:'2026-11-07'}
assert.equal(contentValidity(revised,oldDraft,'2026-11-08').ready,false,'La revue du nouveau guide ne prolonge pas celle d’un ancien brouillon')
const old = TWEETS.find(t => t.id === 37)
assert.match(old.text, /Archive classée « Août 2026 »/)
assert(!contentValidity(old, null, '2026-11-08').ready)
const universe = {...RANKING_ASSETS, ...ANNUAL_ASSETS}
for (const category of ALL_CATEGORIES) {
  assert(!/calendriers NAV|du registre/.test(selectionCategoryLabel(category)))
  assert(category.ids.every(id => universe[id]), category.id)
}
for (const asset of Object.values(universe)) assert(!/ · VL\b/.test(selectionAssetLabel(asset)))
assert.equal(holdingName('APPLE INC'), 'Apple')
assert.equal(holdingName('ALPHABET INC CLASS A'), 'Alphabet (classe A)')
assert.equal(holdingName('ALPHABET INC CLASS C'), 'Alphabet (classe C)')
assert.equal(holdingName('SAP SE'), 'SAP SE')
const record = {holdings:{asOf:'2026-10-30',basis:'fund',rows:[{name:'APPLE INC',weightPct:30},{name:'ALPHABET INC CLASS A',weightPct:20},{name:'ALPHABET INC CLASS C',weightPct:10}]}}
const before = structuredClone(record)
assert.match(presentationComposition(record,{replicationMethod:'Physical'}), /Apple \(30 %\), Alphabet \(classe A\) \(20 %\), Alphabet \(classe C\) \(10 %\)/)
assert.deepEqual(record,before)
assert.equal(presentationComposition(record,{replicationMethod:'Synthetic swap'}), '')
const asset = {priceUnit:'USD'}
for (const [gain,formatted,expected] of [[-90,'−90 %','son prix a reculé de 90 %'],[0,'0 %','son prix est au même niveau'],[5,'+5 %','son prix a progressé de 5 %'],[100,'+100 %','son prix a doublé'],[200,'+200 %','son prix a triplé'],[300,'+300 %','son prix a quadruplé'],[638.9,'+638,9 %','son prix a été multiplié par environ 7,39'],[900,'+900 %','son prix a été multiplié par 10']]) assert.equal(anniversaryResult(asset,gain,formatted),expected)
assert.equal(anniversaryResult(asset,99.999,'+100 %'), 'son prix a presque doublé')
assert.equal(anniversaryResult(asset,100.001,'+100 %'), 'son prix a plus que doublé')
assert.equal(anniversaryResult(asset,-.001,'−0,0 %'), 'son prix a très légèrement reculé')
console.log(JSON.stringify({guideTexts:guides.length,guideGroups:groups.length,restrictedGroups:groups.filter(t => !contentValidity(t,null,'2026-11-08').ready).map(t=>t.id),comparisonSelections:ALL_CATEGORIES.length,rankingAssets:Object.keys(universe).length,editorialCases:true}))
