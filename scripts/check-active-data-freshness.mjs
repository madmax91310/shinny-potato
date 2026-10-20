import {readFileSync,writeFileSync} from 'node:fs'
import {buildAssetFieldReport} from './report-asset-fields.mjs'
import {mergeCollectionReport} from './lib/data-incidents.mjs'
const report=buildAssetFieldReport()
const failures=report.rows.filter(r=>['instrument','equity','series','index'].includes(r.type) && r.present && ['check-overdue','publication-old','invalid-date','undated-check','undated-observation'].includes(r.state))
const errors=failures.map(r=>({id:`${r.id}:${r.field}`,field:r.label,category:r.state,error:`${r.state}; checked=${r.checkedAt??'unknown'}, published=${r.asOf??'unknown'}`,sourceUrl:r.sourceUrl,lastSuccessAt:r.checkedAt,lastAttemptAt:r.lastAttempt??null,evaluatedAt:report.checkedAt}))
const path=process.argv[2]
if(path){const previous=JSON.parse(readFileSync(path));const successes=report.rows.filter(r=>['instrument','equity','series','index'].includes(r.type)&&r.present&&r.state==='current').map(r=>({id:`${r.id}:${r.field}`}));writeFileSync(path,JSON.stringify(mergeCollectionReport(previous,errors,successes),null,2)+'\n')}
console.log(JSON.stringify({checkedAt:report.checkedAt,overdue:errors},null,2))
if(errors.length)process.exitCode=1
