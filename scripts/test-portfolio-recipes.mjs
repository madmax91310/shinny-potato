import assert from 'node:assert/strict';
import { PROFILES, RISK_BOUNDS, THEME_OPTIONS_CALM, THEME_OPTIONS_FULL, THEME_OPTIONS_AGGRESSIVE } from '../src/pages/portfolio-generator/theses.js';
import { getRecipes, withinRecipe } from '../src/pages/portfolio-generator/recipes.js';
import { getAsset, YEARS } from '../src/data/portfolio-assets.js';
import { generatePortfolio, renderTweetText } from '../src/pages/portfolio-generator/engine.js';
import { exposureSignature, exposureVector, exposureDistance } from '../src/pages/portfolio-generator/exposures.js';
import { computeYearlyPerf } from '../src/pages/portfolio-generator/performance.js';

const europe = new Set(['eurostoxx50','eurostoxx50_ishares','cac40','tech_europe','smallcap_europe','oblig_etat_eur_short','msci_europe']);
const bitcoinBounds = { defensif:[5,10], equilibre:[10,20], dynamique:[15,30] };
const income = new Set(['fonds_euros','scpi','oblig_hy','oblig_hy_amundi','oblig_etat_us','qyld_ucits']);
function validate(profile, risk, selection) {
  assert.equal(selection.reduce((sum,s) => sum+s.pct,0),100);
  assert.equal(new Set(selection.map(s=>s.id)).size,selection.length);
  const perf = computeYearlyPerf(selection);
  assert.ok(YEARS.every(y=>Number.isFinite(perf[y])));
  const worst = Math.min(...Object.values(perf));
  if (RISK_BOUNDS[risk].min !== null) assert.ok(worst >= RISK_BOUNDS[risk].min, `${profile}/${risk}: ${worst}`);
  if (profile === 'pro_europe') assert.ok(selection.filter(s=>europe.has(s.id)).reduce((sum,s)=>sum+s.pct,0)>=70);
  if (profile === 'rentier') assert.ok(selection.every(s=>getAsset(s.id).distributing || income.has(s.id)));
  if (profile === 'crypto_curieux' && bitcoinBounds[risk]) {
    const btc = selection.filter(s=>s.id.startsWith('bitcoin')).reduce((sum,s)=>sum+s.pct,0);
    assert.ok(btc>=bitcoinBounds[risk][0] && btc<=bitcoinBounds[risk][1]);
  }
  if (profile === 'thematique') {
    const options = risk==='defensif' ? THEME_OPTIONS_CALM : risk==='equilibre' ? THEME_OPTIONS_FULL : THEME_OPTIONS_AGGRESSIVE;
    assert.ok(options.includes(selection[0].id));
    assert.equal(selection[0].pct, {defensif:35,equilibre:35,dynamique:55,offensif:70}[risk]);
  }
}
let combinations=0, constructions=0, generations=0;
// Exploration reproductible avec une fenêtre bornée de 40 résultats.
// L’interface conserve son historique de session entier.
const originalRandom = Math.random;
let seed=20261002;
Math.random=()=> { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
try {
  for (const profile of PROFILES) for (const risk of Object.keys(profile.riskCombos)) {
    const recipes = getRecipes(profile.id,risk);
    assert.ok(recipes.length >= 3);
    assert.equal(new Set(recipes.map(r=>r.id)).size,recipes.length);
    for (const recipe of recipes) {
      constructions++;
      function visit(index, selection) {
        if(index===recipe.assets.length) { validate(profile.id,risk,selection); combinations++; return; }
        const slot=recipe.assets[index];
        for(const id of slot.idOptions??[slot.id]) visit(index+1,[...selection,{id,pct:slot.pct,r:getAsset(id).r}]);
      }
      try { visit(0,[]); } catch(error) { throw new Error(`${profile.id}/${risk}/${recipe.id}: ${error.message}`); }
    }
    const structures = recipes.map(() => new Set());
    for (let r=0;r<recipes.length;r++) {
      function visit(index, selection) {
        if (index===recipes[r].assets.length) { structures[r].add(Object.keys(exposureVector(selection)).sort().join(',')); return; }
        const slot=recipes[r].assets[index];
        for(const id of slot.idOptions??[slot.id]) visit(index+1,[...selection,{id,pct:slot.pct}]);
      }
      visit(0,[]);
    }
    for(let a=0;a<structures.length;a++)for(let b=a+1;b<structures.length;b++) {
      assert.ok(![...structures[a]].some(key=>structures[b].has(key)), `${profile.id}/${risk}: structures identiques`);
    }
    const history=[], seen=new Set(), signatures=new Set();
    for(let i=0;i<90;i++) {
      const p=generatePortfolio(history,risk,profile.id);
      validate(profile.id,risk,p.selection);
      assert.ok(withinRecipe(p.selection,recipes.find(r=>r.id===p.recipeId)));
      assert.notEqual(p.recipeId,history.at(-1)?.recipeId);
      assert.doesNotMatch(renderTweetText(p), /undefined|NaN|\{pct\}/);
      assert.ok(!history.some(h=>h.sig===p.sig));
      assert.ok(!history.some(h=>exposureSignature(h.selection)===exposureSignature(p.selection)), `${profile.id}/${risk}: répétition d’exposition`);
      seen.add(p.recipeId); signatures.add(p.sig); generations++;
      history.push(p); if(history.length>40)history.shift();
    }
    assert.equal(seen.size,recipes.length,`${profile.id}/${risk}: couverture`);
    assert.ok(signatures.size>=80,`${profile.id}/${risk}: variété`);
  }
  const world=[{id:'msci_world',pct:60},{id:'or',pct:40}];
  const twins=[{id:'msci_world_ishares',pct:60},{id:'or_amundi',pct:40}];
  assert.equal(exposureSignature(world),exposureSignature(twins));
  assert.equal(exposureDistance(exposureVector(world),exposureVector(twins)),0);
  assert.notEqual(exposureSignature(world),exposureSignature([{id:'world_quality_ishares',pct:60},{id:'or',pct:40}]));
  assert.equal(exposureDistance(exposureVector(world),exposureVector([{id:'msci_world',pct:50},{id:'or',pct:50}])),10);
  // Historique long, tel que conservé par l’interface.
  const longHistory=[];
  for(let i=0;i<100;i++) {
    const p=generatePortfolio(longHistory,'offensif','rentier');
    assert.ok(!longHistory.some(h=>h.exposureSig===p.exposureSig));
    longHistory.push(p);
  }
  const oldHistory=[generatePortfolio([], 'equilibre', 'generaliste')];
  delete oldHistory[0].recipeId;
  assert.ok(generatePortfolio(oldHistory,'equilibre','generaliste').recipeId);
  assert.deepEqual(getRecipes('bouclier','offensif'),[]);
  console.log(`OK : ${constructions} constructions, ${combinations} combinaisons exhaustives et ${generations} générations déterministes.`);
} finally { Math.random=originalRandom; }
