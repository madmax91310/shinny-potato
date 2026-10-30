import {sourceConditions} from './lib/source-conditions.mjs'
import {connectNativeIndexCandidates} from './lib/native-index-source-candidates.mjs'
import DYNAMIC from '../src/data/dynamic-data-consumers.json' with {type:'json'}
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DATA_CATALOG } from '../src/data/catalog.js'
import { registryQualification, fieldQualification, qualifyCoverage } from './lib/data-qualification.mjs'
import {catalogCoverage} from './lib/catalog-coverage.mjs'
import {assetAutomation,assetAutomationCsv} from './lib/asset-automation.mjs'
import {consumerUsage} from './lib/consumer-usage.mjs'
import {externalConsumerAssets} from './lib/external-consumer-assets.mjs'
import {connectConsumerFields} from './lib/consumer-field-evidence.mjs'
import {collectObservationsSync} from './update-editorial-radar.mjs'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import { marketCalendarPerformance } from '../src/data/market-calendar-performance.js'
import exposureSleeves from '../src/data/exposure-sleeves.json' with {type:'json'}
import { buildAssetFieldReport } from './report-asset-fields.mjs'
import metadata from '../src/data/automated-instrument-metadata.json' with {type:'json'}
import attempts from '../src/data/instrument-metadata-status.json' with {type:'json'}
import sourceHoldings from '../src/data/dca-complete-holdings.json' with {type:'json'}
import {references as holdingReferences} from '../src/pages/dca-profiles/records.js'
import {ASSETS as holdingAssets} from '../src/pages/dca-profiles/data.js'
import {holdingsConsumerQualifications,applyHoldingsConsumerQualification} from './lib/holdings-consumer-qualification.mjs'
const ROOT=fileURLToPath(new URL('../',import.meta.url))
const read=p=>readFileSync(resolve(ROOT,p),'utf8')
function files(dir){return readdirSync(resolve(ROOT,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(`${dir}/${e.name}`):[`${dir}/${e.name}`])}
const sourceFiles=files('src').filter(p=>/\.(?:m?js|jsx|json)$/.test(p))
const known=new Set(sourceFiles)
export function importsOf(path,text=read(path)){
 const result=[]
 for(const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)['"]([^'"]+)['"]/g)){
  if(!match[1].startsWith('.'))continue
  const base=relative(ROOT,resolve(ROOT,dirname(path),match[1]))
  const found=[base,base+'.js',base+'.jsx',base+'/index.js'].find(p=>known.has(p))
  if(found)result.push(found)
 }
 return [...new Set(result)]
}
const graph=new Map(sourceFiles.filter(p=>!p.endsWith('.json')).map(p=>[p,importsOf(p)]))
function dependencies(path,seen=new Set()){
 if(seen.has(path))return seen
 seen.add(path)
 for(const child of graph.get(path)??[])dependencies(child,seen)
 return seen
}
export function workflowInfo(path,text=read(path)){
 const outputs=[]
 // Only the explicitly validated commit allowlist establishes a writer. PR path
 // filters and a mention in a test do not establish automatic publication.
 for(const line of text.split('\n').filter(l=>l.includes('bash scripts/commit-validated-data.sh '))) {
  for(const m of line.matchAll(/(?:src|public)\/[A-Za-z0-9_./*?-]+\.(?:json|js)/g))outputs.push(m[0])
  for(const m of line.matchAll(/(?:^|\s)(data\/[A-Za-z0-9_./*-]+)(?=\s|$)/g))outputs.push(m[1].endsWith('/')?m[1]+'*':m[1]+'/*')
 }
 return {path,name:/^name:\s*(.+)$/m.exec(text)?.[1]??path,
  crons:[...text.matchAll(/\bcron:\s*['"]([^'"]+)['"]/g)].map(m=>m[1]),
  collectors:[...new Set([...text.matchAll(/\b(?:python3?|node)\s+(scripts\/[\w./-]+\.(?:py|mjs))/g)].map(m=>m[1]))],
  outputs:[...new Set(outputs)],monitored:JSON.parse(read('src/data/automation-workflows.json'))[path.split('/').at(-1)]!=null}
}
function matches(path,pattern){return new RegExp('^'+pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$').test(path)}
function numericPaths(value,path='',out=new Set()){
 if(typeof value==='number'&&Number.isFinite(value))out.add(path||'$')
 else if(value&&typeof value==='object')for(const [key,child] of Object.entries(value))numericPaths(child,path?`${path}.${Array.isArray(value)?'[]':key}`:key,out)
 return [...out]
}
function jsonDatasetInfo(path){
 const value=JSON.parse(read(path)),schema=new Set(),sources=new Set(),checks=new Set(),observations=new Set();let numericLeaves=0
 function visit(node,p=''){
  if(node&&typeof node==='object'){
   const dynamic=!Array.isArray(node)&&p===''&&Object.keys(node).length>20
   for(const [key,child]of Object.entries(node)){
    const segment=Array.isArray(node)?'[]':/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(key)?'{isin}':/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(key)?'{period}':dynamic?'{record}':key
    visit(child,p?`${p}.${segment}`:segment)
    if(typeof child==='string'){
     if((/url|source/i.test(key)||/url|source/i.test(p.split('.').at(-1)))&&/^https?:\/\//.test(child))sources.add(child)
     if(/^checkedAt$/.test(key)&&/^\d{4}-\d{2}-\d{2}/.test(child))checks.add(child)
     if(/^(asOf|periodEnd|effectiveAt|publishedAt)$/.test(key)&&/^\d{4}-\d{2}-\d{2}/.test(child))observations.add(child)
    }
   }
  }else{schema.add(p);if(typeof node==='number'&&Number.isFinite(node))numericLeaves++}
 }
 visit(value)
 const range=set=>{const a=[...set].sort();return a.length?{oldest:a[0],latest:a.at(-1)}:null}
 return {path,rootKind:Array.isArray(value)?'array':typeof value,rootEntries:value&&typeof value==='object'?Object.keys(value).length:1,numericLeaves,schemaPaths:[...schema].sort(),sourceUrls:[...sources].sort(),checkDateRange:range(checks),observationDateRange:range(observations),method:'Schéma exhaustif du fichier enregistré, sans échantillonnage. Les plages de dates peuvent inclure des archives ; elles ne certifient aucune fraîcheur individuelle. Un nombre peut être une donnée, un identifiant ou une hypothèse.'}
}
export function peaInventory(records=metadata,statuses=attempts){
 return Object.keys(records).sort().map(isin=>{
  const proof=records[isin].pea, status=statuses[isin]??{}
  const conflicts=(status.errors??[]).filter(e=>e.qualificationRequired&&e.field==='pea')
  const qualified=!conflicts.length&&typeof proof?.value==='boolean'&&!!proof.sourceUrl&&!!proof.checkedAt&&/^[a-f0-9]{64}$/.test(proof.sha256??'')
  const diagnostic=status.fields?.pea??{}
  return {isin,qualified,value:qualified?proof.value:null,
   state:conflicts.length?'source-conflict':qualified?(diagnostic.status==='retained'?'retained':'qualified'):'unqualified',
   checkedAt:qualified?proof.checkedAt:null,sourceUrl:qualified?proof.sourceUrl:null,sha256:qualified?proof.sha256:null,
   lastAttemptAt:diagnostic.lastAttemptAt??status.checkedAt??null,
   sources:conflicts.flatMap(e=>e.sources??[]),
   failures:(status.errors??[]).filter(e=>!e.field||e.field==='pea').map(({sourceUrl,error})=>({sourceUrl,error})),
   nextAction:conflicts.length?'Obtenir une clarification explicite de l’émetteur ou un accord des sources contradictoires.':qualified?'Renouvellement par le collecteur quotidien.':'Qualifier une déclaration PEA explicite liée à cet ISIN ; absence et tiret restent inconnus.'}
 })
}
export function buildDataAutomationInventory(){
 const workflows=files('.github/workflows').filter(p=>p.endsWith('.yml')).map(p=>workflowInfo(p)).filter(w=>w.crons.length||w.outputs.length)
 const writers=path=>workflows.filter(w=>w.outputs.some(pattern=>matches(path,pattern)))
 const consumers=sourceFiles.filter(p=>p.startsWith('src/pages/')&&/\.(?:jsx|js)$/.test(p)).map(path=>({path,deps:dependencies(path)}))
 const registryFiles=sourceFiles.filter(p=>p.startsWith('src/data/')||p.startsWith('src/pages/')&&p.endsWith('.json')||/^src\/pages\/[^/]+\/(?:data|theses|engine)\.js$/.test(p))
 const registries=registryFiles.map(path=>{
  const deps=[...dependencies(path)],direct=writers(path)
  const upstream=[...new Set(deps.flatMap(p=>writers(p).map(w=>w.path)))]
  const dynamic=DYNAMIC.bindings.filter(binding=>matches(path,binding.pattern))
  const dynamicConsumers=new Set(dynamic.flatMap(binding=>binding.consumers))
  const users=consumers.filter(c=>c.deps.has(path)||[...dynamicConsumers].some(d=>c.path===d||c.deps.has(d))).map(c=>c.path)
  return {path,mode:direct.some(w=>w.crons.length)?'scheduled-output':direct.length?'event-output':upstream.length?'mixed-or-derived':'manual-or-editorial',
   dynamicBindings:dynamic,runtimeConsumers:users,buildConsumers:[...dynamicConsumers].filter(p=>p.startsWith('scripts/')),writers:direct.map(w=>w.path),upstreamWorkflows:upstream,dependencies:deps.filter(p=>p!==path),consumers:[...new Set([...users,...dynamicConsumers])],
   catalogFields:DATA_CATALOG.reduce((n,r)=>n+r.fields.filter(f=>f.registry===path).length,0),
   action:upstream.length||direct.length?'Qualifier la couverture au niveau de chaque champ ; vérifier le dernier succès dans Données à revoir.':'Décider si les valeurs sont éditoriales, hypothèses de simulation ou chiffres à raccorder ; aucun statut automatique déduit du nom du fichier.'}
 })
 for(const registry of registries)registry.qualification=registryQualification(registry)
 const registryMap=new Map(registries.map(r=>[r.path,r]))
 const coverage=buildAssetFieldReport(),pea=peaInventory()
 const coverageMap=new Map(coverage.rows.map(row=>[`${row.id}:${row.field}`,row]))
 const holdingsStatus=JSON.parse(read('src/data/dca-holdings-status.json'))
 const holdingSources={...JSON.parse(read('scripts/dca-complete-holdings-sources.json')),...JSON.parse(read('scripts/generated-holdings-sources.json'))}
 const fields=DATA_CATALOG.flatMap(record=>record.fields.map((field,index)=>{
  const registry=registryMap.get(field.registry),evidence=field.metadata??{}
  const nature=fieldQualification(field,record)
  const matchingCoverage=catalogCoverage(field,record,coverageMap,AUTOMATED_ETF)
  return {id:record.id,type:record.type,name:record.name,field:field.label,fieldIndex:index,registry:field.registry,
   consumers:record.consumers.filter(c=>c.path!=='/impact-frais'||['Identité','Frais annuels (%)'].includes(field.label)),mode:registry?.mode??'unmapped',upstreamWorkflows:registry?.upstreamWorkflows??[],
   qualification:'source-configuration-only',nature,valuePresent:field.value!==null&&field.value!==undefined&&(!Array.isArray(field.value)||field.value.length>0),
   coverageReference:matchingCoverage?{id:matchingCoverage.id,field:matchingCoverage.field,state:matchingCoverage.state,checkedAt:matchingCoverage.checkedAt}:null,
   provenanceGap:['live','history'].includes(nature.kind)&&(!evidence.sourceUrls?.length||!evidence.checkedAt),
   sourceStatus:evidence.sourceStatus??null,numericPaths:numericPaths(field.value),
   sourceConditions:(evidence.sourceUrls??[]).map(sourceConditions),sourceUrls:evidence.sourceUrls??[],checkedAt:evidence.checkedAt??null,asOf:evidence.asOf??null,
   periodStart:evidence.periodStart??field.value?.periodStart??null,periodEnd:evidence.periodEnd??field.value?.periodEnd??null,
   currency:evidence.currency??null,scope:evidence.scope??null,method:evidence.method??null,
   requiresConnection:(['live','history'].includes(nature.kind)&&(registry?.mode==='manual-or-editorial'||nature.manual))||!!field.qualificationMissing,
   missingReason:field.qualificationMissing||null,
   action:nature.kind==='archive'?nature.reason:nature.kind==='simulation'||nature.kind==='editorial'?nature.reason:evidence.sourceStatus==='archive-unverifiable'?'Archive non recertifiable conservée avec sa qualification ; ne pas l’utiliser comme observation actuelle.':!evidence.sourceUrls?.length?'Compléter la provenance ou confirmer le statut éditorial/archive.':!evidence.checkedAt?'Qualifier la date de contrôle ; la génération du rapport ne renouvelle pas la preuve.':registry?.mode==='manual-or-editorial'?'Qualifier la mise à jour manuelle et séparer rédaction, hypothèses et chiffres vivants.':'Contrôler la couverture par champ et le dernier résultat de collecte ; un workflow configuré ne certifie pas cette valeur.'}
 }))
 const holdingManifest=JSON.parse(read('src/pages/dca-profiles/holdings-manifest.json'))
 if(!Object.values(holdingManifest).every(bucket=>Number.isSafeInteger(bucket)&&bucket>=0))throw Error('Invalid holdings projection manifest')
 const projectedHoldings=Object.assign({},...[...new Set(Object.values(holdingManifest))].map(bucket=>JSON.parse(read(`src/pages/dca-profiles/holdings-${bucket}.json`))))
 const consumerHoldings=holdingsConsumerQualifications({references:holdingReferences,assets:holdingAssets,holdings:projectedHoldings,sourceRecords:sourceHoldings})
 const connections=coverage.rows.map(row=>applyHoldingsConsumerQualification(connectNativeIndexCandidates(qualifyCoverage(row,{record:AUTOMATED_ETF[row.id],holdingStatus:row.field==='completeHoldings'?holdingsStatus[row.id]:null,holdingSource:row.field==='completeHoldings'?holdingSources[row.id]:null,metadataStatus:attempts[row.id]})),consumerHoldings[row.id]))
 for(const f of fields.filter(f=>f.requiresConnection))connections.push({type:f.type,id:f.id,name:f.name,field:`catalog:${f.field}`,label:f.field,observationState:'manual',actionState:'connector-needed',requiresAction:true,priority:2,sourceUrl:f.sourceUrls[0]??null,configuredSourceUrls:f.sourceUrls,checkedAt:f.checkedAt,lastSuccessAt:null,lastAttemptAt:null,tools:f.consumers.map(c=>c.path),reason:f.missingReason??f.nature.reason,nextAction:f.type==='instrument'?'Recollecter la table liée à la part exacte, qualifier la période et brancher sa valeur au registre commun.':'Qualifier la condition dans la documentation du contrat ou de l’offre, puis raccorder son renouvellement avec ses limites et sa date.'})
 const accessPath='public/data/pending-source-checks.json'
 const access=existsSync(resolve(ROOT,accessPath))?JSON.parse(read(accessPath)):null
 if(access?.schemaVersion===1)for(const connection of connections){
  const proof=access.observations?.[`${connection.id}:${connection.field}`]
  if(proof?.qualification==='access-check-only'&&proof.financialDataQualified===false)connection.sourceAccess=proof
 }
 const discoveryPath='public/data/holdings-discovery.json'
 const discovery=existsSync(resolve(ROOT,discoveryPath))?JSON.parse(read(discoveryPath)):null
 if(discovery?.schemaVersion===1)for(const connection of connections){
  if(connection.field==='completeHoldings'&&discovery.observations?.[connection.id]){
   const proof=discovery.observations[connection.id]
   connection.sourceDiscovery=proof
   if(connection.actionState==='connector-needed'&&proof.status==='qualification-required'){
    connection.reason=`Découverte du portefeuille intégral non qualifiée : ${proof.error}. Aucune donnée financière admise par ce contrôle.`
    connection.sourceUrl??=proof.sourceUrl
    connection.lastAttemptAt=proof.lastAttemptAt??connection.lastAttemptAt
    connection.configuredSourceUrls=[...new Set([...connection.configuredSourceUrls,proof.sourceUrl,proof.discoveredSourceUrl].filter(Boolean))]
   }
  }
 }
 for(const connection of connections.filter(r=>r.type==='instrument'&&r.field==='performance')) {
  const alternative=marketCalendarPerformance(connection.id)
  if(alternative)connection.marketCalendar=alternative
 }
 for(const connection of connections.filter(r=>['countries','sectors'].includes(r.field))) {
  const allocation=exposureSleeves[connection.id]?.[connection.field]
  if(allocation?.basis==='fund'&&allocation.checkedAt&&allocation.asOf&&allocation.sourceUrl&&
   ['exact-isin-lookthrough-countries','morningstar-equity-sectors'].includes(allocation.compatibility))connection.equityAllocation=allocation
 }
 const priorityFields=['performance','monthly','countries','sectors','completeHoldings','returns','facts']
 const priorityMarkets=Object.fromEntries(priorityFields.map(field=>{
  const rows=connections.filter(r=>r.field===field)
  return [field,{total:rows.length,current:rows.filter(r=>r.actionState==='current').length,
   actions:rows.filter(r=>r.requiresAction).length,waiting:rows.filter(r=>r.actionState==='waiting-first-year').length,
   calculatedAlternative:rows.filter(r=>r.marketCalendar&&r.actionState!=='current').length,
   equityAlternative:rows.filter(r=>r.equityAllocation&&r.actionState!=='current').length}]
 }))
 const backlog=connections.filter(row=>row.requiresAction).sort((a,b)=>a.priority-b.priority||(b.tools?.length??0)-(a.tools?.length??0)||a.id.localeCompare(b.id)||a.field.localeCompare(b.field))
 const count=(rows,key)=>rows.reduce((a,r)=>(a[r[key]]=(a[r[key]]??0)+1,a),{})
 const report={schemaVersion:1,generatedAt:new Date().toISOString(),
  method:'Inventaire du code et des observations enregistrées. Modes des fichiers déduits uniquement des chemins explicitement publiés par les workflows et de leurs imports. Les champs de catalogue restent à qualification individuelle : aucun workflow, nom de fichier, source accessible ou date de génération ne garantit une actualisation réussie. Les lignes de couverture conservent les dates et états propres des observations. Les modules non référencés au catalogue restent listés séparément.',
  summary:{fieldKinds:count(fields.map(f=>f.nature),'kind'),registryRoles:count(registries.map(r=>r.qualification),'role'),liveProvenanceGaps:fields.filter(f=>f.provenanceGap).length,connectionStates:count(connections,'actionState'),actionableConnections:backlog.length,unclassifiedFields:fields.filter(f=>f.nature.kind==='unclassified').length,unclassifiedModules:registries.filter(r=>r.qualification.role==='unclassified').length,registries:registries.length,registryModes:count(registries,'mode'),catalogRecords:DATA_CATALOG.length,catalogFields:fields.length,catalogTypes:count(DATA_CATALOG,'type'),fieldsWithoutSource:fields.filter(f=>!f.sourceUrls.length).length,fieldsWithoutCheckDate:fields.filter(f=>!f.checkedAt).length,scheduledWorkflows:workflows.filter(w=>w.crons.length).length,coverageRows:coverage.rows.length,coverageStates:count(coverage.rows,'state'),peaQualified:pea.filter(p=>p.qualified).length,peaRemaining:pea.filter(p=>!p.qualified).length},
  workflows,registries,fields,connections,backlog,datasets:registryFiles.filter(p=>p.endsWith('.json')).map(jsonDatasetInfo),coverage,pea}
 const certification=assetAutomation(report)
 report.summary.priorityMarkets=priorityMarkets
 report.assets=certification.assets;report.summary.assetAutomation=certification.summary
 const externalAssets=connectConsumerFields(externalConsumerAssets(workflows,report.generatedAt),{observations:collectObservationsSync().observations,connections,etfs:AUTOMATED_ETF,metadata})
 const allConsumerAssets=[...report.assets,...externalAssets].map(asset=>({...asset,fields:asset.fields.map(field=>({...field,consumers:[...(field.consumers??[]),{path:'/bibliotheque-donnees'}]}))}))
 report.consumerUsage={...consumerUsage(allConsumerAssets),externalAssets}
 report.summary.consumerUsage=report.consumerUsage.summary
 return report
}
export function writeDataAutomationInventory(){
 const report=buildDataAutomationInventory();mkdirSync(resolve(ROOT,'public/data'),{recursive:true})
 writeFileSync(resolve(ROOT,'public/data/asset-automation.csv'),assetAutomationCsv(report.assets))
 writeFileSync(resolve(ROOT,'public/data/consumer-data-usage.json'),JSON.stringify({...report.consumerUsage,assets:report.assets})+'\n')
 writeFileSync(resolve(ROOT,'public/data/data-automation-inventory.json'),JSON.stringify(report)+'\n')
 writeFileSync(resolve(ROOT,'public/data/data-automation-summary.json'),JSON.stringify({schemaVersion:report.schemaVersion,generatedAt:report.generatedAt,summary:report.summary})+'\n')
 const csvCell=value=>'"'+String(value??'').replaceAll('"','""')+'"'
 const csv=[['isin','etat','qualifie','eligible_pea','controle_preuve','source','sha256','derniere_tentative','action'],...report.pea.map(p=>[p.isin,p.state,p.qualified,p.value,p.checkedAt,p.sourceUrl,p.sha256,p.lastAttemptAt,p.nextAction])].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n'
 writeFileSync(resolve(ROOT,'public/data/pea-automation.csv'),csv)
 const connectionCsv=[['type','id','nom','champ','etat_observation','etat_raccordement','priorite','source','sources_configurees','controle_valeur','derniere_tentative','dernier_succes','outils','motif','action'],...report.backlog.map(r=>[r.type,r.id,r.name,r.field,r.observationState,r.actionState,r.priority,r.sourceUrl,r.configuredSourceUrls.join(' | '),r.checkedAt,r.lastAttemptAt,r.lastSuccessAt,(r.tools??[]).join(' | '),r.reason,r.nextAction])].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n'
 writeFileSync(resolve(ROOT,'public/data/data-connections-backlog.csv'),connectionCsv)
 const escape=s=>String(s??'').replaceAll('|','\\|').replaceAll('\n',' ')
 const lines=['# Inventaire de l’automatisation des données','',`Généré le ${report.generatedAt}.`, '',report.method,'',
  `${report.summary.registries} modules de données ; ${report.summary.catalogFields} champs du catalogue ; ${report.summary.coverageRows} lignes de couverture détaillée.`,
  '',`PEA : ${report.summary.peaQualified}/${report.pea.length} statuts avec preuve ; ${report.summary.peaRemaining} non qualifiés.`,
  '', '## Familles du catalogue','', '| Famille | Fiches |','|---|---:|',...Object.entries(report.summary.catalogTypes).map(([type,n])=>`| ${type} | ${n} |`),
  '', '## Modules et mises à jour','', '« mixed-or-derived » signale un mélange possible de données automatiques et de valeurs éditoriales/manuelles ; ce mode ne certifie aucun champ individuel.',
  '', '| Module | Mode | Workflows en amont | Consommateurs directs ou indirects |','|---|---|---|---:|',...report.registries.map(r=>`| ${r.path} | ${r.mode} | ${r.upstreamWorkflows.map(escape).join(', ')} | ${r.consumers.length} |`),
  '', '## Qualification et raccordements', '', `${report.summary.actionableConnections} raccordements demandent une action. Les états bruts de couverture restent conservés : une composition actions hors périmètre n’est pas une nouvelle donnée collectée.`, '', '| Nature des champs | Nombre |','|---|---:|',...Object.entries(report.summary.fieldKinds).map(([kind,n])=>`| ${kind} | ${n} |`), '', '| État de raccordement | Nombre |','|---|---:|',...Object.entries(report.summary.connectionStates).map(([state,n])=>`| ${state} | ${n} |`), '', 'Le CSV `data/data-connections-backlog.csv` contient chaque raccordement restant avec source, tentative, dernier succès, consommateurs et action. Les champs financiers sans provenance, les modules non qualifiés et les archives restent visibles séparément dans le JSON.', '', '## Statuts PEA restant à qualifier','', '| ISIN | État | Action |','|---|---|---|',...report.pea.filter(p=>!p.qualified).map(p=>`| ${p.isin} | ${p.state} | ${escape(p.nextAction)} |`),
  '', '## Exploitation','', 'Le JSON public `data/data-automation-inventory.json` fournit les champs du catalogue, leurs sources, dates, consommateurs, valeurs numériques présentes (chemins uniquement), workflows et crons UTC, ainsi que la couverture détaillée et les diagnostics PEA. Il est régénéré à chaque build. Les derniers résultats réseau restent dans le suivi des automatisations ; cet inventaire ne prétend pas avoir relu chaque fournisseur.',
  '', 'Priorités : 1. statuts PEA inconnus et contradiction ; 2. champs vivants sans source/date ou sans collecteur ; 3. champs absents, en retard ou conservés après panne ; 4. modules hors catalogue et données éditoriales à séparer des chiffres. Les champs non applicables ou en attente de publication gardent leur qualification.', '']
 writeFileSync(resolve(ROOT,'public/data/data-automation-inventory.md'),lines.join('\n'))
 return report
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const r=process.argv.includes('--write')?writeDataAutomationInventory():buildDataAutomationInventory();console.log(JSON.stringify(r.summary,null,2))}
