import assert from 'node:assert/strict'
import fs from 'node:fs'
import {decodeCatalogue,loadCatalogue,mergeRuntime,restoreOwnerDraft} from '../src/pages/ai-portfolios/runtime.js'
import {compactProposal,expandProposal,identityList} from '../src/pages/ai-portfolios/request-transport.js'
// Use the current published book, without freezing collector-owned counts or models.
const book=JSON.parse(fs.readFileSync('data/ai-portfolios/book.json'))
const catalogue=JSON.parse(fs.readFileSync('public/data/ai-portfolios/catalogue.json'))
const assets=decodeCatalogue(catalogue),defaults={version:2,book,market:{asOf:catalogue.asOf,universe:assets.slice(0,1),series:{}},catalogue:{url:'catalogue.json',count:assets.length,revision:catalogue.revision},catalogueLoaded:false}
const selection=book.competitions.find(c=>c.config.universe.length>1)?.config.universe??assets.slice(0,20000).map(a=>a.id)
const proposal={version:1,expectedRevision:book.revision,requestId:'isolated-catalogue-recovery',operation:{type:'configure',config:{universe:selection}}}
const fetcher=async()=>({ok:true,json:async()=>catalogue})
await assert.rejects(()=>compactProposal(proposal,defaults.market),/Identifiant absent/,'Original reduced-overview failure reproduced')
const full=await loadCatalogue(defaults,fetcher,'/')
const compact=await compactProposal(proposal,full.market)
assert.deepEqual((await expandProposal(compact,{universe:assets})).operation.config.universe,[...selection].sort())
for(const b of [mergeRuntime(full,defaults),mergeRuntime(full,{...defaults,book:{...book,revision:book.revision+1}})]){
 assert(b.catalogueLoaded)
 assert.deepEqual(identityList(b.market),identityList(full.market))
 assert.deepEqual(await compactProposal(proposal,b.market),compact,'Refresh/receipt must retain complete canonical catalogue')
}
const archived={...defaults,market:{...defaults.market,universe:[...defaults.market.universe,{id:'archived-absent',ticker:'OLD',name:'Archived exact listing'}]}}
const retained=await loadCatalogue(archived,fetcher,'/')
assert(retained.market.universe.some(a=>a.id==='archived-absent'),'Archive still readable')
assert.deepEqual(await compactProposal(proposal,retained.market),compact,'Retained identity must not change canonical fingerprint')
await assert.rejects(()=>compactProposal({...proposal,operation:{config:{universe:['archived-absent']}}},retained.market),/archived-absent.*Aucun actif retiré/)
assert.equal(mergeRuntime(full,{...defaults,catalogue:{...defaults.catalogue,revision:'new-publication'}}).catalogueLoaded,false)
for(const patch of [{asOf:'1999-01-01'},{revision:'incompatible-publication'},{rows:catalogue.rows.slice(1)}])await assert.rejects(()=>loadCatalogue(defaults,async()=>({ok:true,json:async()=>({...catalogue,...patch})}),'/'),/Publication en cours|incomplet/)
assert.deepEqual(proposal.operation.config.universe,selection,'No filtering or replacement of owner universe')
console.log(JSON.stringify({scope:'read-only production snapshot and isolated requests',selected:selection.length,catalogue:assets.length,refresh:true,receipt:true,canonicalArchive:true,publicationMismatch:true}))

const recoveryBook={competitions:[{id:'existing-competition'}],audit:[{requestId:'recorded-creation',competitionId:'existing-competition'}]}
const oldDraft={selected:'',config:{participants:[{model:'Gratuit — isolated test'}],universe:selection},request:{requestId:'recorded-creation',operation:{type:'create'},expectedRevision:0}}
const restored=restoreOwnerDraft(oldDraft,recoveryBook)
assert.equal(restored.selected,'existing-competition')
assert(restored.request.trackingOnly)
assert.equal(restored.receipt.state,'recorded')
assert.deepEqual(restored.config,oldDraft.config,'Restore typed models and full universe onto the existing competition')
assert.equal(oldDraft.selected,'','Do not mutate the persisted draft')
