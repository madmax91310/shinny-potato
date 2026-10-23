// Deterministic test ledger, not market observations or decisions attributed to AIs.
// Everything produced by this script stays in a temporary directory.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {defaultConfig,POSITION_METHOD} from '../src/pages/ai-portfolios/data.js'
import {addDays,clone,portfolioAt,mark,quoteAt,periodReport,runCompetition,coverage,technicalCoverage,emptyPortfolio,planDecision} from '../src/pages/ai-portfolios/lib.js'
import {register,refresh} from './ai-portfolios.mjs'
import {briefing,parseResponse} from '../src/pages/ai-portfolios/briefing.js'
import {publication,FORMATS,periodBounds} from '../src/pages/ai-portfolios/publication.js'
import {trackingStatus} from './check-ai-tracking.mjs'
import {weeklyWindow,weeklyStatus} from '../src/pages/ai-portfolios/weekly.js'
const near=(a,b,label='')=>assert(Math.abs(a-b)<1e-6,`${label}: ${a} != ${b}`)
const ids=['qa-sp500','qa-usd','qa-eur','qa-gbp','qa-jpy','qa-crypto'],currencies=['USD','USD','EUR','GBP','JPY','USD']
export function rehearsal(count=3,uniqueClaude=false){
 const market={version:1,asOf:'2026-07-09',generatedAt:'2026-07-10T09:00:00Z',calendarFrom:'2026-06-01',calendarThrough:'2026-11-30',calendars:{EU:{},US:{},ASIA:{},CRYPTO:{}},calendarValidity:{},series:{},status:{ECB:{ok:true,lastSuccess:'2026-10-23'}},revisions:[],fx:{rates:{},expectedDates:[],validThrough:'2026-11-30'},universe:ids.map((id,i)=>({id,name:(i===0?'ETF S&P 500 synthétique de recette':`Actif ${i} · données déterministes de recette`),ticker:['SPTEST','USTEST','EUTEST','GBTEST','JPTEST','BTCTEST'][i],symbol:id,mic:['XLON','XNAS','XPAR','XLON','XTKS','CRYP'][i],timezone:i===4?'Asia/Tokyo':'UTC',calendar:['EU','US','EU','EU','ASIA','CRYPTO'][i],currency:currencies[i],priceScale:i===3?.01:1,instrumentType:i===0?'ETF':i===5?'CRYPTOCURRENCY':'EQUITY',ucits:i===0,status:'qualified',shareType:'ordinary'}))}
 if(uniqueClaude)market.universe.push({...market.universe[2],id:'qa-claude-only',symbol:'qa-claude-only',ticker:'ONLYTEST'})
 let n=0
 for(let d=market.calendarFrom;d<=market.calendarThrough;d=addDays(d,1),n++){
  const dow=new Date(d+'T12:00:00Z').getUTCDay(),business=![0,6].includes(dow)
  if(business){market.calendars.EU[d]=d+'T16:30:00Z';market.calendars.US[d]=d+'T20:00:00Z';market.calendars.ASIA[d]=d+'T06:00:00Z';market.fx.expectedDates.push(d);market.fx.rates[d]={USD:1.1+n*.0005,GBP:.85+n*.0001,JPY:150+n*.02}}
  // Exact official-closure behaviour is tested here as an explicitly synthetic
  // exceptional closure; no assertion that a real market closed on this date.
  if(d==='2026-10-13')delete market.calendars.ASIA[d]
  market.calendars.CRYPTO[d]=addDays(d,1)+'T00:00:00Z'
  for(const [i,a] of market.universe.entries()){
   market.series[a.id]??={anchorDate:market.calendarFrom,qualified:true,convention:'synthetic-total-return-100-at-anchor',symbol:a.symbol,currency:a.currency,timezone:a.timezone,priceScale:a.priceScale,points:{}}
   if(market.calendars[a.calendar][d])market.series[a.id].points[d]={synthetic:100+n*(i===2?-.025:.03+i*.012),close:i===1&&d>='2026-08-03'?50:100}
   market.status[a.id]={ok:true}
  }
 }
 const config={...defaultConfig('2026-07-13'),name:`RECETTE ISOLÉE ${count} · JAMAIS PUBLIÉE`,benchmark:ids[0],universe:market.universe.map(a=>a.id),minLines:1,maxLines:6,maxWeight:35,feeBps:10,participants:defaultConfig().participants.concat(count===4?[{id:'fourth',name:'Quatrième participant au nom volontairement long pour la recette',model:'Modèle déclaré manuellement pour vérifier les identités longues en image',color:'#287fba'}]:[]).map(p=>({...p,name:p.name+' · TEST',model:p.model==='À renseigner'?'Modèle fictif de recette':p.model}))}
 // Respect the production identity length rule, including the extra participant.
 if(config.participants[3])config.participants[3].name='Quatrième participant au nom long pour la recette isolée'
 let book={version:1,revision:0,competitions:[],audit:[]},serial=0
 const at=(date,time='09:00:00')=>{market.asOf=addDays(date,-1);market.generatedAt=date+'T'+time+'Z'}
 const submit=(operation,date)=>{at(date);book=register(book,{version:1,requestId:`qa-${count}-request-${String(serial++).padStart(5,'0')}`,expectedRevision:book.revision,competitionId:book.competitions[0]?.id,operation},market,market.generatedAt)}
 submit({type:'create',config},'2026-07-10')
 for(const p of config.participants)submit({type:'decision',decision:{participant:p.id,kind:'target',weights:{'qa-usd':20,[uniqueClaude&&p.id==='claude'?'qa-claude-only':'qa-eur']:20,'qa-gbp':20,'qa-jpy':20},model:p.model,decisionDate:'2026-07-10',reason:'RECETTE déterministe initiale, aucune vraie réponse IA.'}},'2026-07-10')
 submit({type:'launch'},'2026-07-10');assert.equal(book.competitions[0].startDate,'2026-07-13')
 market.asOf='2026-10-04';market.generatedAt='2026-10-05T05:20:00Z';book=refresh(book,market).book
 const decision=(participant,kind,extra,date)=>({type:'decision',decision:{participant,kind,...extra,model:config.participants.find(p=>p.id===participant).model,decisionDate:date,reason:'RECETTE ISOLÉE : décision manuelle déterministe.'}})
 submit(decision('chatgpt','trades',{amounts:{'qa-usd':300,'qa-eur':-200}},'2026-10-05'),'2026-10-05')
 submit(decision('claude','hold',{},'2026-10-05'),'2026-10-05')
 let comp=book.competitions[0];assert.equal(comp.decisions.at(-1).executionDate,'2026-10-12');assert.equal(weeklyStatus(comp,'2026-10-07T12:00:00Z').participants.find(p=>p.id==='gemini').received,false)
 market.asOf='2026-10-11';market.generatedAt='2026-10-12T05:00:00Z';book=refresh(book,market).book
 const before=portfolioAt(book.competitions[0],'chatgpt','2026-10-11');assert.equal(book.competitions[0].decisions.filter(d=>d.status==='recorded').length,2)
 // One complete weekly turn: daily observations, receipt, missing answer,
 // common deadline, future execution, then durable reload below.
 market.asOf='2026-10-12';book=refresh(book,market).book;assert.notDeepEqual(portfolioAt(book.competitions[0],'chatgpt','2026-10-12'),before)
 submit(decision('chatgpt','target',{weights:{'qa-usd':25,'qa-eur':25,'qa-jpy':20,'qa-crypto':20}},'2026-10-12'),'2026-10-12')
 submit(decision('claude','hold',{},'2026-10-12'),'2026-10-12');comp=book.competitions[0]
 assert.equal(comp.decisions.at(-1).executionDate,'2026-10-19')
 const results=[]
 for(let date='2026-10-12';date<='2026-10-19';date=addDays(date,1)){market.asOf=date;market.generatedAt=addDays(date,1)+'T05:20:00Z';const r=refresh(book,market);book=r.book;results.push({date,revision:book.revision,value:r.state.current[comp.id].rows[0].value})}
 comp=book.competitions[0];assert(comp.decisions.filter(d=>d.participant==='chatgpt').at(-1).execution.trades.some(t=>t.id==='qa-gbp'&&t.units<0));assert.equal(portfolioAt(comp,'chatgpt','2026-10-19').positions['qa-gbp'],0)
 assert(comp.decisions.filter(d=>d.participant==='chatgpt').at(-1).execution.trades.some(t=>t.id==='qa-crypto'&&t.units>0))
 // Independent cash/units arithmetic using the actual archived executions.
 // No use of quoteAt, mark, planDecision or portfolioAt in this oracle.
 const oracle=(id,date)=>{let cash=10000,fees=0;const units={};for(const d of comp.decisions.filter(d=>d.participant===id&&d.status==='executed'&&d.executionDate<=date))for(const t of d.execution.trades){const a=market.universe.find(a=>a.id===t.id),pd=Object.keys(market.calendars[a.calendar]).filter(x=>x<=d.executionDate).at(-1),fd=market.fx.expectedDates.filter(x=>x<=d.executionDate).at(-1),rate=a.currency==='EUR'?1:market.fx.rates[fd][a.currency],price=market.series[a.id].points[pd].synthetic/rate;near(t.units,t.amount/price,'units oracle');near(t.fee,Math.abs(t.amount)*.001,'fees oracle');cash-=t.amount+t.fee;fees+=t.fee;units[t.id]=(units[t.id]??0)+t.units}let value=cash;for(const [key,u] of Object.entries(units)){const a=market.universe.find(x=>x.id===key),pd=Object.keys(market.calendars[a.calendar]).filter(x=>x<=date).at(-1),fd=market.fx.expectedDates.filter(x=>x<=date).at(-1);value+=u*market.series[key].points[pd].synthetic/(a.currency==='EUR'?1:market.fx.rates[fd][a.currency])}return {value,cash,fees}}
 // Independently solve target allocations by bisection (the engine uses a
 // fixed-point iteration). Check generated amounts, not only their bookkeeping.
 let independentTargets=0
 for(const d of comp.decisions.filter(d=>d.status==='executed'&&d.kind==='target')){
  let cash=10000;const units={};for(const previous of comp.decisions.filter(x=>x.participant===d.participant&&x.status==='executed'&&x.executionDate<d.executionDate))for(const t of previous.execution.trades){cash-=t.amount+t.fee;units[t.id]=(units[t.id]??0)+t.units}
  const price=id=>{const a=market.universe.find(a=>a.id===id),pd=Object.keys(market.calendars[a.calendar]).filter(x=>x<=d.executionDate).at(-1),fd=market.fx.expectedDates.filter(x=>x<=d.executionDate).at(-1);return market.series[id].points[pd].synthetic/(a.currency==='EUR'?1:market.fx.rates[fd][a.currency])},keys=[...new Set([...Object.keys(units),...Object.keys(d.weights)])],value=cash+keys.reduce((s,id)=>s+(units[id]??0)*price(id),0)
  let lo=0,hi=value;for(let i=0;i<100;i++){const mid=(lo+hi)/2,turnover=keys.reduce((s,id)=>s+Math.abs(mid*(d.weights[id]??0)/100-(units[id]??0)*price(id)),0);if(mid+turnover*.001>value)hi=mid;else lo=mid}
  const capital=(lo+hi)/2;near(d.execution.after.value,capital,'independent target capital');for(const id of keys)near(d.execution.trades.find(t=>t.id===id)?.amount??0,capital*(d.weights[id]??0)/100-(units[id]??0)*price(id),'independent target amount');independentTargets++
 }
 market.asOf='2026-10-23';market.generatedAt='2026-10-24T05:20:00Z';const final=refresh(book,market),state=final.state;book=final.book;comp=book.competitions[0]
 for(const point of state.daily[comp.id])for(const row of point.rows){const expected=oracle(row.id,point.date);near(row.value,expected.value,'daily independent EUR NAV');near(row.cash,expected.cash,'cash');near(row.fees,expected.fees,'fees');near(row.performance,(expected.value/10000-1)*100,'return');near([...(row.positions??[]),...(row.closedResults??[])].reduce((s,p)=>s+(p.investmentPnl??0),0),row.value-10000,'net contributions reconcile')}
 near(state.current[comp.id].rows.find(p=>p.id==='world').value,oracle('world',market.asOf).value,'reference')
 const week=periodReport(comp,'2026-10-23',market),previous=oracle('chatgpt','2026-10-16');near(week.rows[0].weekly,(oracle('chatgpt','2026-10-23').value/previous.value-1)*100,'weekly independent')
 assert.deepEqual(refresh(book,market).book,book,'No duplicate execution');assert.deepEqual(runCompetition(comp,market,market.asOf),comp)
 assert.equal(comp.decisions.filter(d=>d.participant==='gemini').length,1,'Missing replies never create hold decisions')
 assert.equal(trackingStatus(book,state).ok,true);const incompleteState=clone(state);incompleteState.current[comp.id].complete=false;assert.equal(trackingStatus(book,incompleteState).ok,false)
 const text=briefing(comp,'chatgpt',market,market.asOf,state.current[comp.id],market.generatedAt,week).text;assert(text.includes('unités synthétiques'))
 const good={version:1,participant:'chatgpt',kind:'hold',model:'Modèle de recette',decisionDate:'2026-10-23',reason:'Conserver.'};assert.equal(parseResponse(good,comp,'chatgpt',market).kind,'hold');assert.throws(()=>parseResponse({...good,participant:'claude'},comp,'chatgpt',market),/participant/);assert.throws(()=>parseResponse({...good,kind:'target',weights:{inconnu:20}},comp,'chatgpt',market),/inconnu/)
 for(const [format] of FORMATS){const model=publication(comp,state.daily[comp.id],market,{format,participant:'chatgpt',participants:config.participants.map(p=>p.id),period:'week'});assert(model.complete);assert.equal(model.start,'2026-10-16')}
 for(const period of ['all','week','month','quarter']){const p=publication(comp,state.daily[comp.id],market,{period});assert(p.complete);near(p.curves[0].values[0].value,0,'rebased origin');near(p.rows[0].periodPerformance,(oracle('chatgpt',p.end).value/(p.opening?10000:oracle('chatgpt',p.start).value)-1)*100,'independent rebased return')}
 assert.throws(()=>periodBounds(comp,'2026-07-20','month'),/court/)
 const broken=clone(state.daily[comp.id]);broken.at(-1).rows.find(r=>r.id==='claude').complete=false;broken.at(-1).rows.find(r=>r.id==='claude').error='Fixture source en échec'
 assert(publication(comp,broken,market,{format:'individual',participant:'chatgpt'}).complete);assert(publication(comp,broken,market,{participants:['chatgpt','gemini']}).complete);assert.throws(()=>publication(comp,broken,market),/claude/)
 broken.at(-1).rows.find(r=>r.id==='world').complete=false;assert.throws(()=>publication(comp,broken,market,{format:'individual',participant:'chatgpt'}),/world/)
 const missing=clone(market);delete missing.series['qa-usd'].points['2026-10-19'];const pending=runCompetition({...comp,decisions:comp.decisions.map(d=>d.executionDate==='2026-10-19'?{...d,status:'recorded'}:d)},missing,missing.asOf);assert.equal(pending.decisions.find(d=>d.participant==='chatgpt'&&d.executionDate==='2026-10-19').status,'pending');assert.equal(runCompetition(pending,market,market.asOf).decisions.find(d=>d.participant==='chatgpt'&&d.executionDate==='2026-10-19').status,'executed')
 const failed=clone(market);failed.status['qa-usd']={ok:false,error:'Fixture HTTP 429'};assert.equal(coverage('qa-usd',failed,market.asOf).ok,false);assert.equal(technicalCoverage('qa-usd',failed,market.asOf).ok,true,'Provider failure cannot invalidate an intact certified history')
 assert.equal(quoteAt('qa-jpy','2026-10-13','EUR',market).priceDate,'2026-10-12');assert.equal(quoteAt('qa-eur','2026-10-18','EUR',market).priceDate,'2026-10-16');assert.equal(quoteAt('qa-crypto','2026-10-18','EUR',market).priceDate,'2026-10-18')
 const short=clone(market);short.series['qa-usd'].points=Object.fromEntries(Object.entries(short.series['qa-usd'].points).slice(-3));assert.equal(coverage('qa-usd',short,market.asOf).ok,false)
 assert.equal(weeklyWindow('2026-03-25T12:00:00Z').deadlineAt,'2026-03-29T21:59:59.000Z');assert.equal(weeklyWindow('2026-10-23T12:00:00Z').deadlineAt,'2026-10-25T22:59:59.000Z')
 const p=mark(portfolioAt(comp,'chatgpt','2026-07-31'),'2026-08-03',config,market);near(p.cash,mark(portfolioAt(comp,'chatgpt','2026-07-31'),'2026-07-31',config,market).cash,'no duplicate dividend or split cash credit')
 const proof={scope:'Données entièrement déterministes de recette, aucune preuve réseau ni décision réelle.',participants:count,weeklyRun:results,independentTargets,independentDailyValues:state.daily[comp.id].length*(count+1),current:state.current[comp.id].rows.map(r=>({id:r.id,value:r.value,cash:r.cash,fees:r.fees,performance:r.performance})),method:POSITION_METHOD,productionBookUntouched:true,scenarios:['hold','reinforce','partial-sale','full-sale','target','fees','cash','weekly-deadline','missing-reply','future-execution','daily-refresh','replay','missing-own-or-unrelated','missing-reference','provider-failure','closed-market','different-calendars','crypto-weekend','historical-FX','GBp','short-history','DST','all-six-publication-models']}
 return {version:2,book,market,state,defaults:config,catalogueLoaded:true,proof}
}
// Small independent worked example for realised/unrealised P&L after several buys.
export function investmentExample(){const f=rehearsal(3),c={...f.book.competitions[0].config,maxWeight:100,feeBps:100},m=clone(f.market);for(const id of ids)for(const point of Object.values(m.series[id].points))point.synthetic=100;m.fx.rates=Object.fromEntries(Object.keys(m.fx.rates).map(d=>[d,{USD:1,GBP:1,JPY:1}]));let p=planDecision(emptyPortfolio(c),{kind:'trades',amounts:{'qa-eur':1000}},'2026-10-05',c,m).portfolio;m.series['qa-eur'].points['2026-10-06'].synthetic=120;p=planDecision(p,{kind:'trades',amounts:{'qa-eur':1200}},'2026-10-06',c,m).portfolio;m.series['qa-eur'].points['2026-10-07'].synthetic=140;p=planDecision(p,{kind:'trades',amounts:{'qa-eur':-700}},'2026-10-07',c,m).portfolio;m.series['qa-eur'].points['2026-10-08'].synthetic=150;const row=mark(p,'2026-10-08',c,m).positions[0];near(row.realizedPnl,137.5);near(row.unrealizedPnl,583.5);near(row.investmentPnl,721);near(row.investmentPerformance,721/2222*100);const closed=planDecision(p,{kind:'target',weights:{}},'2026-10-08',c,m).after.closedResults[0];near(closed.investmentPnl,698.5);near(closed.realizedPnl,698.5);near(closed.unrealizedPnl,0);return {realized:137.5,unrealized:583.5,totalNet:721,purchases:2222,closedNet:698.5}}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const production=fs.readFileSync('data/ai-portfolios/book.json'),out=process.env.AI_REHEARSAL_OUTPUT??fs.mkdtempSync(path.join(os.tmpdir(),'ai-week-rehearsal-'));fs.mkdirSync(out,{recursive:true});const evidence=[]
 for(const count of [3,4]){const f=rehearsal(count);fs.writeFileSync(path.join(out,`fixture-${count}.json`),JSON.stringify(f));evidence.push(f.proof)}
 const f=rehearsal(3),folder=path.join(out,'data/ai-portfolios');fs.mkdirSync(folder,{recursive:true});for(const [name,value] of Object.entries({book:f.book,market:f.market,state:f.state}))fs.writeFileSync(path.join(folder,name+'.json'),JSON.stringify(value))
 let r=spawnSync(process.execPath,['scripts/ai-portfolios.mjs','refresh','--root',out],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(folder,'book.json'))),f.book)
 const git=(...args)=>{const r=spawnSync('git',args,{cwd:out,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim()};git('init','-q');git('add','--all');git('-c','user.name=Recette isolée','-c','user.email=qa@example.invalid','commit','--allow-empty','-qm','Recette fictive isolée, jamais publiée');assert.equal(git('status','--porcelain'),'')
 assert.deepEqual(fs.readFileSync('data/ai-portfolios/book.json'),production)
 const report={scope:'Recette entièrement isolée et déterministe ; aucun résultat réseau fabriqué.',fixtures:evidence,investmentExample:investmentExample(),durableCommit:git('rev-parse','HEAD'),durableReload:true,productionBookUnchanged:true}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('Recette complète : '+out);console.log(JSON.stringify(report,null,2))
}
