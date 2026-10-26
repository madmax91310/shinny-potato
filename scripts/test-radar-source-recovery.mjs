import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {collectPublications,PUBLICATION_SOURCES} from './lib/radar-publications.mjs'
import {extraDiscovery} from './lib/radar-extra-sources.mjs'
import {requestRadarSource,sourceFailureKind} from './lib/radar-source-health.mjs'
const now=new Date('2026-10-26T09:00:00Z'),source=id=>PUBLICATION_SOURCES.find(s=>s.id===id)
const listing=await readFile(new URL('./fixtures/radar-source-recovery/hanetf-listing.html',import.meta.url),'utf8')
const han=source('hanetf'),htmlHan={...han,url:han.newsroomUrl,method:'extra-links'},rows=await extraDiscovery(listing+'<footer><a href="https://hanetf.com/press-releases/another-release">Footer link</a></footer>',htmlHan,()=>assert.fail())
assert.equal(rows.length,2);assert.match(rows[0].title,/Trading Central/);assert.match(rows[1].title,/YieldMax/)
assert.ok(rows.every(r=>r.title!=='Read more'&&!r.publishedAt),'A listing month does not invent a publication day')
await assert.rejects(()=>extraDiscovery('<html><main></main></html>',htmlHan),/vide ou format modifié/)
const oldDate='2026-10-25T00:00:00Z',future='2026-11-01T00:00:00Z'
const saved={label:rows[0].title,sourceUrl:rows[0].url,value:'Validated observation',checkedAt:oldDate,evidence:{sourceHash:'proof'}}
for(const [id,status,body,kind] of [
 ['revolut-news',403,'Forbidden','access-denied'],['wisdomtree',403,'Forbidden','access-denied'],
 ['hanetf',200,'<html><main></main></html>','structure-changed'],
 ['drees',503,'Unavailable','temporary-unavailable'],
 ['dares',200,'Please enable JavaScript to view the page content. Vérification de sécurité','access-denied']]) {
 const old={sources:{[id]:{lastSuccessAt:oldDate,checkedAt:oldDate}},documents:{[rows[0].url]:{source:id,status:'done',discoveredAt:oldDate,nextAttemptAt:future,observation:saved}}}
 let calls=0
 const r=await collectPublications(now,async()=>{calls++;return new Response(body,{status})},old,[source(id)],0)
 assert.equal(r.sources[0].status,'error');assert.equal(r.sources[0].failureKind,kind)
 assert.equal(calls,status===503?2:1,'No immediate retries of a denial or challenge')
 assert.deepEqual(r.observations,[saved]);assert.equal(r.sources[0].lastSuccessAt,oldDate)
 assert.deepEqual(old.documents[rows[0].url].observation,saved,'Input state is immutable')
}
const lbp=source('lbp-bank'),pdf='<div class="o-newslist__push__content"><a href="/content/dam/lbp/documents/communiques-de-presse/2026/test.pdf"><h3>La Banque Postale lance une nouvelle épargne</h3></a><time>07/09/2026</time>'
for(const body of ['<html>Vérification de sécurité</html>','<html><main>Unknown layout</main></html>']) {
 const partial=await collectPublications(now,async url=>new Response(url===lbp.url?pdf:body),{},[lbp],0)
 assert.equal(partial.sources[0].status,'partial');assert.equal(partial.sources[0].discovered,1);assert.ok(partial.sources[0].archiveWarning)
}
const partial=await collectPublications(now,async url=>new Response(url===lbp.url?pdf:'Forbidden',{status:url===lbp.url?200:403}),{},[lbp],0)
assert.equal(partial.sources[0].status,'partial');assert.equal(partial.sources[0].failureKind,'access-denied');assert.equal(partial.sources[0].discovered,1)
assert.match(partial.sources[0].archiveWarning,/page 2.*403/)
partial.state.sources[lbp.id].etag='first-page-cache'
const recovered=await collectPublications(new Date(+now+3600001),async(url,options)=>{assert.equal(options?.headers?.['If-None-Match'],undefined,'A partial archive must not be trapped behind a first-page 304');return new Response(pdf)},partial.state,[lbp],0)
assert.equal(recovered.sources[0].status,'ok');assert.equal(recovered.sources[0].failureKind,undefined);assert.equal(recovered.sources[0].archiveWarning,null)
for(const mode of ['503','network']) {
 let calls=0,attempts=0
 const r=await requestRadarSource(async()=>{if(++calls===1){if(mode==='network')throw TypeError('fetch failed');return new Response('down',{status:503})}return new Response('ok')},'https://official.example/',{},()=>attempts++)
 assert.equal(await r.text(),'ok');assert.equal(calls,2);assert.equal(attempts,2)
}
let timedCalls=0
await assert.rejects(()=>requestRadarSource(async()=>{timedCalls++;throw Error('fetch failed')},'https://official.example/',{signal:AbortSignal.abort()}),/fetch failed/);assert.equal(timedCalls,1)
let calls=0
await assert.rejects(()=>requestRadarSource(async()=>{calls++;throw Error('Invalid JSON')},'https://official.example/',{}),/Invalid JSON/);assert.equal(calls,1)
assert.equal(sourceFailureKind(Error('Bad schema')),'processing-error')
// Migration must bypass the old discovery cache without changing document IDs,
// observation proofs or treating an undated card month as a new publication.
const xml=await readFile(new URL('./fixtures/radar-source-recovery/hanetf-sitemap.xml',import.meta.url),'utf8')
const sitemapRows=await extraDiscovery(xml,han);assert.ok(sitemapRows.length);assert.ok(sitemapRows.every(r=>!r.publishedAt&&!r.title&&!/\/fr\//.test(r.url)))
await assert.rejects(()=>extraDiscovery(xml.replace('</urlset>',''),han),/tronqué/)
const old={sources:{hanetf:{lastSuccessAt:oldDate,nextCheckAt:future,etag:'old'}},documents:{[rows[0].url]:{url:rows[0].url,title:'Read more',source:'hanetf',status:'done',discoveredAt:oldDate,attempts:1,nextAttemptAt:future,observation:saved}}}
const migrated=await collectPublications(now,async(url,options)=>{assert.equal(options.headers['If-None-Match'],undefined);return new Response(xml)},old,[han],0)
assert.equal(migrated.sources[0].discoveryVersion,2);assert.ok(Object.values(migrated.state.documents).filter(d=>!old.documents[d.url]).every(d=>d.backfill),'New sitemap archives are silent during route migration')
assert.equal(migrated.state.documents[rows[0].url].title,saved.label);assert.deepEqual(migrated.state.documents[rows[0].url].observation,saved);assert.equal(migrated.state.documents[rows[0].url].discoveredAt,oldDate)
console.log('Six-source recovery: recorded failures, denial/challenge non-bypass, bounded transport retry, partial LBP archive, HANetf cards/cache migration and original observation proofs preserved.')
