import {addDays,assert,fxAt} from './lib.js'
export const FORMATS=[['individual','Bilan individuel'],['comparison','Comparatif des participants'],['moves','Mouvements individuels'],['all-moves','Mouvements collectifs'],['curve','Courbe individuelle'],['curves','Courbes comparatives']]
export const PERIODS=[['week','Une semaine'],['month','Un mois'],['quarter','Trois mois'],['all','Depuis le lancement']]
export function periodBounds(comp,end,period='all'){
 assert(comp?.status==='launched'&&comp.startDate<=end,'Compétition non démarrée à cet arrêté.')
 let start=comp.startDate
 if(period==='week')start=addDays(end,-7)
 if(['month','quarter'].includes(period)){const d=new Date(end+'T12:00:00Z'),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-(period==='month'?1:3));const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));start=d.toISOString().slice(0,10)}
 assert(start>=comp.startDate,'Historique trop court pour cette période. Choisir depuis le lancement.')
 return {start,end,opening:start===comp.startDate,label:PERIODS.find(x=>x[0]===period)?.[1]??period}
}
const requiredReady=(point,id,comp)=>{
 const row=point?.rows.find(r=>r.id===id)
 assert(point?.started&&row?.complete&&Number.isFinite(row.value),`${id} : ${row?.error??'valorisation ou allocation manquante'} au ${point?.date??'début de période'}.`)
 assert(comp.decisions.some(d=>d.participant===id&&d.status==='executed'&&d.executionDate<=point.date),id+' : allocation initiale non exécutée.')
 assert(!comp.decisions.some(d=>d.participant===id&&['recorded','pending','failed'].includes(d.status)&&d.executionDate<=point.date),id+' : opération attendue non exécutée au '+point.date+'.')
 return row
}
export function publication(comp,daily,market,{format='comparison',participants=comp.config.participants.map(p=>p.id),participant=participants[0],period='all',end=market.asOf}={}){
 assert(FORMATS.some(x=>x[0]===format),'Format inconnu.')
 assert(end<=market.asOf,'Arrêté au-delà des données disponibles.')
 const bounds=periodBounds(comp,end,period),individual=['individual','moves','curve'].includes(format),ids=individual?[participant]:participants
 assert(ids.length>0&&ids.length<=4&&new Set(ids).size===ids.length,'Sélectionner de un à quatre participants distincts.')
 assert(ids.every(id=>comp.config.participants.some(p=>p.id===id)),'Participant inconnu.')
 const ref=market.universe.find(a=>a.id===comp.config.benchmark)
 const common={...bounds,format,currency:comp.config.currency,participants:ids,reference:ref,complete:true}
 if(['moves','all-moves'].includes(format)){
  const rows=ids.map(id=>({...comp.config.participants.find(p=>p.id===id),movements:comp.decisions.filter(d=>d.participant===id&&d.status==='executed'&&d.executionDate<=end&&(d.executionDate>bounds.start||bounds.opening&&d.executionDate===bounds.start)).flatMap(d=>(d.execution?.trades??[]).map(t=>{
   const before=d.execution.before.positions.find(p=>p.id===t.id),after=d.execution.after.positions.find(p=>p.id===t.id),rate=fxAt(comp.config.currency,d.executionDate,market).rate
   assert(Number.isFinite(t.amount)&&Number.isFinite(t.fee),'Exécution archivée incomplète : '+d.id)
   return {id:t.id,date:d.executionDate,label:t.amount>0?(before?'Renforcement':'Achat'):(after?'Allègement':'Vente totale'),amount:Math.abs(t.amount)/rate,fee:t.fee/rate,before:before?.weight??0,after:after?.weight??0}
  })),pending:comp.decisions.filter(d=>d.participant===id&&d.status!=='cancelled'&&d.registeredAt.slice(0,10)<=end&&(d.executionDate>end||d.status!=='executed')).map(d=>({id:d.id,kind:d.kind,date:d.executionDate,status:'Non exécutée à cet arrêté'}))}))
  return {...common,currency:'EUR',rows,curves:[]}
 }
 assert(ref,'Identité de la référence archivée absente.')
 const points=daily.filter(p=>p.date>=bounds.start&&p.date<=end)
 assert(points[0]?.date===bounds.start&&points.at(-1)?.date===end,'Bornes non couvertes par les valorisations publiées.')
 // Validate every required day and only participants actually presented. Never
 // bridge a missing expected valuation, or block on an unrelated participant.
 for(let date=bounds.start;date<=end;date=addDays(date,1)){
  const point=points.find(p=>p.date===date);assert(point,'Valorisation quotidienne absente au '+date)
  for(const id of [...ids,'world'])requiredReady(point,id,comp)
 }
 const first=points[0],last=points.at(-1),base=id=>bounds.opening?comp.config.initialCapital:requiredReady(first,id,comp).value
 const rows=[...ids,'world'].map(id=>{const r=requiredReady(last,id,comp);const lastDecision=comp.decisions.filter(d=>d.participant===id&&d.status==='executed'&&d.executionDate<=end).sort((a,b)=>a.executionDate.localeCompare(b.executionDate)||a.registeredAt.localeCompare(b.registeredAt)).at(-1);return {...r,model:lastDecision?.model??r.model,periodPerformance:(r.value/base(id)-1)*100,color:id==='world'?'#858b89':r.color}})
 const benchmark=rows.at(-1).periodPerformance
 const curves=points.map(point=>({date:point.date,values:rows.map(r=>({id:r.id,value:(point.rows.find(x=>x.id===r.id).value/base(r.id)-1)*100}))}))
 if(bounds.opening)curves.unshift({date:bounds.start,opening:true,values:rows.map(r=>({id:r.id,value:0}))})
 return {...common,rows:rows.map(r=>({...r,vsReference:r.periodPerformance-benchmark})),curves,hasCurve:points.length>=2}
}
export function publicationTweet(model){
 if(model.format.includes('moves'))return `🔄 Mouvements exécutés du ${model.start} au ${model.end}\n`+model.rows.map(r=>`${r.name} : ${r.movements.length?r.movements.length+' mouvement(s)':'aucun mouvement'}`).join('\n')+'\nPortefeuilles fictifs. Pas un conseil financier'
 return `📊 ${model.start} → ${model.end} · ${model.currency}\n`+model.rows.map(r=>`${r.name} : ${r.periodPerformance>=0?'+':''}${r.periodPerformance.toFixed(2)} % sur la période`).join('\n')+'\nPortefeuilles fictifs. Pas un conseil financier'
}
