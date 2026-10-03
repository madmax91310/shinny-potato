import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { INSTRUMENT_FACTS_BY_ISIN } from '../src/data/instrument-facts.js';
import { ETF_TER_BY_ISIN } from '../src/data/etf-ter.js';
import { ASSETS } from '../src/data/portfolio-assets.js';
import { ETFS } from '../src/data/etf-cards.js';
import { buildText, presentationType } from '../src/pages/etf-sheets/lib.js';
const capture = JSON.parse(readFileSync(new URL('./source-snapshots/instrument-supports-2026-10-03.json', import.meta.url)));
assert.equal(Object.keys(capture.records).length, 52);
for (const [isin, record] of Object.entries(capture.records)) {
  const facts = INSTRUMENT_FACTS_BY_ISIN[isin], card = ETFS.find(c => c.isin === isin);
  assert.deepEqual(facts, record.facts); assert(card);
  assert.equal(ETF_TER_BY_ISIN[isin], record.ter);
  assert.equal(new URL(record.sourceUrl).searchParams.get('isin'), isin);
  assert.match(record.htmlSha256, /^[a-f0-9]{64}$/);
  const basics = record.basicsExcerpt;
  assert(basics.includes(`Index ${facts.benchmark} Investment focus`));
  assert(basics.includes(`Total expense ratio ${record.ter.replace(',', '.')}%`));
  assert(basics.includes(`Fund currency ${record.fundCurrency}`));
  assert(basics.includes(`Distribution policy ${facts.incomePolicy === 'accumulating' ? 'Accumulating' : 'Distributing'}`));
  assert.equal(facts.positionsAsOf, null); assert(facts.positionsLabel.startsWith('Exposition suivie :'));
  assert(card.hook && card.whatIs && card.whyInteresting && card.whatToKnow && card.question);
  assert(buildText(card).startsWith(`📋 Présentation d'${presentationType(card)}\n`));
  assert(!/undefined|NaN/.test(buildText(card)));
}
for (const asset of ASSETS.filter(a => a.isin)) assert(ETFS.some(c => c.isin === asset.isin), `Fiche manquante : ${asset.id}`);
assert.equal(new Set(ETFS.map(c => c.isin)).size, ETFS.length);
assert.equal(new Set(ETFS.map(c => c.hook)).size, ETFS.length);
console.log('52 fiches ajoutées : profils ISIN rejoués, TER et caractéristiques concordants ; tous les supports du générateur couverts.');
