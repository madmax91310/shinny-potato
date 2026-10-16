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
