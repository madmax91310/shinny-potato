import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DEFAULT_THEMES } from '../src/data/etf-themes.js';
import { AUTOMATED_ETF } from '../src/data/automated-etf.js';
import { classifyInstrumentGap } from './automation-gap-inventory.mjs';

const sources = ['etf-pilot.json', 'amundi-etf.json', 'ssga-etf.json', 'additional-etf-sources.json']
  .flatMap(file => JSON.parse(readFileSync(new URL(file, import.meta.url))).instruments);

// Check the actual selection, including reused themes and PEA blocks.
// This checks wiring and qualified observations, not today's network availability.
export function auditComparisonAutomation({ themes = DEFAULT_THEMES, configs = sources, records = AUTOMATED_ETF, now = new Date().toISOString().slice(0, 10) } = {}) {
  const configured = new Set(configs.filter(source => source.enabled !== false).map(source => source.isin));
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
    for (const field of ['countries', 'sectors', 'holdings']) {
      if (classifyInstrumentGap(isin, field, now).status === 'not-applicable') continue;
      assert(record[field]?.rows?.length && record[field].asOf, `${isin}: ${field} non raccordé ou non daté`);
    }
    if (Object.keys(record.performance?.years ?? {}).length) {
      assert(record.performance.currency === record.currency, `${isin}: devise du calendrier différente de la part`);
      calendars++;
    } else {
      const gap = classifyInstrumentGap(isin, 'performance', now);
      assert(['waiting-first-year', 'waiting-publication', 'source-conflict'].includes(gap.status), `${isin}: calendrier absent sans motif qualifié`);
      waiting.push({ isin, name: fund.nom, ...gap });
    }
  }
  return { themes: themes.length, instruments: funds.length, calendars, waiting };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = auditComparisonAutomation();
  console.log(`${report.instruments} ETF/ETC raccordés dans ${report.themes} comparatifs ; ${report.calendars} calendriers actifs ; ${report.waiting.length} absences qualifiées.`);
}
