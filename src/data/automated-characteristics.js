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
 for(const field of ['domicile','replicationMethod'])if(typeof c[field]==='string'&&c[field].trim()) {next[field]=c[field];next.automatedFields[field]=record.characteristicChecks?.[field]??source;}
 return next;
}
