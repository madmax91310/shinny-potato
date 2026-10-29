import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import classes from './wisdomtree-holdings-classes.json' with {type:'json'}
// Regression of the real ordinary workflow sequence: discovery -> generator ->
// declared producer plan. Previously only WCLD survived the generator.
execFileSync(process.execPath,['scripts/build-automation-targets.mjs'],{stdio:'pipe'})
const configured=JSON.parse(readFileSync('scripts/generated-holdings-sources.json'))
const shares=['additional-etf-sources','exposure-etf-expansion'].flatMap(name=>JSON.parse(readFileSync(`scripts/${name}.json`)).instruments)
for(const isin of Object.keys(classes)){
 assert(shares.some(s=>s.isin===isin),'Existing selector support only')
 assert.equal(configured[isin]?.parser,'wisdomtree-complete',isin)
 assert.equal(configured[isin]?.currency,classes[isin].currency)
}
execFileSync('python3',['-c',`import sys;sys.path.insert(0,'scripts');from producer_report_plans import build_plan
p=build_plan('collect_dca_complete_holdings',['--only','IE00BKLF1R75','IE00BZ56SW52'])
assert {r['instrument'] for r in p['items'] if r['selected']}=={'IE00BKLF1R75','IE00BZ56SW52'}
`],{stdio:'pipe'})
console.log('Six existing WisdomTree shares survive ordinary target regeneration and targeted producer declaration.')
