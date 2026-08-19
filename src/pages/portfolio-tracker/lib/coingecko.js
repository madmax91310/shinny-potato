const BASE_URL = 'https://api.coingecko.com/api/v3/simple/price'

// Récupère le prix (en USD) d'une liste d'identifiants CoinGecko.
// Retourne { [id]: price } et lève une erreur explicite en cas de souci réseau/quota.
export async function fetchCryptoPrices(ids) {
  if (!ids || ids.length === 0) return {}

  const url = `${BASE_URL}?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd`

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Impossible de contacter CoinGecko (réseau indisponible).')
  }

  if (response.status === 429) {
    throw new Error('Quota CoinGecko dépassé, nouvelle tentative au prochain cycle.')
  }
  if (!response.ok) {
    throw new Error(`Erreur CoinGecko (HTTP ${response.status}).`)
  }

  const data = await response.json()
  const result = {}
  for (const id of ids) {
    if (data[id] && typeof data[id].usd === 'number') {
      result[id] = data[id].usd
    }
  }
  return result
}
