import RECORDS from './automated-etf-monthly.json' with { type: 'json' }

// Ready for explicit tool connections; collecting a part does not expose it
// automatically in the existing selectors or change their editorial formats.
export function buildEtfMonthlyHistories(records = RECORDS) {
  return Object.fromEntries(Object.entries(records)
    .filter(([, record]) => record.consumerScope === 'catalog')
    .map(([id, record]) => [id, {
      id, label: record.label, isin: record.isin, ticker: record.ticker,
      mic: record.mic, currency: record.currency, priceMethod: 'adjusted',
      periodStart: record.periodStart, periodEnd: record.periodEnd,
      checkedAt: record.checkedAt, method: record.method, sourceUrls: record.sourceUrls,
      points: record.points.map(([date, price]) => ({ date, price })),
    }]))
}
export const ETF_MONTHLY_HISTORIES = buildEtfMonthlyHistories()
