import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {COVERAGE_SOURCES,coverageDiscovery,coverageDate} from './lib/radar-coverage.mjs'
import {collectPublications} from './lib/radar-publications.mjs'
const source=COVERAGE_SOURCES.find(s=>s.id==='cm-cic')
const html=gunzipSync(readFileSync(new URL('./fixtures/radar-coverage/cm-cic-partial/official-archive.html.gz',import.meta.url))).toString()
const rows=await coverageDiscovery(html,source,()=>assert.fail('No extra source request needed'))
assert.equal(rows.length,17);assert.equal(rows.expectedListingItems,18)
assert.equal(rows.discoveryFailures.length,1)
const missing=rows.discoveryFailures[0]
assert.equal(missing.rawDate,'03/08/26');assert.equal(missing.field,'publishedAt')
assert.match(missing.url,/grands-incendies-clients-et-societaire.html$/)
assert.match(rows.archiveWarning,/1\/18/);assert(rows.archiveWarning.includes(missing.url))
assert(!rows.some(r=>r.url===missing.url))
assert.throws(()=>coverageDate('03/08/26'),'No collection-year inference')
const now=new Date('2026-10-29T12:00:00Z'),response=content=>new Response(content,{status:200,headers:{'content-type':'text/html'}})
const first=await collectPublications(now,async url=>{assert.equal(url,source.url);return response(html)}, {},[source],0)
const status=first.state.sources[source.id]
assert.equal(status.status,'partial');assert.equal(status.discovered,17);assert.equal(status.expectedListingItems,18)
assert.deepEqual(status.discoveryFailures,[missing]);assert(first.errors.some(e=>e.reason.includes(missing.url)))
assert.equal(Object.keys(first.state.documents).length,17)
const cached=await collectPublications(new Date(+now+1000),()=>assert.fail('Cache pass is not a new source control'),first.state,[source],0)
assert.equal(cached.state.sources[source.id].lastSuccessAt,status.lastSuccessAt)
assert.equal(cached.state.sources[source.id].status,'partial')
const later=new Date(+now+61*60000)
const failed=await collectPublications(later,async()=>{throw Error('Isolated network failure')},first.state,[source],0)
assert.equal(failed.state.sources[source.id].lastSuccessAt,status.lastSuccessAt)
assert.equal(Object.keys(failed.state.documents).length,17)
// Isolated structure mutation proves recovery; this is never a provider claim.
const repairedFixture=html.replace('03/08/26','03/08/2026')
const recovered=await collectPublications(later,async()=>response(repairedFixture),first.state,[source],0)
assert.equal(recovered.state.sources[source.id].status,'ok');assert.equal(recovered.state.sources[source.id].discovered,18)
assert.deepEqual(recovered.state.sources[source.id].discoveryFailures,[])
const article=html.slice(html.lastIndexOf('<article',html.indexOf('grands-incendies-clients-et-societaire.html')),html.indexOf('</article>',html.indexOf('grands-incendies-clients-et-societaire.html'))+10)
await assert.rejects(()=>coverageDiscovery(article,source,()=>{}),/Liste officielle vide/)
console.log('CM-CIC actual archive: 17 dated cards preserved, 1 ambiguous date explicit; empty/partial/failure/cache/recovery and source dates verified in isolation.')
