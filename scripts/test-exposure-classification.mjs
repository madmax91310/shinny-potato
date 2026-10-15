import assert from 'node:assert/strict'
import { qualifyExposureClassification as qualify } from '../src/lib/exposure-classification.js'
import { portfolioExposure, comparePortfolioExposure } from '../src/lib/portfolio-exposure.js'
import { PORTFOLIO_EXPOSURES } from '../src/data/portfolio-exposure-data.js'
const sourceUrl='https://www.ishares.com/product-data/api/v2/get-product-data?component=exposureBreakdowns'
const country={provider:'iShares',basis:'fund',asOf:'2026-10-13',sourceUrl,rows:[{name:'United States',weightPct:60},{name:'Japan',weightPct:40}]}
const lines=[{isin:'a',pct:60},{isin:'b',pct:40}]
const data={a:{countries:country},b:{countries:{...country,rows:[{name:'United States',weightPct:50},{name:'Japan',weightPct:50}]}}}
const groups=portfolioExposure(lines,data,'countries')
assert.equal(groups.length,1);assert.equal(groups[0].coverage,100);assert.equal(groups[0].complete,true)
assert.equal(groups[0].rows.find(r=>r.name==='États-Unis').weight,56)
assert.equal(groups[0].asOf,country.asOf);assert.deepEqual(groups[0].sources,[sourceUrl])
for(const override of [{asOf:'2026-09-30'},{basis:'index'},{sourceComponent:'exposureBreakdowns.geography.registration'},{sourceUrl:'https://blackrock.com.example.org/product-data/api/v2/get-product-data?component=exposureBreakdowns'},{method:'Country of risk, all published holdings including cash/derivatives, no renormalisation'}]) {
 assert.equal(portfolioExposure(lines,{...data,b:{countries:{...country,...override}}},'countries').length,2)
}
assert.equal(qualify({...country,sourceUrl:'http://www.ishares.com/product-data/api/v2/get-product-data?component=exposureBreakdowns'},'countries'),null)
assert.equal(qualify({...country,sourceUrl:'https://www.ishares.com/other?component=exposureBreakdowns'},'countries'),null)
assert.equal(qualify({...country,sourceUrl:'https://www.ishares.com/product-data/api/v2/get-product-data?component=holdings'},'countries'),null)
assert.equal(qualify({...country,rows:[{name:'Utilities',weightPct:80},{name:'Cash and/or Derivatives',weightPct:20}]},'sectors').level,'sector')
assert.equal(qualify({...country,rows:[{name:'Semiconductors',weightPct:100}]},'sectors'),null)
const amundi={...country,provider:'Amundi',sourceUrl:'https://www.amundietf.fr/mapi/ProductAPI/getProductsData'}
assert.notEqual(qualify(amundi,'countries').id,qualify({...amundi,basis:'index'},'countries').id)
assert.equal(qualify({...amundi,sourceComponent:'INDEX_COUNTRIES'},'countries'),null)
assert.equal(qualify(amundi,'sectors'),null)
const vaneck={...country,provider:'VanEck',sourceUrl:'https://www.vaneck.com/fund',method:'Published Sector weights, percent of net assets, no renormalisation'}
assert.notEqual(qualify(vaneck,'sectors').id,qualify({...vaneck,method:'Published SubIndustry weights, percent of net assets, no renormalisation'},'sectors').id)
const partial={a:{countries:country},b:{countries:{...country,rows:[{name:'United States',weightPct:40}]}}}
assert.equal(portfolioExposure(lines,partial,'countries')[0].complete,false)
assert.deepEqual(comparePortfolioExposure(lines,[{isin:'a',pct:100}],partial,'countries'),[])
let automatic=0
for(const record of Object.values(PORTFOLIO_EXPOSURES))for(const [field,observation]of Object.entries(record)) {
 assert.deepEqual(observation.classificationMetadata,qualify(observation,field))
 if(observation.classificationMetadata?.sourceComponent)automatic++
}
assert.ok(automatic>=100,`Expected known source contracts to qualify existing observations, got ${automatic}`)
console.log(`Exposure classification: ${automatic} observations qualified from source components; provenance, scope, dates, partial coverage and unknown taxonomies verified.`)
