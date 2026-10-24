// Producer-side gap contract; the incident UI keeps its existing generic renderer.
import {TOOLS}from '../src/tools.js'
export function requiredDataGaps(inventory){
 const result=new Map(),labels=xs=>[...new Set((xs??[]).map(x=>TOOLS.find(t=>t.to===(typeof x==='string'?x:x.path))?.title??(typeof x==='string'?x:x.tool??x.path)).filter(Boolean))]
 const add=r=>result.set(r.id,r)
 for(const c of inventory.connections.filter(c=>c.requiresAction)){
  add({id:`gap:${c.type}:${c.id}:${c.field}`,name:c.name,aliases:[c.id],field:c.label??c.field,kind:'review',category:'automation-gap',impactScope:'asset',tools:labels(c.tools),sourceUrls:[...new Set([c.sourceUrl,...(c.configuredSourceUrls??[])].filter(Boolean))],checkedAt:c.checkedAt??null,lastSuccessAt:c.lastSuccessAt??null,attemptedAt:c.lastAttemptAt??null,asOf:c.asOf??null,cause:`Automatisation ou qualification incomplète : ${c.reason??c.nextAction??c.actionState}`,to:'/donnees-a-revoir'})
 }
 const proofGroups=new Map()
 for(const a of [...inventory.assets,...(inventory.consumerUsage?.externalAssets??[])])for(const f of a.fields){
  if(!['live','history','coverage'].includes(f.kind)||!['qualification-needed','scheduled-evidence','blocked'].includes(f.state))continue
  const covered=inventory.connections.some(c=>c.requiresAction&&c.id===a.id&&c.field===(f.coverageReference?.field??f.key.replace(/^coverage:/,'')))
  if(covered)continue
  if(f.state==='scheduled-evidence'){
   const producer=f.workflows?.[0]?.path??f.registry??'non-déclaré',key='proof:'+producer
   if(!proofGroups.has(key))proofGroups.set(key,{id:key,name:'Qualification des chaînes · '+producer.split('/').at(-1),field:'Preuves par champ et usage',kind:'review',category:'automation-proof-missing',impactScope:'collector',tools:[],aliases:[],members:[],sourceUrls:['https://github.com/madmax91310/shinny-potato/blob/master/reports/donnees-consolidees-2026-10-24/matrice-donnees-usages.csv'],checkedAt:null,lastSuccessAt:null,asOf:null,to:'/donnees-a-revoir'})
   const group=proofGroups.get(key);group.members.push(a.id+'|'+f.key);group.tools.push(...labels(f.consumers));group.aliases.push(a.id)
  }else add({id:`gap:usage:${a.id}:${f.key}`,name:a.name,aliases:[a.id],field:f.label,kind:'review',category:'automation-proof-missing',impactScope:'asset',tools:labels(f.consumers),sourceUrls:f.sourceUrls??[],checkedAt:f.checkedAt??null,lastSuccessAt:null,asOf:f.asOf??null,cause:`Qualification ou contrôle nécessaire : ${f.nextAction??f.reason??f.state}`,to:'/donnees-a-revoir'})
 }
 for(const group of proofGroups.values()){
  group.tools=[...new Set(group.tools)];group.aliases=[...new Set(group.aliases)];group.cause=`${group.members.length} champs ont une preuve de collecte déclarée ; la qualification complète par usage et sa publication restent détaillées dans la matrice datée du suivi. Ceci ne déclare pas ces valeurs fausses ou la source en panne.`;add(group)
 }
 return [...result.values()]
}
