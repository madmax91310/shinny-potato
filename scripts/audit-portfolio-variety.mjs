// Mesure reproductible de la composition par familles, jamais du chevauchement de titres.
import {generatePortfolio,PROFILES} from '../src/pages/portfolio-generator/engine.js';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const baselineRef=process.argv.find(a=>a.startsWith('--baseline-ref='))?.split('=')[1];
let baseline, temporary;
if(baselineRef){
 temporary=await mkdtemp(join(tmpdir(),'portfolio-variety-'));
 for(const name of ['recipes','engine']){
  let source=execFileSync('git',['show',`${baselineRef}:src/pages/portfolio-generator/${name}.js`],{encoding:'utf8'});
  source=source.replace(/(from\s+["'])(\.[^"']+)(["'])/g, (_,start,path,end)=>start+new URL(path,new URL('../src/pages/portfolio-generator/',import.meta.url)).href+end);
  if(name==='engine')source=source.replace(new URL('../src/pages/portfolio-generator/recipes.js',import.meta.url).href,pathToFileURL(join(temporary,'recipes.mjs')).href);
  await writeFile(join(temporary,`${name}.mjs`),source);
 }
 baseline=(await import(pathToFileURL(join(temporary,'engine.mjs')).href)).generatePortfolio;
}
import {getRecipes} from '../src/pages/portfolio-generator/recipes.js';
import { exposureVector as vector, exposureDistance as distance } from '../src/pages/portfolio-generator/exposures.js';
const sig=v=>Object.entries(v).sort().map(([id,pct])=>id+':'+pct).join(',');
const structure=v=>Object.keys(v).sort().join(',');
function measure(fn,profile,risk){
 let exact=0,near=0,recentNear=0,count=0,structs=[],unique=[],structuresByRecipe={};
 for(const initial of [20261003,123456,987654]){
  let seed=initial;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const history=[],seen=[],keys=new Set(),patterns=new Set();
  for(let i=0;i<100;i++){
   const p=fn(history,risk,profile),v=vector(p.selection);keys.add(sig(v));patterns.add(structure(v));
   const id=p.recipeId??'baseline';(structuresByRecipe[id]??=new Set()).add(structure(v));
   if(seen.length){count++;const last=seen.at(-1);if(sig(last)===sig(v))exact++;if(distance(last,v)<=10)near++;if(seen.slice(-20).some(s=>distance(s,v)<=10))recentNear++;}
   history.push(p);if(history.length>40)history.shift();seen.push(v);
  }
  structs.push(patterns.size);unique.push(keys.size);
 }
 return {exact:exact/count,near:near/count,recentNear:recentNear/count,unique:unique.reduce((a,b)=>a+b)/3,structures:structs.reduce((a,b)=>a+b)/3,recipeStructures:Object.fromEntries(Object.entries(structuresByRecipe).map(([k,v])=>[k,[...v]]))};
}
const originalRandom=Math.random;
const results=[];
try {
for(const p of PROFILES)for(const risk of Object.keys(p.riskCombos)){
 const before=baseline ? measure(baseline,p.id,risk) : null,after=measure(generatePortfolio,p.id,risk);
 const recipes=getRecipes(p.id,risk);const collisions=[];
 for(let a=0;a<recipes.length;a++)for(let b=a+1;b<recipes.length;b++){
 const one=new Set(after.recipeStructures[recipes[a].id]),two=new Set(after.recipeStructures[recipes[b].id]);
 const common=[...one].filter(s=>two.has(s));if(common.length)collisions.push([recipes[a].id,recipes[b].id,common]);
 }
 results.push({profile:p.id,risk,before,after,collisions});
}
const total=key=>({before:baseline ? results.reduce((s,r)=>s+r.before[key],0)/results.length : null,after:results.reduce((s,r)=>s+r.after[key],0)/results.length});
console.log(JSON.stringify({method:{seeds:[20261003,123456,987654],drawsPerPairPerSeed:100,historyWindow:40,nearThreshold:10,recentWindow:20,baselineRef:baselineRef??null},summary:Object.fromEntries(['exact','near','recentNear','unique','structures'].map(k=>[k,total(k)])),results},null,2));

} finally { Math.random=originalRandom; if(temporary) await rm(temporary,{recursive:true,force:true}); }
