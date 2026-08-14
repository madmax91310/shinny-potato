const BASE_URL = 'https://api.twelvedata.com/quote'

// Récupère la cotation d'un symbole action/ETF via Twelve Data.
// Lève une erreur avec un flag `quotaExceeded` quand le tier gratuit est dépassé.
export async function fetchStockQuote(symbol, apiKey) {
  const url = `${BASE_URL}?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`

  let response
  try {
    response = await fetch(url)
  } catch {
    const err = new Error('Impossible de contacter Twelve Data (réseau indisponible).')
    throw err
  }

  if (!response.ok && response.status !== 200) {
    const err = new Error(`Erreur Twelve Data (HTTP ${response.status}).`)
    err.quotaExceeded = response.status === 429
    throw err
  }

  const data = await response.json()

  // Twelve Data renvoie un code d'erreur dans le corps même avec un HTTP 200.
  if (data.code && data.code !== 200) {
    const err = new Error(data.message || `Erreur Twelve Data (code ${data.code}).`)
    err.quotaExceeded = data.code === 429
    err.invalidSymbol = data.code === 400 || data.code === 404
    throw err
  }

  const price = Number(data.close ?? data.price)
  if (!Number.isFinite(price)) {
    throw new Error(`Réponse Twelve Data invalide pour ${symbol}.`)
  }
  return price
}
