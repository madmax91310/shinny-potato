import { AUTOMATED_ETF } from '../src/data/automated-etf.js';
import { getPresentationCopy } from '../src/pages/etf-sheets/editorial.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INSTRUMENT_FACTS_BY_ISIN } from '../src/data/instrument-facts.js';
import { applyAutomatedCharacteristics } from '../src/data/automated-characteristics.js';
import { ETF_TER_BY_ISIN } from '../src/data/etf-ter.js';
import { ASSETS, YEARS } from '../src/data/portfolio-assets.js';
import { AUTOMATED_PORTFOLIO_FUNDS } from '../src/data/automated-portfolio-funds.js';
import { assertQualifiedManualSupport } from './lib/portfolio-support-evidence.mjs';
import MONTHLY_RETURNS from '../src/data/monthly-duel-returns.json' with {type:'json'};
import ETF_HISTORIES from '../src/data/automated-etf-monthly.json' with {type:'json'};
import NON_BOND_HISTORIES from '../src/data/non-bond-monthly-records.json' with {type:'json'};
import { ETFS } from '../src/data/etf-cards.js';
import EQUITY_RETURNS from '../src/data/equity-duel-returns.json' with {type:'json'};
import { buildText } from '../src/pages/etf-sheets/lib.js';
const capture = JSON.parse(readFileSync(new URL('./source-snapshots/instrument-supports-2026-10-03.json', import.meta.url)));
assert.equal(Object.keys(capture.records).length, 52);
for (const [isin, record] of Object.entries(capture.records)) {
  const facts = INSTRUMENT_FACTS_BY_ISIN[isin], card = ETFS.find(c => c.isin === isin);
  assert.deepEqual(facts, applyAutomatedCharacteristics(record.facts, AUTOMATED_ETF[isin])); assert(card);
  assert.equal(ETF_TER_BY_ISIN[isin], AUTOMATED_ETF[isin]?.characteristics ? AUTOMATED_ETF[isin].characteristics.terPct.toFixed(2).replace('.', ',') : record.ter);
  assert.equal(new URL(record.sourceUrl).searchParams.get('isin'), isin);
  assert.match(record.htmlSha256, /^[a-f0-9]{64}$/);
  const basics = record.basicsExcerpt;
  assert(basics.includes(`Index ${facts.benchmark} Investment focus`));
  assert(basics.includes(`Total expense ratio ${record.ter.replace(',', '.')}%`));
  assert(basics.includes(`Fund currency ${record.fundCurrency}`));
  // The retained 2026-10-03 document proves its own historical policy;
  // current issuer observations are checked separately by the overlay above.
  assert(basics.includes(`Distribution policy ${record.facts.incomePolicy === 'accumulating' ? 'Accumulating' : 'Distributing'}`));
  assert.equal(record.facts.positionsAsOf, null, 'La photographie historique reste inchangée');
  const count = AUTOMATED_ETF[isin]?.metrics?.numHoldings;
  if (count) {
    assert.equal(facts.positionsAsOf, count.asOf);
    assert(facts.positionsLabel.includes(count.value.toLocaleString('fr-FR')));
  } else {
    assert.equal(facts.positionsAsOf, null);
    assert(facts.positionsLabel.startsWith('Exposition suivie :'));
  }
  assert(card.hook && card.whatIs && card.whyInteresting && card.whatToKnow && card.question);
  assert(buildText(card).startsWith(getPresentationCopy(card).hook + '\n'));
  assert(!/undefined|NaN/.test(buildText(card)));
}
for (const asset of ASSETS.filter(a => a.isin)) {
  if (asset.instrumentType === 'EQUITY') {
    const source=EQUITY_RETURNS.find(r=>r.id===asset.id && r.isin===asset.isin);
    assert(source?.source?.startsWith('https://') && source.checkedAt && asset.manualOnly && asset.returnCurrency==='EUR',`Source action manquante : ${asset.id}`);
    assert.deepEqual(asset.calendarReturns,source.euroCalendarReturns);
  } else if(!ETFS.some(c=>c.isin===asset.isin)&&asset.automatedManual) {
    assertQualifiedManualSupport(asset,{candidates:AUTOMATED_PORTFOLIO_FUNDS,projections:MONTHLY_RETURNS,histories:{...ETF_HISTORIES,...NON_BOND_HISTORIES},calendarYears:YEARS});
  } else assert(ETFS.some(c => c.isin === asset.isin), `Fiche manquante : ${asset.id}`);
}
assert.equal(new Set(ETFS.map(c => c.isin)).size, ETFS.length);
assert.equal(new Set(ETFS.map(c => c.hook)).size, ETFS.length);
console.log('52 fiches ajoutées : profils ISIN rejoués, TER et caractéristiques concordants ; supports du générateur liés à leur fiche ou à leur historique manuel qualifié.');

for (const card of ETFS) {
  const copy = getPresentationCopy(card);
  // L'accroche peut varier selon l'exposition ; l'identité du fonds doit rester explicite.
  assert(buildText(card).includes(card.isin), card.id);
  assert(buildText(card).startsWith(copy.hook + '\n\n'));
}
const world = ETFS.find(card => card.isin === 'FR001400U5Q4');
assert(buildText(world).includes(`(${world.listing.ticker})`), 'La présentation garde le ticker de la cotation sélectionnée');
assert(buildText(ETFS.find(card => card.id === 'ia')).includes('AIAI'));
assert.match(buildText(ETFS.find(card => card.id === 'pea_global_amundi')), /MSCI ACWI/);
assert(!buildText(ETFS.find(card => card.id === 'pea_global_amundi')).includes('Amundi PEA Monde'));
