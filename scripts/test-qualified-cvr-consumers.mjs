import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {references} from '../src/pages/dca-profiles/engine.js'
import {portfolioAnalytics} from '../src/pages/dca-profiles/analytics.js'
import {projectDcaHoldings} from './lib/dca-holdings-projection.mjs'

const ids=['IE00BYZK4776','IE00BYZK4669'], now=new Date('2026-11-12T12:00:00Z')
const source=JSON.parse(execFileSync(process.env.PYTHON || 'python',['-c',
 "import sys,json;sys.path.insert(0,'scripts');from test_dca_qualified_cash_rights import parsed,SHARES;print(json.dumps({isin:parsed(isin) for isin in SHARES}))"
],{encoding:'utf8'}))
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
const books=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))))
const lines=ids.map(isin=>{
 const asset=Object.keys(references).find(key=>references[key].isin===isin)
 assert(asset,'Existing reference, no catalogue expansion')
 const h=projectDcaHoldings(source[isin],false)
 assert.deepEqual(h.qualifiedExcludedPositions,source[isin].qualifiedExcludedPositions)
 assert.equal(h.qualifiedExcludedPositions[0].sourcePosition.name,'ARCELLX INC CVR')
 assert.equal(h.navReconciliation.normalizationApplied,false)
 books[asset]=h
 return{asset,isin,weight:50}
})
const a=portfolioAnalytics(lines,references,books,now),b=portfolioAnalytics([...lines].reverse(),references,books,now)
assert(a.qualification.every(q=>q.valid&&q.complete),'Both actual company books meet existing unchanged quality thresholds')
assert.equal(a.pairs.length,1)
assert(a.pairs[0].full,'Full company overlap becomes usable, without allocating contingent cash rights to a company')
assert.deepEqual(a.pairs.map(p=>p.overlap),b.pairs.map(p=>p.overlap),'Ordering does not change overlap')
assert(!a.groups.flatMap(g=>g.rows).some(r=>/ARCELLX|GILEAD.*CVR/.test(r.name)))
for(const line of lines){
 const partial=structuredClone(books);partial[line.asset]={...partial[line.asset],complete:false,rows:partial[line.asset].rows.slice(0,10)}
 assert(!portfolioAnalytics(lines,references,partial,now).pairs[0].full,'Top10 never gains full overlap')
}
console.log('Two actual source books: company overlap restored, valued rights/proof retained, order invariant and top10 still partial.')
