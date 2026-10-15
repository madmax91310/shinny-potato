import RECORDS from './automated-monthly.json' with { type: 'json' }

// Only successfully collected records enter the tools. Configuration alone never
// publishes an equity. Archive audits deliberately replay their original universe.
export const AUTOMATED_EQUITY_HISTORY = globalThis.process?.env?.MONTHLY_ARCHIVE_AUDIT === '1' ? {} : Object.fromEntries(
  Object.entries(RECORDS).filter(([, r]) => r.consumerScope === 'equity').map(([id, r]) => [id, {
    label: r.label, tweetPhrase: r.tweetPhrase, icon: r.icon, currency: r.currency,
    instrumentType: 'EQUITY', ticker: r.symbol, priceMethod: 'adjusted', returnNote: '',
    points: r.points.map(([date, price]) => ({ date, price })),
    anniversaryPoints: r.anniversaryPoints.map(([date, price]) => ({ date, price })),
  }]),
)
