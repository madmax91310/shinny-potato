import RECORDS from './automated-monthly.json' with { type: 'json' }
import GLOBAL from './global-equities.json' with { type: 'json' }
const identities = new Map(GLOBAL.map(a => [a.id, a]))

// Only successfully collected records enter the tools. Configuration alone never
// publishes an equity. Archive audits deliberately replay their original universe.
export const AUTOMATED_EQUITY_HISTORY = globalThis.process?.env?.MONTHLY_ARCHIVE_AUDIT === '1' ? {} : Object.fromEntries(
  Object.entries(RECORDS).filter(([id, r]) => r.consumerScope === 'equity' || identities.has(id)).map(([id, r]) => [id, {
    label: r.label, tweetPhrase: r.tweetPhrase ?? r.label, icon: r.icon ?? '📈', currency: r.currency,
    instrumentType: 'EQUITY', ticker: r.symbol, priceMethod: 'adjusted', returnNote: r.continuityNote ?? '',
    ...(r.isin ?? identities.get(id)?.isin ? {isin:r.isin ?? identities.get(id).isin} : {}),
    sourceCredit: 'Yahoo Finance · cours ajustés',
    points: r.points.map(([date, price]) => ({ date, price })),
    anniversaryPoints: r.anniversaryPoints.map(([date, price]) => ({ date, price })),
  }]),
)
