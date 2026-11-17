import assert from 'node:assert/strict';
import {parseEtoroPublic, isEtoroVerificationUrl, ETORO_RESTRICTED_EXIT_CODE} from './lib/etoro-public.mjs';
assert.equal(ETORO_RESTRICTED_EXIT_CODE,77,'Collector access-restriction protocol');
assert(isEtoroVerificationUrl('https://geo.captcha-delivery.com/captcha/?challenge=TEST_FICTIF'));
for(const value of ['https://www.etoro.com/people/TEST_FICTIF/stats','https://captcha-delivery.com.evil.test/captcha','https://www.etoro.com/?next=https://geo.captcha-delivery.com/captcha','invalid'])assert.equal(isEtoroVerificationUrl(value),false);
const fixture=()=>({username:'TEST_FICTIF',identity:{username:'TEST_FICTIF',realCID:1},consulted:'2026-11-16',names:[{id:10,name:'TEST FICTIF A'},{id:20,name:'TEST FICTIF B'}],portfolio:{AggregatedPositions:[{InstrumentID:10,Direction:'Buy',Value:60},{InstrumentID:20,Direction:'Buy',Value:40}],AggregatedMirrors:[],CreditByUnrealizedEquity:0},stats:{dataComponentsResponse:[{type:'Performance',componentData:{firstActivity:'2018-01-01T00:00:00Z',monthly:{2026:Object.fromEntries(Array.from({length:11},(_,i)=>[i+1,{gain:i===0?10:i===1?-10:i===10?99:0,isSimulation:false}]))}}}]}});
const input=fixture(),before=JSON.stringify(input),result=parseEtoroPublic(input);
assert.equal(JSON.stringify(input),before);
assert.equal(result.currency,'','A public percentage does not prove the currency of the account');
assert.equal(result.performances.month.value,0);
assert.equal(result.performances.month.start,'2026-10-01');
assert.equal(result.performances.month.end,'2026-10-31');
assert.equal(result.performances.ytd.value,-1,'Chain the monthly factors, never sum their percentages or take current YTD');
assert.equal(result.performances.ytd.approximate,true);
assert.equal(result.performances.ytd.verified,false);
assert.equal(result.performances.month.verified,false);
assert.deepEqual(result.positions.map(row=>row.weight),[60,40,0]);
for(const mutate of [
 f=>f.identity.username='OTHER',
 f=>f.stats.dataComponentsResponse[0].componentData.monthly[2026][10].isSimulation=true,
 f=>f.stats.dataComponentsResponse[0].componentData.monthly[2026][10].gain=null,
 f=>delete f.stats.dataComponentsResponse[0].componentData.monthly[2026][10],
 f=>f.stats.dataComponentsResponse[0].componentData.firstActivity='2026-10-15T00:00:00Z',
 f=>f.portfolio.AggregatedPositions[0].Direction='Sell',
 f=>f.portfolio.AggregatedPositions[0].Value=NaN,
 f=>f.portfolio.AggregatedMirrors.push({}),
 f=>delete f.portfolio.AggregatedMirrors,
 f=>f.names=[],
 f=>f.consulted='2026-02-31',
]){const f=fixture();mutate(f);assert.throws(()=>parseEtoroPublic(f));}
const incomplete=fixture();delete incomplete.stats.dataComponentsResponse[0].componentData.monthly[2026][1];
assert.equal(parseEtoroPublic(incomplete).performances.ytd.value,'','A missing January does not become zero');
const loss=fixture();loss.stats.dataComponentsResponse[0].componentData.monthly[2026][10].gain=-2.45;assert.equal(parseEtoroPublic(loss).performances.month.value,-2.45);
const partial=fixture();partial.portfolio.AggregatedPositions.pop();assert.equal(parseEtoroPublic(partial).positions[0].weight,60,'Never renormalise a partial portfolio');
console.log('eToro public : mois civil, cumul composé approché, périodes, zéros, pertes, simulations et données manquantes vérifiés.');
