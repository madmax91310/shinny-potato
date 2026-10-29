import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {COVERAGE_SOURCES,coverageDiscovery,coverageDate,qualifyCmCardDate} from './lib/radar-coverage.mjs'
import {collectPublications} from './lib/radar-publications.mjs'
const source=COVERAGE_SOURCES.find(s=>s.id==='cm-cic')
const html=gunzipSync(readFileSync(new URL('./fixtures/radar-coverage/cm-cic-partial/official-archive.html.gz',import.meta.url))).toString()
const unavailable=()=>{throw Error('Isolated document unavailable')}
const rows=await coverageDiscovery(html,source,unavailable)
assert.equal(rows.length,17);assert.equal(rows.expectedListingItems,18)
assert.equal(rows.discoveryFailures.length,1)
const missing=rows.discoveryFailures[0]
assert.equal(missing.rawDate,'03/08/26');assert.equal(missing.field,'publishedAt')
assert.match(missing.url,/grands-incendies-clients-et-societaire.html$/)
assert.match(rows.archiveWarning,/1\/18/);assert(rows.archiveWarning.includes(missing.url))
assert(!rows.some(r=>r.url===missing.url))
assert.throws(()=>coverageDate('03/08/26'),'No collection-year inference')
const now=new Date('2026-10-29T12:00:00Z'),response=content=>new Response(content,{status:200,headers:{'content-type':'text/html'}})
const first=await collectPublications(now,async url=>{if(url!==source.url)return unavailable();return response(html)}, {},[source],0)
const status=first.state.sources[source.id]
assert.equal(status.status,'partial');assert.equal(status.discovered,17);assert.equal(status.expectedListingItems,18)
assert.deepEqual(status.discoveryFailures,[missing]);assert(first.errors.some(e=>e.reason.includes(missing.url)))
assert.equal(Object.keys(first.state.documents).length,17)
const fixture=name=>new URL('./fixtures/radar-coverage/cm-cic-partial/'+name,import.meta.url)
const articleHtml=gunzipSync(readFileSync(fixture('official-article.html.gz'))).toString()
const pdfBytes=gunzipSync(readFileSync(fixture('official-release.pdf.gz')))
const pdfText=readFileSync(fixture('official-release.txt'),'utf8')
const request=async url=>url===missing.url?response(articleHtml):new Response(pdfBytes,{headers:{'content-type':'application/pdf'}})
const extract=async r=>{assert.equal(Buffer.from(await r.arrayBuffer()).compare(pdfBytes),0);return pdfText}
const qualified=await qualifyCmCardDate(missing.rawDate,missing.title,missing.url,request,extract)
assert.equal(qualified.publishedAt,'2026-08-03')
assert.equal(qualified.publicationDateEvidence.cardDate,'03/08/26')
const full=await coverageDiscovery(html,source,request,extract)
assert.equal(full.length,18);assert(!full.archiveWarning)
assert.equal(full.find(r=>r.url===missing.url).publicationDateEvidence.sha256,qualified.publicationDateEvidence.sha256)
await assert.rejects(()=>qualifyCmCardDate('04/08/26',missing.title,missing.url,request,extract),/contradictoire/)
await assert.rejects(()=>qualifyCmCardDate(missing.rawDate,'Un autre communiqué officiel',missing.url,request,extract),/Identité/)
await assert.rejects(()=>qualifyCmCardDate(missing.rawDate,missing.title,missing.url,request,async()=>pdfText.replace(/Strasbourg, le 3 août 2026/,'')),/Date/)
await assert.rejects(()=>qualifyCmCardDate(missing.rawDate,missing.title,missing.url,async url=>url===missing.url?response(articleHtml.replaceAll('https://cdnwmsi.e-i.com','https://example.com')):request(url),extract),/CDN officiel/)
const renamedDocument=async url=>url===missing.url?response(articleHtml.replaceAll('03_08_2026_','01_01_1999_')):request(url)
assert.equal((await qualifyCmCardDate(missing.rawDate,missing.title,missing.url,renamedDocument,extract)).publishedAt,'2026-08-03','The PDF filename does not date the publication')
await assert.rejects(()=>qualifyCmCardDate(missing.rawDate,missing.title,missing.url,async url=>url===missing.url?response(articleHtml):response('<html>Access denied</html>'),extract),/PDF attendu/)
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
const legacy={sources:{[source.id]:{nextCheckAt:'2026-10-30T12:00:00Z',etag:'old-unqualified',lastSuccessAt:'2026-10-28T12:00:00Z'}},documents:{}}
let requests=0
await collectPublications(now,async(url,options)=>{requests++;assert(!options.headers?.['If-None-Match']);if(url!==source.url)return unavailable();return response(html)},legacy,[source],0)
assert(requests>0,'Only the corrected source is requalified instead of certifying its old cache')
console.log('CM-CIC actual fixtures: 18 dates corroborated with the linked PDF; 17 retained if that proof fails. Empty/partial/failure/cache/recovery and targeted discovery requalification verified in isolation.')
