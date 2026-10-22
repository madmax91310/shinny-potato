// Calendar weeks are local civil weeks, including 23/25-hour DST days.
export const WEEKLY_WINDOW={timezone:'Europe/Paris',startDay:'monday',deadline:'sunday-23:59:59',missingDecision:'keep-positions'}
const shift=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10)
function civilDate(at,timezone){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at));return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-')}
function midnight(date,timezone){
 const target=Date.parse(date+'T00:00:00Z');let value=target
 for(let i=0;i<4;i++){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));const get=k=>parts.find(p=>p.type===k).value;const local=Date.parse(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`);value+=target-local}
 return new Date(value).toISOString()
}
export function weeklyWindow(at,rule=WEEKLY_WINDOW){
 const local=civilDate(at,rule.timezone),weekday=new Date(local+'T12:00:00Z').getUTCDay(),start=shift(local,-((weekday+6)%7)),next=shift(start,7),endExclusive=midnight(next,rule.timezone)
 return {key:start,startDate:start,endDate:shift(next,-1),startAt:midnight(start,rule.timezone),endExclusive,deadlineAt:new Date(Date.parse(endExclusive)-1000).toISOString(),timezone:rule.timezone}
}
export function weeklyStatus(comp,at=new Date().toISOString()){
 if(comp.config.frequency!=='weekly')return null
 const window=weeklyWindow(at,comp.config.weeklyWindow)
 return {...window,participants:comp.config.participants.map(p=>{const decision=comp.decisions.findLast(d=>d.participant===p.id&&d.status!=='cancelled'&&weeklyWindow(d.registeredAt,comp.config.weeklyWindow).key===window.key);return {...p,received:!!decision,status:decision?.status??'missing',decisionId:decision?.id}})}
}
export function decisionSchedule(at,config){
 // Weekly answers share a deadline. Registration after it belongs to the next week.
 return config.frequency==='weekly'?weeklyWindow(at,config.weeklyWindow).deadlineAt:at
}
export function frequencyText(c){return c.frequency==='weekly'?`Une décision par semaine civile, lundi 00:00 inclus à dimanche 23:59:59 (${c.weeklyWindow.timezone}). Sans réponse : positions et liquidités conservées, aucune décision inventée.`:c.frequency==='monthly'?'Une décision par mois UTC d’enregistrement, conservation comprise.':'Fréquence libre.'}
