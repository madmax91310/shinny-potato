// Mesure reproductible de la composition par familles, jamais du chevauchement de titres.
import {generatePortfolio,PROFILES} from '../src/pages/portfolio-generator/engine.js';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const baselineRef=process.argv.find(a=>a.startsWith('--baseline-ref='))?.split('=')[1];
let baseline, baselineRecipes, temporary;
if(baselineRef){
 temporary=await mkdtemp(join(tmpdir(),'portfolio-variety-'));
 // Snapshot all data and dependencies: comparing an old engine against new
 // recipes or observations would not be a valid before/after measurement.
 const archive=execFileSync('git',['archive',baselineRef,'src','scripts'],{maxBuffer:512*1024*1024});
 execFileSync('tar',['-x','-C',temporary],{input:archive});
 await writeFile(join(temporary,'package.json'),JSON.stringify({type:'module'}));
 baseline=(await import(pathToFileURL(join(temporary,'src/pages/portfolio-generator/engine.js')).href)).generatePortfolio;
 baselineRecipes=(await import(pathToFileURL(join(temporary,'src/pages/portfolio-generator/recipes.js')).href)).getRecipes;
}
import {getRecipes} from '../src/pages/portfolio-generator/recipes.js';
import { exposureVector as vector, exposureDistance as distance } from '../src/pages/portfolio-generator/exposures.js';
const sig=v=>Object.entries(v).sort().map(([id,pct])=>id+':'+pct).join(',');
const structure=v=>Object.keys(v).sort().join(',');
function measure(fn,profile,risk,recipesFor=getRecipes){
 let exact=0,near=0,recentNear=0,count=0,structs=[],unique=[],structuresByRecipe={},assetCounts={},familyCounts={},recipeCounts={};
 for(const initial of [20261003,123456,987654]){
  let seed=initial;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const history=[],seen=[],keys=new Set(),patterns=new Set();
  for(let i=0;i<100;i++){
   const p=fn(history,risk,profile),v=vector(p.selection);keys.add(sig(v));patterns.add(structure(v));
   for(const row of p.selection)assetCounts[row.id]=(assetCounts[row.id]??0)+1;
   for(const family of Object.keys(v))familyCounts[family]=(familyCounts[family]??0)+1;
   const id=p.recipeId??'baseline';recipeCounts[id]=(recipeCounts[id]??0)+1;(structuresByRecipe[id]??=new Set()).add(structure(v));
   if(seen.length){count++;const last=seen.at(-1);if(sig(last)===sig(v))exact++;if(distance(last,v)<=10)near++;if(seen.slice(-20).some(s=>distance(s,v)<=10))recentNear++;}
   history.push(p);seen.push(v);
  }
  structs.push(patterns.size);unique.push(keys.size);
 }
 const eligible=[...new Set(recipesFor(profile,risk).flatMap(r=>r.assets.flatMap(a=>a.idOptions??[a.id])))];
 return {assetCounts,familyCounts,recipeCounts,unusedAssets:eligible.filter(id=>!assetCounts[id]),rareAssets:eligible.filter(id=>(assetCounts[id]??0)>0&&assetCounts[id]<3),exact:exact/count,near:near/count,recentNear:recentNear/count,unique:unique.reduce((a,b)=>a+b)/3,structures:structs.reduce((a,b)=>a+b)/3,recipeStructures:Object.fromEntries(Object.entries(structuresByRecipe).map(([k,v])=>[k,[...v]]))};
}
const originalRandom=Math.random;
const results=[];
try {
for(const p of PROFILES)for(const risk of Object.keys(p.riskCombos)){
 const before=baseline ? measure(baseline,p.id,risk,baselineRecipes) : null,after=measure(generatePortfolio,p.id,risk);
 const recipes=getRecipes(p.id,risk);const collisions=[];
 for(let a=0;a<recipes.length;a++)for(let b=a+1;b<recipes.length;b++){
 const one=new Set(after.recipeStructures[recipes[a].id]),two=new Set(after.recipeStructures[recipes[b].id]);
 const common=[...one].filter(s=>two.has(s));if(common.length)collisions.push([recipes[a].id,recipes[b].id,common]);
 }
 results.push({profile:p.id,risk,before,after,collisions});
}
const total=key=>({before:baseline ? results.reduce((s,r)=>s+r.before[key],0)/results.length : null,after:results.reduce((s,r)=>s+r.after[key],0)/results.length});
console.log(JSON.stringify({method:{seeds:[20261003,123456,987654],drawsPerPairPerSeed:100,historyWindow:"entire-session",nearThreshold:10,recentWindow:20,baselineRef:baselineRef??null},summary:Object.fromEntries(['exact','near','recentNear','unique','structures'].map(k=>[k,total(k)])),results},null,2));

} finally { Math.random=originalRandom; if(temporary) await rm(temporary,{recursive:true,force:true}); }
