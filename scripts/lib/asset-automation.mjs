import {consumerPath} from './consumer-usage.mjs'
// Field certificates derive from existing evidence. File schedules alone never
// certify every value that a mixed registry exposes.
import POLICY from '../../src/data/freshness-policy.json' with {type:'json'}
const FINANCIAL=new Set(['instrument','series','index','insurance','scpi','actor','broker','household','lexicon','reference'])
const EXCLUDED=new Set(['editorial','archive','simulation'])
const PASSIVE=new Set(['archived','not-applicable','outside-equity-scope','waiting-first-year','waiting-publication'])
// Explicit facade contracts. Unlisted fields stay unqualified even when their
// file imports one of these producers.
const BINDINGS=[
 ['src/data/household-statistics.js',/^Statistique de ménages$/,'update-economic-data.yml'],
 ['src/data/regulatory-data.js',/^Paramètres officiels ·/,'update-regulatory-data.yml'],
 ['src/data/presentation-actors.js',/ · (Accès|Frais publiés|Durée|Revenus|Sortie)$/,'update-presentation-actors.yml'],
 ['src/data/broker-tariffs.js',/^(Tarif courtage automatisé|Paramètre automatisé ·|Conditions officielles ·)/,'update-regulatory-data.yml'],
 ['src/data/scpi.js',/^(Actifs immobiliers|Locataires|Taux d’occupation financier|Immeubles|Historique daté du prix de souscription)$/,'update-scpi.yml'],
 ['src/data/qualified-exposure-metrics.js',/./,'update-qualified-exposures.yml'],
]
export function explicitFieldProducer(field,workflows){
 const binding=BINDINGS.find(([registry,label])=>registry===field.registry&&label.test(field.field))
 if(!binding)return null
 return workflows.find(w=>w.path.endsWith('/'+binding[2])&&w.crons.length&&field.upstreamWorkflows.includes(w.path))??null
}
export function certificateFreshnessKey(field){
 const name=field.coverageReference?.field
 if(name==='monthly')return field.type==='instrument'?'etf.monthly':'series.monthly'
 if(name==='performance')return 'etf.performance'
 if(name==='ter')return 'etf.ter'
 for(const key of ['etf.staticCharacteristic','etf.characteristic'])if(POLICY.fields[key].fields.includes(name))return key
 if(field.type==='index')return name==='returns'?'index.returns':'index.facts'
 return field.type==='series'?'series.monthly':field.type==='instrument'?'etf.default':'product.default'
}
export function assetAutomation(inventory,now=inventory.generatedAt){
 const workflows=new Map(inventory.workflows.map(w=>[w.path,w]))
 const fields=new Map(),add=(id,type,name,field)=>{
  if(!FINANCIAL.has(type))return
  if(!fields.has(id))fields.set(id,{id,type,name,fields:[]})
  fields.get(id).fields.push(field)
 }
 const matched=new Set()
 for(const field of inventory.fields){
  const coverage=field.coverageReference
  const connection=coverage?inventory.connections.find(c=>c.id===coverage.id&&c.field===coverage.field):inventory.connections.find(c=>c.id===field.id&&c.field===`catalog:${field.field}`)
  if(connection)matched.add(`${connection.id}:${connection.field}`)
  const scheduled=field.upstreamWorkflows.filter(path=>workflows.get(path)?.crons.length)
  const kind=field.nature.kind
  const binding=explicitFieldProducer(field,inventory.workflows)
  let state=EXCLUDED.has(kind)?'excluded':kind==='reference'?'reference':connection?.requiresAction||field.requiresConnection||field.provenanceGap||kind==='unavailable'?'blocked':connection&&PASSIVE.has(connection.actionState)?'not-required':connection?.actionState==='current'&&scheduled.length?'connected':'qualification-needed'
  if(state==='connected'&&(!field.sourceUrls.length||!field.checkedAt||field.checkedAt.slice(0,10)>now.slice(0,10)))state='blocked'
  if(state==='qualification-needed'&&binding&&field.sourceUrls.length&&field.checkedAt&&field.sourceStatus==='documented')state='scheduled-evidence'
  if(!['excluded','reference','not-required'].includes(state)&&field.checkedAt){
   const key=certificateFreshnessKey(field)
   const age=(Date.parse(now.slice(0,10))-Date.parse(field.checkedAt.slice(0,10)))/86400000
   if(!Number.isFinite(age)||age<0||age>POLICY.fields[key].checkDays)state='blocked'
  }
  if(!['excluded','reference','not-required'].includes(state)&&/^\d{4}-\d{2}-\d{2}/.test(field.asOf??'')&&field.asOf.slice(0,10)>now.slice(0,10))state='blocked'
  const consumers=[...new Map([...(connection?.tools??[]),...(field.consumers??[])].map(c=>[consumerPath(c),typeof c==='string'?{path:consumerPath(c)}:c])).values()]
  add(field.id,field.type,field.name,{key:`catalog:${field.fieldIndex}`,label:field.field,state,kind,registry:field.registry,
   checkedAt:field.checkedAt,asOf:field.asOf,sourceUrls:field.sourceUrls,consumers,coverageReference:field.coverageReference??null,
   currency:field.currency??null,scope:field.scope,method:field.method,
   workflows:scheduled.map(path=>({path,name:workflows.get(path).name,crons:workflows.get(path).crons})),
   reason:connection?.reason??field.missingReason??field.action,
   nextAction:connection?.nextAction??(state==='qualification-needed'?'Établir la preuve de renouvellement de ce champ précis ; le workflow du fichier ne suffit pas.':field.action)})
 }
 for(const row of inventory.connections){
  if(matched.has(`${row.id}:${row.field}`))continue
  const existing=fields.has(row.id)?row.id:fields.has(`${row.type}:${row.id}`)?`${row.type}:${row.id}`:row.id
  // The row itself establishes configuration; no unrelated producer is attached.
  add(existing,row.type,row.name,{key:`coverage:${row.field}`,label:row.label??row.field,
   state:row.requiresAction?'blocked':PASSIVE.has(row.actionState)?'not-required':row.actionState==='current'&&row.automationConfigured&&row.sourceUrl&&row.checkedAt&&row.checkedAt.slice(0,10)<=now.slice(0,10)?'connected':'qualification-needed',
   kind:'coverage',checkedAt:row.checkedAt,asOf:row.asOf,sourceUrls:[...new Set([row.sourceUrl,...(row.configuredSourceUrls??[])].filter(Boolean))],
   consumers:row.tools??[],workflows:[],automationConfigured:row.automationConfigured===true,
   reason:row.reason,nextAction:row.nextAction,sourceAccess:row.sourceAccess??null,sourceDiscovery:row.sourceDiscovery??null})
 }
 const assets=[...fields.values()].map(asset=>{
  const required=asset.fields.filter(f=>!['excluded','reference','not-required'].includes(f.state))
  const counts=asset.fields.reduce((a,f)=>(a[f.state]=(a[f.state]??0)+1,a),{})
  const state=counts.blocked?'blocked':counts['qualification-needed']?'qualification-needed':counts['scheduled-evidence']?'scheduled-evidence':required.length&&required.every(f=>f.state==='connected')?'connected':'reference-only'
  const dates=required.map(f=>f.checkedAt).filter(Boolean).sort()
  return {...asset,state,counts,oldestCheck:dates[0]??null,
   scope:'Champs présents dans les contrats et consommateurs inventoriés ; une identité seule ne certifie aucun cours ni historique.'}
 }).sort((a,b)=>a.name.localeCompare(b.name,'fr')||a.id.localeCompare(b.id))
 return {assets,summary:{profiles:assets.length,fields:assets.reduce((s,a)=>s+a.fields.length,0),states:assets.reduce((a,r)=>(a[r.state]=(a[r.state]??0)+1,a),{})}}
}

export function assetAutomationCsv(assets){
 const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"'
 return [['fiche','type','nom','etat_fiche','champ','etat_champ','controle_source','date_donnee','devise','perimetre','methode','sources','collectes','cadences_UTC','consommateurs_declares','action'],
 ...assets.flatMap(a=>a.fields.map(f=>[a.id,a.type,a.name,a.state,f.label,f.state,f.checkedAt,f.asOf,f.currency,f.scope,f.method,f.sourceUrls.join(' | '),f.workflows.map(w=>w.name).join(' | '),f.workflows.flatMap(w=>w.crons).join(' | '),(f.consumers??[]).map(c=>typeof c==='string'?c:c.path).join(' | '),f.nextAction]))].map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n'
}
