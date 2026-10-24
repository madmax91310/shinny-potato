import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { EXTRA_SOURCES, extraDiscovery } from './lib/radar-extra-sources.mjs'
import { parsePublication,collectPublications } from './lib/radar-publications.mjs'
import { editorialState,editorialAssessment,factType } from '../src/lib/radar-editorial.js'
import { housingConventions,compatibleHousing,qualifyDvfSales,DVF_MIN_SALES,mortgageScenario } from '../src/lib/radar-housing.js'
import { parseEtfDocument } from './lib/radar-news.mjs'
import { advanceRadar } from './lib/editorial-radar.mjs'
import { planNotifications } from './lib/radar-notifications.mjs'
const now=new Date('2026-10-24T16:00:00Z'),source=id=>EXTRA_SOURCES.find(s=>s.id===id)
const fixture=id=>readFile(new URL(`./fixtures/radar-extensions/${id}.html`,import.meta.url),'utf8')
const rows={}
for(const id of ['bnp','xtrackers','hanetf','xetra','credit-logement','oll']){
 const listing=id==='xtrackers'?{title:'DWS expands Xtrackers Fixed Income ETF offering with first Global Credit ETFs',publishedAt:'2026-08-04'}:{}
 const row=parsePublication(await fixture(id),source(id),source(id).url,now,listing);rows[id]=row
 assert.equal(row.checkedAt,now.toISOString())
 if(id==='credit-logement')assert.equal(row.publishedAt,null);else assert.ok(row.publishedAt);assert.ok(row.evidence.sourceHash)
}
assert.equal(rows.bnp.products.length,4)
assert.ok(rows.bnp.products.every(p=>p.isin===null&&p.fees===null),'A group announcement does not need fake per-product characteristics')
assert.ok(rows.xtrackers.products.filter(p=>p.isin).length>=3)
assert.equal(new Set(rows.xtrackers.products.filter(p=>p.isin).map(p=>p.isin)).size,rows.xtrackers.products.filter(p=>p.isin).length)
assert.ok(new Set(rows.xtrackers.products.map(p=>p.fees).filter(Boolean)).size>1,'Distinct table-row fees are retained')
assert.equal(rows.hanetf.products.length,2,'Related press releases and navigation must not become products')
assert.equal(rows.xetra.announcementEvidence.type,'trading')
assert.ok(rows.xetra.products.length>0)
assert.equal(rows.oll.factType,'publication-watch','An external dashboard link without extracted numeric data stays to follow')
assert.equal(editorialState({...rows.oll,after:rows.oll.value}),'watch')
assert.equal(rows['credit-logement'].referencePeriod,'2026-09')
assert.match(rows['credit-logement'].summary,/2026/)
const share=parseEtfDocument('<p>PIMCO announces the launch of an ETF share class of an existing fund.</p><p>PIMCO Advantage StocksPLUS US Large Cap UCITS ETF. ISIN: IE0002XZSHO1</p>','PIMCO launches UCITS ETF share class')
assert.equal(share.announcementEvidence.type,'share-class')
assert.equal(factType({field:'announcement',announcementEvidence:share.announcementEvidence}),'share-class')
const broad={...rows.hanetf,products:[{name:'ETF Monde',index:'MSCI World',pea:null}],family:'etf',field:'announcement',kind:'new',after:rows.hanetf.value,id:'1'.repeat(24),detectedAt:now.toISOString()}
assert.ok(editorialAssessment(broad,+now).score>editorialAssessment({...broad,products:[{name:'ETF spécialisé'}]},+now).score)
assert.equal(editorialAssessment({...broad,after:{aum:0}},+now).score,editorialAssessment({...broad,after:{aum:1000000}},+now).score,'Small initial AUM is not a rejection or editorial penalty')
const price={priceBasis:'transaction',measure:'indice à qualité constante',propertyType:'appartements',market:'ancien',geography:'France',method:'Notaires-INSEE',frequency:'quarterly'}
assert.equal(compatibleHousing(price,{...price}),true)
for(const change of [{priceBasis:'annonce'},{measure:'prix médian'},{market:'neuf'},{geography:'Paris'},{frequency:'monthly'},{method:null}])assert.equal(compatibleHousing(price,{...price,...change}),false)
const rate={rateType:'taux nominal',rateScope:'nouveaux crédits',insurance:'assurance exclue',duration:'20 ans',population:'ménages',method:'Banque de France',frequency:'monthly'}
for(const change of [{rateType:'TAEG'},{rateScope:'encours'},{insurance:'assurance incluse'},{duration:'25 ans'},{method:'Crédit Logement / CSA'},{frequency:'quarterly'}])assert.equal(compatibleHousing(rate,{...rate,...change}),false)
assert.equal(compatibleHousing({rateType:'taux nominal'},{rateType:'taux nominal'}),false,'Unknown methodology blocks automatic comparisons')
assert.equal(housingConventions('Prix d’annonce des appartements dans le neuf').priceBasis,'annonce')
assert.equal(housingConventions('Taux nominal hors assurance comparé au TAEG').rateType,null,'Mixed conventions are not silently treated as one rate')
const transaction={id:'one',nature:'Vente',type:'Appartement',units:1,mixedUse:false,period:'2026-Q1',geography:'commune-A',value:200000,surface:60}
const enough=Array.from({length:DVF_MIN_SALES},(_,i)=>({...transaction,id:String(i)}))
assert.equal(qualifyDvfSales(enough,{period:transaction.period,geography:transaction.geography}).usable,true)
assert.equal(qualifyDvfSales([...enough.slice(1),{...transaction,id:'bad',units:2}],{period:transaction.period,geography:transaction.geography}).usable,false)
assert.equal(qualifyDvfSales(Array(40).fill(transaction),{period:transaction.period,geography:transaction.geography}).usable,false,'Several rows of one mutation are not several sales')
for(const invalid of [{surface:0},{surface:4},{value:0},{value:99999999},{nature:'Echange'},{mixedUse:true},{type:'Local commercial'},{period:'2025-Q1'},{geography:'autre'}])assert.equal(qualifyDvfSales([{...transaction,...invalid}],{period:transaction.period,geography:transaction.geography}).sampleSize,0)
const simulation=mortgageScenario({monthly:1000,ratePct:3,years:20,insurancePct:.3,deposit:15000,fees:10000})
assert.ok(simulation.principal>150000&&simulation.principal<200000)
assert.equal(simulation.purchaseBudget,simulation.principal+5000)
assert.equal(simulation.assumptions.insuranceBasis,'capital initial')
assert.equal(mortgageScenario({monthly:1000,ratePct:0,years:20}).principal,240000)
assert.throws(()=>mortgageScenario({monthly:1000,ratePct:-1,years:20}))
const observation={...rows['credit-logement'],factType:'statistical-publication',publishedAt:'2026-10-22',period:'2026-10-22',discovery:true}
const initial=advanceRadar(null,[observation],{now})
const unchanged=advanceRadar(initial.state,[{...observation,period:'2026-10-23',publishedAt:'2026-10-23'}],{now})
assert.equal(unchanged.newEvents.length,1,'A new statistical publication is emitted even with unchanged quoted values')
const revised=advanceRadar(initial.state,[{...observation,value:'Révision de la même statistique : 3,5 %'}],{now})
assert.equal(revised.newEvents[0].factType,'source-revision')
assert.equal(editorialState(revised.newEvents[0]),'secondary')
// Initial archive recovery is silent; genuinely new later documents remain admissible.
assert.equal(planNotifications([{...broad,backfill:true}],{acknowledged:[]},now,'digest').events.length,0)
const fakeSource={...source('notaires-paris'),id:'fixture',url:'https://paris.notaires.fr/list',path:'/doc/'}
const html='<a href="/doc/a">Publication logement</a>'
const request=async url=>new Response(url.endsWith('/list')?html:'<html><h1>Prix des logements anciens en 2026</h1><script type="application/ld+json">{"datePublished":"2026-10-23"}</script><article><p>Les prix des logements anciens progressent de 1 % au deuxième trimestre 2026 en France.</p></article></html>',{headers:{'content-type':'text/html'}})
const bootstrap=await collectPublications(now,request,{},[fakeSource],1)
assert.equal(bootstrap.observations.length,1);assert.equal(bootstrap.observations[0].backfill,true)
const recovery=await collectPublications(new Date(+now+8*86400000),async()=>{throw Error('HTTP 503')},bootstrap.state,[fakeSource],1)
assert.equal(recovery.observations[0].checkedAt,bootstrap.observations[0].checkedAt)
assert.equal(recovery.state.documents['https://paris.notaires.fr/doc/a'].status,'error')
console.log('Radar extensions: real BNP/Xtrackers/HANetf/Xetra/CSA/OLL publications, share classes, unknowns, housing conventions, DVF sample/filters, mortgage assumptions, revisions, bootstrap silence and durable recovery verified.')

const outside=parseEtfDocument('<table><tr><th>ETF Name</th><th>ISIN</th><th>TER</th></tr><tr><td>Unknown Issuer Broad Europe UCITS ETF</td><td>IE0002XZSHO1</td><td>0.12%</td></tr></table>','New ETF listing')
assert.equal(outside.products[0].name,'Unknown Issuer Broad Europe UCITS ETF')
assert.equal(outside.products[0].fees,'0.12%')
assert.equal(outside.products[0].availability,null)

// Exercise discovery -> fetch, including DWS's significant terminal slash.
const xt=source('xtrackers'), xtDoc=xt.url+'a-new-etf/'
const xtBody=await fixture('xtrackers')
const xtResult=await collectPublications(now,async url=>{
 if(url===xt.url)return new Response(`<table><tr><td>04/08/2026</td><td><a href="${xtDoc}">Xtrackers new ETFs</a></td></tr></table>`)
 assert.equal(url,xtDoc,'Request the official trailing slash, independently of canonical deduplication')
 return new Response(xtBody)
},{},[xt],1)
assert.equal(xtResult.observations.length,1)
assert.equal(xtResult.errors.length,0)
