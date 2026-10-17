import {buildReview} from '../src/pages/data-review/lib.js'
import assert from 'node:assert/strict'
import {TOPICS,FUND_GROUPS} from '../src/data/practical-sheet-topics.js'
import {buildSheet,buildTweet,calculateScenario} from '../src/pages/practical-sheets/lib.js'
import {getInstrumentPeaStatus} from '../src/data/instruments.js'
import {REGULATORY} from '../src/data/regulatory-data.js'
import refs from '../src/data/automated-practical-sheets.json' with {type:'json'}
import {PRACTICAL_EDITORIAL} from '../src/pages/practical-sheets/editorial.js'
assert.equal(new Set(TOPICS.map(t=>t.id)).size,TOPICS.length)
assert.deepEqual(Object.keys(PRACTICAL_EDITORIAL).sort(),TOPICS.map(t=>t.id).sort())
for(const topic of TOPICS) {
 const sheet=buildSheet(topic.id),tweet=buildTweet(sheet)
 assert(sheet.rows.length>0,topic.id)
 assert(sheet.rows.every(row=>row.length===sheet.columns.length+1),topic.id)
 assert(!/undefined|NaN/.test(tweet),topic.id)
 assert.equal(tweet.match(/[\p{Extended_Pictographic}]/u)?.[0],topic.mode==='funds' && ['world','em'].includes(topic.fundGroup)?'🌍':'👇',topic.id)
 assert(tweet.includes('👇\n\n🔖 Sauvegarde ce tweet\n\n'),topic.id)
 assert.equal(tweet.split('🔖 Sauvegarde ce tweet').length,2,topic.id)
 // Every figure from computed comparisons survives the editorial formatting.
 if(topic.mode!=='funds' && !PRACTICAL_EDITORIAL[topic.id].sections) for(const row of sheet.rows) for(const value of row.slice(1)) assert(tweet.includes(String(value).replaceAll('\n',' · ')),`${topic.id}: ${value}`)
 assert(sheet.sources.length>0,topic.id)
 assert(sheet.sources.every(s=>s.url?.startsWith('https://') && s.checkedAt),topic.id)
 if(topic.mode==='funds') {
  assert(!/https?:\/\/|Sources :|\b[Jj]e\b|\b[Jj]’|aucune performance extrapolée/.test(tweet),topic.id)
  assert(tweet.includes('Prenons l’exemple de ces '+(sheet.funds.length===2?'deux':'trois')+' ETF :'),topic.id)
  for(const fund of sheet.funds) {
   assert(tweet.includes(fund.name),`${topic.id}: name ${fund.isin}`)
   assert(tweet.includes('🆔 ISIN : '+fund.isin),`${topic.id}: ISIN ${fund.isin}`)
   assert(tweet.includes(fund.terLabel+' %'),`${topic.id}: fee ${fund.isin}`)
   if(fund.aum) assert(tweet.includes(fund.aum.asOf.split('-').reverse().join('/')),`${topic.id}: AUM date ${fund.isin}`)
  }
  for(const row of sheet.rows.filter(row=>/^\d{4} · EUR$/.test(row[0]))) for(const value of row.slice(1)) assert(tweet.includes(value),`${topic.id}: performance ${value}`)
  for(const title of ['💶 Les frais annuels','💼 L’encours','🛒 Le prix d’une part','📈 La tracking difference']) assert(tweet.includes(title),`${topic.id}: ${title}`)
 }
 assert(!/https?:\/\/|Sources :/.test(tweet),topic.id)
}
for(const id of ['fees-euros','delay-invest','change-etf']) {
 const sheet=buildSheet(id,{scenario:{capital:23456,years:12,returnRate:4,feeA:0.1,feeB:0.6,tradeCost:42,delay:3}})
 const tweet=buildTweet(sheet)
 for(const row of sheet.rows) for(const value of row.slice(1)) assert(tweet.includes(String(value)),`${id}: ${value}`)
 assert.notEqual(tweet,buildTweet(buildSheet(id)),id)
}
const subset=buildSheet('world-pea',{isins:FUND_GROUPS.world.slice(0,2)})
assert(!buildTweet(subset).includes('Amundi World CW8'))
assert(!buildTweet(subset).includes('LU1681043599'))
assert(buildTweet(subset).includes('ces deux ETF'))
assert.equal(buildSheet('same-world').funds.length,2)
assert.throws(()=>buildSheet('same-world',{isins:FUND_GROUPS.world}))
const otherPair=buildSheet('same-world',{isins:[FUND_GROUPS.world[1],FUND_GROUPS.world[2]]})
assert(!buildTweet(otherPair).includes(FUND_GROUPS.world[0]))
assert(buildTweet(otherPair).includes(FUND_GROUPS.world[2]))
const europeSubset=buildTweet(buildSheet('europe-pea',{isins:FUND_GROUPS.europe.slice(0,2)}))
assert(europeSubset.includes('Royaume-Uni'))
assert(!europeSubset.includes('Euro STOXX 50'))
assert(buildTweet(buildSheet('em-pea')).includes('hors Égypte'))
assert(buildTweet(buildSheet('em-pea')).includes('charbon thermique'))
for(const isins of Object.values(FUND_GROUPS)) for(const isin of isins) assert.equal(getInstrumentPeaStatus(isin),true,isin)
assert.throws(()=>buildSheet('world-pea',{isins:['FR001400U5Q4']}))
assert.throws(()=>buildSheet('world-pea',{isins:['FR001400U5Q4','FR001400U5Q4']}))
assert.throws(()=>buildSheet('world-pea',{isins:['FR001400U5Q4','UNKNOWN']}))
assert(buildSheet('europe-pea').notes.some(n=>n.includes('indices diffèrent')))
assert(buildSheet('pea-cto').rows.flat().some(v=>String(v).includes(String(REGULATORY.ctoTotal).replace('.',','))))
const zero=calculateScenario('fees',{feeA:0,feeB:0});assert.equal(zero.a,zero.b)
const cost=calculateScenario('fees',{capital:10000,years:10,returnRate:0,feeA:0,feeB:1});assert.equal(cost.a,10000);assert(Math.abs(cost.b-10000*0.99**10)<1e-8)
assert.equal(calculateScenario('switch',{capital:10000,feeA:.2,feeB:1,tradeCost:30}).payback,.375)
assert.equal(calculateScenario('switch',{feeA:1,feeB:.2}).payback,null)
assert.equal(calculateScenario('delay',{years:5,delay:5}).b,10000)
assert.doesNotThrow(()=>calculateScenario('fees',{years:2}))
assert.doesNotThrow(()=>calculateScenario('switch',{years:NaN,returnRate:NaN,delay:NaN}))
assert.doesNotThrow(()=>calculateScenario('delay',{feeB:NaN}))
assert.throws(()=>calculateScenario('delay',{years:2,delay:5}))
assert.throws(()=>calculateScenario('fees',{capital:NaN}))
assert.throws(()=>calculateScenario('fees',{feeA:-1}))
const gold=buildSheet('gold-av-cto',{contractId:'linxea-spirit-2'});assert(gold.rows[0][1].includes('FR0013416716'));assert(gold.rows[2][1].includes(String(refs.sources['gold-contract'].transactionPct).replace('.',',')))
assert(!buildSheet('gold-av-cto',{contractId:'linxea-avenir-2'}).rows[0][1].includes('FR0013416716'))
const ref=refs.sources.etf,old={...ref}
// A changed source warns without blocking; missing evidence (no URL) blocks publication.
try {ref.reviewRequired=true;const reviewed=buildSheet('world-pea');assert(!reviewed.blocked);assert(reviewed.warnings.some(w=>/source modifiée/.test(w)));const url=ref.sourceUrl;ref.sourceUrl='';assert(buildSheet('world-pea').blocked);ref.sourceUrl=url;assert(buildReview('2026-10-11').items.some(item=>item.id==='practical-source:etf'&&item.category==='reserve')); ref.reviewRequired=false;ref.status='error';ref.lastAttemptAt='2026-10-11';assert(buildSheet('world-pea').warnings.length);const alert=buildReview('2026-10-11').items.find(item=>item.id==='practical-source:etf');assert(alert);assert.equal(alert.checkedAt,old.checkedAt);assert.equal(alert.category,'reserve');assert(!buildSheet('world-pea').blocked);delete ref.checkedAt;assert(buildSheet('world-pea').blocked)} finally {Object.assign(ref,old)}
console.log('Fiches : sources, dimensions, PEA, fiscalité partagée, calculs, contrats et réserves validés.')
