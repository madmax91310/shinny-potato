import assert from 'node:assert/strict'
import {compactProposal,expandProposal,encodeProposal,decodeProposal,universeMask,expandMask,identityList} from '../src/pages/ai-portfolios/request-transport.js'
import {readDraft,writeDraft,deleteDraft} from '../src/pages/ai-portfolios/drafts.js'
const market={universe:Array.from({length:30000},(_,i)=>({id:'asset-'+i}))},all=identityList(market),universe=all.filter((_,i)=>i%3!==0)
const proposal={version:1,requestId:'request-test-123',expectedRevision:7,operation:{type:'create',config:{name:'Épargne 🌍',universe}}}
const compact=await compactProposal(proposal,market),encoded=await encodeProposal(compact),decoded=await decodeProposal(encoded)
assert.deepEqual((await expandProposal(decoded,market)).operation.config.universe,universe)
assert.deepEqual(proposal.operation.config.universe,universe,'Representation never mutates the original decision')
assert(encoded.length<6000,'No arbitrary cap on the catalogue or selection')
await assert.rejects(()=>expandProposal(compact,{universe:market.universe.slice(1)}),/catalogue a changé/)
assert.throws(()=>universeMask(['absent'],all),/absent/)
assert.throws(()=>expandMask('AA==',all),/Taille/)
await assert.rejects(()=>decodeProposal('malformed%%'),/invalide/)
await assert.rejects(()=>decodeProposal(awaitable()),/invalide/)
function awaitable(){return 'a'.repeat(60001)}
const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}
assert.equal(readDraft(storage),null)
assert(writeDraft({request:proposal,responseText:'Réponse non enregistrée',decision:{kind:'hold'}},storage))
assert.equal(readDraft(storage).request.requestId,proposal.requestId)
assert(deleteDraft(storage));assert.equal(readDraft(storage),null)
assert.equal(writeDraft({}, {setItem(){throw Error('Quota')}}),false)
assert.equal(readDraft({getItem(){throw Error('Storage disabled')}}),null)
console.log('Transport: 30,000 identities, exact selection/fingerprint, gzip bounds, Unicode; draft restore/delete/quota: OK')
