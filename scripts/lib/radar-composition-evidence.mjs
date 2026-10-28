import {createHash} from 'node:crypto'
import {residualCategory} from '../../src/lib/radar-composition.js'
// Retain the exact category universe alongside each scalar signal. The Radar
// never repairs or renormalises the financial registry it reads.
export function compositionEvidence(block,{isin,basis,currency,sourceUrl,checkedAt,dimension}) {
  const categories=block.rows.map(r=>({name:r.name??r.label,weightPct:r.weightPct}))
  const sourceHash=block.sha256??createHash('sha256').update(JSON.stringify({asOf:block.asOf,categories,method:block.method,sourceComponent:block.sourceComponent})).digest('hex')
  return {version:1,identity:isin,basis,currency:currency??null,unit:'%',asOf:block.asOf,checkedAt: block.checkedAt??checkedAt,sourceUrl:block.sourceUrl??sourceUrl,sourceHash,hashMethod:block.sha256?'source-document':'allocation-projection',
    method:block.method??block.sourceComponent??dimension,classification:block.classification??block.sourceComponent??dimension,
    weightConvention:block.weightConvention??(/gross|brut/i.test(block.method??'')?'documented-gross-exposure':'net-asset-value'),
    categories,rowCount:categories.length,categoryCount:new Set(categories.map(r=>r.name)).size,total:categories.reduce((s,r)=>s+r.weightPct,0),
    onlyResidual:categories.every(r=>residualCategory(r.name)),complete:block.complete===true,
    ...(block.confirmation?{confirmation:block.confirmation}:{})}
}

export function compositionEventKey(block,snapshot,dimension,isin,basis){
 const proof=block.sharedFundEvidence
 const shared=basis==='fund'&&block.sharedFundId&&proof?.fundId===block.sharedFundId&&proof.kind==='same-fund-allocation'&&proof.shareClassIndependent===true&&proof.method&&/^https:\/\//.test(proof.sourceUrl??'')&&/^[a-f0-9]{64}$/.test(proof.sourceHash??'')
 const allocationHash=createHash('sha256').update(JSON.stringify([snapshot.categories,snapshot.method,snapshot.weightConvention])).digest('hex')
 return JSON.stringify([shared?block.sharedFundId:isin,dimension,basis,block.asOf,shared?allocationHash:snapshot.sourceHash])
}
