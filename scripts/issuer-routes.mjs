// Issuer access routes shared by the Node collectors and builders (issuer-access-routes.json).
import ROUTES from './issuer-access-routes.json' with { type: 'json' }

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
