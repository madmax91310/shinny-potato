import assert from'node:assert/strict'
import {sharedListingIdentities,ordinaryListing,matchesOrdinaryListing}from'./shared-listing-identities.mjs'
const row=sharedListingIdentities.find(r=>r.symbol==='NBIS'),expected={symbol:'NBIS',currency:'USD',isin:'NL0009805522',shareClass:'A',companyId:row.companyId}
assert.equal(ordinaryListing(row.id,expected),row)
for(const change of [{shareType:'depositary-receipt'},{shareClass:'B'},{currency:'EUR'},{symbol:'YNDX'},{isin:'US0000000001'},{companyId:'other'},{sourceUrl:null}])assert(!matchesOrdinaryListing({...row,...change},expected),JSON.stringify(change))
assert.equal(ordinaryListing('unknown',expected),null)
console.log('Common listing proof: ordinary share, class, issuer, exact quote/currency preserved; ADR and identity substitutions refused without IA catalogue.')
