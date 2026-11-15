import assert from 'node:assert/strict'
import { normalizePortfolio, buildTweet, percentage } from '../src/pages/investor-portfolio/data.js'
import { logoIdentity } from '../src/pages/investor-portfolio/media.js'
import { publicationPlan } from '../src/pages/investor-portfolio/publication.js'
export function sample(values, long=false) {
  const declaredTotal=values.reduce((s,v)=>s+v,0)
  return { as_of:'2026-11-15T12:00:00Z', data: { identity:{slug:'tepper',archetype:'hedge_fund',displayName:'David Tepper',entityName:'Appaloosa LP',dataProvider:'FolioFact'},sourceUrl:'https://foliofact.com/funds/appaloosa',snapshot:{primaryVerified:true,sourceDocuments:['https://www.sec.gov/Archives/edgar/test/primary.xml','https://www.sec.gov/Archives/edgar/test/table.xml'],periodEnd:'2026-06-30',filedAt:'2026-08-14',currency:'USD',valueUnit:1,valueUnitSource:'https://foliofact.com/openapi.yaml#/components/schemas/PortfolioRow',declaredTotal,holdings:values.map((value,i)=>({issuerName:long?'Entreprise au nom particulièrement long et détaillé '.repeat(5)+i:'Entreprise '+i,ticker:'T'+i,cusip:String(i).padStart(9,'0'),shareClass:'COM',weight:value/declaredTotal,value,currency:'USD',unit:1,putCall:null}))} } }
}
for(const values of [[1000],[9999,1],[400,300,200,100],Array(300).fill(1),[100000,...Array(1500).fill(1)]])for(const long of [false,true]) {
  const portfolio=normalizePortfolio(sample(values,long)), plan=publicationPlan(portfolio)
  // Independent arithmetic from source integer values, not chart angles.
  assert.equal(plan.total,values.reduce((s,v)=>s+v,0))
  assert.equal(portfolio.holdings.length,values.length)
  const named=plan.entries.filter(r=>!r.other),other=plan.entries.find(r=>r.other)
  assert.equal(named.reduce((s,r)=>s+r.value,0)+(other?.value||0),plan.total)
  assert.equal(other?.value||0,portfolio.holdings.slice(named.length).reduce((s,r)=>s+r.value,0))
  assert(Math.abs(plan.entries.reduce((s,r)=>s+r.weight,0)-1)<1e-12)
  for(const entry of plan.entries) {
    assert.equal(entry.weight,entry.value/plan.total)
    assert(Math.abs((entry.end-entry.start)/(2*Math.PI)-entry.weight)<1e-12)
    assert(entry.y>=310 && entry.y+entry.height<=1020)
    for(const next of plan.entries)if(next!==entry&&next.side===entry.side)assert(entry.y+entry.height<=next.y||next.y+next.height<=entry.y)
  }
  const tweet=buildTweet(portfolio)
  assert.equal(tweet.split('👇').length,2)
  for(const entry of plan.entries)assert(tweet.includes(entry.label)&&tweet.includes(percentage(entry.weight)))
}
assert.equal(percentage(.000001),'< 0,1 %')
const incomplete=sample([100,50]);delete incomplete.data.snapshot.holdings[0].value
assert(normalizePortfolio(incomplete).problem)
assert.throws(()=>publicationPlan(normalizePortfolio(incomplete)))
for(const key of ['currency','valueUnit','valueUnitSource','declaredTotal']) { const p=sample([100,50]);delete p.data.snapshot[key];assert(normalizePortfolio(p).problem) }
const different=sample([100,50]);different.data.snapshot.holdings[1].issuerName=different.data.snapshot.holdings[0].issuerName
assert.equal(normalizePortfolio(different).holdings.length,2,'Classes distinctes conservées')
const badTotal=sample([100,50]);badTotal.data.snapshot.declaredTotal=200
assert(normalizePortfolio(badTotal).problem)
console.log('Calculs indépendants : concentration, 300/1501 petites lignes, noms longs, <0,1 %, classes, unités et regroupement exact.')

assert.equal(logoIdentity({issuerName:'Nom de déclaration différent',cusip:'037833100'}).id,'apple')
assert.equal(logoIdentity({issuerName:'Homonyme non résolu',ticker:'AAPL'}),null)
const missingPrimary=sample([3,2]);delete missingPrimary.data.snapshot.primaryVerified;assert(normalizePortfolio(missingPrimary).problem)

const { detailedCSV, detailedExport } = await import('../src/pages/investor-portfolio/exports.js')
const optionPayload=sample([40,30,20,10]);optionPayload.data.snapshot.holdings[2].putCall='CALL';optionPayload.data.snapshot.holdings[3].putCall='PUT'
const optionPortfolio=normalizePortfolio(optionPayload)
assert.equal(publicationPlan(optionPortfolio).total,70)
assert.equal(detailedExport(optionPortfolio).snapshot.holdings.length,4)
const csv=detailedCSV(optionPortfolio)
assert(csv.includes('Poids du total déclaré') && csv.includes('Poids hors options') && csv.includes('CALL') && csv.includes('PUT'))
assert.equal(csv.split('\r\n').length,5)
