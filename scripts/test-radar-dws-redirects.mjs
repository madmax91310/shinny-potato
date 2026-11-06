import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {sameRadarDocument} from './lib/radar-dws-redirects.mjs'
import {collectPublications,discoverPublications,parsePublication,PUBLICATION_SOURCES} from './lib/radar-publications.mjs'
import {extraDiscovery} from './lib/radar-extra-sources.mjs'
const fixture=name=>gunzipSync(fs.readFileSync(new URL('./fixtures/radar-dws-redirects/'+name+'.html.gz',import.meta.url))).toString()
const now=new Date('2026-11-06T08:00:00Z')
for(const[id,host]of[['dws','www.deutsche-am.com'],['xtrackers','etf.deutsche-am.com']]){
 const source=PUBLICATION_SOURCES.find(s=>s.id===id),url=source.url,good=new URL(url);good.hostname=host
 assert(sameRadarDocument(url,good.href));assert(sameRadarDocument(url,url))
 const article=url.replace(/\/$/,'')+'/exact-article',target=new URL(article);target.hostname=host
 assert(sameRadarDocument(article,target.href+'/'))
 assert(!sameRadarDocument(article,target.href+'//'))
 for(const bad of [good.href.replace(host,'example.com'),good.href.replace('https:','http:'),good.href.replace(host,host+':444'),good.href.replace(host,'user:pass@'+host),good.href+'?other=1',good.href+'other',good.href.replace(host,'www.deutsche-am.com.attacker.test')])assert(!sameRadarDocument(url,bad),bad)
 assert(!sameRadarDocument(url.replace('/en-gb/','/fr-fr/'),good.href.replace('/en-gb/','/fr-fr/')))
 assert(!sameRadarDocument(url.replace(/\/en-gb\/.*/, '/unrelated'),good.href.replace(/\/en-gb\/.*/, '/unrelated')))
 const content=fixture(id),rows=id==='dws'?discoverPublications(content,source):await extraDiscovery(content,source)
 assert(rows.length>0);assert(rows.some(r=>r.publishedAt?.startsWith('2026-')))
 assert(rows.every(r=>r.publishedAt&&new URL(r.url).hostname===source.host))
 const request=async()=>{const r=new Response(content,{status:200});Object.defineProperty(r,'url',{value:good.href});return r}
 // A zero document budget tests listing acquisition only, not article validation.
 const first=await collectPublications(now,request,{},[source],0)
 assert.equal(first.sources[0].status,'ok');assert.equal(first.sources[0].discovered,rows.length)
 assert.equal(first.observations.length,0);assert(Object.values(first.state.documents).every(d=>d.status==='pending'&&d.backfill))
 const previous=structuredClone(first.state),later=new Date(+now+86400000)
 const unchanged=async()=>{const r=new Response(null,{status:304});Object.defineProperty(r,'url',{value:good.href});return r}
 const checked=await collectPublications(later,unchanged,previous,[source],0)
 assert.equal(checked.sources[0].lastSuccessAt,later.toISOString());assert.equal(checked.metrics.notModified,1)
 for(const status of[200,304]){
  const wrong=async()=>{const r=new Response(status===304?null:content,{status});Object.defineProperty(r,'url',{value:'https://example.com'+good.pathname});return r}
  const failed=await collectPublications(later,wrong,previous,[source],0)
  assert.equal(failed.sources[0].status,'error');assert.equal(failed.sources[0].lastSuccessAt,first.sources[0].lastSuccessAt)
  assert.equal(failed.metrics.notModified,0);assert.deepEqual(failed.state.documents,previous.documents)
 }
}
// The exact redirected article retains its own publication date and old stable URL.
const dws=PUBLICATION_SOURCES.find(s=>s.id==='dws')
const listing=discoverPublications(fixture('dws'),dws)[0]
const article=parsePublication(fixture('dws-article'),dws,listing.url,now,listing)
assert.equal(article.publishedAt,listing.publishedAt)
assert.equal(article.sourceUrl,listing.url)
assert.equal(article.evidenceLevel,'official')
assert(!sameRadarDocument('https://unrelated.example/press','https://www.deutsche-am.com/press'))
console.log('DWS redirects: two exact first-party documents, current dated listings, foreign/path/query/auth/port/scheme refusals, no fabricated article success, 304 source identity and failure clock retention passed.')
