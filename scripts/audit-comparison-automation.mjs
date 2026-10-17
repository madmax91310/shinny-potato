import nonBondSources from './non-bond-expansion-sources.json' with {type:'json'};
import nonBondQualified from './non-bond-qualified-sources.json' with { type:'json' };
import lifestrategyConfig from './lifestrategy-sources.json' with {type:'json'};
import baseQualified from './qualified-exposure-sources.json' with { type:'json' };
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_THEMES } from '../src/data/etf-themes.js';
import { AUTOMATED_ETF } from '../src/data/automated-etf.js';
import { classifyInstrumentGap } from './automation-gap-inventory.mjs';

const qualifiedConfig = {instruments:[...baseQualified.instruments,...nonBondQualified.instruments]};
// exposure-etf-expansion.json : collecteur update-exposure-expansion.yml, dont les 35 parts alimentent AUTOMATED_ETF.
const sources = ['etf-pilot.json', 'amundi-etf.json', 'ssga-etf.json', 'additional-etf-sources.json', 'exposure-etf-expansion.json']
  .flatMap(file => JSON.parse(readFileSync(new URL(file, import.meta.url))).instruments).concat(lifestrategyConfig.instruments,nonBondSources.instruments);

// Check the actual selection, including reused themes and PEA blocks.
// This checks wiring and qualified observations, not today's network availability.
export function auditComparisonAutomation({ themes = DEFAULT_THEMES, configs = sources, records = AUTOMATED_ETF, now = new Date().toISOString().slice(0, 10) } = {}) {
  const configured = new Set([...configs, ...qualifiedConfig.instruments].filter(source => source.enabled !== false).map(source => source.isin));
  const funds = [...new Map(themes.flatMap(theme => theme.etfs).map(fund => [fund.isin, fund])).values()];
  const waiting = [];
  let calendars = 0;
  for (const fund of funds) {
    const { isin } = fund;
    assert(configured.has(isin), `${isin}: comparatif sans collecteur actif`);
    const record = records[isin];
    assert(record, `${isin}: aucune observation automatique validée`);
    assert(Number.isFinite(record.characteristics?.terPct), `${isin}: frais non raccordés`);
    assert(record.aum?.amount > 0 && record.aum.asOf && record.aum.checkedAt, `${isin}: encours non raccordé ou non daté`);
    for (const field of lifestrategyConfig.instruments.some(c=>c.isin===isin) ? ['assetAllocation','holdings'] : ['countries', 'sectors', 'holdings']) {
      const gap=classifyInstrumentGap(isin, field, now);
      if (gap.status === 'not-applicable') continue;
      if (gap.status === 'not-published') {
        const q=record.fieldQualification?.[field];
        const officialAbsence=q?.status==='not-published' && q.sourceUrl===record.sourceUrl && q.asOf && q.checkedAt && q.reason && /^[a-f0-9]{64}$/.test(q.sha256 ?? '');
        assert(officialAbsence || (gap.sourceUrl && record.holdings?.basis==='index' && record.holdings.sourceUrl===gap.sourceUrl && /^[a-f0-9]{64}$/.test(record.holdings.sha256)), `${isin}: absence sans preuve officielle qualifiée`);
        waiting.push({isin,name:fund.nom,field,...gap});
        continue;
      }
      assert(record[field]?.rows?.length && record[field].asOf, `${isin}: ${field} non raccordé ou non daté`);
    }
    if (Object.keys(record.performance?.years ?? {}).length) {
      assert(record.performance.currency === record.currency, `${isin}: devise du calendrier différente de la part`);
      calendars++;
    } else {
      const gap = classifyInstrumentGap(isin, 'performance', now);
      const p=record.performance;
      const cumulativeOnly=gap.status==='not-published' && p?.basis==='fund' && p.sourceUrl && p.asOf && p.checkedAt && /^[a-f0-9]{64}$/.test(p.sha256 ?? '') && p.observations?.length>0 && p.observations.every(o=>Number.isFinite(o.value));
      assert(cumulativeOnly || ['waiting-first-year', 'waiting-publication', 'source-conflict'].includes(gap.status), `${isin}: calendrier absent sans motif qualifié`);
      waiting.push({ isin, name: fund.nom, ...gap });
    }
  }
  return { themes: themes.length, instruments: funds.length, calendars, waiting };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = auditComparisonAutomation();
  console.log(`${report.instruments} ETF/ETC raccordés dans ${report.themes} comparatifs ; ${report.calendars} calendriers actifs ; ${report.waiting.length} absences qualifiées.`);
}
