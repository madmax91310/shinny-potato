// Exhausting an issuer's Fund ranking does not prove its NAV denominator.
// A native reconciled book has a distinct source contract, never this tag.
export function unqualifiedFundRankingWeights(observation) {
  const rankedSource = /^https:\/\/dataspanapi\.wisdomtree\.com\/funddetails\/rankings\//.test(observation?.sourceUrl ?? '')
  return Boolean(observation?.weightBasis === 'issuer-fund-ranking-unqualified-nav-denominator' ||
    (observation?.basis === 'fund' && ((rankedSource && observation?.rankClassificationID === 1) ||
      (observation?.coverageProof?.rankClassificationID === 1 && observation?.coverageProof?.rankClassification === 'Fund'))))
}

// Presentation-only projection; never a full holdings or exact-index admission.
export function chooseNativeFundTopTen(isin,previous,native){
 if(native?.subjectIsin!==isin||native.basis!=='fund'||native.complete!==false||
  native.scope!=='top-10-companies'||native.weightBasis!=='fund-nav'||native.topCompaniesCertified!==true||
  !/^[a-f0-9]{64}$/.test(native.sha256||'')||!native.checkedAt||!/^\d{4}-\d{2}-\d{2}$/.test(native.asOf||'')||
  !/^https:\/\/www\.wisdomtree\.com\/api\/fund-holdings\/\d+$/.test(native.sourceUrl||'')||
  native.rows?.length!==10||!native.rows.every(r=>r.name&&Number.isFinite(r.weightPct)&&r.weightPct>=0&&r.weightPct<=100)||
  native.rows.reduce((sum,r)=>sum+r.weightPct,0)>100)return previous
 return previous&&!unqualifiedFundRankingWeights(previous)&&previous.asOf>native.asOf?previous:native
}
