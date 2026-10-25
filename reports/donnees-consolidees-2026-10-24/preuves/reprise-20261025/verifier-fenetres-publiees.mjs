// Execute the common financial guard/engine on the bytes actually published.
// This is distinct from a browser check and never recollects a supplier.
import fs from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {buildEtfMonthlyHistories} from '../../../../src/data/etf-monthly-history.js'
import {qualifyHistoryWindow} from '../../../../src/data/history-window-quality.js'
import {periodReturn} from '../../../../src/pages/performance-rankings/engine.js'
const folder=path.dirname(new URL(import.meta.url).pathname),root=process.argv[2]
if(!root)throw Error('Supply the read-only tree extracted from the actual publication manifest')
const publication=JSON.parse(fs.readFileSync(path.join(folder,'publication.json'))),manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json')))
const files=['src/data/automated-etf-monthly.json','src/data/non-bond-monthly-records.json'],data={},digests={}
for(const file of files){
 const bytes=fs.readFileSync(path.join(root,file)),digest=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')
 if(digest!==manifest.files[file])throw Error('Published registry hash mismatch: '+file)
 data[file]=JSON.parse(bytes);digests[file]=digest
}
const records={...data[files[0]],...Object.fromEntries(Object.entries(data[files[1]]).filter(([,r])=>r.consumerScope==='catalog'))},assets=buildEtfMonthlyHistories(records)
const original=JSON.parse(fs.readFileSync(path.join(folder,'../ishares-reprise-20261025/fenetres-79-apres.json')))
const rows=original.map(({isin,id,year})=>{
 const asset=assets[id],record=records[id],start=`${year-1}-12`,end=`${year}-12`
 if(!asset||asset.isin!==isin)throw Error('Missing or substituted exact share '+id)
 const qualification=qualifyHistoryWindow(asset,start,end),financial={...asset,basis:asset.valuationBasis??'adjusted'}
 let result
 try{result=periodReturn(financial,start,end);if(!qualification.qualified)throw Error('The engine bypassed its refusal')}catch(e){if(qualification.qualified)throw e;if(e.message!==qualification.reason)throw e}
 const file=data[files[1]][id]?.consumerScope==='catalog'?files[1]:files[0]
 return {isin,id,year,start,end,qualification,periodReturnPct:qualification.qualified?result:null,engineRefused:!qualification.qualified,
  basis:financial.basis,currency:asset.currency,sourceRegistry:file,sourceBlobSha:digests[file],checkedAt:record.checkedAt,periodEnd:record.periodEnd,sourceUrls:record.sourceUrls}
})
if(rows.length!==79||new Set(rows.map(r=>r.isin+'/'+r.year)).size!==79)throw Error('The original 79 cases must remain reconciled')
const result={capturedAt:new Date().toISOString(),publication,verification:'Shared guard and calculation engine executed on published registry bytes; browser proof is separate',total:rows.length,qualified:rows.filter(r=>r.qualification.qualified).length,refused:rows.filter(r=>!r.qualification.qualified).length,qualifiedParts:new Set(rows.filter(r=>r.qualification.qualified).map(r=>r.isin)).size,rows}
fs.writeFileSync(path.join(folder,'fenetres-79-publiees.json'),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({total:result.total,qualified:result.qualified,refused:result.refused,qualifiedParts:result.qualifiedParts}))
