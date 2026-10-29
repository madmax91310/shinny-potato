import assert from 'node:assert/strict'
import fs from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import {bdfDebtCharts} from './lib/bdf-debt-charts.mjs'
import {PUBLICATION_SOURCES,parsePublication,collectPublications} from './lib/radar-publications.mjs'
const dir='scripts/fixtures/radar-publications/bdf-debt',manifest=JSON.parse(fs.readFileSync(dir+'/manifest.json'))
const source=PUBLICATION_SOURCES.find(s=>s.id==='bdf-debt'),now=new Date('2026-10-29T12:00:00Z')
let qualified=0,rejected=0
for(const row of manifest.responses){
 const raw=gunzipSync(fs.readFileSync(dir+'/'+row.file)),html=raw.toString()
 assert.equal(createHash('sha256').update(raw).digest('hex'),row.sha256)
 if(row.url.endsWith('2023t2')){
  assert.throws(()=>bdfDebtCharts(html,row.title,row.publishedAt),/bornes différentes/)
  rejected++;continue
 }
 const evidence=bdfDebtCharts(html,row.title,row.publishedAt),result=parsePublication(html,source,row.url,now,{publishedAt:row.publishedAt})
 assert.equal(evidence.series.length,4);assert.equal(result.evidence.controlledSeries.length,4)
 assert.equal(result.referencePeriod,evidence.period);assert.equal(result.publishedAt,row.publishedAt)
 assert.equal(result.checkedAt,now.toISOString());assert.equal(result.sourceUrl,row.url)
 assert.equal(result.evidence.sourceHash,row.sha256)
 assert.equal(evidence.series.filter(s=>s.unit==='% du PIB').length,3)
 assert.equal(evidence.series.find(s=>s.unit==='% des fonds propres').population,'Sociétés non financières')
 assert(result.value.includes(evidence.period.slice(0,4)));qualified++
}
assert.equal(qualified,11);assert.equal(rejected,1)
const latest=manifest.responses.find(r=>r.url.endsWith('2025-q4')),html=gunzipSync(fs.readFileSync(dir+'/'+latest.file)).toString()
assert.deepEqual(bdfDebtCharts(html,latest.title,latest.publishedAt).series.map(s=>s.value),[59.13,174.08,38.87,75.48])
const invalids=[
 html.replace('Ratios en % du PIB','Ratios en % du total'),
 html.replace("yAxis : 'YAxis2'","yAxis : 'YAxis'"),
 html.replaceAll("'T4 2025'","'T1 2026'"),
 html.replace("'T1 2001'","'T2 2001'"),
 html.replace('33.91,34.04','(()=>{globalThis.__bdfExecuted=true;return 33.91})(),34.04'),
 html.replace('59.40,59.13','59.40,null'),
 html.replace('59.40,59.13','59.40'),
 html.replaceAll('chart29878389','chart29878384'),
 html.slice(0,html.indexOf('chart29878389')),
]
for(const invalid of invalids){assert.notEqual(invalid,html,'The regression must mutate the actual response');assert.throws(()=>bdfDebtCharts(invalid,latest.title,latest.publishedAt))}
assert.equal(globalThis.__bdfExecuted,undefined,'Downloaded script must never be executed')
assert.throws(()=>bdfDebtCharts(html,latest.title,'2025-11-01'),/postérieure/)
const bad=manifest.responses.find(r=>r.url.endsWith('2023t2')),badHtml=gunzipSync(fs.readFileSync(dir+'/'+bad.file)).toString()
const monthNames=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const card=r=>`<a href="${new URL(r.url).pathname}"><h3>${r.title}</h3><span>${Number(r.publishedAt.slice(8))} ${monthNames[Number(r.publishedAt.slice(5,7))-1]} ${r.publishedAt.slice(0,4)}</span></a>`
const request=async url=>new Response(url===source.url?card(latest)+card(bad):url===latest.url?html:badHtml,{headers:{'content-type':'text/html'}})
const result=await collectPublications(now,request,{},[source],10)
assert(result.observations.some(o=>o.sourceUrl===latest.url&&o.evidence.controlledSeries.length===4))
assert(result.errors.some(e=>e.entity===bad.url&&/bornes différentes/.test(e.reason)))
assert(!result.observations.some(o=>o.sourceUrl===bad.url),'The inconsistent archive must remain unqualified')
console.log('BDF debt: 11/12 actual documents qualified, inconsistent2023T2 retained; periods, axes, four series, null/partial/malformed responses and isolated producer errors verified.')
