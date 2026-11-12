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

// Real complete NAV-weighted Quantum book: exact Class A proof and cash retained.
const quantum=JSON.parse(readFileSync('scripts/fixtures/wisdomtree-quantum-nav-20261110/qualified-replay.json'));
const {qualifyHoldings}=await import('../src/pages/dca-profiles/holdings-qualification.js');
const {holdingsReconciliationDetails}=await import('../src/data/holdings-reconciliation.js');
const line={isin:'IE000W8WMSL2'},reference={isin:line.isin,synthetic:false};
const q=qualifyHoldings(quantum,line,reference,new Date('2026-11-10T23:59:00Z'));
assert(q.valid&&q.complete);assert.equal(quantum.rows.length,47);
const accounting=holdingsReconciliationDetails(quantum);assert(accounting);
assert(Math.abs(accounting.excludedWeightPctByType.Cash-.2931336614588322)<1e-12);
assert(Math.abs(q.residualWeight-accounting.excludedWeightPctByType.Cash)<1e-10);
assert(quantum.rows.some(r=>r.name==='Google Inc'&&r.isin==='US02079K3059'));
const unknown=structuredClone(quantum);unknown.rows.find(r=>r.name==='Google Inc').isin=null;
assert(!qualifyHoldings(unknown,line,reference,new Date('2026-11-10T23:59:00Z')).complete,'A name and a ticker cannot replace the independent class proof');
console.log('Quantum: 47 exact securities, unchanged fund NAV weights, separately preserved cash and missing-identity refusal.');

const {projectDcaHoldings}=await import('./lib/dca-holdings-projection.mjs');
const {holdingsConsumerQualifications}=await import('./lib/holdings-consumer-qualification.mjs');
const ranking=JSON.parse(readFileSync('scripts/fixtures/wisdomtree-ranking-basis-20261110/rankings-retained.json'));
ranking.accessAttempts=[{sourceUrl:quantum.sourceUrl,status:'unavailable',error:'HTTP403 native source'}];
const projected=projectDcaHoldings(ranking,false);
assert.deepEqual(projected.accessAttempts,ranking.accessAttempts);
const denied=qualifyHoldings(projected,line,reference,new Date('2026-11-10T23:59:00Z'));
assert(!denied.valid&&!denied.complete);assert(denied.reasons.some(r=>r.includes('403')),'The native provider failure remains visible in the existing source details');
assert(!qualifyHoldings({...quantum,subjectIsin:'IE00BJGWQN72'},line,reference,new Date('2026-11-10T23:59:00Z')).valid,'A closed NAV book cannot be attached to another exact part');
const missingAttemptProof=structuredClone(projected);delete missingAttemptProof.accessAttempts;
const mismatch=holdingsConsumerQualifications({references:{q:reference},holdings:{q:missingAttemptProof},sourceRecords:{[line.isin]:ranking},now:new Date('2026-11-10T23:59:00Z')})[line.isin];
assert.equal(mismatch.outcomes[0].status,'deferred','Losing the native attempt proof cannot certify a matching source projection');
console.log('Native attempts survive projection, supplier errors remain visible, exact-share binding and proof-loss refusal preserved.');
