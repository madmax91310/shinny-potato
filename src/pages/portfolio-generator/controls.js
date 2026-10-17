import { getAsset } from '../../data/portfolio-assets.js';
import { assetEditorial } from './asset-editorial.js';
import { exposureFamily, exposureVector, exposureDistance } from './exposures.js';

// Editorial construction limits, not estimates of a future maximum loss.
// Cumulative sleeve weights: a broad equity ETF is not counted as a pure sector.
export const CONSTRUCTION_LIMITS = {
  prudent:   { equity:30, sectors:15, crypto:0, leverage:0, options:0, speculative:0, property:25, highYield:20, commodities:40, technology:20 },
  defensif:  { equity:65, sectors:35, crypto:10, leverage:0, options:0, speculative:10, property:40, highYield:30, commodities:60, technology:40 },
  equilibre: { equity:85, sectors:40, crypto:20, leverage:0, options:0, speculative:20, property:50, highYield:40, commodities:65, technology:50 },
  dynamique: { equity:100,sectors:55, crypto:30, leverage:10,options:45,speculative:50, property:65, highYield:50, commodities:75, technology:75 },
  offensif:  { equity:100,sectors:70, crypto:60, leverage:15,options:65,speculative:75, property:80, highYield:70, commodities:85, technology:90 },
};
const equities = new Set(['single-stock','world-developed','world-all','world-imi','world-ex-us','us','us-equal','us-small','nasdaq','europe','country','region','small','factor','theme','emerging','dividend','property','options','leverage']);
const factorIds = new Set(['world-multifactor','world-midcap-equal']);
const technologyIds = new Set(['sect_tech','sect_tech_world_ishares','tech_europe','tech_europe_pea','sect_robotique','sect_cybersecurite','sect_cyber_lg','sect_ai_lg','ia-big-data-xtrackers','cloud-wisdomtree','semiconducteurs_monde','nasdaq100','nasdaq100_ishares','lqq']);
const financeIds = new Set(['sect_financieres','financieres_monde','europe-banks','europe-insurance']);
const broad = new Set(['world-developed','world-all','world-imi','us','us-equal','europe']);
export function assetKind(id) { return assetEditorial(getAsset(id)).kind; }
export function constructionMetrics(selection) {
  const out = Object.fromEntries(Object.keys(CONSTRUCTION_LIMITS.prudent).map(key=>[key,0]));
  for (const row of selection) {
    const kind=assetKind(row.id), pct=row.pct;
    if(equities.has(kind))out.equity+=pct;
    if(kind==='theme'&&!factorIds.has(row.id))out.sectors+=pct;
    if(['bitcoin','ethereum'].includes(kind)||row.id==='blockchain_ishares')out.crypto+=pct;
    if(kind==='leverage')out.leverage+=pct;
    if(kind==='options')out.options+=pct;
    if(['property','property-private'].includes(kind)||row.id==='europe-property')out.property+=pct;
    if(kind==='high-yield')out.highYield+=pct;
    if(['gold','silver','commodities','commodity'].includes(kind))out.commodities+=pct;
    if(technologyIds.has(row.id))out.technology+=pct;
  }
  out.speculative=out.crypto+out.leverage+out.options;
  return out;
}
export function constructionIssues(selection,risk) {
  const limits=CONSTRUCTION_LIMITS[risk];
  if(!limits)return [];
  const metrics=constructionMetrics(selection);
  return Object.entries(limits).filter(([key,limit])=>metrics[key]>limit+1e-8).map(([key,limit])=>({key,weight:metrics[key],limit}));
}
export function overlapNotes(selection) {
  const notes=[], metrics=constructionMetrics(selection);
  if(selection.some(s=>broad.has(assetKind(s.id))) && metrics.sectors)
    notes.push('Les secteurs ajoutés peuvent déjà être présents dans l’indice large : ces lignes renforcent une conviction.');
  const tech=selection.filter(s=>technologyIds.has(s.id));
  if(tech.length>1)notes.push(`${metrics.technology} % sont placés dans des lignes technologiques ou Nasdaq dédiées. Leurs entreprises et leurs risques peuvent se recouper ; le reste du portefeuille peut aussi détenir de la technologie.`);
  if(selection.some(s=>financeIds.has(s.id))&&selection.some(s=>assetKind(s.id)==='dividend'))
    notes.push('Les fonds à dividendes peuvent déjà détenir des banques et assurances : la poche financière peut accentuer ce biais.');
  if(selection.some(s=>s.id==='blockchain_ishares')&&selection.some(s=>['bitcoin','ethereum'].includes(assetKind(s.id))))
    notes.push('Les entreprises blockchain sont des actions, mais leur activité peut dépendre du marché crypto : ce complément ne constitue pas une protection indépendante.');
  return notes;
}
export function coreFamily(selection) {
  const cores=selection.filter(s=>broad.has(assetKind(s.id))||['world-imi','world-ex-us'].includes(assetKind(s.id))).sort((a,b)=>b.pct-a.pct);
  return cores.length ? (cores[0].id === 'ftse_allworld_vanguard' ? 'FTSE All-World' : ['msci_acwi','msci_acwi_ishares','pea_global_amundi'].includes(cores[0].id) ? 'MSCI ACWI' : exposureFamily(cores[0].id)) : 'sans-socle-large';
}
export function diversityReport(history) {
  const groups=new Map();
  for(const p of history.filter(p=>p.mode==='auto')) {
    const key=`${p.profileId}/${p.riskId}`;
    const g=groups.get(key)??{key,profileId:p.profileId,riskId:p.riskId,count:0,recipes:{},assets:{},families:{},cores:{},sectorFamilies:{},nearRepeats:0,vectors:[]};
    g.count++;
    if(p.recipeId)g.recipes[p.recipeId]=(g.recipes[p.recipeId]??0)+1;
    for(const id of new Set(p.selection.map(s=>s.id)))g.assets[id]=(g.assets[id]??0)+1;
    for(const family of new Set(p.selection.map(s=>exposureFamily(s.id))))g.families[family]=(g.families[family]??0)+1;
    for(const family of new Set(p.selection.filter(s=>assetKind(s.id)==='theme'&&!factorIds.has(s.id)).map(s=>exposureFamily(s.id))))g.sectorFamilies[family]=(g.sectorFamilies[family]??0)+1;
    const core=coreFamily(p.selection);g.cores[core]=(g.cores[core]??0)+1;
    const vector=exposureVector(p.selection);
    if(g.vectors.some(old=>exposureDistance(vector,old)<10))g.nearRepeats++;
    g.vectors.push(vector);if(g.vectors.length>20)g.vectors.shift();groups.set(key,g);
  }
  return [...groups.values()].map(({vectors:_vectors,...g})=>({...g,distinctAssets:Object.keys(g.assets).length,distinctFamilies:Object.keys(g.families).length,distinctCores:Object.keys(g.cores).length}));
}
