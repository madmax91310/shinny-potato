import { NON_BOND_HISTORY_IDENTITIES } from './non-bond-expansion.js';
import BASE_RECORDS from './automated-etf-monthly.json' with { type: 'json' }

import NON_BOND_RECORDS from './non-bond-monthly-records.json' with { type:'json' };
const RECORDS={...BASE_RECORDS,...Object.fromEntries(Object.entries(NON_BOND_RECORDS).filter(([,r])=>r.consumerScope==='catalog'))};
// Exact shares shared by the investment, performance and anniversary tools.
// Visual identities use exposure illustrations, never an invented issuer logo.
export const ETF_HISTORY_IDENTITIES = {
 etfWorldEurHedged:{icon:'🌍',scene:'world',title:'WORLD COUVERT EUR',ticker:'IBCH'},
 etfEuroGovt57:{icon:'📅',scene:'world',title:'OBLIGATIONS EURO 5–7 ANS',ticker:'EUN9'},
 etfEuropeProperty:{icon:'🏢',scene:'world',title:'IMMOBILIER EUROPE HORS UK',ticker:'IQQP'},
 etfIbondsEuro2029:{icon:'📅',scene:'world',title:'OBLIGATIONS EURO 2029',ticker:'29GA'},
 etfEuropeUtilities:{icon:'💡',scene:'industry',title:'SERVICES PUBLICS EUROPE',ticker:'EXH9'},
 etfEuropeTelecom:{icon:'📡',scene:'industry',title:'TELECOMS EUROPE',ticker:'EXV2'},
 etfEuropeConstruction:{icon:'🏗️',scene:'industry',title:'CONSTRUCTION EUROPE',ticker:'EXV8'},
 etfEmSmallCap:{icon:'🌏',scene:'world',title:'SMALL CAPS EMERGENTES',ticker:'IEMS'},
 etfCopperMiners:{icon:'⛏️',scene:'industry',title:'MINES DE CUIVRE',ticker:'COPX'},
 ...NON_BOND_HISTORY_IDENTITIES,
 etfEuropeBanks: {icon:'🏦',scene:'finance',title:'BANQUES EUROPÉENNES',ticker:'EXV1'},
 etfEuropeInsurance: {icon:'🛡️',scene:'finance',title:'ASSURANCES EUROPÉENNES',ticker:'EXH5'},
 etfWorldIslamic: {icon:'🌍',scene:'world',title:'WORLD ISLAMIC',ticker:'ISDW'},
 ...Object.fromEntries([20,40,60,80].map(n=>[`etfLifeStrategy${n}`,{icon:'⚖️',scene:'world',title:`LIFESTRATEGY ${n}/${100-n}`,ticker:`V${n}A`}])) ,
  etfWorldMultifactor: { icon:'🌍',scene:'world',title:'WORLD MULTIFACTOR',ticker:'IFSW' },
  etfIbondsEuro2028: { icon:'📅',scene:'world',title:'OBLIGATIONS EURO 2028',ticker:'B28A' },
  etcSilverPhysical: { instrumentType:'ETC',icon:'⚪',scene:'silver',title:'ARGENT PHYSIQUE',ticker:'SSLN' },
  etfSilverMiners: { icon:'⛏️',scene:'silver',title:'MINES D ARGENT',ticker:'SILV' },
  etfCloudWisdomtree: {icon:'☁️',scene:'world',title:'CLOUD COMPUTING',ticker:'WCLD'},
  etfWorldUtilities: {icon:'💡',scene:'industry',title:'WORLD UTILITIES',ticker:'XDWU'},
  etfWorldMaterials: {icon:'🪨',scene:'industry',title:'WORLD MATERIALS',ticker:'WMTS'},
  etfHealthcareInnovation: {icon:'🩺',scene:'world',title:'HEALTHCARE INNOVATION',ticker:'HEAL'},
  etf_robotics: {"icon": "🌍", "scene": "robotics", "title": "AUTOMATION & ROBOTICS", "ticker": "RBOT"},
  etf_financials: {"icon": "🌍", "scene": "finance", "title": "MSCI WORLD FINANCIALS SECTOR ADVANCED", "ticker": "WFNS"},
  etf_smallcap: {"icon": "🌍", "scene": "world", "title": "MSCI WORLD SMALL CAP", "ticker": "WSML"},
  etf_momentum: {"icon": "🌍", "scene": "world", "title": "EDGE MSCI WORLD MOMENTUM FACTOR", "ticker": "IWMO"},
  etf_gold_miners: {"icon": "🌍", "scene": "gold", "title": "GOLD MINERS", "ticker": "GDX"},
  etf_value: {"icon": "🌍", "scene": "world", "title": "EDGE MSCI WORLD VALUE FACTOR", "ticker": "IWVL"},
  etf_infrastructure: {"icon": "🌍", "scene": "infrastructure", "title": "GLOBAL INFRASTRUCTURE", "ticker": "IDIN"},
  etf_health: {"icon": "🌍", "scene": "health", "title": "MSCI WORLD HEALTH CARE SECTOR ADVANCED", "ticker": "WHCS"},
  etf_quality: {"icon": "🌍", "scene": "world", "title": "EDGE MSCI WORLD QUALITY FACTOR", "ticker": "IWQU"},
  etf_clean_energy: {"icon": "🌍", "scene": "renewables", "title": "GLOBAL CLEAN ENERGY TRANSITION", "ticker": "IQQH"},
  etfIndustrials: { icon: '🏭', scene: 'industry', title: 'WORLD INDUSTRIALS', ticker: 'XDWI' },
  etf_timber_ishares: {icon:'🌳',scene:'world',title:'BOIS ET FORETS',ticker:'WOOD'},
  etf_water_ishares: {icon:'🌍',scene:'world',title:"GLOBAL WATER",ticker:"DH2O"},
  etf_agribusiness_ishares: {icon:'🌍',scene:'world',title:"AGRIBUSINESS USD (ACC)",ticker:"ISAG"},
  etf_world_staples: {icon:'🌍',scene:'world',title:"MSCI WORLD CONSUMER STAPLES SECTOR ADVANCED",ticker:"WCSS"},
  etf_world_discretionary: {icon:'🌍',scene:'world',title:"MSCI WORLD CONSUMER DISCRETIONARY SECTOR ADVANCED",ticker:"WCDS"},
  etf_world_energy: {icon:'🌍',scene:'world',title:"MSCI WORLD ENERGY SECTOR",ticker:"WENS"},
  etf_world_communication: {icon:'🌍',scene:'world',title:"MSCI WORLD COMMUNICATION SERVICES SECTOR ADVANCED",ticker:"WCMS"},
  etf_private_equity_ishares: {icon:'🌍',scene:'world',title:"LISTED PRIVATE EQUITY",ticker:"IQQL"},
  etcPalladium: { instrumentType:'ETC', icon: '⚪', scene: 'industry', title: 'PALLADIUM PHYSIQUE', ticker: 'IPDM' },
  etcPlatinum: { instrumentType:'ETC', icon: '⚪', scene: 'industry', title: 'PLATINE PHYSIQUE', ticker: 'IPLT' },
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
