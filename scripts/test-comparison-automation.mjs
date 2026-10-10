import assert from 'node:assert/strict';
import { auditComparisonAutomation } from './audit-comparison-automation.mjs';
import { AUTOMATED_ETF } from '../src/data/automated-etf.js';

const report = auditComparisonAutomation();
assert(report.instruments > 0 && report.calendars > 0);
assert(report.waiting.every(fund => ['waiting-first-year', 'waiting-publication'].includes(fund.status)));
assert.throws(() => auditComparisonAutomation({ configs: [] }), /sans collecteur actif/);
assert.throws(() => auditComparisonAutomation({ records: {} }), /aucune observation/);
const isin = 'IE0002XZSHO1';
const themes = [{ etfs: [{ isin }] }];
const record = AUTOMATED_ETF[isin];
assert.throws(() => auditComparisonAutomation({ themes, records: { [isin]: { ...record, sectors: undefined } } }), /sectors non raccordé/);
assert.throws(() => auditComparisonAutomation({ themes, records: { [isin]: { ...record, performance: undefined } } }), /calendrier absent sans motif/);
assert.throws(() => auditComparisonAutomation({ themes, records: { [isin]: { ...record, performance: { ...record.performance, currency: 'USD' } } } }), /devise du calendrier/);
console.log('Ajout sans source, observation manquante, composition perdue et calendrier incompatible bloqués.');
