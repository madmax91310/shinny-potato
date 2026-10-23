import { frenchCharacteristic } from './french-characteristics.js';
const policies = new Map([
 ['Accumulating',['accumulating','Capitalisant']],['Capitalisation',['accumulating','Capitalisant']],
 ['Distributing',['distributing','Distribuant']],['Distribution',['distributing','Distribuant']],
 ['Capitalisation et/ou distribution',['capitalisation-and-or-distribution','Capitalisation et/ou distribution']],
 ['Capitalization',['accumulating','Capitalisant']],['Capitalisation and/or Distribution',['capitalisation-and-or-distribution','Capitalisation et/ou distribution']],
 ['Capitalizing',['accumulating','Capitalisant']],
].map(([label,value])=>[label.toLowerCase(),value]));
export function applyAutomatedCharacteristics(previous,record) {
 const count=record?.metrics?.numHoldings;
 if(Number.isInteger(count?.value) && count.value>0 && /^\d{4}-\d{2}-\d{2}$/.test(count.asOf??'') && count.sourceUrl && (!previous.positionsAsOf || count.asOf>=previous.positionsAsOf)) {
  previous={...previous,positionsLabel:`${count.value.toLocaleString('fr-FR')} positions hors liquidités et dérivés au ${count.asOf.split('-').reverse().join('/')}`,positionsAsOf:count.asOf,positionsSource:{url:count.sourceUrl,checkedAt:count.checkedAt,scope:count.scope}};
 }
 const c=record?.characteristics;
 if(!c?.checkedAt)return previous;
 const source={url:c.sourceUrl??record.sourceUrl,checkedAt:c.checkedAt,...(c.asOf?{asOf:c.asOf}:{})};
 if(!source.url)return previous;
 const next={...previous,automatedFields:{}};
 const policy=policies.get(typeof c.distribution==='string'?c.distribution.trim().toLowerCase():null);
 if(policy){[next.incomePolicy,next.distribution]=policy;next.automatedFields.distribution=record.characteristicChecks?.distribution??source;}
 // Keep display wording aligned with the current structured observation.
 for(const field of ['domicile','replicationMethod'])if(typeof c[field]==='string'&&c[field].trim()) {
  const value=c[field];
  // Normalize the issuer's equivalent labels to the shared display vocabulary.
  next[field]=field!=='replicationMethod'?value:/^(Physical \()?Optimised\)?$/i.test(value)?'Physical (Optimised sampling)':/^(Physical \()?Replicated\)?$/i.test(value)?'Physical (Full replication)':value;
  next.automatedFields[field]=record.characteristicChecks?.[field]??source;
 }
 if((next.automatedFields.domicile || next.automatedFields.replicationMethod) && next.domicile && next.replicationMethod) {
  const annotations=(previous.location??'').split(/,\s*/).slice(1).filter(part=>!/r[eé]plication|physical|physique|synthet|synth[eé]|sampling|optimis|[ée]chantill|sampled|swap|gestion active/i.test(part));
  next.location=[frenchCharacteristic(next.domicile),frenchCharacteristic(next.replicationMethod),...annotations].filter(Boolean).join(', ');
 }
 if(typeof c.currencyHedge==='boolean'){
  next.currencyHedge=c.currencyHedge;next.automatedFields.currencyHedge=record.characteristicChecks?.currencyHedge??source;
  // A newly observed boolean replaces old prose too. It does not identify the hedge currency.
  if(next.location)next.location=[...next.location.split(/,\s*/).filter(part=>!/couvert|hedg|risque de change/i.test(part)),c.currencyHedge?'couverture de change':'sans couverture de change'].join(', ');
 }
 return next;
}

