import fs from 'node:fs'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { reviewPolicy } from '../src/pages/tweet-bank/validity.js'
const catalog = {version:1, generatedAt:new Date().toISOString(), tweets:TWEETS.map(t => ({...t,id:`archive:${t.id}`,originalId:t.id,source:'archive',review:reviewPolicy(t)}))}
fs.mkdirSync('public/data',{recursive:true})
fs.writeFileSync('public/data/tweet-bank-catalog.json',JSON.stringify(catalog)+'\n')
if(process.argv.includes('--snapshot')) {
  fs.writeFileSync('services/tweet-bank-private/worker/catalog.js','// Generated from the canonical tweet bank; do not edit texts here.\nexport default '+JSON.stringify(catalog)+'\n')
  fs.copyFileSync('src/lib/tweet-discovery.js','services/tweet-bank-private/worker/discovery.js')
}
console.log(`${catalog.tweets.length} archived tweets projected without rewriting their text or review policy.`)
