import { editorialExclusion, editorialTopic, normalizeEditorial } from '../../src/lib/radar-policy.js'
// Measured audit baseline: 12 documents / 25.4 seconds including listings.
// The ceiling bounds provider traffic; the time envelope and observed p90 cost
// determine admission. At least 1/3 of slots serve the oldest background work.
export const QUEUE_POLICY = Object.freeze({ timeBudgetMs:90000, maxDocuments:24, initialDocumentMs:5000, recentDays:7, reservedFraction:2/3, agingHours:24 })
export function listingPublicationInstant(item) {
  if(item.source==='insee-studies'&&!item.publishedInstant)return null
  const raw = item.publishedInstant ?? item.publishedAt ?? item.hint
  if (!raw || !/(?:T\d\d:\d\d.*(?:Z|[+-]\d\d:\d\d)$|\d\d:\d\d:\d\d (?:GMT|[+-]\d{4})$)/.test(raw)) return null
  const instant = Date.parse(raw)
  return Number.isFinite(instant) ? new Date(instant).toISOString() : null
}
export function queueClass(item, now = new Date()) {
  const title = item.title ?? '', date = Date.parse(item.publishedAt ?? item.hint ?? ''), age = (+now-date)/86400000
  const topic = editorialTopic(title,item.description), wording = normalizeEditorial(title)
  const relevant = topic && !editorialExclusion({label:title}) && !/chiffre d affaires|nominations?|emplois.*entreprises|perspectives.*promoteurs/.test(wording)
  const first = !item.firstAttemptAt && !item.attemptedAt
  // An initial archive can contain a recent publication; it stays notification-silent.
  return first && relevant && age >= 0 && age <= QUEUE_POLICY.recentDays && !item.offerReference ? 'recent-first-extraction' : first ? 'archive-first-extraction' : ['error','partial'].includes(item.status) ? 'retry' : 'recheck'
}
export function planPublicationQueue(documents,sources,now,previous={},limit) {
  const costs = previous.documentDurationsMs ?? [], sorted = [...costs].sort((a,b)=>a-b)
  const p90 = sorted.length ? sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.9))] : QUEUE_POLICY.initialDocumentMs
  const measuredLimit = Math.max(1,Math.min(QUEUE_POLICY.maxDocuments,Math.floor(QUEUE_POLICY.timeBudgetMs*.75/Math.max(1000,p90))))
  const count = limit ?? measuredLimit
  const ordered = [...sources.slice((previous.nextSourceIndex??0)%sources.length),...sources.slice(0,(previous.nextSourceIndex??0)%sources.length)]
  const age = item => Date.parse(item.firstAttemptAt ?? item.discoveredAt)
  const fresh = documents.filter(([,d])=>queueClass(d,now)==='recent-first-extraction').sort((a,b)=>Date.parse(b[1].publishedAt??b[1].hint)-Date.parse(a[1].publishedAt??a[1].hint)||age(a[1])-age(b[1]))
  const freshSlots=Math.min(fresh.length,count===1 ? ((previous.queuePass??0)%3===2?0:1) : Math.max(1,Math.floor(count*QUEUE_POLICY.reservedFraction))), chosen=fresh.slice(0,freshSlots)
  const used=new Set(chosen.map(([u])=>u))
  const background=documents.filter(([u])=>!used.has(u)).sort((a,b)=>age(a[1])-age(b[1]) || (a[1].attempts??0)-(b[1].attempts??0))
  // Aging protects a source's old documents even while its archive keeps growing.
  const overdue=background.filter(([,d])=>(+now-Date.parse(d.lastQueueServiceAt??d.discoveredAt))/3600000>=QUEUE_POLICY.agingHours)
  for(const item of overdue){if(chosen.length>=count)break;chosen.push(item);used.add(item[0])}
  const queues=ordered.map(source=>background.filter(([u,d])=>!used.has(u)&&d.source===source.id))
  while(chosen.length<count&&queues.some(q=>q.length))for(const q of queues)if(q.length&&chosen.length<count)chosen.push(q.shift())
  return {chosen,limit:count,p90DocumentMs:p90,policy:QUEUE_POLICY,reservedRecent:freshSlots,eligibleRecent:fresh.length,objective:'Première tentative au prochain passage admissible pour les publications récentes prioritaires, dans la capacité réservée ; surplus et dépassements visibles.'}
}
export function documentDelays(item) {
  const hours=(a,b)=>a&&b&&Number.isFinite(Date.parse(a))&&Number.isFinite(Date.parse(b))&&Date.parse(b)>=Date.parse(a)?(Date.parse(b)-Date.parse(a))/3600000:null
  const instant=listingPublicationInstant(item)
  const observedDay=item.observation?.publishedAt
  const raw=item.publishedInstant??item.publishedAt??item.hint??''
  const datePart=raw.match(/^(\d{4}-\d{2}-\d{2})T/)?.[1]
  const rfc=raw.match(/\b(\d{1,2}) ([A-Za-z]{3}) (\d{4})\b/)
  const month=rfc?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(rfc[2])+1:0
  const civilDay=datePart??(month?`${rfc[3]}-${String(month).padStart(2,'0')}-${rfc[1].padStart(2,'0')}`:null)
  const validInstant=instant && observedDay && civilDay===observedDay ? instant : null
  return {publicationInstant:validInstant,publicationToDetectionHours:hours(validInstant,item.discoveredAt),detectionToFirstAttemptHours:hours(item.discoveredAt,item.firstAttemptAt),detectionToAvailabilityHours:hours(item.discoveredAt,item.availableAt),recoveryHours:hours(item.firstFailureAt,item.recoveredAt),publicationPrecision:validInstant?'instant prouvé':'jour ou date inconnue ; délai horaire non calculé'}
}
