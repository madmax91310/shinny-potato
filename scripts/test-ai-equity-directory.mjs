import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {inventory} from './ai-portfolio-universe.mjs'
import {tickerKey,directoryCandidates} from './ai-equity-directory.mjs'
import {hydrateMarketSeries,publicMarket} from './ai-series-store.mjs'
import {loadSeries} from '../src/pages/ai-portfolios/series.js'
const raw=JSON.parse(fs.readFileSync('data/ai-portfolios/equity-scope/instruments.json')).listings
const all=inventory(),keys=new Map(all.map(a=>[tickerKey(a.mic,a.ticker,a.currency),a]))
// Renew an existing listing without confusing another share on the same venue.
const official=raw.find(r=>r.isin&&r.sourceUrl&&r.identitySha256&&!r.identityStale&&!r.identityDetailError)
assert(official,'An exact official listing is required for this regression')
const retained={isin:official.isin,mic:official.mic,ticker:official.ticker,currency:official.currency}
directoryCandidates([retained],{})
assert(retained.evidenceId&&retained.listingEvidence.sha256===official.identitySha256,'Existing exact listing keeps the official identity proof')
const conflict={...retained,isin:'ZZ0000000000'};delete conflict.evidenceId;delete conflict.listingEvidence
directoryCandidates([conflict],{})
assert.equal(conflict.evidenceId,undefined,'A matching ticker cannot renew a different ISIN')
const liveMarket=JSON.parse(fs.readFileSync('data/ai-portfolios/market.json'))
for(const a of liveMarket.universe.filter(a=>a.status==='qualified'))assert(a.evidenceId,`Qualified listing without identity proof: ${a.id}`)
for(const r of raw)assert(keys.has(tickerKey(r.mic,r.ticker,r.currency)),`Missing official row ${r.sourceId}/${r.ticker}`)
assert.equal(new Set(all.map(a=>a.id)).size,all.length)
const brk=all.filter(a=>a.mic==='XNYS'&&/^BRK[.\- ][AB]$/.test(a.ticker));assert.equal(brk.length,2);assert.notEqual(brk[0].instrumentId,brk[1].instrumentId)
assert(all.some(a=>a.shareType==='depositary-receipt'&&a.instrumentType==='EQUITY'))
assert(all.filter(a=>a.shareType==='preferred').every(a=>a.permanentExclusion||a.discoveryBlock))
const hk=all.filter(a=>a.mic==='XHKG'&&a.sourceId==='hkex');assert(hk.length>2000,'HKEX complete worksheet, not erroneous dimension of eight rows')
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ai-series-test-'));fs.mkdirSync(path.join(tmp,'data/ai-portfolios/series'),{recursive:true});const value={qualified:true,anchorDate:'2026-01-02',points:{'2026-01-02':{synthetic:100}}};fs.writeFileSync(path.join(tmp,'data/ai-portfolios/series/ab.json'),JSON.stringify({asset:value,unrelated:value}));const market={universe:[{id:'asset',seriesFile:'series/ab.json'}],series:{}};hydrateMarketSeries(market,tmp,['asset']);assert.deepEqual(market.series,{asset:value});
const requests=[];const browser=await loadSeries({...market,series:{}},['asset'],async url=>{requests.push(url);return {ok:true,json:async()=>({asset:value,unrelated:value})}},'/app/');assert.deepEqual(browser,{asset:value});assert.equal(requests.length,1);await loadSeries(market,['asset'],async()=>{throw Error('Already loaded must not request again')},'/app/');fs.rmSync(tmp,{recursive:true});
const complete={...market,universe:[{id:'usable',instrumentId:'usable'},{id:'excluded',instrumentId:'excluded',permanentExclusion:true}]}
assert.deepEqual(publicMarket(complete).universe.map(a=>a.id),['usable'])
assert.equal(publicMarket(complete).inventoryCounts.listings,2,'Full inventory remains counted and exported')
assert.deepEqual(publicMarket(complete,['excluded']).universe.map(a=>a.id),['usable','excluded'],'An archived competition never loses a referenced identity')
console.log(`Official perimeter: all ${raw.length} source rows reconciled; classes, ADR, units and selective shard hydration validated.`)
const {fxAt,quoteAt}=await import('../src/pages/ai-portfolios/lib.js')
const twd={universe:[{id:'taiwan',ticker:'1101',calendar:'XTAI',currency:'TWD'}],calendarFrom:'2026-01-09',calendarThrough:'2026-01-12',calendars:{XTAI:{'2026-01-09':'2026-01-09T05:30:00Z'}},series:{taiwan:{anchorDate:'2026-01-09',points:{'2026-01-09':{synthetic:100,close:300}}}},fx:{validThrough:'2026-01-12',expectedDates:['2026-01-09'],rates:{'2026-01-09':{USD:1.2,TWD:36}},supplemental:{TWD:{}},derivedFixingOrigins:{TWD:{'2026-01-09':{TWDUSDDate:'2026-01-09',USDEURDate:'2026-01-09',TWDPerUSD:30,USDPerEUR:1.2}}},supplementalGaps:{TWD:[]}}}
assert(Math.abs(quoteAt('taiwan','2026-01-10','EUR',twd).price*180-500)<1e-8)
assert.equal(fxAt('TWD','2026-01-10',twd).fixings.TWDUSDDate,'2026-01-09')
twd.fx.supplementalGaps.TWD=['2026-01-12'];assert.throws(()=>fxAt('TWD','2026-01-12',twd),/CBC/)

const jtec=all.filter(a=>a.name==='JTEC CORPORATION'&&a.mic==='XTKS');assert.equal(jtec.length,2);assert.equal(new Set(jtec.map(a=>a.instrumentId)).size,2,'Same Japanese issuer labels cannot merge distinct exchange security codes')
const heico=all.filter(a=>a.mic==='XNYS'&&/^HEI(?:\.A)?$/.test(a.ticker));assert.equal(new Set(heico.map(a=>a.instrumentId)).size,2,'Two HEICO share classes retained')
const gut=all.find(a=>a.ticker==='GUT'&&a.mic==='XNYS');assert(gut?.permanentExclusion&&gut.shareType==='closed-end-fund','SEC N-CEN fund type outranks common-stock wording')
