import assert from 'node:assert/strict'
import { normalizePortfolio, buildTweet, percentage } from '../src/pages/investor-portfolio/data.js'
import { editorialCopy } from '../src/pages/investor-portfolio/editorial.js'
import { logoIdentity } from '../src/pages/investor-portfolio/media.js'
import { cash, publicationPlan, reportedAmount, portfolioOwner, POSTER, colorPositions, shortPosition, positionColor } from '../src/pages/investor-portfolio/publication.js'
export function sample(values, long=false) {
  const declaredTotal=values.reduce((s,v)=>s+v,0)
  return { as_of:'2026-11-15T12:00:00Z', data: { identity:{slug:'tepper',archetype:'hedge_fund',displayName:'David Tepper',entityName:'Appaloosa LP',personVerified:true,personPeriod:'2026-06-30',personSource:'https://foliofact.com/api/v1/funds/appaloosa',dataProvider:'FolioFact'},sourceUrl:'https://foliofact.com/funds/appaloosa',snapshot:{primaryVerified:true,sourceDocuments:['https://www.sec.gov/Archives/edgar/test/primary.xml','https://www.sec.gov/Archives/edgar/test/table.xml'],periodEnd:'2026-06-30',filedAt:'2026-08-14',currency:'USD',valueUnit:1,valueUnitSource:'https://foliofact.com/openapi.yaml#/components/schemas/PortfolioRow',declaredTotal,holdings:values.map((value,i)=>({issuerName:long?'Entreprise au nom particulièrement long et détaillé '.repeat(5)+i:'Entreprise '+i,ticker:'T'+i,cusip:String(i).padStart(9,'0'),shareClass:'COM',weight:value/declaredTotal,value,currency:'USD',unit:1,putCall:null}))} } }
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
    const b=entry.box
    assert(b.x>=20 && b.x+b.width<=1060 && b.y>=POSTER.top && b.y+b.height<=POSTER.bottom)
    if (entry.leader) assert.deepEqual(entry.leader[0], entry.anchor)
    for(const next of plan.entries)if(next!==entry){
      const c=next.box
      assert(b.x+b.width<=c.x || c.x+c.width<=b.x || b.y+b.height<=c.y || c.y+c.height<=b.y,'Label collision')
    }
  }
  assert.equal(editorialCopy(portfolio).status, 'review')
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

assert(!reportedAmount({value:1000}).includes('$'))
assert(!reportedAmount({value:1000,currency:'USD',unit:1000}).includes('$'))
assert(reportedAmount({value:1000,currency:'USD',unit:1}).includes('$US'))

const unverified=normalizePortfolio(sample([60,40]));unverified.identity.personVerified=false;assert.equal(portfolioOwner(unverified),'Appaloosa LP');assert.equal(editorialCopy(unverified).status, 'review')
unverified.identity.personVerified=true;unverified.identity.personPeriod='2026-03-31';assert.equal(portfolioOwner(unverified),'Appaloosa LP')

assert.equal(cash(78300000,'USD'),'78,3\u00a0M\u00a0$US') // Same explicit precision in Node 20 and Chromium.

// Poster simplification must not hide the class discriminator or alter detail colors.
assert.equal(shortPosition({displayLabel:'Alphabet (02079K305)',shareClass:'CAP STK CL A',cusip:'02079K305'}),'Alphabet A')
assert.equal(shortPosition({displayLabel:'Berkshire Hathaway (084670108)',shareClass:'CL A',cusip:'084670108'}),'Berkshire A')
assert.equal(shortPosition({displayLabel:'Uber Technologies Inc'}),'Uber')
const colorPortfolio=normalizePortfolio(sample([10,9,8,7,6,5,4,3,2,1]))
const allColors=colorPositions(colorPortfolio.holdings),colorPlan=publicationPlan(colorPortfolio)
assert.equal(new Set(allColors.map(r=>r.color)).size,allColors.length)
for(const row of colorPlan.entries.filter(r=>!r.other))assert.equal(row.color,allColors.find(r=>r.cusip===row.cusip).color)

const nearGreens=colorPositions([{displayLabel:'Nvidia',cusip:'67066G104'},{displayLabel:'Cerebras Systems Inc',cusip:'15675D103'}])
assert.equal(positionColor({displayLabel:'Cerebras Systems Inc',cusip:'15675D103'}),'#68882b')
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16))
assert(Math.hypot(...rgb(nearGreens[0].color).map((v,i)=>v-rgb(nearGreens[1].color)[i]))>=95,'Near greens need a contrasting replacement')

