import {readFileSync,writeFileSync} from 'node:fs'
import {buildAssetFieldReport} from './report-asset-fields.mjs'
const report=buildAssetFieldReport()
const failures=report.rows.filter(r=>['instrument','equity','series','index'].includes(r.type) && r.present && ['check-overdue','publication-old','invalid-date','undated-check','undated-observation'].includes(r.state))
const errors=failures.map(r=>({id:`${r.id}:${r.field}`,field:r.label,error:`${r.state}; checked=${r.checkedAt??'unknown'}, published=${r.asOf??'unknown'}`,sourceUrl:r.sourceUrl}))
const path=process.argv[2]
if(path){const previous=JSON.parse(readFileSync(path));const failed=new Set([...(previous.errors??[]),...errors].map(r=>r.id));const successes=report.rows.filter(r=>['instrument','equity','series','index'].includes(r.type)&&r.present&&r.state==='current'&&!failed.has(`${r.id}:${r.field}`)).map(r=>({id:`${r.id}:${r.field}`}));writeFileSync(path,JSON.stringify({...previous,successes:[...(previous.successes??[]),...successes],errors:[...(previous.errors??[]),...errors]},null,2)+'\n')}
console.log(JSON.stringify({checkedAt:report.checkedAt,overdue:errors},null,2))
if(errors.length)process.exitCode=1
