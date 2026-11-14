import {completeEquitySleeve} from '../../src/data/holdings-reconciliation.js'
import {calculateConcentration} from '../../src/data/index-concentration-core.js'
import {unqualifiedFundRankingWeights} from '../../src/data/holding-weight-basis.js'
import {qualifiedWisdomtreeApiMethod} from '../issuer-routes.mjs'

export function projectNativeFundDetails(books,classes,identities){
 const result={}
 for(const [isin,config]of Object.entries(classes)){
  const book=books[isin]
  if(!book||book.sourceUrl!==`https://www.wisdomtree.com/api/fund-holdings/${config.classId}`||
   unqualifiedFundRankingWeights(book)||!qualifiedWisdomtreeApiMethod(book)||!completeEquitySleeve(book,isin))continue
  const concentration=calculateConcentration(book,identities)
  if(!concentration.available)continue
  result[isin]={subjectIsin:isin,asOf:book.asOf,checkedAt:book.checkedAt,sourceUrl:book.sourceUrl,
   sha256:book.sha256,basis:'fund',scope:'top-10-companies',complete:false,
   weightBasis:'fund-nav',topCompaniesCertified:true,sourceSecurityRows:book.rows.length,
   identitySourceUrl:book.identitySourceUrl,identitySha256:book.identitySha256,
   excludedWeightPctByType:book.navReconciliation.excludedWeightPctByType,
   method:'Top ten economic companies consolidated with the common qualified issuer identities from the exact native fund book; original fund NAV weights and cash retained; not an index or complete holdings projection',
   rows:concentration.top.map(row=>({name:row.name,weightPct:row.weightPct,securities:row.securities}))}
 }
 return result
}
