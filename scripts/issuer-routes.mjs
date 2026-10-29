// Issuer access routes shared by the Node collectors and builders (issuer-access-routes.json).
import ROUTES from './issuer-access-routes.json' with { type: 'json' }
import identityMethods from './wisdomtree-identity-methods.json' with { type: 'json' }

export function qualifiedWisdomtreeApiMethod(record){
 return record?.identityMethodCode===identityMethods.nativeApiV1 ||
  (record?.identityMethodCode===undefined&&record?.identityMethod===identityMethods.legacyApiMethod)
}

export function wisdomtreeFactsheet(isin) {
  const route = ROUTES.wisdomtree
  return isin.startsWith(route.appliesToIsinPrefix) ? route.ucitsFactsheet.replace('{isin}', isin) : null
}

export function blackrockCharacteristicsEndpoint(url) {
  return url.includes('blackrock.com/varnish-api/') ? url.replace(/component=[^&]+/, `component=${ROUTES.blackrock.characteristicsComponents}`) : url
}

// Same bounded public product routes as Python; no cross-product/host alias.
export function wisdomtreeProductCandidates(url) {
  const match=/^https:\/\/www\.wisdomtree\.com\/[a-z]{2}(\/products\/(?:equities|commodities)\/[a-z0-9-]+)$/.exec(url)
  return match?[...new Set([url,...ROUTES.wisdomtree.productPageRegions.map(region=>`https://www.wisdomtree.com/${region}${match[1]}`),...(ROUTES.wisdomtree.productPageAliases?.[url]??[])])]:[url]
}

// URL encoding and parameter order do not identify a different financial share.
// A different listing remains admissible only with the exact factsheet row proof.
export function qualifiedWisdomtreeRankingsRoute(value,config,listingProofs=[]){
 try{
  if(!config)return false
  const url=new URL(value),base=new URL(ROUTES.wisdomtree.fundRankings)
  if(url.origin!==base.origin||url.pathname!==base.pathname||url.username||url.password||url.hash)return false
  const p=url.searchParams
  if([...p].length!==2||p.getAll('ticker').length!==1||p.getAll('isoCode').length!==1||p.get('isoCode')!=='en-GB')return false
  if(p.get('ticker')===config.fundTicker)return true
  return (config.rankingsListingAlternatives??[]).some(listing=>listing.ticker===p.get('ticker')&&listingProofs.some(proof=>
   ['ticker','exchange','tradingCurrency','exchangeTicker','ric','sedol'].every(key=>proof[key]===listing[key])))
 }catch{return false}
}
