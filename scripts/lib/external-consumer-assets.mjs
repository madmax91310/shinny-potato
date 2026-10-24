import {readFileSync} from 'node:fs'
import{collectObservationsSync}from '../update-editorial-radar.mjs'
import {INVESTORS} from '../../src/data/investor-roster.js'
import {normalizePortfolio} from '../../src/pages/investor-portfolio/data.js'
import POLICY from '../../src/data/freshness-policy.json' with {type:'json'}
import {RANKING_ASSETS} from '../../src/pages/performance-rankings/data.js'

// The 13F UI consumes independent public JSON files, not DATA_CATALOG. Keep
// these obligations visible without importing entire portfolios into the SPA.
export function externalConsumerAssets(workflows,now=new Date().toISOString()){
 const read=path=>JSON.parse(readFileSync(new URL('../../'+path,import.meta.url)))
 const reviews=read('public/data/investors/review-metadata.json')
 const workflow=workflows.find(w=>w.path.endsWith('/update-investor-13f.yml'))
 const portfolios=INVESTORS.map(([id,name])=>{
  const fields=[],payload=read(`public/data/investors/${id}.json`)
  let portfolio,error
  try{portfolio=normalizePortfolio(payload)}catch(e){error=e.message}
  const review=reviews.find(r=>r.data?.identity?.slug===id&&r.data?.snapshot?.periodEnd===portfolio?.snapshot.periodEnd)
  // A lightweight review of the available quarter does not re-certify the
  // retained holdings/weights, even when it names the same quarter.
  const checkedAt=review?.lastSuccessfulPollAt??portfolio?.fetchedAt??null,asOf=portfolio?.snapshot.periodEnd??null
  const age=(Date.parse(now)-Date.parse(checkedAt))/86400000
  const periodAge=(Date.parse(now)-Date.parse(asOf))/86400000
  const state=error||!workflow||!checkedAt||!asOf||!Number.isFinite(age)||age<0||age>POLICY.fields['investor.13f'].checkDays||!Number.isFinite(periodAge)||periodAge<0||periodAge>POLICY.fields['investor.13f'].dataDays?'blocked':'scheduled-evidence'
  for(const [key,label]of [['holdings','Positions et poids déclarés'],['quarterChanges','Mouvements déclarés']].filter(([key])=>key==='holdings'||portfolio?.snapshot?.[key])){
   fields.push({key:`investor:${key}`,label,state,kind:'live',checkedAt,asOf,currency:null,
    scope:'Déclaration 13F, hors positions non déclarables ; poids des options conservés séparément. Aucun ISIN inféré du nom.',
    method:'Le même lecteur de portefeuille valide la photographie consommée par le texte et l’image.',
    sourceUrls:portfolio?.sourceUrl?[portfolio.sourceUrl]:[],consumers:[{path:'/portefeuilles-investisseurs'}],
    workflows:workflow?[{path:workflow.path,name:workflow.name,crons:workflow.crons}]:[],
    reason:error??null,nextAction:error??'Confirmer le renouvellement des positions et leur publication dans le bilan du collecteur 13F.'})
  }
  const reviewAge=(Date.parse(now)-Date.parse(review?.lastSuccessfulPollAt??review?.as_of))/86400000
  if(review)fields.push({key:'investor:filing-availability',freshnessPolicyKey:'investor.13f',label:'Disponibilité de la déclaration',state:workflow&&Number.isFinite(reviewAge)&&reviewAge>=0&&reviewAge<=POLICY.fields['investor.13f'].checkDays?'scheduled-evidence':'blocked',kind:'live',
   checkedAt:review.lastSuccessfulPollAt??review.as_of,asOf:review.data.snapshot.periodEnd,currency:null,scope:'Période disponible ; ce contrôle ne renouvelle pas les poids conservés.',
   method:'Revue de disponibilité du trimestre, distincte du téléchargement des positions.',sourceUrls:[review.data.sourceUrl].filter(Boolean),
   consumers:[{path:'/portefeuilles-investisseurs'}],workflows:workflow?[{path:workflow.path,name:workflow.name,crons:workflow.crons}]:[],
   reason:null,nextAction:'Surveiller les nouvelles déclarations ; qualifier les positions indépendamment de la période disponible.'})
  return {id:`investor:${id}`,type:'investor',name,fields}
 })
 const makeField=(id,label,observation,producer,consumers,policyKey)=>{
  const writer=workflows.find(w=>w.path.endsWith('/'+producer)),age=(Date.parse(now)-Date.parse(observation?.checkedAt))/86400000
  const valid=writer&&observation?.sourceUrl&&/^[a-f0-9]{64}$/.test(observation?.sha256??'')&&Number.isFinite(age)&&age>=0&&age<=POLICY.fields[policyKey].checkDays
  return {key:id,label,freshnessPolicyKey:policyKey,state:valid?'scheduled-evidence':'blocked',kind:'live',checkedAt:observation?.checkedAt??null,asOf:observation?.asOf??observation?.publishedAt??null,
   currency:observation?.currency??null,scope:observation?.scope??null,method:observation?.method??null,
   sourceUrls:[...new Set([observation?.sourceUrl,observation?.secondarySourceUrl].filter(Boolean))],consumers:consumers.map(path=>({path})),
   workflows:writer?[{path:writer.path,name:writer.name,crons:writer.crons}]:[],reason:valid?null:'Preuve du champ absente ou contrôle à renouveler.',
   nextAction:valid?'Confirmer le cycle de collecte et sa publication dans le suivi.':'Renouveler la preuve de ce champ ; conserver la dernière valeur validée et sa date.'}
 }
 const regulatory=read('src/data/automated-regulatory.json').sources
 const contracts=[
  {path:'/simulateur-patrimoine',files:['src/pages/wealth-simulator/data.js','src/pages/wealth-simulator/App.jsx'],extra:['pel']},
  {path:'/fiches-pratiques',files:['src/pages/practical-sheets/lib.js'],extra:[]},
 ]
 const regulations=Object.entries(regulatory).flatMap(([id,o])=>{
  const consumers=contracts.filter(contract=>contract.extra.includes(id)||contract.files.some(file=>{
   const text=readFileSync(new URL('../../'+file,import.meta.url),'utf8')
   return Object.keys(o.values??{}).some(key=>new RegExp(`\\b(?:REGULATORY|R)\\.${key}\\b`).test(text))
  })).map(c=>c.path)
  return consumers.length?[{id:`regulatory:${id}`,name:o.title,type:'regulatory',fields:[makeField(id,'Paramètres officiels utilisés',o,'update-regulatory-data.yml',consumers,'product.default')]}]:[]
 })
 const fx=read('src/data/monthly-fx.json'),last=Object.keys(fx.months??{}).sort().at(-1)
 const currencies=[...new Set(Object.values(RANKING_ASSETS).map(a=>a.currency))].filter(c=>c&&c!=='EUR')
 const rates=currencies.map(currency=>{
  const o=fx.derived?.[currency]??fx,observation={...o,asOf:o.observations?.[last]?.asOf??(last?fx.months[last].asOf:null),currency,scope:`${currency} par EUR · fin de mois`,method:o.convention??fx.convention}
  const field=makeField(currency,'Conversion monétaire des performances',observation,'update-market-monthly.yml',['/classements-performances'],'series.monthly')
  if(!Number.isFinite(fx.months?.[last]?.rates?.[currency])){field.state='blocked';field.reason='Dernier taux requis absent ; aucune substitution par 1.'}
  return {id:`fx:${currency}`,name:`Change ${currency}/EUR`,type:'series',fields:[field]}
 })
 const purchasing=read('src/data/purchasing-power-observations.json'),powerWorkflow=workflows.find(w=>w.path.endsWith('/update-publication-observations.yml'))
 const powerFields=['general','alimentation','energie','irl','smic'].map(id=>{
  const family=['general','alimentation','energie'].includes(id)?purchasing.prices:purchasing[id],source=family.sources?.[id]??family.source
  const checked=source?.checkedAt??family.checkedAt,age=(Date.parse(now)-Date.parse(checked))/86400000
  return{id:`purchasing:${id}`,name:source.title,type:'purchasing',fields:[{key:'insee-series',label:'Série INSEE utilisée et dernier niveau',kind:'history',state:powerWorkflow&&Number.isFinite(age)&&age>=0&&age<=7?'scheduled-evidence':'blocked',consumerCode:'src/data/purchasing-power.js',registry:'src/data/purchasing-power-observations.json',sourceIdentity:id,checkedAt:checked??null,asOf:family.asOf,currency:id==='smic'?'EUR':null,unit:id==='smic'?'EUR/mois':'points',scope:source.title,method:'Même base et même population INSEE ; périodes de départ et dernière publication réellement disponibles.',sourceUrls:[source.sourceUrl],consumers:[{path:'/pouvoir-achat'}],workflows:powerWorkflow?[{path:powerWorkflow.path,name:powerWorkflow.name,crons:powerWorkflow.crons}]:[],freshnessPolicyKey:id==='irl'?'purchasing.irl':id==='smic'?'purchasing.smic':'purchasing.prices',reason:checked?null:'Date de contrôle source distincte de la date de publication non encore enregistrée.'}]}
 })
 const radarWorkflow=workflows.find(w=>w.path.endsWith('/update-editorial-radar.yml')),radarGroups=new Map()
 for(const o of collectObservationsSync().observations){
  const groupKey=o.family+':'+o.entity+':'+o.field.split(':')[0]
  if(!radarGroups.has(groupKey))radarGroups.set(groupKey,[])
  radarGroups.get(groupKey).push(o)
 }
 const radar=[...radarGroups].map(([id,observations])=>{
  const first=observations[0],checks=observations.map(o=>o.checkedAt).filter(Boolean).sort(),checked=checks[0],age=(Date.parse(now)-Date.parse(checked))/86400000
  return{id:'radar:'+id,name:first.label,type:first.family==='etf'?'instrument':first.family==='indices'?'index':'radar',fields:[{key:first.field.split(':')[0],label:first.fieldLabel,kind:'live',state:checked&&Number.isFinite(age)&&age>=0&&age<=(first.maxAgeDays??90)?'scheduled-evidence':'blocked',consumerCode:'scripts/update-editorial-radar.mjs#collectObservationsSync',sourceIdentity:first.entity,checkedAt:checked??null,asOf:observations.map(o=>o.period).filter(Boolean).sort().at(-1),scope:first.scope,method:'Observations exactes du lecteur Radar commun ; seuils et rapprochements existants, aucune observation nouvelle déduite de la génération du flux.',unit:first.unit??null,sourceUrls:[...new Set(observations.map(o=>o.sourceUrl).filter(Boolean))],members:observations.map(o=>o.field),freshnessContract:{checkDays:first.maxAgeDays??90,dataDays:null,authority:'existing-radar-consumer'},consumers:[{path:'/radar-editorial'}],workflows:radarWorkflow?[{path:radarWorkflow.path,name:radarWorkflow.name,crons:radarWorkflow.crons}]:[],reason:checked?null:'Contrôle source non documenté, sans utiliser sa date de publication.'}]}
 })
 return [...portfolios,...regulations,...rates,...powerFields,...radar]
}
