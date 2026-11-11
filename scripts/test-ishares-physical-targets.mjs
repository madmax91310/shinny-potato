import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync,writeFileSync} from 'node:fs'
import {hasPhysicalPortfolio} from './lib/physical-replication.mjs'
import {AUTOMATED_ETF} from '../src/data/automated-etf.js'

for(const method of ['Replicated','Optimised','Optimized']){
 assert(hasPhysicalPortfolio(method,'Physical',{issuer:'ishares',productStructure:'Physical'}))
 assert(!hasPhysicalPortfolio(method,'Physical',{issuer:'ishares'}),'An abbreviation alone is insufficient')
 assert(!hasPhysicalPortfolio(method,'Physical',{issuer:'ishares',productStructure:'Unknown'}))
 assert(!hasPhysicalPortfolio(method,'Synthetic',{issuer:'ishares',productStructure:'Physical'}))
 assert(!hasPhysicalPortfolio(method,'Physical',{issuer:'other',productStructure:'Physical'}))
}
assert(!hasPhysicalPortfolio('Unknown','Physical',{issuer:'ishares',productStructure:'Physical'}))
assert(!hasPhysicalPortfolio('Synthetic','Physical',{issuer:'ishares',productStructure:'Physical'}))
assert(!hasPhysicalPortfolio('Physical','Physical',{issuer:'ishares',productStructure:'Synthetic'}))

// Exercise the generator on its real common records, without changing a price,
// date, source response or financial convention. Restore its two output files.
const files=['scripts/generated-holdings-sources.json','scripts/instrument-metadata-sources.json']
const before=new Map(files.map(path=>[path,readFileSync(path)]))
try{
 execFileSync(process.execPath,['scripts/build-automation-targets.mjs'],{stdio:'pipe'})
 const targets=JSON.parse(readFileSync(files[0]))
 for(const isin of ['IE0008471009','IE0008470928','IE00B1YZSC51']){
  const c=AUTOMATED_ETF[isin]?.characteristics
  if(c?.productStructure!=='Physical'||!/^(Replicated|Optimi[sz]ed)$/i.test(c.replicationMethod??''))continue
  assert.equal(targets[isin]?.isin,isin,'A qualified abbreviated iShares method must keep its full-book collector')
  assert.match(targets[isin].url,/^https:\/\/www\.blackrock\.com\/varnish-api\//)
  assert(targets[isin].url.includes('holdings.all'))
 }
}finally{
 for(const [path,bytes] of before)writeFileSync(path,bytes)
}
console.log('iShares physical targets: explicit structure, abbreviation, contradictory/synthetic/unknown cases and real generator routing passed.')
