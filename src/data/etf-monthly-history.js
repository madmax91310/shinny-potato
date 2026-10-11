import RECORDS from './automated-etf-monthly.json' with { type: 'json' }

// Exact shares shared by the investment, performance and anniversary tools.
// Visual identities use exposure illustrations, never an invented issuer logo.
export const ETF_HISTORY_IDENTITIES = {
  etfImie: { icon: '🌍', scene: 'world', title: 'ACWI IMI', ticker: 'IMIE' },
  etfVwce: { icon: '🌍', scene: 'world', title: 'FTSE ALL-WORLD', ticker: 'VWCE' },
  etfEqualWeight: { icon: '🇺🇸', scene: 'america', title: 'S&P 500 EQUAL WEIGHT', ticker: 'XDEW' },
  etfMinVol: { icon: '🌍', scene: 'world', title: 'WORLD MINIMUM VOLATILITY', ticker: 'MVOL' },
  etfWqdv: { icon: '💰', scene: 'world', title: 'WORLD QUALITY DIVIDEND', ticker: 'WQDV' },
  etfTdiv: { icon: '💰', scene: 'world', title: 'DIVIDEND LEADERS', ticker: 'TDIV' },
  etfEpra: { icon: '🏢', scene: 'world', title: 'IMMOBILIER MONDIAL', ticker: 'EPRA' },
  etfCmod: { icon: '📦', scene: 'industry', title: 'BLOOMBERG COMMODITY', ticker: 'CMOD' },
  etfSemi: { icon: '💻', scene: 'chip', title: 'GLOBAL SEMICONDUCTORS', ticker: 'SEMI' },
  etfLock: { icon: '🔐', scene: 'chip', title: 'DIGITAL SECURITY', ticker: 'LOCK' },
}
export function buildEtfMonthlyHistories(records = RECORDS) {
  return Object.fromEntries(Object.entries(records)
    .filter(([, record]) => record.consumerScope === 'catalog')
    .map(([id, record]) => [id, {
      id, label: record.label, tweetPhrase: `l’ETF ${record.label}`, icon: ETF_HISTORY_IDENTITIES[id].icon,
      isin: record.isin, ticker: record.ticker, sourceCredit: 'Yahoo Finance',
      mic: record.mic, currency: record.currency, priceMethod: 'adjusted',
      periodStart: record.periodStart, periodEnd: record.periodEnd,
      checkedAt: record.checkedAt, method: record.method, sourceUrls: record.sourceUrls,
      points: record.points.map(([date, price]) => ({ date, price })),
      ...(record.anniversaryPoints?.length ? { anniversaryPoints: record.anniversaryPoints.map(([date, price]) => ({ date, price })) } : {}),
    }]))
}
export const ETF_MONTHLY_HISTORIES = globalThis.process?.env?.MONTHLY_ARCHIVE_AUDIT === '1' ? {} : buildEtfMonthlyHistories()
