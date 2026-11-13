// Exhausting an issuer's Fund ranking does not prove its NAV denominator.
// A native reconciled book has a distinct source contract, never this tag.
export function unqualifiedFundRankingWeights(observation) {
  const rankedSource = /^https:\/\/dataspanapi\.wisdomtree\.com\/funddetails\/rankings\//.test(observation?.sourceUrl ?? '')
  return Boolean(observation?.weightBasis === 'issuer-fund-ranking-unqualified-nav-denominator' ||
    (observation?.basis === 'fund' && ((rankedSource && observation?.rankClassificationID === 1) ||
      (observation?.coverageProof?.rankClassificationID === 1 && observation?.coverageProof?.rankClassification === 'Fund'))))
}
