import assert from 'node:assert/strict'
import { equityChartObservations } from './equity-chart-observations.mjs'
import full from '../src/data/dca-complete-holdings.json' with {type:'json'}
import { references } from '../src/pages/dca-profiles/records.js'
import { publishedExposure, exposureView } from '../src/pages/dca-profiles/exposure.js'
import { portfolioCompanies } from '../src/pages/dca-profiles/companies.js'
const h=full.IE00B5BMR087,now=new Date(h.asOf+'T12:00:00Z')
const charts=equityChartObservations(h,now)
assert.deepEqual(charts.countries.rows,[{name:'United States',weightPct:100}])
assert(charts.sectors.rows.every(r=>! /cash|derivatives/i.test(r.name)))
assert(Math.abs(charts.sectors.rows.reduce((s,r)=>s+r.weightPct,0)-100)<1e-8)
assert.equal(equityChartObservations({...h,complete:false},now),null)
assert.equal(equityChartObservations(h,new Date(+now+94*86400000)),null)
const broken=structuredClone(h);broken.compositionFacts.countries.rows[0].weightPct=90
assert.equal(equityChartObservations(broken,now),null,'Incomplete geography must not be filled to 100')
const line={asset:'sp500',isin:'IE00B5BMR087',label:'S&P 500',weight:100}
const view=exposureView(publishedExposure([line],references,'countries',now))
assert.equal(view.rows.length,1)
assert(Math.abs(view.rows[0].weight-100)<1e-8)
const apple={asset:'apple',isin:'US0378331005',label:'Apple',weight:20}
const result=portfolioCompanies([{...line,weight:80},apple],references,{sp500:h},now)
const expected=20+.8*h.rows.find(r=>r.isin===apple.isin).weightPct
assert(Math.abs(result.rows.find(r=>r.id===apple.isin).weightPct-expected)<1e-8)
const alphabet=h.rows.filter(r=>['US02079K3059','US02079K1079'].includes(r.isin)).reduce((s,r)=>s+r.weightPct*.8,0)
assert(Math.abs(result.rows.find(r=>r.name==='Alphabet').weightPct-alphabet)<1e-8)
assert.equal(result.rows.filter(r=>r.name==='Alphabet').length,1)
const partial=portfolioCompanies([line],references,{sp500:{...h,complete:false,rows:h.rows.slice(0,10)}},now)
assert.equal(partial.complete,false)
assert(partial.coverage<100)
assert.equal(portfolioCompanies([line],references,{},now).rows.length,0)
console.log('Equity-only S&P 500, missing/stale data, direct+ETF weights, share-class grouping and partial top companies verified.')
