import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import {execFileSync}from'node:child_process'
import {projectNativeFundDetails}from'./lib/native-fund-details.mjs'
import {chooseNativeFundTopTen}from'../src/data/holding-weight-basis.js'
const read=name=>JSON.parse(readFileSync(name))
const books=read('src/data/dca-complete-holdings.json'),classes=read('scripts/wisdomtree-holdings-classes.json'),identities=read('src/data/index-company-identities.json')
const projected=projectNativeFundDetails(books,classes,identities)
const isin=Object.keys(projected)[0];assert(isin,'At least one genuinely qualified native book exercises the consumer regression')
for(const [id,h]of Object.entries(projected)){
 assert.equal(h.complete,false);assert.equal(h.basis,'fund');assert.equal(h.scope,'top-10-companies')
 assert.equal(h.asOf,books[id].asOf);assert.equal(h.checkedAt,books[id].checkedAt);assert.equal(h.sha256,books[id].sha256)
 assert.equal(h.rows.length,10);assert(h.rows.reduce((s,r)=>s+r.weightPct,0)<100)
 for(const row of h.rows){
  const original=books[id].rows.filter(r=>row.securities.includes(r.isin)).reduce((s,r)=>s+r.weightPct,0)
  assert(Math.abs(row.weightPct-original)<1e-10,'Company weights sum exact original share-class weights, never rescaled')
 }
 assert.deepEqual(h.excludedWeightPctByType,books[id].navReconciliation.excludedWeightPctByType)
}
const native=projected[isin],old={asOf:'2020-01-01'},newer={asOf:'2099-01-01'}
assert.equal(chooseNativeFundTopTen(isin,old,native),native)
assert.equal(chooseNativeFundTopTen(isin,newer,native),newer)
assert.equal(chooseNativeFundTopTen(isin,{...newer,weightBasis:'issuer-fund-ranking-unqualified-nav-denominator'},native),native)
for(const patch of [{subjectIsin:'OTHER'},{basis:'index'},{scope:'complete-equity-sleeve-with-published-cash'},{complete:true},{sourceUrl:'https://example.com'},{sha256:null},{rows:native.rows.slice(1)}]){
 assert.equal(chooseNativeFundTopTen(isin,old,{...native,...patch}),old)
}
for(const patch of [{sourceUrl:'https://example.com'},{subjectIsin:'OTHER'},{basis:'index'},{weightBasis:'issuer-fund-ranking-unqualified-nav-denominator'},{identityMethodCode:'unknown'},
 {rows:books[isin].rows.map((r,i)=>i? r:{...r,isin:null})}]){
 assert(!projectNativeFundDetails({...books,[isin]:{...books[isin],...patch}},classes,identities)[isin])
}
execFileSync(process.execPath,['scripts/build-native-fund-details.mjs'],{stdio:'pipe'})
const first=readFileSync('src/data/native-fund-details.json')
execFileSync(process.execPath,['scripts/build-native-fund-details.mjs'],{stdio:'pipe'})
assert(first.equals(readFileSync('src/data/native-fund-details.json')),'Projection is idempotent')
// A fresh process reads regenerated JSON even if the calling test already
// imported the ETF registry before a producer changed the native books.
execFileSync(process.execPath,['--input-type=module','-e',`
 import fs from'node:fs';import assert from'node:assert/strict';
 import{AUTOMATED_ETF,refreshFundDetails}from'./src/data/automated-etf.js';
 const p=JSON.parse(fs.readFileSync('src/data/native-fund-details.json'));
 for(const[isin,h]of Object.entries(p)){
  const selected=AUTOMATED_ETF[isin]?.holdings;if(selected?.sha256!==h.sha256)continue;
  const detail=refreshFundDetails(isin,{holdingsWeightBasis:'issuer-fund-ranking-unqualified-nav-denominator'});
  assert.deepEqual(detail.holdings,h.rows.map(r=>[r.name,r.weightPct]));
  assert.equal(detail.holdingsWeightBasis,'fund-nav');assert.equal(detail.holdingsAsOf,h.asOf);assert.equal(detail.holdingsBasis,'fund');
 }
`],{stdio:'pipe'})
console.log('Native fund top tens: exact NAV weights, company consolidation, missing-identity refusal, source clocks, newer-qualified retention and shared ETF consumer verified.')
