import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {gunzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import {inseeBookChapters,parsePublication,collectPublications,PUBLICATION_SOURCES} from './lib/radar-publications.mjs'
const fixture=async name=>gunzipSync(await readFile(new URL(`./fixtures/radar-publications/${name}.html.gz`,import.meta.url))).toString()
const book=await fixture('insee-book-8733125'),chapter=await fixture('insee-chapter-8733097')
const source=PUBLICATION_SOURCES.find(s=>s.id==='insee-publications'),url='https://www.insee.fr/fr/statistiques/8733125',child='https://www.insee.fr/fr/statistiques/8733097',now=new Date('2026-10-31T01:45:00Z')
const expected=inseeBookChapters(book,source,url)
assert.equal(expected.chapters.length,12)
assert.equal(expected.excluded.length,31)
assert.equal(new Set(expected.chapters.map(x=>x.url)).size,12)
assert(expected.chapters.some(x=>x.url===child&&x.title==='Revenu salarial'))
assert(expected.chapters.every(x=>!new URL(x.url).search&&new URL(x.discoveredHref).searchParams.get('sommaire')==='8733125'))
assert(expected.excluded.every(x=>x.reason))
assert.equal(expected.sourceHash,createHash('sha256').update(book).digest('hex'))
const parent=parsePublication(book,source,url,now)
assert.match(parent.rejected,/12 chapitres/)
assert.equal(parent.summary,undefined,'An index is not fabricated as a numerical publication')
assert.equal(parent.publishedAt,'2026-07-02')
const article=parsePublication(chapter,source,child,now)
assert.equal(article.label,'Revenu salarial')
assert.equal(article.publishedAt,'2026-07-02')
assert.match(article.summary,/En 2023, le revenu salarial annuel moyen/)
assert.match(article.summary,/24 960 euros nets/)
assert.equal(article.referencePeriod,null,'Publication year2026 must not become the statistical year2023')
assert.equal(article.sourceUrl,child)
assert.equal(inseeBookChapters(book,{...source,host:'other.example'},url),null)
assert.equal(inseeBookChapters(book,source,url.replace('www.insee.fr','evil.example')),null)
assert.equal(inseeBookChapters(book,source,url+'?unexpected=1'),null)
assert.equal(inseeBookChapters(book.replaceAll('sommaire=8733125','sommaire=9999999'),source,url),null)
assert.equal(inseeBookChapters(book.replaceAll('href="/fr/statistiques/','href="https://evil.example/fr/statistiques/'),source,url),null)
assert.equal(inseeBookChapters(book.replace('sommaire-seul','not-a-pure-index'),source,url),null)
assert.equal(inseeBookChapters(book.replaceAll('/fr/statistiques/','/fr/files/'),source,url),null)
const validBefore=structuredClone(article)
assert.throws(()=>parsePublication(book,source,url,now,{observation:validBefore}),/Résumé statistique chiffré absent/,'Do not retire a last valid numerical observation on a changed index response')
const indexWithNumber=book.replaceAll('L’Insee et la Dares présentent','En2024, 12% des ménages ; l’Insee et la Dares présentent')
assert.equal(parsePublication(indexWithNumber,source,url,now).bookDiscovery,undefined,'Existing numerical summaries retain their parser/observation')
const initial={sources:{[source.id]:{lastSuccessAt:'2026-10-30T00:00:00Z',nextCheckAt:'2026-11-01T00:00:00Z',status:'ok'}},documents:{[url]:{url,source:source.id,title:'Emploi, chômage, revenus du travail',status:'error',error:'Résumé statistique chiffré absent : extraction à adapter',attempts:3,discoveredAt:'2026-10-24T00:00:00Z',attemptedAt:'2026-10-29T00:00:00Z',firstFailureAt:'2026-10-29T00:00:00Z',nextAttemptAt:'2026-11-01T00:00:00Z',etag:'old-index',parserVersion:3}}}
const saved=structuredClone(initial),calls=[]
const request=async(u,options)=>{calls.push({u,headers:options.headers});assert.equal(u,url);assert(!options.headers['If-None-Match'],'Migration must read source text');return new Response(book,{headers:{'content-type':'text/html'}})}
const first=await collectPublications(now,request,initial,[source],1)
assert.deepEqual(initial,saved,'Caller state is not mutated')
assert.equal(calls.length,1,'Chapter discovery does not fan out network requests')
assert.equal(first.state.documents[url].status,'rejected')
assert.equal(first.state.documents[url].observation,undefined)
assert.equal(first.state.documents[url].backfill,true,'Index migration remains a quiet historical qualification')
assert.equal(first.state.documents[url].bookDiscovery.chapters.length,12)
assert.equal(first.state.documents[url].failureHistory.length,1,'Original failure remains dated')
assert.equal(first.state.metrics.queue.attempted,1)
assert.equal(first.errors.length,0)
for(const c of expected.chapters){const r=first.state.documents[c.url];assert.equal(r.status,'pending');assert.equal(r.attempts,0);assert.equal(r.observation,undefined);assert.equal(r.backfill,true,'Structural historical discovery does not invent breaking news');assert.equal(r.discoveredVia,url)}
// One targeted isolated next pass: the other11 queue entries remain deferred,
// never certified by the successful child. No production scope/date is altered.
const next=structuredClone(first.state),later=new Date(+now+60000)
for(const c of expected.chapters)if(c.url!==child)next.documents[c.url].nextAttemptAt='2026-11-01T00:00:00Z'
const childCalls=[]
const second=await collectPublications(later,async u=>{childCalls.push(u);assert.equal(u,child);return new Response(chapter,{headers:{'content-type':'text/html'}})},next,[source],1)
assert.deepEqual(childCalls,[child])
assert.equal(second.state.documents[child].status,'done')
assert.match(second.state.documents[child].observation.summary,/24 960 euros nets/)
assert.equal(second.state.documents[child].observation.backfill,true)
assert.equal(second.state.documents[url].attempts,4,'Index not re-read to certify a child')
for(const c of expected.chapters.filter(c=>c.url!==child)){assert.equal(second.state.documents[c.url].status,'pending');assert.equal(second.state.documents[c.url].attempts,0)}
const empty=book.replace(/sommaire=8733125/g,'sommaire=123')
const malformed=await collectPublications(now,async()=>new Response(empty),initial,[source],1)
assert.equal(malformed.state.documents[url].status,'error')
assert.equal(Object.keys(malformed.state.documents).length,1,'Malformed/empty index cannot invent a healthy scope')
const noText=await collectPublications(now,async()=>new Response(null,{status:304}),initial,[source],1)
assert.equal(noText.state.documents[url].status,'error')
assert.match(noText.state.documents[url].error,/304 sans texte/)
assert.equal(Object.keys(noText.state.documents).length,1)
const failed=await collectPublications(later,async()=>{throw Error('isolated network outage')},next,[source],1)
assert.equal(failed.state.documents[child].status,'error')
assert.equal(failed.state.documents[url].bookDiscovery.sourceHash,expected.sourceHash)
assert.equal(failed.state.documents[url].attempts,4)
console.log('INSEE: exact pure index→12qualified chapter routes, own title/figures/date, no fan-out; scope/retention/partial retry/cache/migration/quiet archives verified.')

const retained=structuredClone(initial),oldObservation={...article,sourceUrl:url,label:'Emploi, chômage, revenus du travail',checkedAt:'2026-10-20T00:00:00Z'}
Object.assign(retained.documents[url],{status:'done',observation:oldObservation,nextAttemptAt:'2026-10-30T00:00:00Z'})
const changed=await collectPublications(now,async()=>new Response(book),retained,[source],1)
assert.equal(changed.state.documents[url].status,'error')
assert.deepEqual(changed.state.documents[url].observation,oldObservation,'Changed index does not erase/re-date a previously qualified numerical observation')
assert.equal(changed.state.documents[url].bookDiscovery,undefined)

const outOfScope=book.replaceAll('Emploi, chômage, revenus du travail','Objectif 7 : énergie propre et d’un coût abordable').replaceAll('sommaire-seul','not-a-pure-index')
assert.equal(parsePublication(outOfScope,source,url,now).rejected,'Publication hors des thèmes ménages suivis','Existing theme filter runs before an unnecessary abstract becomes an error')
const poverty=await fixture('insee-odd-poverty-9090671')
assert.throws(()=>parsePublication(poverty,source,'https://www.insee.fr/fr/statistiques/9090671',now),/Résumé statistique chiffré absent/,'A financially relevant reference without qualified figures remains blocked; no invented summary')
