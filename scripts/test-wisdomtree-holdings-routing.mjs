import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {qualifiedWisdomtreeRankingsRoute,qualifiedWisdomtreeApiMethod} from './issuer-routes.mjs'
import classes from './wisdomtree-holdings-classes.json' with {type:'json'}
import methods from './wisdomtree-identity-methods.json' with {type:'json'}
assert(qualifiedWisdomtreeApiMethod({identityMethod:methods.legacyApiMethod}))
assert(qualifiedWisdomtreeApiMethod({identityMethodCode:methods.nativeApiV1,identityMethod:'Reworded explanatory method'}))
for(const value of [{},{identityMethod:'Unknown method'},{identityMethodCode:'unknown-v2',identityMethod:methods.legacyApiMethod}])assert(!qualifiedWisdomtreeApiMethod(value))
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

for(const config of Object.values(classes)){
 const base='https://dataspanapi.wisdomtree.com/funddetails/rankings/'
 const encoded=encodeURIComponent(config.fundTicker)
 for(const query of [`ticker=${encoded}&isoCode=en-GB`,`ticker=${encoded.replace(/%20/g,'+')}&isoCode=en-GB`,`isoCode=en-GB&ticker=${encoded}`])assert(qualifiedWisdomtreeRankingsRoute(base+'?'+query,config))
 for(const url of [base+'?ticker=OTHER&isoCode=en-GB',base+'?ticker='+encoded+'&isoCode=en-GB&extra=1',base+'?ticker='+encoded+'&ticker=OTHER&isoCode=en-GB',base.replace('wisdomtree.com','wisdomtree.com.evil.test')+'?ticker='+encoded+'&isoCode=en-GB'])assert(!qualifiedWisdomtreeRankingsRoute(url,config))
}
const config=classes.IE00BZ56SW52,alias=config.rankingsListingAlternatives[0],url='https://dataspanapi.wisdomtree.com/funddetails/rankings/?ticker=GGRG%20LN&isoCode=en-GB'
assert(!qualifiedWisdomtreeRankingsRoute(url,config))
assert(qualifiedWisdomtreeRankingsRoute(url,config,[alias]))
assert(!qualifiedWisdomtreeRankingsRoute(url,config,[{...alias,tradingCurrency:'USD'}]))
console.log('Semantic route checks retain +/%20 and document-qualified same-ISIN listings; wrong hosts, products, duplicate/extra parameters and unproved listings refused.')
