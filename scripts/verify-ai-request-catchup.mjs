// Optional real-network acceptance check of CLI wiring, never a real launch.
// Every book/decision/price modification stays in a disposable temporary root.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {defaultConfig} from '../src/pages/ai-portfolios/data.js'
import {register} from './ai-portfolios.mjs'
import {hydrateMarketSeries} from './ai-series-store.mjs'
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex')
const productionBook='data/ai-portfolios/book.json',before=hash(productionBook),root=fs.mkdtempSync(path.join(os.tmpdir(),'ai-real-catchup-'))
try{
 const market=JSON.parse(fs.readFileSync('data/ai-portfolios/market.json')),now=new Date().toISOString()
 const stocks=market.universe.filter(a=>a.status==='qualified'&&!a.selectionBlock&&a.sourceId==='nasdaq'&&a.instrumentType==='EQUITY'&&a.shareType==='ordinary').slice(0,3)
 assert.equal(stocks.length,3)
 const defaults=defaultConfig(now.slice(0,10)),ids=[defaults.benchmark,...stocks.map(a=>a.id)]
 hydrateMarketSeries(market,process.cwd(),ids);market.universe=market.universe.filter(a=>ids.includes(a.id));market.series=Object.fromEntries(ids.map(id=>[id,market.series[id]]))
 const last=Object.keys(market.series[stocks[0].id].points).sort().at(-1);delete market.series[stocks[0].id].points[last]
 const config={...defaults,name:'TEST ISOLÉ CLI · aucune compétition réelle',universe:ids,participants:defaults.participants.map(p=>({...p,model:'MODÈLE FICTIF DE TEST'}))}
 let book={version:1,revision:0,competitions:[],audit:[]}
 book=register(book,{version:1,requestId:'isolated-cli-competition',expectedRevision:0,operation:{type:'create',config}},market,now)
 const folder=path.join(root,'data/ai-portfolios');fs.mkdirSync(folder,{recursive:true})
 fs.writeFileSync(path.join(folder,'book.json'),JSON.stringify(book));fs.writeFileSync(path.join(folder,'market.json'),JSON.stringify(market));fs.writeFileSync(path.join(folder,'qualification.json'),JSON.stringify({candidates:market.universe}))
 const proposal={version:1,requestId:'isolated-cli-response',expectedRevision:1,competitionId:book.competitions[0].id,operation:{type:'decision',decision:{participant:'chatgpt',kind:'target',weights:Object.fromEntries(stocks.map(a=>[a.id,33])),decisionDate:now.slice(0,10),model:'MODÈLE FICTIF DE TEST',reason:'Réponse construite exclusivement pour valider le rattrapage CLI dans un dossier temporaire.'}}}
 const request=path.join(root,'request.json');fs.writeFileSync(request,JSON.stringify(proposal))
 const run=()=>spawnSync(process.execPath,['scripts/ai-portfolios.mjs','import',request,'--root',root],{encoding:'utf8',maxBuffer:10_000_000,timeout:180000})
 const first=run();assert.equal(first.status,0,first.stderr+'\n'+first.stdout)
 const saved=JSON.parse(fs.readFileSync(path.join(folder,'book.json'))),updated=JSON.parse(fs.readFileSync(path.join(folder,'market.json')))
 assert.equal(saved.revision,2);assert.equal(saved.competitions[0].status,'draft');assert.equal(saved.competitions[0].decisions.length,1)
 assert.equal(saved.competitions[0].decisions[0].status,'recorded');assert(saved.competitions[0].decisions[0].executionDate>now.slice(0,10))
 assert.deepEqual(new Set(updated.collection.required),new Set(ids));assert(updated.collection.requested.includes(stocks[0].id),'The missing bar must trigger catch-up');assert.deepEqual(new Set([...updated.collection.requested,...updated.collection.reused]),new Set(ids),'Only necessary exact listings may be collected or reused');assert.equal(updated.collection.requested.length+updated.collection.reused.length,ids.length,'One fetch or reuse per exact listing')
 // Restored real close is sharded by the collector, so hydrate its actual output.
 hydrateMarketSeries(updated,root,ids);assert(updated.series[stocks[0].id].points[last]);assert.equal(updated.series[stocks[0].id].anchorDate,market.series[stocks[0].id].anchorDate)
 const marketHash=hash(path.join(folder,'market.json')),bookHash=hash(path.join(folder,'book.json')),second=run()
 assert.notEqual(second.status,0);assert.match(second.stderr,/périmé/);assert.equal(hash(path.join(folder,'market.json')),marketHash,'Stale replay is refused before any unnecessary catchup');assert.equal(hash(path.join(folder,'book.json')),bookHash)
 assert.equal(hash(productionBook),before,'Production book must be byte-identical')
 const proof={testedAt:now,scope:'CLI réelle avec réseau, livre temporaire et sans lancement ; aucune compétition ni décision ajoutée aux données de production.',requestedAssets:updated.collection.required,fetchedListings:updated.collection.requested,collectionModes:Object.fromEntries(updated.collection.requested.map(id=>[id,updated.series[id].collectionMode])),reused:updated.collection.reused,restoredClose:last,anchorPreserved:true,decisionRecordedInTemporaryRoot:true,competitionRemainsDraft:true,duplicateRejectedBeforeCollection:true,productionBookUnchanged:true}
 const output=process.env.AI_REHEARSAL_OUTPUT??os.tmpdir();fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'import-validation.json'),JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof,null,2))
}finally{fs.rmSync(root,{recursive:true})}
