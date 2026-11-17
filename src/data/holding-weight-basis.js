// Exhausting an issuer's Fund ranking does not prove its NAV denominator.
// A native reconciled book has a distinct source contract, never this tag.
export function unqualifiedFundRankingWeights(observation) {
  const rankedSource = /^https:\/\/dataspanapi\.wisdomtree\.com\/funddetails\/rankings\//.test(observation?.sourceUrl ?? '')
  return Boolean(observation?.weightBasis === 'issuer-fund-ranking-unqualified-nav-denominator' ||
    (observation?.basis === 'fund' && ((rankedSource && observation?.rankClassificationID === 1) ||
      (observation?.coverageProof?.rankClassificationID === 1 && observation?.coverageProof?.rankClassification === 'Fund'))))
}

// The producer separately proves the complete exact physical fund book. This
// lightweight reader checks that its projection retains the same route/part proof.
function invescoNativeTopTenSource(n){
 const m=/^https:\/\/dng-api\.invesco\.com\/cache\/v1\/accounts\/(fr_FR|en_GB)\/shareclasses\/([A-Z]{2}[A-Z0-9]{9}[0-9])\/holdings\/index\?idType=isin&loadType=initial$/.exec(n.sourceUrl||'')
 const c=n.coverageProof
 return Boolean(m&&m[2]===n.subjectIsin&&n.sourceContract==='invesco-physical-fund-exposure-v1'
  &&n.metadataSourceUrl===`https://dng-api.invesco.com/cache/v1/accounts/${m[1]}/shareclasses/${m[2]}?idType=isin`
  &&/^[a-f0-9]{64}$/.test(n.metadataSha256||'')&&/^[a-f0-9]{64}$/.test(n.identitySha256||'')
  &&n.identitySourceUrl===`https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/${m[2]}_factsheet_en.pdf`
  &&Number.isFinite(Date.parse(n.metadataAsOf))&&Date.parse(n.metadataAsOf)<=Date.parse(n.checkedAt)
  &&c?.pageUrl?.startsWith(`https://www.invesco.com/${m[1]==='fr_FR'?'fr/fr':'uk/en'}/financial-products/etfs/`)
  &&c.pageUrl.endsWith('.html')&&c.asOf===n.asOf&&c.normalizationApplied===false&&Number.isInteger(c.publisherRowCount)
  &&c.publisherRowCount>=n.sourceSecurityRows&&n.sourceSecurityRows>=11
  &&['issuer-physical-replicated-fund-public-table','issuer-physical-sampled-fund-public-table'].includes(c.kind))
}

// Presentation-only projection; never a full holdings or exact-index admission.
export function chooseNativeFundTopTen(isin,previous,native){
 if(native?.subjectIsin!==isin||native.basis!=='fund'||native.complete!==false||
  native.scope!=='top-10-companies'||native.weightBasis!=='fund-nav'||native.topCompaniesCertified!==true||
  !/^[a-f0-9]{64}$/.test(native.sha256||'')||!native.checkedAt||!/^\d{4}-\d{2}-\d{2}$/.test(native.asOf||'')||
  !(/^https:\/\/www\.wisdomtree\.com\/api\/fund-holdings\/\d+$/.test(native.sourceUrl||'')||invescoNativeTopTenSource(native))||
  native.rows?.length!==10||!native.rows.every(r=>r.name&&Number.isFinite(r.weightPct)&&r.weightPct>=0&&r.weightPct<=100)||
  native.rows.reduce((sum,r)=>sum+r.weightPct,0)>100)return previous
 return previous&&!unqualifiedFundRankingWeights(previous)&&previous.asOf>native.asOf?previous:native
}
