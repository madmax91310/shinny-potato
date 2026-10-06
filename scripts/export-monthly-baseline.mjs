import { ASSETS } from '../src/data/market-history.js';
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js';
console.log(JSON.stringify(Object.fromEntries(Object.entries(ASSETS).map(([id, asset]) => [id, {
  currency: asset.currency, points: asset.points, anniversaryPoints: asset.anniversaryPoints,
  review: MARKET_HISTORY_REVIEW[`history:${id}`],
}]))));
