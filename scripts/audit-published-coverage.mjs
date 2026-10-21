import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const PROOF_FIELDS=['present','automationConfigured','state','checkedAt','asOf','sourceUrl']
const key=row=>`${row.type}:${row.id}:${row.field}`
export function publishedCoverageIssues(published,inventory,holdingsSources){
 assert(Array.isArray(published?.rows)&&Array.isArray(inventory?.coverage?.rows),'Two published field reports are required')
 const expected=new Map(inventory.coverage.rows.map(row=>[key(row),row])),seen=new Set(),issues=[]
 for(const row of published.rows){
  const id=key(row),other=expected.get(id)
  if(seen.has(id))issues.push(`${id}: duplicate public certificate`)
  seen.add(id)
  if(!other){issues.push(`${id}: missing inventory certificate`);continue}
  for(const name of PROOF_FIELDS)if(row[name]!==other[name])issues.push(`${id}: ${name} differs between public reports`)
  if(holdingsSources&&row.field==='completeHoldings'&&row.automationConfigured!==holdingsSources.has(row.id))issues.push(`${id}: configured collector differs from generated sources`)
 }
 for(const id of expected.keys())if(!seen.has(id))issues.push(`${id}: missing public field certificate`)
 return issues
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const root=resolve(process.argv[2]??'dist'),read=path=>JSON.parse(readFileSync(path,'utf8'))
 const published=read(resolve(root,'data/asset-field-coverage.json')),inventory=read(resolve(root,'data/data-automation-inventory.json'))
 const holdings=new Set(Object.keys({...read('scripts/dca-complete-holdings-sources.json'),...read('scripts/generated-holdings-sources.json')}))
 const issues=publishedCoverageIssues(published,inventory,holdings)
 assert.deepEqual(issues,[],'Published certificates must agree with each other and with the configured collectors')
 console.log(`Published coverage: ${published.rows.length} field certificates agree with the inventory and generated collection targets.`)
}
