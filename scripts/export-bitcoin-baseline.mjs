// Export the existing registry at runtime; never duplicate prices in the pilot.
import { ASSETS } from '../src/data/market-history.js';
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js';
console.log(JSON.stringify({ assetId: 'bitcoin', currency: ASSETS.bitcoin.currency,
  points: ASSETS.bitcoin.points, evidence: MARKET_HISTORY_REVIEW['history:bitcoin'] }));
