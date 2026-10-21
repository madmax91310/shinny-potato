import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { defaultConfig } from '../src/pages/ai-portfolios/data.js'
import { addDays,clone,emptyPortfolio,mark,planDecision,quoteAt,validateDecision,runCompetition,portfolioAt,snapshot,periodReport,nextExecution,coverage,sourceFreshness } from '../src/pages/ai-portfolios/lib.js'
import { register,refresh } from './ai-portfolios.mjs'
// Entirely synthetic tests, never published in the real book.
const ids=['a','b','c'],config={...defaultConfig('2026-01-05'),benchmark:'a',universe:ids,participants:[{id:'test',name:'Test',model:'Test manuel',color:'#17866b'}]}
const market={version:1,universe:ids.map(id=>({id,name:id,ticker:id,calendar:'TEST',currency:id==='c'?'USD':'EUR'})),calendarFrom:'2025-12-01',calendarThrough:'2026-03-31',calendars:{TEST:{}},series:{},status:{},fx:{rates:{},validThrough:'2026-03-31'},revisions:[],asOf:'2026-01-02',generatedAt:'2026-01-03T05:00:00Z'}
for(let d='2025-12-01';d<='2026-03-31';d=addDays(d,1)){
 if([0,6].includes(new Date(d+'T12:00:00Z').getUTCDay()))continue
 market.calendars.TEST[d]=d+'T16:30:00+00:00';market.fx.rates[d]={USD:d>='2026-02-01'?2:1,GBP:.8,CHF:.9}
 for(const id of ids){market.series[id]??={anchorDate:'2025-12-01',qualified:true,points:{}};market.series[id].points[d]={synthetic:id==='a'&&d>='2026-02-01'?200:100,close:75};market.status[id]={ok:true}}
}
market.status.ECB={ok:true}
assert.equal(sourceFreshness(market,'2026-01-05T00:00:00Z').ok,false)
assert.equal(sourceFreshness(market,'2026-01-03T06:00:00Z').ok,true)
const eq=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`)
const target={id:'initial',participant:'test',model:'Test',kind:'target',weights:{a:33,b:33,c:33},reason:'Test',decisionDate:'2026-01-02'}
validateDecision(target,{config,decisions:[]},market,market.asOf)
const initial=planDecision(emptyPortfolio(config),target,'2026-01-05',config,market)
eq(initial.after.cash,100);eq(initial.after.positions[0].units,33)
const drift=mark(initial.portfolio,'2026-02-02',config,market)
assert.ok(drift.positions[0].weight>35);eq(drift.value,11650);eq(drift.positions[2].value,1650)
// Historical conversion at both dates, closed sessions carried only when calendar confirms closure.
eq(quoteAt('c','2026-01-10','EUR',market).price,100)
assert.equal(quoteAt('c','2026-01-10','EUR',market).priceDate,'2026-01-09')
eq(quoteAt('c','2026-02-02','EUR',market).price,50)
const missing=clone(market);delete missing.series.a.points['2026-01-09']
assert.throws(()=>quoteAt('a','2026-01-10','EUR',missing),/manquante/)
const noFx=clone(market);noFx.fx.rates={};assert.throws(()=>quoteAt('c','2026-01-09','EUR',noFx),/Change/)
const buy={...target,kind:'trades',amounts:{a:10}}
assert.throws(()=>planDecision(initial.portfolio,buy,'2026-02-02',config,market),/poids maximum/)
const sell={...target,kind:'trades',amounts:{a:-1000}}
const sold=planDecision(initial.portfolio,sell,'2026-02-02',config,market)
assert.equal(sold.trades.length,1);eq(sold.after.cash,1100)
assert.throws(()=>planDecision(initial.portfolio,{...sell,amounts:{a:-99999}},'2026-02-02',config,market),/Vente supérieure/)
assert.throws(()=>planDecision(initial.portfolio,{...sell,amounts:{b:10000}},'2026-01-05',config,market),/Liquidités/)
const fees=planDecision(emptyPortfolio(config),{...target,weights:{a:33,b:33,c:34}},'2026-01-05',{...config,feeBps:50},market)
assert.ok(fees.after.cash<1e-6);eq(fees.after.value+fees.fee,10000)
const hold=planDecision(initial.portfolio,{kind:'hold'},'2026-02-02',config,market);assert.deepEqual(hold.portfolio,initial.portfolio)
assert.throws(()=>validateDecision({...target,weights:{a:50,b:25,c:25}},{config,decisions:[]},market,'2026-01-02'),/Poids/)
assert.throws(()=>validateDecision(target,{config,decisions:[{...target,id:'other',status:'executed'}]},market,'2026-01-02'),/par mois/)
const down=clone(market);down.status.a={ok:false,error:'HTTP 404'};assert.equal(coverage('a',down,'2026-01-02').ok,false)
assert.equal(nextExecution('2026-01-02T01:00:00Z','2026-01-01',market),'2026-01-05')
// Durable registration, immutable historical decisions, initial reference and future execution.
let book={version:1,revision:0,competitions:[],audit:[]}
const request=(operation,competitionId)=>({version:1,expectedRevision:book.revision,requestId:'request-'+book.revision,competitionId,operation})
book=register(book,request({type:'create',config}),market,'2026-01-02T12:00:00Z');const cid=book.competitions[0].id
book=register(book,request({type:'decision',decision:target},cid),market,'2026-01-02T12:01:00Z')
const proposal=request({type:'launch'},cid)
book=register(book,proposal,market,'2026-01-02T12:02:00Z')
assert.throws(()=>register(book,proposal,market),/périmé/)
let comp=book.competitions[0]
assert.equal(comp.startDate,'2026-01-05')
const before=runCompetition(comp,market,'2026-01-04');assert.equal(before.decisions[0].status,'recorded')
const executed=runCompetition(comp,market,'2026-01-05')
assert.deepEqual(executed,runCompetition(executed,market,'2026-01-05'))
eq(portfolioAt(executed,'test','2026-01-04').cash,10000)
eq(portfolioAt(executed,'test','2026-01-05').cash,100)
assert.equal(snapshot(executed,'2026-01-09',market).complete,true)
const first=periodReport(executed,'2026-01-09',market)
assert.equal(first.partialWeek,true);eq(first.rows[0].weekly,0)
const noPrice=clone(market);delete noPrice.series.a.points['2026-01-05']
const waiting=runCompetition(comp,noPrice,'2026-01-06');assert.equal(waiting.decisions[0].status,'pending');assert.equal(waiting.decisions[0].executionDate,'2026-01-05')
assert.equal(snapshot(waiting,'2026-01-09',noPrice).complete,false)
assert.equal(runCompetition(waiting,market,'2026-01-06').decisions[0].status,'executed')
// Fully sold lines keep their contributions, but no longer require future prices.
const liquidated=planDecision(initial.portfolio,{...target,weights:{a:0,b:0,c:0}},'2026-02-02',config,market)
assert.equal(liquidated.after.positions.length,0);assert.equal(liquidated.after.closedResults.length,3)
const cashComp=clone(executed);cashComp.decisions.push({...target,id:'sell-all',status:'executed',executionDate:'2026-02-02',registeredAt:'2026-02-01T00:00:00Z',execution:liquidated})
cashComp.decisions.push({...target,id:'cash-hold',kind:'hold',weights:undefined,status:'recorded',executionDate:'2026-02-03',registeredAt:'2026-02-02T00:00:00Z'})
const discontinued=clone(market);for(const id of ids)delete discontinued.series[id].points['2026-02-03']
assert.equal(runCompetition(cashComp,discontinued,'2026-02-03').decisions.at(-1).status,'executed')
// Source adjustment cancels in normalization; a dividend or split never creates cash a second time.
const afterDividend=clone(market);for(const d of Object.keys(afterDividend.series.a.points))if(d>='2026-01-06')afterDividend.series.a.points[d].synthetic=110
const wealth=mark(portfolioAt(executed,'test','2026-01-09'),'2026-01-09',config,afterDividend)
eq(wealth.cash,100);eq(wealth.value,10330)
// Corrections have observable effects while executed units remain fixed.
book.competitions=[executed];const firstRefresh=refresh(book,{...market,asOf:'2026-01-09'})
const corrected=refresh(firstRefresh.book,{...afterDividend,asOf:'2026-01-09'},firstRefresh.state)
assert.equal(corrected.state.valuationRevisions.length,1)
assert.deepEqual(corrected.book.competitions[0].decisions,executed.decisions)
const changedConfig={...config,maxWeight:40};book=register(book,request({type:'configure',config:changedConfig,reason:'Règle revue'},cid),market,'2026-01-10T00:00:00Z')
assert.equal(book.competitions[0].ruleHistory.length,1);assert.equal(book.competitions[0].decisions[0].rules.maxWeight,35)
assert.throws(()=>register(book,request({type:'configure',config:{...changedConfig,initialCapital:20000},reason:'test'},cid),market,'2026-01-11T00:00:00Z'),/figé/)
// File-level persistence round-trip and idempotent refresh in an isolated temporary repository.
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-book-'));fs.mkdirSync(path.join(root,'data/ai-portfolios'),{recursive:true})
fs.writeFileSync(path.join(root,'data/ai-portfolios/book.json'),JSON.stringify(book));fs.writeFileSync(path.join(root,'data/ai-portfolios/market.json'),JSON.stringify({...market,asOf:'2026-01-09'}))
for(let i=0;i<2;i++){const result=spawnSync(process.execPath,['scripts/ai-portfolios.mjs','refresh','--root',root],{encoding:'utf8'});assert.equal(result.status,0,result.stderr)}
const saved=JSON.parse(fs.readFileSync(path.join(root,'public/data/ai-portfolios/snapshot.json')))
assert.deepEqual(saved.book.competitions[0].decisions,book.competitions[0].decisions)
fs.rmSync(root,{recursive:true})
console.log('Portefeuilles IA : comptabilité, dérive, change historique, cibles, frais, conservation, règles, référence, calendrier, reprise, corrections et persistance validés.')
