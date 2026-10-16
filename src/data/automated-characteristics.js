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
 // Preserve the original location sentence; translated display of the structured
 // domicile/replication is handled separately, without losing hedge annotations.
 for(const field of ['domicile','replicationMethod'])if(typeof c[field]==='string'&&c[field].trim()) {
  const value=c[field];
  // Normalize the issuer's equivalent labels to the shared display vocabulary.
  next[field]=field!=='replicationMethod'?value:/^(Physical \()?Optimised\)?$/i.test(value)?'Physical (Optimised sampling)':/^(Physical \()?Replicated\)?$/i.test(value)?'Physical (Full replication)':value;
  next.automatedFields[field]=record.characteristicChecks?.[field]??source;
 }
 return next;
}
// A generic physical statement does not contradict either full replication or
// sampling in a separately sourced description. Only compare published detail.
export function replicationContradictsLocation(location, method) {
 location = location.replace(/\(pas[^)]*\)/gi, '');
 const physical = /physical|physically|physique/i.test(method);
 const synthetic = /synthetic|swap|indirect/i.test(method);
 if (/physique/i.test(location) && synthetic || /synthétique|swap/i.test(location) && physical && !synthetic) return true;
 const full = /full|replicated/i.test(method);
 const sampled = /sampling|sampled|optimised|optimized/i.test(method);
 return /intégrale/i.test(location) && sampled || /optimisée|échantillonnage/i.test(location) && full;
}
