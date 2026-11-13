import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { ASSETS } from '../src/data/market-history.js'
import { performanceBasis } from '../src/pages/tweet-midi/data/marketHistory.js'
import { derive } from '../src/pages/investment-calculator/lib.js'
const record=JSON.parse(readFileSync('src/data/automated-monthly.json')).nasdaq100
assert.equal(record.symbol,'XNDX')
assert.equal(record.variant,'TOTAL')
assert.equal(record.parser,'fred')
assert.match(performanceBasis('nasdaq100'),/dividendes bruts réinvestis/)
assert.match(ASSETS.nasdaq100.methodNote,/XNDX/)
const points=Object.fromEntries(record.points)
// Independent Nasdaq factsheet calendar figures, already collected by the annual pipeline.
const { INDEX_COMPARISON_RETURN_ADDITIONS } = await import('../src/data/index-comparison-return-additions.js')
for(const [year,expected] of INDEX_COMPARISON_RETURN_ADDITIONS['nasdaq-pea']['2025-12-31'].values) {
  assert(Math.abs((points[`${year}-12`]/points[`${year-1}-12`]-1)*100-expected)<.015)
}
const result=derive({assetId:'nasdaq100',amountRaw:'100',startYear:2020,startMonth:1,mode:'lump',overridePriceRaw:''})
assert(Math.abs(result.result.finalValue-100*record.points.at(-1)[1]/points['2020-01'])<1e-8)
console.log('XNDX: full monthly series, independent annual returns, text convention and simulation verified.')
const { resolveAnniversaryLevel }=await import('../src/data/anniversary-levels.js')
const daily=JSON.parse(readFileSync('src/data/anniversary-levels.json')).nasdaq100
// A source migration must preserve the index's financial identity, not the old
// provider's ticker spelling. Every admitted transport has its own full proof.
const FRED_URL='https://fred.stlouisfed.org/data/NASDAQXNDX'
const YAHOO_URLS=[
 'https://query1.finance.yahoo.com/v8/finance/chart/%5EXNDX?range=5d&interval=1d&includePrePost=false',
 'https://query2.finance.yahoo.com/v8/finance/chart/%5EXNDX?range=1d&interval=1d&includePrePost=false',
]
function qualifiedDaily(record){
 assert.equal(record.variant,'TOTAL')
 assert.equal(record.currency,'USD')
 assert.equal(record.maxAgeDays,7)
 assert(Number.isFinite(record.value)&&record.value>0)
 assert.match(record.asOf,/^\d{4}-\d{2}-\d{2}$/)
 assert.equal(new Date(record.asOf+'T00:00:00Z').toISOString().slice(0,10),record.asOf)
 assert(Number.isFinite(Date.parse(record.checkedAt)))
 if(record.parser==='fred-document'){
  assert.equal(record.symbol,'XNDX')
  assert.equal(record.seriesId,'NASDAQXNDX')
  assert.equal(record.quoteMethod,'official-fred-xndx-document')
  assert.equal(record.sourceUrl,FRED_URL)
  assert.deepEqual(record.sourceUrls,[FRED_URL])
  assert.match(record.sha256,/^[a-f0-9]{64}$/)
  assert.deepEqual(record.sourceHashes,{[FRED_URL]:record.sha256})
  const evidence=record.sourceEvidence
  assert.equal(evidence.seriesId,'NASDAQXNDX')
  assert.equal(evidence.provider,'Nasdaq, Inc.')
  assert.equal(evidence.sha256,record.sha256)
  assert.equal(evidence.asOf,record.asOf)
  assert.equal(evidence.expectedCompletedSession,record.asOf)
  assert.equal(evidence.value,record.value)
  assert.match(evidence.publisherUpdated,/^\d{4}-\d{2}-\d{2} \d{1,2}:\d{2} [AP]M C[DS]T$/)
  assert.match(evidence.sourceDateRange,/^\d{4}-\d{2}-\d{2} to \d{4}-\d{2}-\d{2}$/)
 }else{
  assert.equal(record.parser,'yahoo')
  assert.equal(record.symbol,'^XNDX')
  assert.equal(record.quoteMethod,'supported-xndx-ranges')
  assert.deepEqual(Object.keys(record.sourceHashes).sort(),[...YAHOO_URLS].sort())
  assert(YAHOO_URLS.includes(record.sourceUrl))
  for(const hash of Object.values(record.sourceHashes))assert.match(hash,/^[a-f0-9]{64}$/)
 }
}
const fixture=name=>JSON.parse(readFileSync(new URL('./fixtures/publication/xndx-official-20261113/'+name,import.meta.url)))
const legacy=fixture('legacy-yahoo-record.json'),official=fixture('official-fred-record.json')
const sourceProof=fixture('proof.json')
const frozenBody=gunzipSync(readFileSync(new URL('./fixtures/publication/xndx-official-20261113/fred-table.html.gz',import.meta.url)))
assert.equal(createHash('sha256').update(frozenBody).digest('hex'),sourceProof.sha256)
assert.equal(official.sha256,sourceProof.sha256,'Official fixture bound to the independently retained source bytes')
for(const observation of [daily,legacy,official]){
 qualifiedDaily(observation)
 for(const mutation of [{symbol:'^NDX'},{variant:'PRICE'},{currency:'EUR'},{parser:'unqualified'},{maxAgeDays:8}]){
  assert.throws(()=>qualifiedDaily({...observation,...mutation}))
 }
}
for(const mutation of [
 {seriesId:'NASDAQ100'},
 {sourceUrl:YAHOO_URLS[0]},
 {sourceHashes:{[FRED_URL]:'0'.repeat(64)}},
 {sourceEvidence:{...official.sourceEvidence,provider:'Yahoo'}},
 {sourceEvidence:{...official.sourceEvidence,value:official.value+1}},
 {sourceEvidence:{...official.sourceEvidence,expectedCompletedSession:'2026-11-11'}},
])assert.throws(()=>qualifiedDaily({...official,...mutation}))
assert.throws(()=>qualifiedDaily({...legacy,sourceHashes:{[YAHOO_URLS[0]]:legacy.sourceHashes[YAHOO_URLS[0]]}}))
const now=new Date(`${daily.asOf}T12:00:00Z`)
assert.equal(resolveAnniversaryLevel('nasdaq100','',now).value,daily.value)
for(const observation of [legacy,official]){
 const at=new Date(`${observation.asOf}T12:00:00Z`)
 assert.equal(resolveAnniversaryLevel('nasdaq100','',at,{nasdaq100:observation}).value,observation.value)
 assert.equal(resolveAnniversaryLevel('nasdaq100','',at,{nasdaq100:{...observation,symbol:'^NDX',variant:null}}),null)
}
console.log('Nasdaq daily: exact legacy Yahoo and independent official FRED XNDX contracts; raw-price, currency, hash, provider and session mismatches rejected. Monthly convention unchanged.')
