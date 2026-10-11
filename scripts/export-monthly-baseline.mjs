import { ASSETS } from '../src/data/market-history.js';
import { MARKET_HISTORY_REVIEW } from '../src/data/market-history-review.js';
import { ETF_MONTHLY_HISTORIES } from '../src/data/etf-monthly-history.js';
console.log(JSON.stringify(Object.fromEntries(Object.entries({ ...ASSETS, ...ETF_MONTHLY_HISTORIES }).map(([id, asset]) => [id, {
  currency: asset.currency, points: asset.points, anniversaryPoints: asset.anniversaryPoints,
  review: MARKET_HISTORY_REVIEW[`history:${id}`],
}]))));
