import RECORDS from './automated-etf-monthly.json' with { type: 'json' }

// Exact shares shared by the investment, performance and anniversary tools.
// Visual identities use exposure illustrations, never an invented issuer logo.
export const ETF_HISTORY_IDENTITIES = {
  etf_water_ishares: {icon:'🌍',scene:'world',title:"GLOBAL WATER",ticker:"DH2O"},
  etf_agribusiness_ishares: {icon:'🌍',scene:'world',title:"AGRIBUSINESS USD (ACC)",ticker:"ISAG"},
  etf_world_staples: {icon:'🌍',scene:'world',title:"MSCI WORLD CONSUMER STAPLES SECTOR ADVANCED",ticker:"WCSS"},
  etf_world_discretionary: {icon:'🌍',scene:'world',title:"MSCI WORLD CONSUMER DISCRETIONARY SECTOR ADVANCED",ticker:"WCDS"},
  etf_world_energy: {icon:'🌍',scene:'world',title:"MSCI WORLD ENERGY SECTOR",ticker:"WENS"},
  etf_world_communication: {icon:'🌍',scene:'world',title:"MSCI WORLD COMMUNICATION SERVICES SECTOR ADVANCED",ticker:"WCMS"},
  etf_private_equity_ishares: {icon:'🌍',scene:'world',title:"LISTED PRIVATE EQUITY",ticker:"IQQL"},
  etcPalladium: { icon: '⚪', scene: 'industry', title: 'PALLADIUM PHYSIQUE', ticker: 'IPDM' },
  etcPlatinum: { icon: '⚪', scene: 'industry', title: 'PLATINE PHYSIQUE', ticker: 'IPLT' },
  etfAvantisSmallValue: { icon: '🌍', scene: 'world', title: 'SMALL CAP VALUE', ticker: 'AVWS' },
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
