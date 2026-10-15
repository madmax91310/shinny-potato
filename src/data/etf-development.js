import { AUTOMATED_ETF } from './automated-etf.js';
import { getInstrumentName } from './instruments.js';
import { INSTRUMENT_FACTS_BY_ISIN } from './instrument-facts.js';
import { ETFS } from './etf-cards.js';
import { ASSETS, YEARS } from './portfolio-assets.js';

// Scope requested on 15/10/2026. Only ISIN references: all observations remain
// in their canonical registries. This inventory does not assign funds to tools.
export const ETF_DEVELOPMENT_LOTS = [
  { id:'sectors', label:'1 · Secteurs classiques', entries:[
    ['Industrie','IE00BM67HV82'],['Finance','IE00BJ5JP097'],['Santé','IE00BJ5JNZ06'],
    ['Santé · autre émetteur','IE00BM67HK77'],['Consommation de base','IE00BJ5JP329'],
    ['Consommation discrétionnaire','IE00BJ5JP212'],['Services publics','IE00BM67HQ30'],
    ['Matériaux','IE00BM67HS53'],['Énergie','IE00BJ5JP105'],['Communication','IE00BJ5JP436'],['Technologie','IE00BJ5JNY98'],
  ]},
  { id:'themes', label:'2 · Thématiques', entries:[
    ['Semi-conducteurs','IE000I8KRLL9'],['Cybersécurité','IE00BG0J4C88'],['Cybersécurité · autre émetteur','IE00BYPLS672'],
    ['Robotique','IE00BYZK4552'],['Intelligence artificielle et big data','IE00BGV5VN51'],['Intelligence artificielle','IE00BK5BCD43'],
    ['Cloud','IE00BJGWQN72'],['Eau','IE00B1TXK627'],['Infrastructures','IE00B1FZS467'],
    ['Énergies propres','IE00B1XNHC34'],['Nouvelles énergies','FR0010524777'],['Énergies propres · autre émetteur','IE00BK5BCH80'],
  ]},
  { id:'factors', label:'3 · Facteurs et tailles', entries:[
    ['Quality','IE00BP3QZ601'],['Value','IE00BP3QZB59'],['Momentum','IE00BP3QZ825'],['Minimum Volatility','IE00B8FHGS14'],
    ['Multifactor','IE00BZ0PKT83'],['Small caps mondiales','IE00BF4RFH31'],['Small cap value Europe','IE00BSPLC298'],
    ['Small cap value mondiales','IE0003R87OG3'],
  ]},
  { id:'regions', label:'4 · Grandes zones', entries:[
    ['ACWI IMI','IE00B3YLTY66'],['Pays développés hors États-Unis','IE0006WW1TQ4'],
    ['Émergents hors Chine','IE00BMG6Z448'],['Small caps émergentes','IE00B3F81G20'],
  ]},
];
const dated = (field, record) => Boolean(field && /^\d{4}-\d{2}-\d{2}$/.test(field.asOf ?? '') && (field.sourceUrl || record.sourceUrl));
export function etfDevelopmentEntry(isin) {
  const record = AUTOMATED_ETF[isin] ?? {}, facts = INSTRUMENT_FACTS_BY_ISIN[isin];
  const performance = record.performance;
  const years = Object.entries(performance?.years ?? {}).filter(([,v])=>Number.isFinite(v)).map(([year])=>Number(year)).sort((a,b)=>a-b);
  const sixYears = performance?.basis === 'fund' && Boolean(performance.currency && performance.method && (performance.sourceUrl || record.sourceUrl))
    && YEARS.every(year=>Number.isFinite(performance?.years?.[year]));
  const observations = Object.fromEntries(['aum','holdings','countries','sectors'].map(key=>[key,{
    available:dated(record[key],record) && (key==='aum' ? Number.isFinite(record[key].amount) : Boolean(record[key].rows?.length)),
    asOf:record[key]?.asOf ?? null, source:record[key]?.sourceUrl ?? record.sourceUrl ?? null,
    basis:record[key]?.basis ?? record[key]?.scope ?? null,
  }]));
  const gaps=[];
  if (!facts?.benchmark || !facts?.incomePolicy || !facts?.replicationMethod || !facts?.domicile || !facts?.characteristicsSource?.url) gaps.push('Caractéristiques à compléter dans le registre commun');
  for (const [key,label] of [['aum','Encours'],['holdings','Positions'],['countries','Pays'],['sectors','Secteurs']]) if(!observations[key].available)gaps.push(`${label} : observation datée manquante`);
  if(!sixYears)gaps.push('Historique annuel de part insuffisant pour six années communes');
  const assets=ASSETS.filter(asset=>asset.isin===isin);
  return {isin,name:getInstrumentName(isin),years,sixYears:Boolean(sixYears),observations,gaps,
    collected:Boolean(record.provider),sheet:ETFS.some(etf=>etf.isin===isin),
    portfolio:assets.length ? assets.some(asset=>!asset.manualOnly) ? 'Disponible en automatique et manuel' : 'Disponible en manuel' : 'Non raccordé',
    status:gaps.length ? 'À compléter' : 'Données réunies · affectation à examiner',
  };
}
