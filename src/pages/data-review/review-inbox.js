import registry from '../../data/automation-workflows.json' with {type:'json'}
import retired from '../../data/retired-automations.json' with {type:'json'}
export const ISSUE_KINDS={failure:'Panne ou anomalie',connection:'Donnée nécessaire non raccordée',qualification:'Qualification manquante',waiting:'Publication normalement attendue','not-applicable':'Non applicable ou archive',editorial:'Revue éditoriale',monitoring:'Surveillance non démontrée',history:'Historique et résolutions enregistrées'}
export function projectionHealth(inventory,manifest){
 if(!inventory||!manifest)return null
 return /^[a-f0-9]{40}$/.test(inventory.inventoryBlobSha??'')&&inventory.inventoryBlobSha===manifest.files?.['public/data/data-automation-inventory.json']?null:'Projection des incidents différente de l’inventaire publié : régénérer et republier la projection. Les diagnostics conservés ne certifient pas les données actuellement enregistrées.'
}
const normal=new Set(['current','connected','reference','not-required','excluded'])
export function decodeReviewProjection(inventory){
 if(!inventory?.fieldStrings)return inventory
 const strings=inventory.fieldStrings
 if(!Array.isArray(strings)||strings.some(s=>typeof s!=='string')||!Array.isArray(inventory.assets)||inventory.assets.some(a=>!a||!Array.isArray(a.fields)))throw Error('Dictionnaire de champs de projection invalide')
 const decode=value=>{
  if(Array.isArray(value))return value.map(decode)
  if(value&&typeof value==='object'&&Object.hasOwn(value,'$text')){
   if(Object.keys(value).length!==1||!Number.isInteger(value.$text)||value.$text<0||value.$text>=strings.length)throw Error('Référence de champ de projection invalide')
   return strings[value.$text]
  }
  return value
 }
 const usage=inventory.consumerUsage
 const consumerUsage=usage?.requiredRowsOnly?{...usage,requiredRowsOnly:undefined,tools:usage.tools.map(t=>({...t,rows:t.rows.map(r=>{
  if(r.required!==undefined&&r.required!==true)throw Error('Ligne non requise dans le périmètre des usages requis')
  return {...r,required:true}
 })}))}:usage
 return {...inventory,consumerUsage,fieldStrings:undefined,assets:inventory.assets.map(a=>({...a,fields:a.fields.map(f=>Object.fromEntries(Object.entries(f).map(([k,v])=>[k,decode(v)])))}))}
}
export function monitorHealth(status,now=Date.now()){
 const m=status?.monitoring
 if(status?.schemaVersion!==1||!status.workflows||Array.isArray(status.workflows)||!m||m.schemaVersion!==1||!m.active||Array.isArray(m.active)||typeof m.active!=='object'||!Array.isArray(m.resolved)||m.resolved.some(r=>!r||typeof r.id!=='string')||m.retired!=null&&(!Array.isArray(m.retired)||m.retired.some(r=>!r||typeof r.id!=='string'))||Object.values(m.active).some(r=>!r||typeof r.id!=='string'||typeof r.name!=='string'||!Array.isArray(r.tools??[])))return {ok:false,reason:'Moniteur absent ou invalide : l’absence d’alerte ne démontre aucun succès.'}
 const age=now-Date.parse(m.checkedAt)
 if(!Number.isFinite(age)||age<0||age>2*3600000)return{ok:false,reason:'Moniteur périmé ou date invalide : les derniers incidents connus sont conservés, l’état actuel reste à vérifier.'}
 return{ok:true,reason:'Dernier contrôle du moniteur : '+m.checkedAt}
}
export function issueKind(state){
 if(['waiting-first-year','waiting-publication','scheduled','soon'].includes(state))return'waiting'
 if(['not-applicable','archive','archived','outside-equity-scope'].includes(state))return'not-applicable'
 if(['connector-needed','tracked-index-needed','lookthrough-needed','missing','not-published'].includes(state))return'connection'
 if(['collection-error','source-conflict','invalid-date','future-date','publication-old','check-overdue'].includes(state))return'failure'
 return'qualification'
}
const phase=kind=>({connection:'Raccordement',qualification:'Qualification',waiting:'Calendrier',editorial:'Revue éditoriale',monitoring:'Surveillance'}[kind]??'Donnée / collecte')
export function buildInbox({status,inventory,coverage,financial,review,failures={},now=Date.now()}){
 inventory=decodeReviewProjection(inventory)
 const consumerTools=new Map(Object.entries(inventory?.fieldConsumers??{}).map(([key,names])=>[key,inventory.toolNames?names.map(i=>inventory.toolNames[i]):names]))
 for(const t of inventory?.consumerUsage?.tools??[])for(const r of t.rows??[])if(r.required){const key=r.id+':'+r.key;consumerTools.set(key,[...new Set([...(consumerTools.get(key)??[]),t.name??t.path])])}
 const rows=[],add=r=>{const item={...r,to:Object.values(retired.workflows).some(v=>r.to?.startsWith(v.tool))?undefined:r.to,stage:r.stage??phase(r.kind),tools:Array.isArray(r.tools)?r.tools:[],sourceUrls:Array.isArray(r.sourceUrls)?r.sourceUrls.filter(u=>typeof u==='string'):[]};for(const k of ['name','field','cause','asOf','checkedAt','attemptedAt','lastSuccessAt','asset'])if(item[k]!=null&&typeof item[k]!=='string'){item[k]='Format invalide : '+JSON.stringify(item[k]);item.kind='monitoring'};rows.push(item)}
 const health=monitorHealth(status,now)
 if(!health.ok||failures.monitor)add({id:'health:monitor',name:'Système de surveillance',field:'État du moniteur',kind:'monitoring',cause:failures.monitor??health.reason})
 for(const[key,cause]of Object.entries(failures))if(key!=='monitor')add({id:'health:'+key,name:'Lecture du bilan · '+key,field:'Preuve attendue',kind:'monitoring',cause})
 for(const[id,c]of Object.entries(registry)){
  if(c.reportCoverage==='job-only')add({id:'coverage:'+id,name:c.name,field:'Contrat de remontée individuelle',kind:'qualification',cause:'Ce producteur ne fournit pas de rapport individuel contractuel ; la couverture de chaque champ reste à démontrer.',tools:c.tools,workflow:id})
  const w=status?.workflows?.[id]
  if(status&&(!w||!Number.isFinite(Date.parse(w.completedAt))))add({id:'unobserved:'+id,name:c.name,field:'Exécution',kind:'monitoring',cause:'Aucune exécution terminée démontrée par ce bilan.',tools:c.tools,workflow:id})
 }
 for(const r of Object.values(status?.monitoring?.active??{})){
  if(!r||typeof r.id!=='string'||Object.hasOwn(retired.workflows,r.workflow??''))continue
  const kind=['unobserved','overdue','monitoring'].includes(r.kind)?'monitoring':r.kind==='qualification'||r.kind==='review'?'qualification':'failure'
  const match=r.id.match(/^field:(?:gap:)?([^:]+):([^:]+):([^:]+)$/)
  const metadata=String(r.dataId??'').match(/^([A-Z]{2}[A-Z0-9]{10}):([^:]+)$/),holdings=String(r.dataId??'').match(/^dca-holdings:([A-Z]{2}[A-Z0-9]{10})$/)
  const usageKey=match?`${match[2]}:coverage:${match[3]}`:metadata?`${metadata[1]}:coverage:${metadata[2]}`:holdings?`${holdings[1]}:coverage:completeHoldings`:null
  add({...r,tools:consumerTools.get(usageKey)??r.tools,collectorTools:r.tools,kind,stage:r.kind==='publication'?'Publication':/Commit validated|Enregistrement/i.test(r.cause??'')?'Enregistrement':r.kind==='checks'?(/build|projection|génér/i.test(r.cause??'')?'Génération':'Validation'):phase(kind),key:match?`${match[1]}:${match[2]}:${match[3]}`:r.id.startsWith('field:gap:usage:')?r.id.slice('field:gap:'.length):metadata?`instrument:${metadata[1]}:${metadata[2]}`:holdings?`instrument:${holdings[1]}:completeHoldings`:r.id,attemptedAt:r.attemptedAt,recovery:status?.recovery?.[r.workflow]})
 }
 for(const r of status?.monitoring?.resolved??[])if(r&&typeof r.id==='string')add({...r,id:'history:'+r.id+':'+r.resolvedAt,kind:'history',field:r.field??'Champ historique',stage:'Historique',cause:(r.resolutionEvidence?'Résolution documentée':'Retour enregistré ; preuve historique à qualifier')+' · '+r.resolvedAt+' · '+r.cause})
 for(const r of status?.monitoring?.retired??[])if(r&&typeof r.id==='string')add({...r,id:'retired:'+r.id+':'+r.retiredAt,kind:'not-applicable',stage:'Retrait de périmètre',field:r.field??'Champ retiré',cause:r.retirementReason??'Retrait enregistré ; aucune réparation déduite'})
 for(const r of inventory?.backlog??[])add({id:'connection:'+r.type+':'+r.id+':'+r.field,key:`${r.type}:${r.id}:${r.field}`,name:r.name,asset:r.id,field:r.label??r.field,kind:issueKind(r.actionState),cause:r.reason??r.nextAction,action:r.nextAction,asOf:r.asOf,checkedAt:r.checkedAt,attemptedAt:r.lastAttemptAt,lastSuccessAt:r.lastSuccessAt,tools:consumerTools.get(`${r.id}:coverage:${r.field}`)??r.tools??[],sourceUrls:[r.sourceUrl,...(r.configuredSourceUrls??[])].filter(Boolean),scope:r.scope,currency:r.currency,method:r.method})
 for(const r of coverage?.rows??[]){if(normal.has(r.state))continue;add({id:'coverage:'+r.type+':'+r.id+':'+r.field,key:`${r.type}:${r.id}:${r.field}`,name:r.name,asset:r.id,field:r.label??r.field,kind:issueKind(r.state),cause:r.reason??r.diagnostic?.reason??r.state,asOf:r.asOf,checkedAt:r.checkedAt,tools:consumerTools.get(`${r.id}:coverage:${r.field}`)??r.tools??[],sourceUrls:r.sourceUrl?[r.sourceUrl]:[],scope:r.scope,currency:r.currency})}
 const fieldMap=new Map([...(inventory?.assets??[]),...(inventory?.consumerUsage?.externalAssets??[])].flatMap(a=>(a.fields??[]).map(f=>[`${a.id}:${f.key}`,{...f,name:a.name}])) )
 for(const tool of inventory?.consumerUsage?.tools??[])for(const r of tool.rows??[]){
  if(!r.required||r.state==='connected'||r.state==='not-required')continue
  const f=fieldMap.get(`${r.id}:${r.key}`)??{}
  add({id:`usage:${tool.path}:${r.id}:${r.key}`,key:`usage:${r.id}:${r.key}`,name:f.name??r.id,asset:r.id,field:f.label??r.key,kind:r.state==='blocked'?'connection':'qualification',stage:'Consommation',cause:f.reason??f.action??'Contrat d’usage requis non confirmé',action:f.nextAction,tools:[tool.name??tool.path],asOf:f.asOf,checkedAt:f.checkedAt,sourceUrls:f.sourceUrls??[],scope:f.scope,currency:f.currency})
 }
 for(const r of financial?.rows??[])if(r.open||r.residualOpen)add({id:'financial:'+r.id,name:r.name,asset:r.isin,field:'Rapprochement financier '+r.year,kind:'qualification',stage:'Calcul',cause:r.reason,action:r.missingPiece,impact:r.currentConsumer?.secured,tools:['Calculateur','Performance depuis','Classements','Duels'],sourceUrls:[...(r.sourceUrls??[]),r.proof,r.resolutionEvidence].filter(Boolean),asOf:String(r.year),to:'/donnees-a-revoir'})
 for(const r of review?.items??[])add({id:'editorial:'+r.id,name:r.name,field:r.field,kind:'editorial',cause:r.reason,checkedAt:r.checkedAt,asOf:r.metadata?.asOf,tools:r.tools,sourceUrls:r.urls,action:r.nextReviewAt?'Prochaine revue : '+r.nextReviewAt:null,to:r.to})
 const map=new Map()
 for(const r of rows){const key=r.key??r.id;if(!map.has(key))map.set(key,{...r,id:key,signals:[],tools:[],sourceUrls:[]});const x=map.get(key);x.signals.push(r);for(const k of ['asset','asOf','checkedAt','lastSuccessAt','attemptedAt','currency','scope','method','action','impact','to','runUrl','recovery'])if(x[k]==null&&r[k]!=null)x[k]=r[k];x.tools=[...new Set([...x.tools,...r.tools])];x.sourceUrls=[...new Set([...x.sourceUrls,...r.sourceUrls])];if(r.kind==='failure'&&x.kind!=='failure'){x.kind='failure';x.cause=r.cause;x.stage=r.stage;x.action=r.action??x.action}}
 const priorities={monitoring:0,failure:1,qualification:2,connection:3,editorial:4,waiting:5,'not-applicable':6,history:7}
 const issues=[...map.values()].sort((a,b)=>(priorities[a.kind]??9)-(priorities[b.kind]??9)||b.tools.length-a.tools.length||String(a.name).localeCompare(String(b.name),'fr')||a.id.localeCompare(b.id))
 return{issues,health,signals:rows.length,examinedFields:coverage?.rows?.length??null,requiredUsages:inventory?.consumerUsage?.summary?.required??inventory?.summary?.consumerUsage?.required??null,workflows:Object.keys(registry).length}
}
export function inboxDiagnostic(row){
 return row.signals.map(r=>[`Incident : ${r.id}`,`Actif : ${r.name} · ${r.asset??r.dataId??'identifiant non documenté'}`,`Champ : ${r.field}`,`Classe : ${ISSUE_KINDS[r.kind]}`,`Étape : ${r.stage}`,`Cause : ${r.cause??'Non documentée'}`,`Impact : ${r.impact??'Le signal concerne ce champ et ses usages déclarés ; les autres capacités restent distinctes.'}`,`Outils déclarant ce champ : ${r.tools.join(', ')||'Non documentés'}`,`Périmètre du collecteur : ${(r.collectorTools??[]).join(', ')||'Non documenté'}`,`Dernière donnée valide : ${r.asOf??'Non documentée'}`,`Dernier contrôle réussi : ${r.lastSuccessAt??r.checkedAt??'Non documenté'}`,`Dernière tentative : ${r.attemptedAt??'Non documentée'}`,`Fin de l’exécution rapportée : ${r.completedAt??'Non documentée'}`,`Reprise : ${r.recovery?.status??'Intervention / contrôle du producteur nécessaire'}`,`Action : ${r.action??'Consulter la source et l’exécution ; aucune résolution sans preuve.'}`,`Sources : ${r.sourceUrls.join(' ; ')||'Non documentées'}`,`Exécution : ${r.runUrl??'Non documentée'}`,`Preuve du rapport : ${JSON.stringify(r.evidence??r.resolutionEvidence??null)}`,`Champs du groupe : ${JSON.stringify(r.members??[])}`,`Historique des tentatives : ${JSON.stringify(r.observations??[])}`].join('\n')).join('\n\n')
}

export const MONITOR_RUNS_URL='https://api.github.com/repos/madmax91310/shinny-potato/actions/workflows/automation-status.yml/runs?branch=master&status=completed&per_page=10'
export function monitorExecutionHealth(payload){
 if(!Array.isArray(payload?.workflow_runs))return 'Contrôle indépendant du moniteur invalide ou indisponible.'
 const runs=payload.workflow_runs.filter(r=>r.head_branch==='master'&&['schedule','workflow_run','workflow_dispatch','push'].includes(r.event)&&r.status==='completed'&&!['skipped','cancelled','neutral'].includes(r.conclusion)).sort((a,b)=>b.id-a.id)
 if(!runs.length)return 'Aucune exécution du moniteur démontrée par le contrôle indépendant.'
 const r=runs[0]
 return r.conclusion==='success'?null:`Dernière exécution de la surveillance en échec (${r.conclusion}) : ${r.html_url}. Le dernier bilan connu ne prouve pas son rétablissement.`
}
