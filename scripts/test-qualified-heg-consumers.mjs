import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {references} from '../src/pages/dca-profiles/engine.js'
import {portfolioAnalytics} from '../src/pages/dca-profiles/analytics.js'
import {projectDcaHoldings} from './lib/dca-holdings-projection.mjs'
const ids=['IE00B3F81G20','IE00BKM4GZ66'],now=new Date('2026-11-12T15:00:00Z')
const records=JSON.parse(execFileSync(process.env.PYTHON||'python',['-c',"import sys,json;sys.path.insert(0,'scripts');from test_dca_qualified_heg_identity import parsed,SHARES;print(json.dumps({i:parsed(i)for i in SHARES}))"],{encoding:'utf8'}))
const manifest=JSON.parse(readFileSync('src/pages/dca-profiles/holdings-manifest.json'))
const books=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>JSON.parse(readFileSync(`src/pages/dca-profiles/holdings-${n}.json`))))
const mapped=ids.map(isin=>{const asset=Object.keys(references).find(id=>references[id].isin===isin);assert(asset);const h=projectDcaHoldings(records[isin],false);assert.deepEqual(h.qualifiedIdentityPositions,records[isin].qualifiedIdentityPositions);assert.equal(h.navReconciliation.normalizationApplied,false);books[asset]=h;return {asset,isin,weight:50}})
const small=portfolioAnalytics([mapped[0]],references,books,now)
assert(small.qualification[0].complete,'EM Small Cap exact identity restores its already sufficient company coverage')
const imi=portfolioAnalytics([mapped[1]],references,books,now)
assert(!imi.qualification[0].complete,'EM IMI coverage remains below the unchanged full-overlap minimum')
assert.equal(imi.qualification[0].unidentifiedCoverage,0)
const other=Object.keys(references).find(id=>references[id].isin==='US0378331005');assert(other)
const lines=[mapped[0],{asset:other,isin:'US0378331005',weight:50}]
const a=portfolioAnalytics(lines,references,books,now),b=portfolioAnalytics([...lines].reverse(),references,books,now)
assert(a.pairs[0].full);assert.equal(a.pairs[0].overlap,b.pairs[0].overlap)
const partial=structuredClone(books);partial[mapped[0].asset]={...partial[mapped[0].asset],complete:false,rows:partial[mapped[0].asset].rows.slice(0,10)}
assert(!portfolioAnalytics(lines,references,partial,now).pairs[0].full)
console.log('Exact HEG identity; EM Small Cap admitted, EM IMI stays partial, original weights/proofs preserved, overlap order invariant.')
