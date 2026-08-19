// Mapping des tickers crypto les plus courants vers leur identifiant CoinGecko.
// Pour un ticker inconnu, on retombe sur le ticker en minuscule (fonctionne pour
// une partie des cas, sinon l'utilisateur peut ajuster via le champ "ID CoinGecko").
export const COINGECKO_ID_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  TRX: 'tron',
  TON: 'the-open-network',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  POL: 'polygon-ecosystem-token',
  LTC: 'litecoin',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
  ATOM: 'cosmos',
  UNI: 'uniswap',
  XLM: 'stellar',
  XMR: 'monero',
  ETC: 'ethereum-classic',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  NEAR: 'near',
  SHIB: 'shiba-inu',
  USDT: 'tether',
  USDC: 'usd-coin',
  DAI: 'dai',
  FIL: 'filecoin',
  ICP: 'internet-computer',
  APE: 'apecoin',
  SUI: 'sui',
  PEPE: 'pepe',
  INJ: 'injective-protocol',
  RNDR: 'render-token',
  HBAR: 'hedera-hashgraph',
  VET: 'vechain',
  ALGO: 'algorand',
}

export function tickerToCoingeckoId(ticker) {
  const upper = (ticker || '').trim().toUpperCase()
  if (COINGECKO_ID_MAP[upper]) return COINGECKO_ID_MAP[upper]
  return ticker.trim().toLowerCase()
}
