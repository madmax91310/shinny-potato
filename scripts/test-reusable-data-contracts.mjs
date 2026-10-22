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
