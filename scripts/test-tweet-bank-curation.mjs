import assert from 'node:assert/strict'
import { TWEETS as ARCHIVED_TWEETS } from '../src/pages/tweet-bank/data.js'
import { curateTweet, groupTweetVariants, discoverTweets } from '../src/lib/tweet-discovery.js'

const TWEETS = ARCHIVED_TWEETS.map(curateTweet)
const before = structuredClone(TWEETS)
const grouped = groupTweetVariants(TWEETS)
assert.deepEqual(TWEETS,before,'Grouping must not mutate or delete original records')
assert(TWEETS.filter(t=>t.category==='Pédagogie').every(t=>t.sources?.length),'Every pedagogical text keeps its sources, including reclassified archives')
assert.deepEqual(new Set(grouped.flatMap(t=>t.variants.map(v=>v.id))),new Set(TWEETS.map(t=>t.id)))
for(const [id,category] of [[8,'Simulation & chiffres'],[14,'Simulation & chiffres'],[18,'Bilan patrimoine'],[39,'Pédagogie'],[41,'Simulation & chiffres']]) {
  assert.equal(TWEETS.find(t=>t.id===id).category,category)
}
const originals = [32,49].map(id=>({...TWEETS.find(t=>t.id===id),id:'archive:'+id,source:'archive'}))
const own = originals.map((t,i)=>({...t,id:'own-'+i,source:'personal',favorite:true,last_published:'2026-10-29',text:i===0?'MSCI World, MSCI ACWI, FTSE All-World\nLe comparatif complet pour bien choisir son exposition.':t.text+'\nExplication personnelle conservée.'}))
const personalBefore=structuredClone(own)
const mixed=groupTweetVariants([...originals,...own])
assert.equal(mixed.length,2)
assert(mixed.every(t=>t.variants.length===2 && t.source==='personal' && t.favorite))
assert.deepEqual(own,personalBefore)
assert.equal(discoverTweets(mixed,{publication:'never'},'2026-10-29').length,0,'A published copy must put the whole family in cooldown')
assert.equal(discoverTweets(mixed,{publication:'cooldown',source:'archive',favorite:true},'2026-10-29').length,2)
assert.equal(discoverTweets(mixed,{search:'explication personnelle'},'2026-10-29').length,1)
assert(mixed[1].variants.some(t=>t.text.endsWith('Explication personnelle conservée.')))
assert.equal(groupTweetVariants([{id:'a',text:'DCA de juin',source:'personal'},{id:'b',text:'DCA de septembre',source:'personal'}]).length,2)
assert.equal(groupTweetVariants(TWEETS.filter(t=>String(t.id).startsWith('pedagogy:'))).length,TWEETS.filter(t=>String(t.id).startsWith('pedagogy:')).length)
assert.equal(curateTweet({id:'own',source:'personal',text:'Tu veux ouvrir une assurance-vie, mais tu ne sais pas laquelle choisir ?',category:'Guide ETF'}).title,'Comment choisir son assurance-vie')
console.log('Curation: texts, IDs, personal copies, publication dates and favorites preserved; explicit families and category corrections verified.')
