// Issuer access routes shared by the Node collectors and builders (issuer-access-routes.json).
import ROUTES from './issuer-access-routes.json' with { type: 'json' }

export function wisdomtreeFactsheet(isin) {
  const route = ROUTES.wisdomtree
  return isin.startsWith(route.appliesToIsinPrefix) ? route.ucitsFactsheet.replace('{isin}', isin) : null
}

export function blackrockCharacteristicsEndpoint(url) {
  return url.includes('blackrock.com/varnish-api/') ? url.replace(/component=[^&]+/, `component=${ROUTES.blackrock.characteristicsComponents}`) : url
}
