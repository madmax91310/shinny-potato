import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {parseFlow, validateObservation, addObservation, latestObservation, publicationGate, expectedEnd, buildFlowTweet, checkFlowText, signedFlow} from '../src/lib/etf-flows.js'
const production = JSON.parse(readFileSync(new URL('../src/data/etf-flows.json', import.meta.url)))
assert.equal(production.schemaVersion, 1)
assert(Array.isArray(production.observations))
production.observations.reduce((all, observation) => addObservation(all, observation), [])
const fixture = JSON.parse(readFileSync(new URL('./fixtures/etf-flows/2026-10-12.json', import.meta.url)))
assert.equal(parseFlow('−628.5 MEUR').amount,-628500000)
assert.equal(parseFlow('+5,23 MdEUR').amount,5230000000)
assert.equal(parseFlow('-2 kUSD').currency,'USD')
for (const raw of ['',null,'5 MEUR','+1,234.5 EUR','+10 %','+NaN EUR','+1 billion']) assert.throws(() => parseFlow(raw))
assert(validateObservation(fixture).length >= 3)
assert.throws(() => addObservation([],fixture))
// Positive contract simulation ONLY: factual values/dates above, explicitly simulated
// universe and permission evidence. Never shipped to the app, always tested as archive.
const record = structuredClone(fixture)
Object.assign(record,{id:'test-contract-archive',fixture:false,status:'validated',publishedAt:'2026-10-19T10:00:00Z',validatedAt:'2026-11-12T21:15:00Z'})
Object.assign(record.universe,{basis:'europe-listed',label:'ETF cotés en Europe (contrat simulé)',evidence:'Simulation de contrat pour le test, pas une preuve sur ETF Express.'})
Object.assign(record.source,{rightsStatus:'licensed',rightsEvidence:'Autorisation simulée uniquement pour tester le validateur.'})
const now = new Date('2026-11-13T12:00:00Z')
assert.deepEqual(validateObservation(record,now),[])
const saved = addObservation([],record,now), before = JSON.stringify(saved)
assert.throws(() => addObservation(saved,record,now),/Doublon/)
assert.equal(JSON.stringify(saved),before)
assert.equal(latestObservation([fixture,...saved],now).id,record.id)
assert(publicationGate(record,{now}).some(s=>s.includes('archive')))
assert.deepEqual(publicationGate(record,{now,archive:true}),[])
assert.equal(expectedEnd(new Date('2026-11-09T09:00:00Z')),'2026-11-06')
assert.equal(expectedEnd(new Date('2026-11-06T23:00:00Z')),'2026-10-30')
for (const mutate of [r=>r.rows[0].amount=null,r=>r.rows[0].raw='−5.23 MdEUR',r=>r.rows[0].raw='+5.23 MdUSD',r=>r.rows.push({...r.rows[0],id:'contradiction'}),r=>r.rows[0].start='2026-10-01',r=>r.start='2026-10-32',r=>r.end='2026-11-20',r=>r.periodEvidence='',r=>r.universe.basis='europe-exposure',r=>r.universe.productTypes=['unknown'],r=>r.source.rightsStatus='restricted',r=>r.validatedAt=r.publishedAt,r=>r.metric='aum-change',r=>r.rows[0].amount=0]) {
 const bad=structuredClone(record); mutate(bad); assert(validateObservation(bad,now).length,JSON.stringify(bad));assert.throws(()=>addObservation(saved,bad,now));assert.equal(JSON.stringify(saved),before)
}
const text=buildFlowTweet(record,record.rows,{archive:true})
assert.deepEqual(checkFlowText(text,record,record.rows,true),[])
for(const edited of [text.replace('+5,23','+8,23'),text.replace('−628,5','+628,5'),text.replace('Md€','M€'),text.replace('Archives · ',''),text+' Cette semaine, les particuliers anticipent une hausse.']) assert(checkFlowText(edited,record,record.rows,true).length)
assert(text.includes('sélection'));assert(text.includes('flux nets'));assert(!text.includes('performance'))
assert.equal(signedFlow(-628500000),'−628,5 M€')
console.log('ETF flows: signed amounts, units, exact dates, rights/scope, contradictions, archive gate, duplicates, retention and text evidence passed. Real fixture remains unqualified.')
