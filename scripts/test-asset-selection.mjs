import { portfolioAssetLabel } from '../src/pages/portfolio-generator/compact.js'
import assert from 'node:assert/strict'
import { normalizeSearch, instrumentOption, sameBenchmarkSupports, benchmarkKey, exposureGroup } from '../src/data/asset-selection.js'
import { ASSETS, YEARS } from '../src/data/portfolio-assets.js'
import { PROFILES, RISK_BOUNDS } from '../src/pages/portfolio-generator/theses.js'
import { generatePortfolio, getReplacementCandidates, replacePortfolioAsset, renderTweetText } from '../src/pages/portfolio-generator/engine.js'
import { computeYearlyPerf } from '../src/pages/portfolio-generator/performance.js'
assert.equal(normalizeSearch('Émergents'), 'emergents')
assert.equal(exposureGroup({label:'Or'}), 'Matières premières')
assert.equal(exposureGroup({label:'MSCI World Small Cap'}), 'Monde')
const world = sameBenchmarkSupports('FR001400U5Q4')
assert.ok(world.some(a => a.isin === 'IE00B4L5Y983'))
assert.ok(!world.some(a => /ACWI|Small Cap|Quality|ex USA/.test(a.name)))
assert.notEqual(benchmarkKey('FR0013411998'), benchmarkKey('FR0013411980'))
for (const a of ASSETS) assert.ok(instrumentOption(a).label)
let count=0, offered=0
let seed=20261003
const random=Math.random
Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296}
try {
 for (const profile of PROFILES) for (const risk of Object.keys(profile.riskCombos)) {
  const history=[]
  for(let i=0;i<12;i++) {
   const p=generatePortfolio(history,risk,profile.id); history.push(p)
   assert.throws(()=>replacePortfolioAsset(p,p.selection[0].id,'unknown'))
   for(const row of p.selection) for(const candidate of getReplacementCandidates(p,row.id)) {
    const updated=replacePortfolioAsset(p,row.id,candidate.id,history.slice(0,-1)); offered++
    assert.deepEqual(updated.selection.map(a=>a.pct),p.selection.map(a=>a.pct))
    assert.equal(updated.profileId,profile.id); assert.equal(updated.riskId,risk)
    assert.equal(new Set(updated.selection.map(a=>a.id)).size,updated.selection.length)
    assert.deepEqual(updated.perf,computeYearlyPerf(updated.selection))
    assert.ok(YEARS.every(y=>Number.isFinite(updated.perf[y])))
    const worst=Math.min(...Object.values(updated.perf)), bounds=RISK_BOUNDS[risk]
    assert.ok(bounds.min===null||worst>=bounds.min); assert.ok(bounds.max===null||worst<=bounds.max)
    assert.ok(renderTweetText(updated).includes(portfolioAssetLabel(candidate)))
    assert.ok(!getReplacementCandidates(updated,candidate.id).some(a=>updated.selection.some(s=>s.id===a.id)))
   }
   count++
  }
 }
} finally {Math.random=random}
assert.ok(offered>100)
console.log(`Asset selection: ${count} portfolios, ${offered} validated replacements; exact benchmarks, search and rejection OK.`)
