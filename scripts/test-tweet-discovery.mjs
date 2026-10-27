import assert from 'node:assert/strict'
import {TWEETS} from '../src/pages/tweet-bank/data.js'
import {reviewPolicy} from '../src/pages/tweet-bank/validity.js'
import {matchesTweet,tweetThemes,discoverTweets,archiveReady,publicationState} from '../src/lib/tweet-discovery.js'
import {execFileSync} from 'node:child_process'
execFileSync(process.execPath,['scripts/build-tweet-bank-catalog.mjs','--snapshot'],{stdio:'pipe'})
const catalog=(await import('../services/tweet-bank-private/worker/catalog.js')).default
for(const tweet of TWEETS){const archive=catalog.tweets.find(t=>t.originalId===tweet.id);assert(archive);assert.equal(archive.text,tweet.text);assert.deepEqual(archive.review,reviewPolicy(tweet))}
assert.equal(catalog.tweets.length,TWEETS.length)
const t={id:'archive:1',source:'archive',text:'Épargner 79\u202f058 € pour la retraite\n\nUn ETF World dans mon PEA.',category:'Storytelling',formats:['Bilan de la semaine']}
assert(matchesTweet(t,'EPARGNER retraite'));assert(matchesTweet(t,'79 058'));assert(matchesTweet(t,'79058'));assert(matchesTweet(t,'pea world'));assert(!matchesTweet(t,'world inconnu'));assert(tweetThemes(t).includes('Retraite'))
const own={...t,id:'own',source:'personal',favorite:true,last_published:'2026-01-01',created_at:'2026-02-01'}
assert.deepEqual(discoverTweets([t,own],{source:'personal',favorite:true,theme:'Retraite',format:'Bilan de la semaine',publication:'recycle'},'2026-03-01').map(x=>x.id),['own'])
assert.equal(discoverTweets([t,own],{search:'introuvable'}).length,0)
assert.equal(publicationState('','2026-03-01'),'never');assert.equal(publicationState('2026-02-28','2026-03-01'),'cooldown');assert.equal(publicationState('2026-01-01','2026-03-01'),'recycle')
assert.equal(archiveReady({review:{kind:'personal'}},'2026-03-01'),false)
assert.equal(archiveReady({review:{kind:'reviewed',checkedAt:'2026-01-01',maxAge:30}},'2026-03-01'),false)
assert.equal(archiveReady({review:{kind:'general'}},'2026-03-01'),true)
console.log(`${TWEETS.length} complete archives preserved; numeric/accent/multiword search, filters, cooldown and review gates verified.`)
