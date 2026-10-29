import assert from 'node:assert/strict';
import { generatePortfolio, replacePortfolioAsset, getReplacementCandidates } from '../src/pages/portfolio-generator/engine.js';
import { constructionIssues, constructionMetrics, diversityReport, overlapNotes } from '../src/pages/portfolio-generator/controls.js';
import { PROFILES } from '../src/pages/portfolio-generator/theses.js';
import { ETF_DEVELOPMENT_LOTS, etfDevelopmentEntry } from '../src/data/etf-development.js';
let seed=15102026;
const random=Math.random;
Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
try {
  let draws=0, replacements=0;
  for(const profile of PROFILES)for(const risk of Object.keys(profile.riskCombos)) {
    const history=[];
    for(let i=0;i<12;i++) {
      const p=generatePortfolio(history,risk,profile.id);
      history.push(p);
      const row=p.selection[i%p.selection.length];
      const locked=[{id:row.id,pct:row.pct}];
      const next=generatePortfolio(history,risk,profile.id,{locked});
      assert.equal(next.selection.find(s=>s.id===row.id)?.pct,row.pct);
      assert.deepEqual(constructionIssues(next.selection,risk),[]);
      assert.equal(next.selection.reduce((sum,s)=>sum+s.pct,0),100);
      for(const candidate of getReplacementCandidates(next,next.selection[0].id).slice(0,2)) {
        const updated=replacePortfolioAsset(next,next.selection[0].id,candidate.id,history);
        assert.deepEqual(constructionIssues(updated.selection,risk),[]);replacements++;
      }
      history.push(next);draws++;
    }
    const all=history.at(-1).selection.map(({id,pct})=>({id,pct}));
    const frozen=generatePortfolio(history,risk,profile.id,{locked:all});
    assert.deepEqual(frozen.selection.map(({id,pct})=>({id,pct})).sort((a,b)=>a.id.localeCompare(b.id)),all.sort((a,b)=>a.id.localeCompare(b.id)));
    const report=diversityReport(history)[0];
    assert.equal(Object.values(report.recipes).reduce((a,b)=>a+b,0),24);
    assert.equal(report.count,24);assert.ok(report.distinctFamilies>0);
  }
  assert.throws(()=>generatePortfolio([],'equilibre','generaliste',{locked:[{id:'bitcoin',pct:100}]}),/Aucune composition/);
  assert.throws(()=>generatePortfolio([],'auto','auto',{locked:[{id:'msci_world',pct:30}]}),/profil et le risque/);
  assert.throws(()=>generatePortfolio([],'equilibre','generaliste',{locked:[{id:'msci_world',pct:NaN}]}),/poids entier/);
  assert.ok(constructionIssues([{id:'bitcoin',pct:20},{id:'ethereum',pct:15},{id:'msci_world',pct:65}],'dynamique').some(x=>x.key==='crypto'));
  assert.equal(constructionMetrics([{id:'europe-property',pct:30}]).property,30);
  assert.equal(constructionMetrics([{id:'bitcoin',pct:20},{id:'lqq',pct:10},{id:'qyld_ucits',pct:40}]).speculative,70);
  assert.ok(overlapNotes([{id:'msci_world',pct:60},{id:'sect_tech',pct:20},{id:'sect_ai_lg',pct:20}]).length>=2);
  assert.ok(overlapNotes([{id:'bitcoin',pct:20},{id:'blockchain_ishares',pct:20}]).some(x=>x.includes('blockchain')));
  const lots=ETF_DEVELOPMENT_LOTS.flatMap(l=>l.entries);
  assert.equal(new Set(lots.map(([,isin])=>isin)).size,lots.length);
  for(const [,isin] of lots) {const r=etfDevelopmentEntry(isin);assert.notEqual(r.name,isin);assert.ok(r.collected);assert.ok(r.gaps.length || r.sixYears);}
  assert.equal(etfDevelopmentEntry('IE0003R87OG3').sixYears,false);
  assert.equal(etfDevelopmentEntry('IE00BMG6Z448').sixYears,false);
  assert.equal(etfDevelopmentEntry('IE00BM67HV82').sixYears,true);
  assert.throws(()=>etfDevelopmentEntry('UNKNOWN'),/Produit inconnu/);
  console.log(`OK : ${draws} tirages verrouillés, ${replacements} remplacements, plafonds cumulés, recoupements et ${lots.length} références ETF.`);
} finally {Math.random=random;}

// A short/partial positive window cannot make a risky allocation look prudent.
const { compatibleRiskTier, buildManualPortfolio, renderTweetText } = await import('../src/pages/portfolio-generator/engine.js');
const { computeYearlyPerf, annualizedReturn, validAllocation } = await import('../src/pages/portfolio-generator/performance.js');
const { getAsset } = await import('../src/data/portfolio-assets.js');
const years = Array.from({length:6},(_,i)=>new Date().getUTCFullYear()-6+i);
const full = Object.fromEntries(years.map(year=>[year,2]));
assert.equal(compatibleRiskTier([{id:'fonds_euros',pct:100}],full),'prudent');
assert.equal(compatibleRiskTier([{id:'sp500',pct:100}],full),'dynamique','Equity ceilings apply even after six positive years');
assert.equal(compatibleRiskTier([{id:'bitcoin',pct:100}],full),null,'Beyond every construction ceiling');
assert.equal(compatibleRiskTier([{id:'sp500',pct:100}],Object.fromEntries(years.slice(-3).map(y=>[y,2]))),null);
assert.equal(compatibleRiskTier([{id:'fonds_euros',pct:100}],{...full,[years[1]]:null}),null);
assert.equal(compatibleRiskTier([{id:'fonds_euros',pct:100}],{...full,[years[1]]:-100}),'offensif','Loss of all capital remains in the historical floor');
const short = {...getAsset('sp500'),pct:100,calendarReturns:Object.fromEntries(years.slice(-3).map(y=>[y,2]))};
assert.deepEqual(Object.keys(computeYearlyPerf([short])).map(Number),years.slice(-3),'No index-filled missing years');
const loss = computeYearlyPerf([{...short,calendarReturns:{...full,[years[1]]:-100}}]);
assert.equal(loss[years[1]],-100);
assert.equal(annualizedReturn(loss),-100);
const decimals=[{pct:33.3},{pct:33.3},{pct:33.4}];
assert(validAllocation(decimals));
assert(!validAllocation([{pct:99.999}]));
assert(!validAllocation([{pct:101},{pct:-1}]));
assert(!validAllocation([{pct:NaN}]));
const texts=[];const prior=[];
for(let i=0;i<3;i++){
 const p=buildManualPortfolio([{id:'msci_world',pct:70},{id:'or',pct:30}],'generaliste',prior);prior.push(p);texts.push(renderTweetText(p));
 assert.equal(texts[i].match(/Pas un conseil\./g)?.length,1);
 assert(!texts[i].includes('La pire année civile observée n’est pas une perte maximale'));
}
assert.equal(new Set(texts.map(text=>text.split('💼 La répartition')[0])).size,3,'Actual publication variants rotate');
console.log('Audit regression: six-year qualification, composition limits, exact share, total loss, decimals and three publication variants verified.');
