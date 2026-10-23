import assert from 'node:assert/strict'
import {resolveGuideFees} from '../src/data/reusable-data-contracts.js'
import {TWEETS} from '../src/pages/tweet-bank/data.js'
import {FACTS} from '../src/pages/market-facts/data.js'
import {contentValidity} from '../src/pages/tweet-bank/validity.js'
const original={id:'guide:test',text:'Titre\nIE00B4L5Y983 · 💸 TER : 0,20 %\nExemple hypothétique : +10 % et 5 % de swap.'}
const records={IE00B4L5Y983:{sourceUrl:'https://issuer.test/exact',characteristics:{terPct:.18,checkedAt:'2026-10-22'}}}
const updated=resolveGuideFees(original,records)
assert.equal(updated.text,original.text.replace('0,20 %','0,18 %'))
assert.deepEqual(resolveGuideFees({...original,id:'archive:test'},records),{...original,id:'archive:test'})
assert.equal(resolveGuideFees(original,{}).text,original.text)
assert(TWEETS.every(t=>t.dataContract?.kind))
assert(FACTS.every(t=>t.dataContract?.kind))
const draft={text:original.text,verifiedText:original.text,checkedAt:'2026-10-22',asOf:'2026-10-22',verifiedAsOf:'2026-10-22'}
assert(contentValidity(original,draft,'2026-10-22').ready)
assert(!contentValidity(updated,{...draft,text:updated.text},'2026-10-22').ready,'Old review cannot certify a changed draft')
console.log(`${TWEETS.length} textes et ${FACTS.length} faits : contrats, TER vivant, archives, hypothèses et verrou de revue vérifiés.`)

const commodity={id:'guide:commodities',text:'GB00B15KXQ89 · 💸 Gestion : 0,49 % + swap : 0,45 % par an\nHypothèse : 10 %.'}
const fresh={GB00B15KXQ89:{sourceUrl:'https://issuer.test/exact',characteristics:{terPct:.4,checkedAt:'2026-10-23',annualSwapRatePct:.3},characteristicChecks:{annualSwapRatePct:{checkedAt:'2026-10-23',sourceUrl:'https://issuer.test/swap'}}}}
const result=resolveGuideFees(commodity,fresh)
assert.equal(result.text,'GB00B15KXQ89 · 💸 Gestion : 0,40 % + swap : 0,30 % par an\nHypothèse : 10 %.')
assert.equal(result.dataContract.fields.length,2)
assert(resolveGuideFees(commodity,{GB00B15KXQ89:{...fresh.GB00B15KXQ89,characteristicChecks:{}}}).text.includes('swap : 0,45 %'),'An unproved swap fee is never renewed from the TER proof')
