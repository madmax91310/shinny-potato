// Source metadata survives lazy sharding. Nothing here upgrades a top list or
// turns an index exposure into a fund holding.
export function isSyntheticReplication(name,replication='') {
 return /swap|synth[eé]t|indirect|leveraged|daily.*2x/i.test(`${name} ${replication}`)
}
export function projectDcaHoldings(h,synthetic,sourceUrl) {
 if(!h||(synthetic&&h.basis!=='index'))return null
 const metadata=Object.fromEntries(['navReconciliation','subjectIsin','coverageProof','identityHistory','requestedListingTicker','qualifiedRankingListings','identityDiscoverySourceUrl','identityDiscoverySha256','checkedAt','sha256','method','methodCode','metadataSourceUrl','metadataSha256','metadataAsOf','scope','sourceUrls','index','indexId','approximation',
  'identitySourceUrl','identitySha256','identityAsOf','identityMethod','identityMethodCode','identityEvidenceRegistry','identitySourceFailures',
  'shareAsOf','shareSourceUrl','shareSha256','unidentifiedSecurityCount','unidentifiedWeightPct','excludedWeightPctByType']
  .filter(key=>h[key]!==undefined).map(key=>[key,h[key]]))
 return {...metadata,asOf:h.asOf,basis:h.basis||'fund',sourceUrl:h.sourceUrl||sourceUrl,
  complete:h.complete===true,rows:h.rows.map(r=>({name:r.name,isin:r.isin,weightPct:r.weightPct})),synthetic}
}
