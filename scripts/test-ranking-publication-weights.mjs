import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { unqualifiedFundRankingWeights } from '../src/data/holding-weight-basis.js'
import { AUTOMATED_ETF, refreshFundDetails } from '../src/data/automated-etf.js'
import { holdingConcentration, concentrationCopy, comparisonConcentration } from '../src/data/exposure-observations.js'
import { presentationComposition } from '../src/pages/etf-sheets/presentationDetails.js'
import { getComparisonComposition } from '../src/pages/etf-tweets/lib/comparisonComposition.js'
import { buildComparisonEtfDetails } from '../src/pages/etf-tweets/lib/comparisonDetails.js'

const old={sourceUrl:'https://dataspanapi.wisdomtree.com/funddetails/rankings/?ticker=WTAI%20LN&isoCode=en-GB',basis:'fund',asOf:'2026-11-09',rankClassificationID:1,scope:'top-10',rows:[{name:'A',weightPct:20},{name:'B',weightPct:15},{name:'C',weightPct:10}]}
assert(unqualifiedFundRankingWeights(old),'Retained reports without the new tag remain identifiable')
assert(unqualifiedFundRankingWeights({...old,rankClassificationID:undefined,weightBasis:'issuer-fund-ranking-unqualified-nav-denominator'}))
assert.equal(holdingConcentration({holdings:old}),null)
assert.equal(concentrationCopy({holdings:old}),'')
assert.equal(presentationComposition({holdings:old},{replicationMethod:'physical'}),'')
assert.equal(comparisonConcentration([{isin:'a'},{isin:'b'}],{a:{holdings:old},b:{holdings:old}}),'')
const independent={...old,rankClassificationID:undefined}
assert.equal(holdingConcentration({holdings:independent}).weight,45,'Other qualified source conventions retain their established contract')
const native=JSON.parse(readFileSync(new URL('./fixtures/wisdomtree-ranking-basis-20261110/native-qualified.json',import.meta.url)))
assert(!unqualifiedFundRankingWeights(native),'A distinctly qualified native book remains usable')
assert(holdingConcentration({holdings:native}), 'The valid native denominator still admits concentration')
assert(!unqualifiedFundRankingWeights({...old,sourceUrl:'https://another-issuer.example/holdings'}),'An unrelated issuer classification number does not prove a WisdomTree Fund ranking')
let affected=[]
for(const[isin,r]of Object.entries(AUTOMATED_ETF)){
 if(!unqualifiedFundRankingWeights(r.holdings))continue
 const before=JSON.stringify(r),details=refreshFundDetails(isin,{holdings:[['Undocumented fallback',9]]})
 assert.deepEqual(details.holdings,[],'No manual fallback may disguise the rejected ranking')
 assert.equal(holdingConcentration(r),null)
 assert.equal(presentationComposition(r,{replicationMethod:'physical'}),'')
 assert.deepEqual(getComparisonComposition(isin,'holdings').rows,[])
 assert(!buildComparisonEtfDetails({isin,nom:isin},[]).some(t=>/Principales positions du fonds/.test(t)))
 if(r.countries)assert.equal(details.countries.length,r.countries.rows.length,'Country capabilities remain separate')
 if(r.sectors)assert.equal(details.sectors.length,r.sectors.rows.length,'Sector capabilities remain separate')
 assert.equal(JSON.stringify(r),before,'Source rows, dates and weights are retained intact')
 affected.push(isin)
}
const retained=JSON.parse(readFileSync(new URL('./fixtures/wisdomtree-ranking-basis-20261110/rankings-retained.json',import.meta.url)))
assert(unqualifiedFundRankingWeights(retained),'The acquired real ranking remains refused independently of future live-registry updates')
assert.equal(holdingConcentration({holdings:retained}),null)
assert.equal(presentationComposition({holdings:retained},{replicationMethod:'physical'}),'')
// The loop above exercises every current affected consumer. A later qualified
// issuer PDF/native response must not be forced to remain a rejected ranking.
console.log('Publication weight basis: original ranked data retained; unsafe fund concentration, comparison text and image rows refused for '+affected.join(', ')+'; independent fields preserved.')
