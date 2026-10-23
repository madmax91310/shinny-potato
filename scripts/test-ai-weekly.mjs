import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {defaultConfig} from '../src/pages/ai-portfolios/data.js'
import {weeklyWindow,weeklyStatus,WEEKLY_WINDOW} from '../src/pages/ai-portfolios/weekly.js'
import {briefing,parseResponse,responseTemplate,individualReportReady} from '../src/pages/ai-portfolios/briefing.js'
import {addDays,clone,coverage,periodReport,validateDecision} from '../src/pages/ai-portfolios/lib.js'
import {register,refresh} from './ai-portfolios.mjs'
import {publishRuntime} from './ai-runtime-projection.mjs'
import {decodeCatalogue,loadCatalogue} from '../src/pages/ai-portfolios/runtime.js'
const spring=weeklyWindow('2026-03-29T12:00:00Z'),fall=weeklyWindow('2026-10-25T12:00:00Z')
assert.equal((Date.parse(spring.endExclusive)-Date.parse(spring.startAt))/3600000,167)
assert.equal((Date.parse(fall.endExclusive)-Date.parse(fall.startAt))/3600000,169)
assert.equal(weeklyWindow('2026-01-04T23:00:00Z').key,'2026-01-05')
assert.equal(weeklyWindow('2026-01-04T22:59:59Z').key,'2025-12-29')
assert.equal(weeklyWindow('2026-01-04T23:00:00Z',{...WEEKLY_WINDOW,timezone:'UTC'}).key,'2025-12-29')
const ids=['a','b','c'],config={...defaultConfig('2026-01-06'),benchmark:'a',universe:ids,participants:[{id:'test',name:'Test',model:'Modèle saisi manuellement',color:'#17866b'}]}
const market={universe:ids.map(id=>({id,name:id,ticker:id,symbol:id,mic:'XPAR',instrumentType:'EQUITY',calendar:'TEST',currency:'EUR',timezone:'UTC'})),calendarFrom:'2025-12-01',calendarThrough:'2026-04-01',calendars:{TEST:{}},series:{},status:{ECB:{ok:true}},fx:{rates:{},validThrough:'2026-03-31'},revisions:[],asOf:'2026-01-04',generatedAt:'2026-01-05T12:00:00Z'}
for(let d='2025-12-01';d<'2026-04-01';d=addDays(d,1)){if([0,6].includes(new Date(d+'T12:00:00Z').getUTCDay()))continue;market.calendars.TEST[d]=d+'T16:00:00Z';for(const id of ids){market.series[id]??={anchorDate:'2025-12-01',qualified:true,convention:'synthetic-total-return-100-at-anchor',symbol:id,currency:'EUR',timezone:'UTC',points:{}};market.series[id].points[d]={synthetic:100,close:10,adjusted:10};market.status[id]={ok:true}}}
let book={version:1,revision:0,competitions:[],audit:[]},n=0
const submit=(operation,now='2026-01-05T12:00:00Z')=>{book=register(book,{version:1,requestId:'weekly-test-'+n++,expectedRevision:book.revision,competitionId:book.competitions[0]?.id,operation},market,now)}
submit({type:'create',config});const initial={participant:'test',kind:'target',weights:{a:33,b:33,c:33},model:'Test',reason:'Fixture uniquement',decisionDate:'2026-01-05'}
submit({type:'decision',decision:initial});submit({type:'launch'})
assert.equal(book.competitions[0].startDate,'2026-01-06','Initial allocations and reference share their own future close')
market.asOf='2026-01-11';market.generatedAt='2026-01-12T12:00:00Z';book=refresh(book,market).book
const hold={participant:'test',kind:'hold',model:'Test',reason:'Conserver',decisionDate:'2026-01-12'}
assert.throws(()=>submit({type:'decision',decision:{...hold,kind:'trades',amounts:{a:99999}}},market.generatedAt),/Liquidités|poids/)
submit({type:'decision',decision:hold},market.generatedAt)
assert.equal(book.competitions[0].decisions.at(-1).executionDate,'2026-01-19','Weekly response waits until the common deadline')
// Explicit rule migration keeps archived rules and already planned dates intact.
const legacyBook=clone(book),legacyComp=legacyBook.competitions[0]
legacyComp.config.frequency='monthly';legacyComp.decisions.at(-1).executionDate='2026-01-13'
legacyComp.decisions.at(-1).rules.frequency='monthly'
const migrated=register(legacyBook,{version:1,requestId:'weekly-migration',expectedRevision:legacyBook.revision,competitionId:legacyComp.id,operation:{type:'configure',config,reason:'Passage explicite à une fenêtre commune'}},market,market.generatedAt)
assert.equal(migrated.competitions[0].decisions.at(-1).executionDate,'2026-01-13')
assert.equal(migrated.competitions[0].decisions.at(-1).rules.frequency,'monthly')
assert.equal(migrated.competitions[0].ruleHistory.at(-1).before.frequency,'monthly')
assert.equal(migrated.competitions[0].ruleHistory.at(-1).after.frequency,'weekly')
const comp=book.competitions[0],duplicate={...hold,decisionDate:'2026-01-13'}
assert.throws(()=>validateDecision(duplicate,{...comp,decisions:comp.decisions.map(d=>({...d,status:'executed'}))},market,market.asOf,'2026-01-13T12:00:00Z'),/semaine/)
assert(weeklyStatus(comp,'2026-01-13T12:00:00Z').participants[0].received)
const before=JSON.stringify(comp.decisions)
assert(!weeklyStatus(comp,'2026-02-03T12:00:00Z').participants[0].received)
assert.equal(JSON.stringify(comp.decisions),before,'Missing response creates no fake hold decision')
const report=periodReport(comp,'2026-01-09',market),brief=briefing(comp,'test',market,'2026-01-09',report,'2026-01-12T12:00:00Z')
for(const term of ['Modèle saisi manuellement','Liquidités','Référence exacte','unités synthétiques','a | a','2026-01-09','2026-01-18','weights','amounts'])assert(brief.text.includes(term),term)
assert.throws(()=>briefing(comp,'test',market,'2026-01-09',{...report,complete:false,rows:report.rows.map(r=>r.id==='test'?{...r,complete:false}:r)}),/incomplet/)
// A missing quote held exclusively by another participant must not block this
// participant's current holdings and matched benchmark briefing.
const otherComp=clone(comp),otherMarket=clone(market)
otherComp.config.participants.push({id:'other',name:'Autre participant de test',model:'Test',color:'#287fba'})
otherComp.config.universe.push('outside')
otherMarket.universe.push({...otherMarket.universe[0],id:'outside',symbol:'outside',ticker:'outside',name:'Marché sans rapport'})
otherMarket.series.outside={...clone(otherMarket.series.a),symbol:'outside'}
otherMarket.status.outside={ok:true}
otherComp.decisions.push({id:'other-initial',participant:'other',status:'executed',kind:'target',model:'Test',reason:'Fixture isolée',registeredAt:'2026-01-05T12:00:00Z',executionDate:otherComp.startDate,execution:{trades:['outside','b','c'].map(id=>({id,units:33,amount:3300,fee:0}))}})
delete otherMarket.series.outside.points['2026-01-09']
const otherMissing=periodReport(otherComp,'2026-01-09',otherMarket)
assert.equal(otherMissing.complete,false,'The competition ranking stays incomplete')
assert(individualReportReady(otherComp,'test',otherMissing),'A healthy individual focus remains exportable')
assert(!individualReportReady(otherComp,'other',otherMissing),'The incomplete participant focus stays blocked')
assert(briefing(otherComp,'test',otherMarket,'2026-01-09',otherMissing).complete,'An unrelated missing quote cannot block a complete individual briefing')
assert.throws(()=>briefing(otherComp,'other',otherMarket,'2026-01-09',otherMissing),/incomplet/,'Own missing quote still blocks its briefing')
const pendingMarket=clone(otherMarket);pendingMarket.asOf='2026-01-23';delete pendingMarket.series.a.points['2026-01-19']
const pendingReport=periodReport(otherComp,'2026-01-23',pendingMarket)
assert.throws(()=>briefing(otherComp,'test',pendingMarket,'2026-01-23',pendingReport),/incomplet/,'An unresolved own execution cannot be hidden by healthy current prices')
const referenceMissing={...otherMissing,rows:otherMissing.rows.map(r=>r.id==='world'?{...r,complete:false}:r)}
assert.throws(()=>briefing(otherComp,'test',otherMarket,'2026-01-09',referenceMissing),/incomplet/,'The benchmark is required on the same dates')
const response={version:1,...initial};assert.deepEqual(parseResponse(response,comp,'test',market).weights,initial.weights)
assert.throws(()=>parseResponse({...response,participant:'other'},comp,'test',market),/participant/)
assert.throws(()=>parseResponse({...response,weights:{UNKNOWN:33}},comp,'test',market),/Identifiant/)
assert.throws(()=>parseResponse({...response,weights:{a:'33'}},comp,'test',market),/numérique/)
const ambiguous={...market,universe:market.universe.map(a=>({...a,isin:'SAME'}))}
assert.throws(()=>parseResponse({...response,weights:{SAME:33}},comp,'test',ambiguous),/ambigu/)
const broken=clone(market);delete broken.series.a.points['2025-12-08'];assert(!coverage('a',broken,market.asOf).ok,'An old qualified certificate cannot hide an interior missing session')
const root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-lazy-'))
try{
 const large={...market,universe:[...market.universe,...Array.from({length:1000},(_,i)=>({...market.universe[0],id:'not-held-'+i,instrumentId:'extra-'+i,name:'Searchable '+i}))]}
 const result=refresh(book,market),boot=publishRuntime(root,result.book,large,result.state)
 assert.equal(boot.market.universe.length,3,'Global catalogue is absent from dashboard bootstrap')
 assert.deepEqual(boot.market.series,{},'Opening does not load histories')
 assert.equal(boot.book.competitions[0].decisions[0].rules.universe,undefined,'Archived global universes do not repeat at opening')
 assert.equal(boot.state.competitions,undefined,'The durable book is not duplicated in dashboard state')
 const archived=JSON.parse(fs.readFileSync(path.join(root,'public/data/ai-portfolios/book.json')))
 assert.deepEqual(archived.competitions[0].decisions[0].rules.universe,ids,'Exact archived rules survive in the downloadable durable book')
 const encoded=JSON.parse(fs.readFileSync(path.join(root,'public/data/ai-portfolios/catalogue.json')))
 assert.equal(decodeCatalogue(encoded).length,1003)
 const loaded=await loadCatalogue(boot,async()=>({ok:true,json:async()=>encoded}),'/')
 assert(loaded.market.universe.some(a=>a.name==='Searchable 999'),'Search discovers the last candidate, no sample cap')
 await assert.rejects(()=>loadCatalogue(boot,async()=>({ok:true,json:async()=>({...encoded,asOf:'1999-01-01'})}),'/'),/Publication en cours/)
}finally{fs.rmSync(root,{recursive:true})}
// Initial dossiers require no positions and never reveal another participant's answer.
const launchConfig={...config,participants:defaultConfig().participants.map(p=>({...p,model:'Modèle de recette '+p.name}))}
let launchBook={version:1,revision:0,competitions:[],audit:[]}
const launchRequest=operation=>({version:1,expectedRevision:launchBook.revision,requestId:'initial-dossier-'+n++,competitionId:launchBook.competitions[0]?.id,operation})
const launchMarket={...clone(market),asOf:'2026-01-04',generatedAt:'2026-01-05T12:00:00Z'}
launchBook=register(launchBook,launchRequest({type:'create',config:launchConfig}),launchMarket,launchMarket.generatedAt)
const initialDraft=launchBook.competitions[0],draftBefore=JSON.stringify(initialDraft)
const launchBriefs=launchConfig.participants.map(p=>briefing(initialDraft,p.id,launchMarket,'2026-01-04',null,launchMarket.generatedAt))
for(const [i,b] of launchBriefs.entries()){
 assert(b.complete);assert(/10\s000/.test(b.text));assert(b.text.includes('Aucune position'));assert(b.text.includes('Référence exacte : a'))
 assert(b.text.includes('Aucun apport ni retrait externe'));assert(b.text.includes('100 % en liquidités'));assert(b.text.includes('schéma à compléter'));assert(b.text.includes('2026-01-06'))
 for(const other of launchConfig.participants.filter((_,j)=>j!==i))assert(!b.text.includes(other.model),'No other participant model/answer in initial dossier')
 const common=t=>t.slice(t.indexOf('RÈGLES'),t.indexOf('RÉPONSE À FOURNIR'))
 assert.equal(common(b.text),common(launchBriefs[0].text),'Identical shared rules and universe')
 assert.deepEqual(responseTemplate(launchConfig.participants[i].id,launchConfig.participants[i].model,'2026-01-05',true).weights,{})
}
assert.equal(JSON.stringify(initialDraft),draftBefore,'Generating initial dossiers cannot create positions or decisions')
assert.throws(()=>briefing({...initialDraft,config:{...launchConfig,minLines:7}},'chatgpt',launchMarket,'2026-01-04'),/lignes/)
const initialResponse={version:1,participant:'chatgpt',model:launchConfig.participants[0].model,decisionDate:'2026-01-05',kind:'target',weights:{a:30,b:30,c:30},reason:'RECETTE uniquement, pas une allocation attribuée à une IA.'}
const parsedInitial=parseResponse(initialResponse,initialDraft,'chatgpt',launchMarket)
validateDecision(parsedInitial,initialDraft,launchMarket,launchMarket.asOf,launchMarket.generatedAt)
for(const weights of [{a:36,b:32,c:32},{a:35,b:35,c:35},{a:30,b:30}])assert.throws(()=>validateDecision({...parsedInitial,weights},initialDraft,launchMarket,launchMarket.asOf,launchMarket.generatedAt),/Poids|poids|lignes/)
assert.throws(()=>register(launchBook,launchRequest({type:'decision',decision:{...parsedInitial,kind:'trades',weights:undefined,amounts:{a:5000,b:5000,c:5000}}}),launchMarket,launchMarket.generatedAt),/Liquidités/,'Initial purchases cannot exceed available cash')
const blockedReference=clone(launchMarket);blockedReference.status.a={ok:false,error:'Clôture attendue absente — test isolé'}
assert(briefing(initialDraft,'chatgpt',blockedReference,'2026-01-04',null,launchMarket.generatedAt).text.includes('Clôture attendue absente'))
assert.throws(()=>validateDecision(parsedInitial,initialDraft,blockedReference,blockedReference.asOf,launchMarket.generatedAt),/collecte en échec/)
for(const p of launchConfig.participants){const d={...parsedInitial,participant:p.id,model:p.model};if(p.id==='claude'){d.kind='hold';delete d.weights}launchBook=register(launchBook,launchRequest({type:'decision',decision:d}),launchMarket,launchMarket.generatedAt)}
assert(launchBook.competitions[0].decisions.every(d=>d.status==='recorded'))
assert.throws(()=>register(launchBook,launchRequest({type:'launch'}),blockedReference,launchMarket.generatedAt),/collecte en échec/)
launchBook=register(launchBook,launchRequest({type:'launch'}),launchMarket,launchMarket.generatedAt)
const launched=launchBook.competitions[0];assert.equal(launched.startDate,'2026-01-06');assert(launched.decisions.every(d=>d.executionDate===launched.startDate),'All participants and benchmark share the future initial close')
const initialResult=refresh(launchBook,{...launchMarket,asOf:'2026-01-06',generatedAt:'2026-01-07T12:00:00Z'})
for(const row of initialResult.state.current[launched.id].rows){assert.equal(row.value,10000);assert.equal(row.cash,row.id==='claude'?10000:row.id==='world'?0:1000)}
assert.equal(JSON.stringify(refresh(initialResult.book,{...launchMarket,asOf:'2026-01-06'}).book),JSON.stringify(initialResult.book),'Retry cannot duplicate initial execution')
console.log('Initial empty dossiers, common rules, exact reference, target template, residual cash, missing reference and shared future launch validated in isolation.')
console.log('Weekly windows/DST, common future execution, missing responses, financial briefings, exact import, stale coverage and lazy exhaustive catalogue validated.')
