import assert from 'node:assert/strict'
import {authorizedIssue,proposalFromIssue,REQUEST_TITLE,isRehearsalBranch} from './ai-owner-issue.mjs'
import {compactProposal,encodeProposal} from '../src/pages/ai-portfolios/request-transport.js'
const market={universe:[{id:'b'},{id:'a'}]},proposal={version:1,requestId:'owner-test-123',expectedRevision:0,operation:{type:'create',config:{universe:['a','b']}}}
const encoded=await encodeProposal(await compactProposal(proposal,market)),event={repository:{full_name:'madmax91310/shinny-potato',owner:{id:123}},sender:{id:123},issue:{user:{id:123},title:REQUEST_TITLE+proposal.requestId,body:'AI_PORTFOLIO_REQUEST_V1\n'+encoded+'\nEND_AI_PORTFOLIO_REQUEST'}}
assert(authorizedIssue(event));assert.deepEqual(await proposalFromIssue(event,market),proposal)
for(const changed of [{...event,sender:{id:456}},{...event,issue:{...event.issue,user:{id:456}}},{...event,repository:{...event.repository,full_name:'other/repo'}},{...event,issue:{...event.issue,pull_request:{}}}]){assert(!authorizedIssue(changed));await assert.rejects(()=>proposalFromIssue(changed,market),/propriétaire/)}
await assert.rejects(()=>proposalFromIssue({...event,issue:{...event.issue,title:'Wrong ID'}},market),/identifiant/)
await assert.rejects(()=>proposalFromIssue({...event,issue:{...event.issue,body:event.issue.body+'\n'+event.issue.body}},market),/unique/)
await assert.rejects(()=>proposalFromIssue(event,{universe:[{id:'c'}]}),/catalogue a changé/)
const bomb=await encodeProposal({original:'x'.repeat(4*1024*1024+1)}),bombEvent={...event,issue:{...event.issue,body:'AI_PORTFOLIO_REQUEST_V1\n'+bomb+'\nEND_AI_PORTFOLIO_REQUEST'}}
await assert.rejects(()=>proposalFromIssue(bombEvent,market),/volumineuse/)
console.log('Owner identity/sender/repository, unique payload, title/id, exact catalogue, decompression bound: OK')
// The real durable writer is still the only authority; the transport is not a
// second validation engine. Its idempotency and optimistic revision are checked
// in test-ai-portfolios and in the isolated browser runner.

assert(isRehearsalBranch('ai-rehearsal/20261023-test'))
for(const branch of ['master','refs/heads/master','ai-rehearsal/../master','ai-rehearsal/short','ai-rehearsal/a%2fmaster']){assert(!isRehearsalBranch(branch));const encodedBad=await encodeProposal({...proposal,testBranch:branch});await assert.rejects(()=>proposalFromIssue({...event,issue:{...event.issue,body:'AI_PORTFOLIO_REQUEST_V1\n'+encodedBad+'\nEND_AI_PORTFOLIO_REQUEST'}},market),/production interdite/)}

assert.deepEqual(await proposalFromIssue({...event,issue:{...event.issue,body:event.issue.body.replaceAll('\n','\r\n')}},market),proposal,'Mobile/native form CRLF preserves exact request')
