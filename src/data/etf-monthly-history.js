import { ETF_HISTORY_IDENTITIES } from './etf-history-identities.js'
export { ETF_HISTORY_IDENTITIES } from './etf-history-identities.js'
import BASE_RECORDS from './automated-etf-monthly.json' with { type: 'json' }

import NON_BOND_RECORDS from './non-bond-monthly-records.json' with { type:'json' };
const RECORDS={...BASE_RECORDS,...Object.fromEntries(Object.entries(NON_BOND_RECORDS).filter(([,r])=>r.consumerScope==='catalog'))};
// Exact shares shared by the investment, performance and anniversary tools.
// Visual identities use exposure illustrations, never an invented issuer logo.
export function buildEtfMonthlyHistories(records = RECORDS) {
  return Object.fromEntries(Object.entries(records)
    .filter(([, record]) => record.consumerScope === 'catalog')
    .map(([id, record]) => [id, {
      id, label: record.label, instrumentType: record.instrumentType || 'ETF', tweetPhrase: `l’${record.instrumentType || 'ETF'} ${record.label}`, icon: ETF_HISTORY_IDENTITIES[id].icon,
      isin: record.isin, ticker: record.ticker, sourceCredit: 'Yahoo Finance',
      mic: record.mic, currency: record.currency, priceMethod: 'adjusted',
      periodStart: record.periodStart, periodEnd: record.periodEnd,
      checkedAt: record.checkedAt, method: record.method, sourceUrls: record.sourceUrls,
      points: record.points.map(([date, price]) => ({ date, price })),
      ...(record.anniversaryPoints?.length ? { anniversaryPoints: record.anniversaryPoints.map(([date, price]) => ({ date, price })) } : {}),
    }]))
}
export const ETF_MONTHLY_HISTORIES = globalThis.process?.env?.MONTHLY_ARCHIVE_AUDIT === '1' ? {} : buildEtfMonthlyHistories()
