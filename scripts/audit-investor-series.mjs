import fs from 'node:fs'
import assert from 'node:assert/strict'
import {INVESTORS,normalizePortfolio} from '../src/pages/investor-portfolio/data.js'
import {publicationPlan,editorialSeries} from '../src/pages/investor-portfolio/publication.js'
import {createHash} from 'node:crypto'
const media=JSON.parse(fs.readFileSync('public/data/investors/media/manifest.json'))
const rows=INVESTORS.map(([slug])=>{
 const p=normalizePortfolio(JSON.parse(fs.readFileSync(`public/data/investors/${slug}.json`)))
 const plan=p.problem?null:publicationPlan(p),series=p.problem?null:editorialSeries(p),other=plan?.entries.find(r=>r.other),named=plan?.entries.filter(r=>!r.other).length || 0
 const photo=media[slug]
 if(photo.status==='ready')assert(fs.statSync('public/'+photo.file).size>100)
 return {slug,portrait:photo.status,portraitFile:photo.file||null,portraitReason:photo.reason,totalPositions:p.snapshot.holdings.length,eligiblePositions:p.holdings.length,named:p.problem?null:named,otherValue:p.problem?null:other?.value||0,total:plan?.total,otherWeight:p.problem?null:other?.weight||0,grouped:p.problem?null:other?.count||0,groupedKnown:p.problem?[]:p.holdings.slice(named).map(r=>({cusip:r.cusip,shareClass:r.shareClass,name:r.displayLabel,value:r.value})),unknownEligiblePositions:0,detailedExportsAvailable:true,complementaryImages:series?series.pages.length-1:0,editorialCoverage:series?.coverage,editorialPositions:series?.coveredCount,problem:p.problem,sourceSha256:createHash('sha256').update(fs.readFileSync(`public/data/investors/${slug}.json`)).digest('hex')}
})
fs.writeFileSync(process.argv[2]||'test-artifacts/investor-series-audit.json',JSON.stringify(rows,null,2)+'\n')
console.table(rows.map(({slug,named,otherWeight,grouped,complementaryImages,portrait})=>({slug,named,otherWeight,grouped,complementaryImages,portrait})))
