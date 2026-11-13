import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {references} from '../src/pages/dca-profiles/engine.js'
import {portfolioAnalytics} from '../src/pages/dca-profiles/analytics.js'
import {projectDcaHoldings} from './lib/dca-holdings-projection.mjs'
const raw=JSON.parse(execFileSync(process.env.PYTHON||'python',['-c',"import sys,json;sys.path.insert(0,'scripts');from test_dca_dws_held_funds import parsed;print(json.dumps(parsed()))"],{encoding:'utf8'}))
const h=projectDcaHoldings(raw,false),asset=Object.keys(references).find(id=>references[id].isin==='IE000L6ZMMC4');assert(asset)
assert(!h.complete);assert.deepEqual(h.navReconciliation,raw.navReconciliation)
for(const isin of['LU0514695187','IE00BZ3FDG37','IE00BZ3FDF20'])assert(!h.rows.some(r=>r.isin===isin))
assert.equal(h.rows.reduce((s,r)=>s+r.weightPct,0),raw.rows.reduce((s,r)=>s+r.weightPct,0))
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json')),books=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))));books[asset]=h
const apple=Object.keys(references).find(id=>references[id].isin==='US0378331005');assert(apple)
const lines=[{asset,isin:'IE000L6ZMMC4',weight:50},{asset:apple,isin:'US0378331005',weight:50}],now=new Date('2026-11-12T16:00:00Z'),a=portfolioAnalytics(lines,references,books,now),b=portfolioAnalytics([...lines].reverse(),references,books,now)
assert(!a.pairs[0].full);assert.equal(a.pairs[0].overlap,null);assert.equal(b.pairs[0].overlap,null)
assert.deepEqual(a.pairs[0].common.map(r=>[r.isin,r.portfolioWeight]),b.pairs[0].common.map(r=>[r.isin,r.portfolioWeight]))
assert(a.pairs[0].companyCommon.some(r=>r.id==='US0378331005'))
assert(!a.groups.flatMap(g=>g.rows).some(r=>['LU0514695187','IE00BZ3FDG37','IE00BZ3FDF20'].includes(r.isin)))
console.log('DWS: original NAV weights, separate money-market/equity-fund units, partial company overlap and ordering preserved.')
