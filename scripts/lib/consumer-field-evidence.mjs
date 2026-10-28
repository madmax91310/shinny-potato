// A consumer may inherit a field certificate, never an asset-wide success.
// The Radar reader is left untouched: compare its actual observations with the
// exact shared registry and the existing field's validation/freshness contract.
import {compositionIssue} from '../../src/lib/radar-composition.js'
const fields={ter:'ter',pea:'pea',aum:'aum',countries:'countries',sectors:'sectors',top10:'holdings'}
function observedValue(o,record,metadata){
 const [field,...suffix]=o.field.split(':')
 if(field==='ter')return record.characteristics?.terPct
 if(field==='pea')return metadata?.pea?.value
 if(field==='aum')return record.aum?.amount
 if(field==='top10'){
  const block=record.holdings
  if(block?.basis==='substitute-basket'||block?.rows?.length!==10)return undefined
  return block.rows.every(r=>Number.isFinite(r.weightPct))?block.rows.reduce((n,r)=>n+r.weightPct,0):undefined
 }
 if(field==='countries'||field==='sectors')return record[field]?.rows?.find(r=>(r.name??r.label)===suffix.join(':'))?.weightPct
}
export function connectConsumerFields(assets,{observations,connections,etfs,metadata={}}){
 const coverage=new Map(connections.map(r=>[r.id+':'+r.field,r]))
 const groups=new Map()
 for(const o of observations){const key=`radar:${o.family}:${o.entity}:${o.field.split(':')[0]}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o)}
 return assets.map(asset=>({...asset,fields:asset.fields.map(f=>{
  if(f.state!=='scheduled-evidence')return f
  if(!asset.id.startsWith('radar:etf:')||!fields[f.key])return f.reason?f:{...f,reason:`Lecture déclarée dans ${f.consumerCode??'le consommateur'} ; le contrat de ${f.label??f.key} ne référence pas de certificat source ciblé et publié. Une source et un contrôle affichés ne suffisent pas à démontrer cette liaison.`,qualificationBlock:'targeted-field-certificate-unlinked',nextAction:'Rapprocher les valeurs effectivement lues du certificat de la même identité, du même champ, de la même période et des fichiers publiés ; conserver leurs dates propres.'}
  const obs=groups.get(asset.id)??[],id=f.sourceIdentity,field=fields[f.key]
  if(!field)return f
  const row=coverage.get(id+':'+field),record=etfs[id]
  let missing=!record?'Identité exacte absente du registre commun.':!row?'Contrat du champ source absent.':row.actionState!=='current'||row.requiresAction||!row.present?'Le champ source reste bloqué : '+(row.reason??row.actionState):!row.automationConfigured?'Voie de renouvellement du champ non démontrée.':!obs.length?'Observations du consommateur absentes.':null
  if(!missing&&(!Array.isArray(f.members)||obs.length!==f.members.length||obs.some(o=>!f.members.includes(o.field))))missing='Périmètre consommateur incomplet.'
  if(!missing&&obs.some(o=>!o.sourceUrl||o.sourceUrl!==row.sourceUrl))missing='La source lue par le consommateur diffère de la preuve du champ.'
  if(!missing&&obs.some(o=>!o.checkedAt||o.checkedAt!==row.checkedAt))missing='Le contrôle lu par le consommateur diffère du contrôle qualifié du champ.'
  if(!missing&&row.asOf&&obs.some(o=>o.period!==row.asOf))missing='La période consommée diffère de la photographie qualifiée.'
  if(!missing&&obs.some(o=>observedValue(o,record,metadata[id])!==o.value))missing='La valeur consommée diffère de la valeur qualifiée de la part exacte.'
  if(!missing){const issue=obs.map(o=>o.compositionEvidence?compositionIssue(o.compositionEvidence):null).find(Boolean);if(issue)missing='Qualification de composition requise par le lecteur Radar : '+issue}
  if(!missing&&['countries','sectors'].includes(field)&&obs.some(o=>o.completeComposition!==(record[field]?.complete===true)||o.scope!==`${id} · ${record[field]?.basis??'fund'} · ${record[field]?.method??field}`))missing='La base ou la méthode de ventilation consommée diffère du registre qualifié.'
  if(!missing&&field==='aum'&&obs.some(o=>o.unit!==record.aum?.currency||o.scope!==`${id} · ${record.aum?.scope} · ${record.aum?.currency}`))missing='La devise ou le périmètre fonds/part de l’encours diffère.'
  if(!missing&&field==='top10'&&obs.some(o=>o.unit!=='%'||o.scope!==`${id} · ${record.holdings?.basis??'fund'} · dix lignes publiées`))missing='Le périmètre des dix lignes consommées diffère de la preuve.'
  if(!missing&&field==='ter'&&obs.some(o=>o.unit!=='% / an'))missing='Unité des frais annuels différente.'
  if(missing)return {...f,reason:missing,nextAction:'Rapprocher la lecture du consommateur et la preuve ciblée du champ ; aucune réussite globale ne lève cette réserve.',qualificationBlock:missing}
  return {...f,state:'connected',coverageReference:{id,field},reason:null,nextAction:'Suivre le contrôle source du champ ; aucune nouvelle date déduite de cette liaison.',qualificationEvidence:{kind:'exact-consumer-field-binding-v1',consumer:f.consumerCode,asset:id,field,checkedAt:row.checkedAt,asOf:row.asOf,sourceUrl:row.sourceUrl,members:obs.map(o=>o.field),scope:f.scope,method:f.method}}
 })}))
}
