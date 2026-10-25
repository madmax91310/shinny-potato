import { parisClock } from './radar-schedule.mjs'
// Metadata is obtained from the running workflow, not inferred from push times.
export function recordRadarRun(previous={},context={},now=new Date()) {
  const history=[...(previous.scheduledRuns??[])]
  if(context.eventName!=='schedule')return {...previous,scheduledRuns:history,lastProducer:{eventName:context.eventName??'local',runId:context.runId??null,observedAt:now.toISOString()}}
  const created=Date.parse(context.createdAt), started=Date.parse(context.jobStartedAt??context.startedAt), last=history.at(-1)
  const row={runId:context.runId??null,createdAt:context.createdAt??null,startedAt:context.startedAt??null,productionJobStartedAt:context.jobStartedAt??null,queueMeasurementNote:'Création du workflow → démarrage du job producteur quand disponible ; inclut attente de concurrence et amorçage GitHub, pas un délai nominal de cron.',observedAt:now.toISOString(),sourceRevision:context.sourceRevision??null,paris:parisClock(now),workflowQueueSeconds:Number.isFinite(created)&&Number.isFinite(started)?Math.max(0,(started-created)/1000):null,intervalSincePreviousCreationMinutes:last?.createdAt&&Number.isFinite(created)?(created-Date.parse(last.createdAt))/60000:null,nominalCadenceMinutes:30,triggerDelaySeconds:null,triggerDelayNote:'GitHub ne fournit pas l’heure nominale propre à ce déclenchement ; les créneaux absents et intervalles sont observables, pas un délai exact de déclenchement.'}
  if(!history.some(r=>r.runId===row.runId&&r.createdAt===row.createdAt))history.push(row)
  return {...previous,scheduledRuns:history.slice(-512),lastScheduledRun:row}
}
