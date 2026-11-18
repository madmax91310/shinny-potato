import assert from 'node:assert/strict'
import { normalizePortfolio, buildTweet, percentage } from '../src/pages/investor-portfolio/data.js'
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
    const ex=Math.max(b.x,Math.min(entry.badge.x,b.x+b.width)),ey=Math.max(b.y,Math.min(entry.badge.y,b.y+b.height))
    assert(!needsLeader(entry,plan.entries) || entry.leader?.length===2,'Only necessary short straight leaders')
    if(entry.leader)assert(Math.hypot(entry.leader[1].x-entry.leader[0].x,entry.leader[1].y-entry.leader[0].y)<=66)
    assert(!entry.box.lines.some(line=>line.length===1),'No orphan class letter')
    assert(b.x>=20 && b.x+b.width<=1060 && b.y>=POSTER.top && b.y+b.height<=POSTER.bottom)
    assert.equal(entry.badge.radius,POSTER.badgeRadius)
    for(const next of plan.entries)if(next!==entry){
      const c=next.box
      assert(b.x+b.width<=c.x || c.x+c.width<=b.x || b.y+b.height<=c.y || c.y+c.height<=b.y,'Label collision')
      assert(Math.hypot(entry.badge.x-next.badge.x,entry.badge.y-next.badge.y)>=2*POSTER.badgeRadius,'Badge collision')
    }
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

assert(!reportedAmount({value:1000}).includes('$'))
assert(!reportedAmount({value:1000,currency:'USD',unit:1000}).includes('$'))
assert(reportedAmount({value:1000,currency:'USD',unit:1}).includes('$US'))

const unverified=normalizePortfolio(sample([60,40]));unverified.identity.personVerified=false;assert.equal(portfolioOwner(unverified),'Appaloosa LP');assert(buildTweet(unverified).startsWith('Portefeuille de Appaloosa LP :'))
unverified.identity.personVerified=true;unverified.identity.personPeriod='2026-03-31';assert.equal(portfolioOwner(unverified),'Appaloosa LP')

assert.equal(cash(78300000,'USD'),'78,3\u00a0M\u00a0$US') // Same explicit precision in Node 20 and Chromium.

// Poster simplification must not hide the class discriminator or alter detail colors.
assert.equal(shortPosition({displayLabel:'Alphabet (02079K305)',shareClass:'CAP STK CL A',cusip:'02079K305'}),'Alphabet A')
assert.equal(shortPosition({displayLabel:'Berkshire Hathaway (084670108)',shareClass:'CL A',cusip:'084670108'}),'Berkshire A')
assert.equal(shortPosition({displayLabel:'Uber Technologies Inc'}),'Uber')
assert.equal(shortPosition({issuerName:'MASTERCARD INCORPORATED'}),'MASTERCARD')
assert.equal(shortPosition({issuerName:'Space Exploration Technologies'}),'SpaceX')
const colorPortfolio=normalizePortfolio(sample([10,9,8,7,6,5,4,3,2,1]))
const allColors=colorPositions(colorPortfolio.holdings),colorPlan=publicationPlan(colorPortfolio)
assert.equal(new Set(allColors.map(r=>r.color)).size,allColors.length)
for(const row of colorPlan.entries.filter(r=>!r.other))assert.equal(row.color,allColors.find(r=>r.cusip===row.cusip).color)

const nearGreens=colorPositions([{displayLabel:'Nvidia',cusip:'67066G104'},{displayLabel:'Cerebras Systems Inc',cusip:'15675D103'}])
assert.equal(positionColor({displayLabel:'Cerebras Systems Inc',cusip:'15675D103'}),'#68882b')
const rgb=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16))
assert(Math.hypot(...rgb(nearGreens[0].color).map((v,i)=>v-rgb(nearGreens[1].color)[i]))>=95,'Near greens need a contrasting replacement')

// Actual principal portfolios preserve descending selection as disclosures change.
const {readFileSync}=await import('node:fs')
for(const slug of ['berkshire','tepper']) {
  const p=normalizePortfolio(JSON.parse(readFileSync(`public/data/investors/${slug}.json`,'utf8')))
  if(p.problem){assert.throws(()=>publicationPlan(p));continue}
  const plan=publicationPlan(p)
  const named=plan.entries.filter(e=>!e.other)
  assert.deepEqual(named.map(e=>e.value),[...p.holdings].sort((a,b)=>b.value-a.value).slice(0,named.length).map(e=>e.value))
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

// Regression: the old straight Moody's leader crossed Chubb's two text lines.
import {leaderPath,needsLeader} from '../src/pages/investor-portfolio/leader-layout.js'
const moody={badge:{x:164,y:584,radius:50},box:{x:20,y:332,width:181,height:80}}
const chubb={badge:{x:141,y:692,radius:50},box:{x:20,y:440,width:150,height:80}}
const route=leaderPath(moody,[moody,chubb],POSTER)
assert.equal(route,null,'A long detour must trigger a simpler composition, not an elbow leader')
const nearby={badge:{x:940,y:700,radius:50},box:{x:1035,y:680,width:40,height:44}}
const shortRoute=leaderPath(nearby,[nearby],POSTER)
assert.equal(shortRoute?.length,2)
assert(Math.hypot(shortRoute[1].x-shortRoute[0].x,shortRoute[1].y-shortRoute[0].y)<=66)
assert.equal(leaderPath({...nearby,box:{...nearby.box,x:1005}},[{...nearby,box:{...nearby.box,x:1005}}],POSTER),null)

assert.equal(shortPosition({displayLabel:'TSMC',issuerName:'TAIWAN SEMICONDUCTOR'}),'TSMC')
assert.equal(shortPosition({displayLabel:'Liberty Live Group I (53033H101)',issuerName:'LIBERTY LIVE GROUP INC',cusip:'53033H101',shareClass:'COM SER A'}),'Liberty Live A')

// The editorial selection remains contiguous and finite, independently of archive size.
const {editorialSeries}=await import('../src/pages/investor-portfolio/publication.js')
const {INVESTORS}=await import('../src/pages/investor-portfolio/data.js')
for(const [slug] of INVESTORS){
  const p=normalizePortfolio(JSON.parse(readFileSync(`public/data/investors/${slug}.json`)))
  if(p.problem){assert.throws(()=>editorialSeries(p));continue}
  const series=editorialSeries(p),rows=[...p.holdings].sort((a,b)=>b.value-a.value)
  assert(series.pages.length>=1&&series.pages.length<=4)
  assert.equal(series.coverage,rows.slice(0,series.topCount).reduce((s,r)=>s+r.value,0)/p.total)
  const named=series.main.entries.filter(r=>!r.other),next=series.pages.slice(1).flatMap(page=>page.rows)
  assert.deepEqual([...named,...next].map(r=>r.cusip),rows.slice(0,series.coveredCount).map(r=>r.cusip))
  assert.equal(series.main.hiddenCount,rows.length-named.length)
  if(series.main.hiddenCount)assert.equal(series.main.entries.find(r=>r.other).label,`Autres · ${series.main.hiddenCount} positions`)
  assert(next.every(r=>r.value/p.total>0))
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
