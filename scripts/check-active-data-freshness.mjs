import {readFileSync,writeFileSync} from 'node:fs'
import {buildAssetFieldReport} from './report-asset-fields.mjs'
import {mergeCollectionReport} from './lib/data-incidents.mjs'
const report=buildAssetFieldReport()
const requested=process.argv.indexOf('--only')
const fields=new Set(JSON.parse(readFileSync(new URL('./instrument-metadata-fields.json',import.meta.url))))
const known=new Set(JSON.parse(readFileSync(new URL('./instrument-metadata-sources.json',import.meta.url))).instruments.map(r=>r.isin))
let rows=report.rows.filter(r=>known.has(r.id)&&fields.has(r.field))
if(requested!==-1){
 const ids=[...new Set(process.argv.slice(requested+1).flatMap(s=>s.trim().toUpperCase().split(/[,\s]+/)).filter(Boolean))]
 if(!ids.length||ids.some(id=>!known.has(id)))throw Error('Ciblage de fraîcheur vide ou non enregistré')
 const selected=new Set(ids);rows=rows.filter(r=>selected.has(r.id))
}
const failures=rows.filter(r=>['instrument','equity','series','index'].includes(r.type) && r.present && ['check-overdue','publication-old','invalid-date','undated-check','undated-observation'].includes(r.state))
const errors=failures.map(r=>({id:`${r.id}:${r.field}`,field:r.label,category:r.state,error:`${r.state}; checked=${r.checkedAt??'unknown'}, published=${r.asOf??'unknown'}`,sourceUrl:r.sourceUrl,lastSuccessAt:r.checkedAt,lastAttemptAt:r.lastAttempt??null,evaluatedAt:report.checkedAt}))
const path=process.argv[2]
// Reading a still-current cache is not a successful source consultation. Keep
// only successes emitted by the actual collector; this guard may add failures.
if(path){const previous=JSON.parse(readFileSync(path));writeFileSync(path,JSON.stringify(mergeCollectionReport(previous,errors,[]),null,2)+'\n')}
console.log(JSON.stringify({checkedAt:report.checkedAt,overdue:errors},null,2))
if(errors.length)process.exitCode=1
