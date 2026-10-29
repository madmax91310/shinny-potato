import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {qualifiedIssuerReturnWindows,historyAlerts} from './history-alerts.mjs'
const records=JSON.parse(readFileSync(new URL('../src/data/automated-etf-monthly.json',import.meta.url)))
const record=records.etc_wti_crude_oilNav
assert(qualifiedIssuerReturnWindows(record).some(w=>w.start==='2020-12'&&w.end==='2021-12'))
for(const mutate of [
 r=>{r.calendarProof.sourceRuntime.kind='local'},
 r=>{r.calendarProof.sourceRuntime.event='pull_request'},
 r=>{delete r.calendarProof.sourceRuntime.runId},
 r=>{delete r.responseSha256},
 r=>{r.calendarProof.navHistoryTransport='official-xlsx-post'},
 r=>{r.points=r.points.filter(([d])=>d!=='2021-06')},
 r=>{r.historyUnqualifiedReturnWindows=[{start:'2020-12',end:'2021-12',reason:'Still unqualified'}]},
]) {
 const r=structuredClone(record);mutate(r)
 assert(!qualifiedIssuerReturnWindows(r).some(w=>w.year===2021),'No absent, partial, unqualified, cached or CI-only interval can certify ordinary recovery')
}
const checks={};historyAlerts('2026-10-29',[],checks)
assert(checks['automated-etf-monthly:etc_wti_crude_oilNav'].qualifiedReturnWindows.some(w=>w.year===2021))
assert(!checks['automated-etf-monthly:etfGB00B15KXQ89'].qualifiedReturnWindows,'Old quotation is independent')
console.log('Monthly recovery evidence: ordinary source identity and exact valid intervals; old quotes, missing months, withheld windows and non-production controls remain independent.')