// Actual principal portfolios keep named positions without a fixed eight-line cap.
const {readFileSync}=await import('node:fs')
for(const slug of ['berkshire','tepper']) {
  const p=normalizePortfolio(JSON.parse(readFileSync(`public/data/investors/${slug}.json`,'utf8')))
  if(p.problem){assert.throws(()=>publicationPlan(p));continue}
  const plan=publicationPlan(p)
  // Pin this density regression to the reviewed filings, not future disclosures.
  const reviewedTotal={berkshire:299253556246,tepper:7471257999}[slug]
  if(p.snapshot.periodEnd==='2026-06-30' && plan.total===reviewedTotal)assert(plan.entries.filter(e=>!e.other).length>=9)
  assert(plan.entries.every(e=>!['M','C','OP'].includes(e.label)))
  assert.equal(publicationPlan(p),plan,'Reuse the deterministic layout')
  p.holdings[0].value+=1
  const revised=publicationPlan(p)
  assert.equal(revised.total,plan.total+1,'Updated values invalidate the layout cache')
}
assert.equal(shortPosition({issuerName:'INDIVIOR PHARMACEUTICALS INC',cusip:'45579U109'}),'Indivior')

// New reviewed issuer assets and the investor-only Alphabet variant retain provenance.
const {createHash}=await import('node:crypto')
for(const issuerName of ['MOODYS CORP','CHUBB LIMITED','OCCIDENTAL PETE CORP','VISTRA CORP','ISHARES INC','ALPHABET INC','META PLATFORMS INC']) {
  const identity=logoIdentity({issuerName,...(issuerName==='ISHARES INC'?{cusip:'464286772'}:issuerName==='ALPHABET INC'?{cusip:'02079K305'}:issuerName==='META PLATFORMS INC'?{cusip:'30303M102'}:{})})
  assert(identity,issuerName)
  const source=identity.investorVariant || identity
  assert(source.source.startsWith('https://'))
  assert.equal(createHash('sha256').update(readFileSync(`public/asset-art/${source.file}`)).digest('hex'),source.sha256)
}

const marks = JSON.parse(readFileSync('public/asset-art/investor-logos/sources.json'))
const registeredCusips = new Set()
for (const [id, mark] of Object.entries(marks)) {
  assert.equal(createHash('sha256').update(readFileSync(`public/asset-art/${mark.file}`)).digest('hex'), mark.sha256)
  for (const cusip of mark.cusips) {
    assert.match(cusip, /^[A-Z0-9*@#]{9}$/)
    assert(!registeredCusips.has(cusip), `Multiple investor marks for ${cusip}`)
    registeredCusips.add(cusip)
    assert.equal(logoIdentity({ cusip }).id, id)
  }
}

assert.equal(shortPosition({displayLabel:'TSMC',issuerName:'TAIWAN SEMICONDUCTOR'}),'TSMC')
assert.equal(shortPosition({displayLabel:'Liberty Live Group I (53033H101)',issuerName:'LIBERTY LIVE GROUP INC',cusip:'53033H101',shareClass:'COM SER A'}),'Liberty Live A')

// Qualify every live portfolio and reconcile the single editorial image.
const {INVESTORS}=await import('../src/pages/investor-portfolio/data.js')
for (const [slug] of INVESTORS) {
  const p = normalizePortfolio(JSON.parse(readFileSync(`public/data/investors/${slug}.json`)))
  if (p.problem) {
    assert.throws(() => publicationPlan(p))
    continue
  }
  const plan = publicationPlan(p)
  const sorted = [...p.holdings].sort((a,b) => b.value - a.value)
  const named = plan.entries.filter(row => !row.other)
  const other = plan.entries.find(row => row.other)
  assert.deepEqual(named.map(row => row.cusip), sorted.slice(0, named.length).map(row => row.cusip))
  assert.equal(plan.total, p.total)
  assert.equal(plan.hiddenCount, sorted.length - named.length)
  assert.equal(other?.value || 0, sorted.slice(named.length).reduce((sum, row) => sum + row.value, 0))
  if (other) assert.equal(other.label, 'Autres')
}
// Standalone PNGs retain machine-readable credits, with valid framing and CRC.
const {pngCredits}=await import('../src/pages/investor-portfolio/png-credits.js')
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg=='
const attributed=Buffer.from(pngCredits(png,{author:'Créateur',license:'CC0'}).split(',')[1],'base64')
const zlib=await import('node:zlib')
let found=false
for(let offset=8;offset<attributed.length;){const size=attributed.readUInt32BE(offset),type=attributed.toString('ascii',offset+4,offset+8),content=attributed.subarray(offset+8,offset+8+size)
 if(type==='iTXt'){found=true;assert.equal(content.toString('utf8'),'Description\0\0\0\0\0{"author":"Créateur","license":"CC0"}');assert.equal(attributed.readUInt32BE(offset+8+size),zlib.crc32(attributed.subarray(offset+4,offset+8+size)))}offset+=size+12}
assert(found)
