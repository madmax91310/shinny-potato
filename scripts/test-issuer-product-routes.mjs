import assert from 'node:assert/strict'
import {wisdomtreeProductCandidates}from'./issuer-routes.mjs'
const route='https://www.wisdomtree.com/gb/products/equities/wisdomtree-europe-defence-ucits-etf---eur-acc'
const accepted=wisdomtreeProductCandidates(route)
assert(accepted.includes(route.replace('/gb/','/ie/')))
assert(accepted.includes(route.replace('/gb/','/nl/')))
assert(accepted.includes('https://www.wisdomtree.eu/en-ie/etfs/thematic/wdef---wisdomtree-europe-defence-ucits-etf---eur-acc'))
for(const wrong of [route.replace('www.wisdomtree.com','evil.test'),route+'?different-share=1',route.replace('europe-defence','quantum-computing'),route.replace('/gb/','/se/')])assert(!accepted.includes(wrong))
assert.equal(new Set(accepted).size,accepted.length)
console.log('Exact WisdomTree regional product routes preserve qualified targets without admitting another host, part path, query or unqualified region.')
