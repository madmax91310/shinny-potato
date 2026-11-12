import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {INSTRUMENTS_BY_ISIN} from '../src/data/instruments.js';
import {deriveExposureSleeves} from './derive-exposure-sleeves.mjs';
const parents=JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/lifestrategy-nav/qualified-parents.json.gz',import.meta.url))));
const now=new Date('2026-11-12T00:00:00Z'), acc='IE00BK5BQW10',dist='IE00BKX55R35';
assert.equal(INSTRUMENTS_BY_ISIN[acc],undefined,'internal exact held share is not a selectable catalogue extension');
const children={};
for(const p of Object.values(parents))for(const h of p.underlyingHoldings.rows.filter(h=>h.assetCategory==='Actions'))children[h.isin]={name:h.name,isin:h.isin,...Object.fromEntries(['countries','sectors'].map(field=>[field,{asOf:'2026-09-30',sourceUrl:'https://fund-docs.vanguard.com/test-unit.pdf',rows:[{name:'Known classification',weightPct:90}]}]))};
children[dist]={name:'Vanguard FTSE North America UCITS ETF',countries:{asOf:'2026-09-30',sourceUrl:'https://fund-docs.vanguard.com/test-unit.pdf',rows:[{name:'Wrong class',weightPct:100}]}};
for(const [isin,parent]of Object.entries(parents)){
 const r=deriveExposureSleeves({...parents,...children},{},{},now)[isin];
 const weight=parent.underlyingHoldings.assetAllocationChecks.Actions.originalNavWeightPct;
 assert.ok(Math.abs(r.equitySleeve.weightPct-weight)<1e-9);
 assert.equal(r.countries.scope,'equity-fund-sleeve-only');
 assert.ok(Math.abs(r.countries.rows.reduce((a,b)=>a+b.weightPct,0)-90)<1e-9,'unclassified 10% is never scaled to 100');
 assert.equal(r.countries.parentPortfolioEvidence.sha256,parent.underlyingHoldings.sha256);
 assert.deepEqual(r,deriveExposureSleeves(Object.fromEntries(Object.entries({...parents,...children}).reverse()),{},{},now)[isin]);
}
const isin='IE00BMVB5P51';
for(const bad of ['missing','date']){
 const copy=structuredClone(children);if(bad==='missing')delete copy[acc];else copy[acc].countries.asOf='2026-08-31';
 const r=deriveExposureSleeves({...parents,...copy},{},{},now)[isin];
 assert.ok(r.countries.rows.every(x=>x.name!=='Wrong class'));
 assert.ok(r.countries.rows.reduce((a,b)=>a+b.weightPct,0)<90,'missing exact class remains uncovered; no Dist fallback');
 assert.ok(!r.countries.dependencies.some(d=>d.isin===acc));
}
const corrupt=structuredClone(parents);corrupt[isin].underlyingHoldings.subjectIsin=dist;
assert.deepEqual(deriveExposureSleeves({...corrupt,...children},{},{},now)[isin],{});
console.log('LifeStrategy exact held classes, raw fund-NAV weights, same-date dependencies, partial coverage and order invariance passed.');
