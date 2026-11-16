import {completeEquitySleeve,holdingsReconciliationDetails} from '../../src/data/holdings-reconciliation.js'
import {calculateConcentration} from '../../src/data/index-concentration-core.js'
import {unqualifiedFundRankingWeights} from '../../src/data/holding-weight-basis.js'
import {qualifiedWisdomtreeApiMethod} from '../issuer-routes.mjs'
import invescoContracts from '../invesco-physical-holdings-contracts.json' with {type:'json'}


// Separate exact-fund contract: never a native benchmark or a partial basket.
function qualifiedInvescoBook(book,isin,share){
 const p=holdingsReconciliationDetails(book),c=book?.coverageProof
 if(!p||book.complete!==true||book.synthetic===true||book.sourcePartial||book.unvaluedPositions?.length||book.subjectIsin!==isin||book.approximation
  ||book.methodCode!==invescoContracts.methodCode||p.unidentifiedPositions.length
  ||new Set(book.rows.map(r=>r.isin)).size!==book.rows.length
  ||c?.normalizationApplied!==false||c.asOf!==book.asOf||c.publisherRowCount!==p.sourceRowCount
  ||c.pageTitle!==share.shareName||!Number.isFinite(Date.parse(book.checkedAt))||!/^\d{4}-\d{2}-\d{2}$/.test(book.metadataAsOf||'')
  ||!Number.isFinite(Date.parse(book.metadataAsOf))||new Date(book.metadataAsOf).toISOString().slice(0,10)!==book.metadataAsOf
  ||!/^\d{4}-\d{2}-\d{2}$/.test(book.asOf||'')||!Number.isFinite(Date.parse(book.asOf))
  ||new Date(book.asOf).toISOString().slice(0,10)!==book.asOf||Date.parse(book.asOf)>Date.parse(book.checkedAt)
  ||Date.parse(book.metadataAsOf)>Date.parse(book.checkedAt)
  ||!/^[a-f0-9]{64}$/.test(book.metadataSha256||'')||!/^[a-f0-9]{64}$/.test(book.identitySha256||'')
  ||book.identitySourceUrl!==`https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/${isin}_factsheet_en.pdf`
  ||c.kind!==(share.mandate==='full-physical-replication'?'issuer-physical-replicated-fund-public-table':'issuer-physical-sampled-fund-public-table')
  ||Object.keys(p.sourceWeightPctByType).some(k=>!['Equity','Cash and/or Derivatives'].includes(k))
  ||Object.entries(p.excludedWeightPctByType).some(([k,v])=>!['Equity','Cash and/or Derivatives'].includes(k)||(k==='Equity'&&v!==0))
  ||Math.abs(p.publishedNetWeightPct-100)>p.sourceRowCount*.00005+.0001)return false
 const routes=[{account:invescoContracts.account,pageUrl:share.pageUrl},...Object.values(share.qualifiedRoutes||{})]
 return routes.some(r=>c.pageUrl===r.pageUrl
  &&book.sourceUrl===`https://dng-api.invesco.com/cache/v1/accounts/${r.account}/shareclasses/${isin}/holdings/index?idType=isin&loadType=initial`
  &&book.metadataSourceUrl===`https://dng-api.invesco.com/cache/v1/accounts/${r.account}/shareclasses/${isin}?idType=isin`)
}

export function projectNativeFundDetails(books,classes,identities){
 const result={}
 const sources={...classes,...invescoContracts.shares}
 for(const [isin,config]of Object.entries(sources)){
  const book=books[isin]
  const invesco=Object.hasOwn(invescoContracts.shares,isin)
  if(invesco?!qualifiedInvescoBook(book,isin,config):(!book||book.sourceUrl!==`https://www.wisdomtree.com/api/fund-holdings/${config.classId}`||
   unqualifiedFundRankingWeights(book)||!qualifiedWisdomtreeApiMethod(book)||!completeEquitySleeve(book,isin)))continue
  const concentration=calculateConcentration(book,identities)
  if(!concentration.available)continue
  result[isin]={subjectIsin:isin,asOf:book.asOf,checkedAt:book.checkedAt,sourceUrl:book.sourceUrl,
   sha256:book.sha256,basis:'fund',scope:'top-10-companies',complete:false,
   weightBasis:'fund-nav',topCompaniesCertified:true,sourceSecurityRows:book.rows.length,
   identitySourceUrl:book.identitySourceUrl,identitySha256:book.identitySha256,
   ...(invesco?{sourceContract:invescoContracts.methodCode,coverageProof:book.coverageProof,
    metadataSourceUrl:book.metadataSourceUrl,metadataSha256:book.metadataSha256,metadataAsOf:book.metadataAsOf}:{}),
   excludedWeightPctByType:book.navReconciliation.excludedWeightPctByType,
   method:'Top ten economic companies consolidated with the common qualified issuer identities from the exact native fund book; original fund NAV weights and cash retained; not an index or complete holdings projection',
   rows:concentration.top.map(row=>({name:row.name,weightPct:row.weightPct,securities:row.securities}))}
 }
 return result
}
