import { frenchCharacteristic } from './french-characteristics.js';
const policies = new Map([
 ['Accumulating',['accumulating','Capitalisant']],['Capitalisation',['accumulating','Capitalisant']],
 ['Distributing',['distributing','Distribuant']],['Distribution',['distributing','Distribuant']],
 ['Capitalisation et/ou distribution',['capitalisation-and-or-distribution','Capitalisation et/ou distribution']],
 ['Capitalization',['accumulating','Capitalisant']],['Capitalisation and/or Distribution',['capitalisation-and-or-distribution','Capitalisation et/ou distribution']],
]);
export function applyAutomatedCharacteristics(previous,record) {
 const c=record?.characteristics;
 if(!c?.checkedAt)return previous;
 const source={url:c.sourceUrl??record.sourceUrl,checkedAt:c.checkedAt,...(c.asOf?{asOf:c.asOf}:{})};
 if(!source.url)return previous;
 const next={...previous,automatedFields:{}};
 const policy=policies.get(c.distribution);
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
 return next;
}
