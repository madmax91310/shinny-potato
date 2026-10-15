import assert from 'node:assert/strict';
import {annualListingReturns,buildCompleteness} from './build-etf-completeness.mjs';
import {ASSETS} from '../src/data/portfolio-assets.js';
import {constructionMetrics} from '../src/pages/portfolio-generator/controls.js';
const r={isin:'IE0003R87OG3',field:'adjclose',currency:'EUR',listingEvidenceId:'exact',method:'adjusted close',sourceUrls:['https://example.test'],points:[['2024-12',100],...Array.from({length:12},(_,i)=>[`2025-${String(i+1).padStart(2,'0')}`,101+i])]};
assert(Math.abs(annualListingReturns(r,'2026-10-15').years[2025]-12)<1e-10);
assert.equal(annualListingReturns({...r,field:'close'}),null);
assert.equal(annualListingReturns({...r,listingEvidenceId:null}),null);
assert.equal(annualListingReturns({...r,points:r.points.slice(1)}),null);
assert.equal(annualListingReturns({...r,points:r.points.filter(([m])=>m!=='2025-06')}),null);
assert.equal(annualListingReturns({...r,points:[...r.points,r.points[0]]}),null);
assert.equal(annualListingReturns(r,'2025-12-31'),null);
const report=buildCompleteness();
for(const f of Object.values(report.fieldCoverage)) {
 assert.equal(f.present+f.waiting+f.notPublished+f.unresolved,f.applicable);
 assert.equal(f.applicable+f.notApplicable,report.instruments);
}
for(const id of ['health_world_dws','new_energy_amundi']) {
 const a=ASSETS.find(a=>a.id===id);assert(a&&!a.manualOnly&&a.r.every(Number.isFinite));
 assert.equal(constructionMetrics([{id,pct:20}]).sectors,20);
}
const avantis=report.rows.find(r=>r.isin==='IE0003R87OG3');
assert.equal(avantis.annual.currency,'USD');assert.deepEqual(avantis.annual.years,{});
assert(avantis.listings.some(l=>l.currency==='EUR'&&Number.isFinite(l.years[2025])));
console.log('ETF coverage: exact-share annual calculation, incomplete periods, currencies, denominators and sector risk verified.');
