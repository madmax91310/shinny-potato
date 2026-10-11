import HISTORY from './anniversary-index-history.json' with { type: 'json' }

// Reuse the exact official monthly histories already collected for anniversaries.
// Keep the short FTSE history in anniversaries; no ETF or factor variant substitutes.
export const SHARED_INDEX_HISTORY = Object.fromEntries(Object.entries(HISTORY)
  .filter(([id]) => id !== 'ftseAllWorld')
  .map(([id, record]) => [id, {
    ...record, icon: '📊', priceUnit: 'points', tweetPhrase: `l’indice ${record.label}`,
    sourceCredit: record.parser === 'msci' ? 'MSCI' : 'FTSE Russell',
    methodNote: `Indice ${record.label} en dollars, dividendes ${record.variant === 'NETR' ? 'nets' : 'bruts'} réinvestis, hors frais ; ce n’est pas la performance d’un ETF précis.`,
    points: record.points.map(([date, price]) => ({ date, price })),
  }]))
export const SHARED_INDEX_HISTORY_REVIEW = Object.fromEntries(Object.entries(SHARED_INDEX_HISTORY)
  .map(([id, record]) => [`history:${id}`, {
    sourceUrls: record.sourceUrls, checkedAt: record.checkedAt, asOf: null,
    periodStart: record.periodStart, periodEnd: record.periodEnd,
    dateStatus: 'month-only', sourceStatus: 'documented', method: record.method,
    note: `Historique officiel partagé, actualisé par la collecte existante des indices. SHA-256 ${record.responseSha256}.`,
  }]))
