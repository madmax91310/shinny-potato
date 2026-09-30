#!/usr/bin/env node
// Rejoue le recoupement des 140 points des six séries depuis les captures datées.
// Une capture ne garantit pas qu'un fournisseur ne corrigera jamais l'historique.
import { readFileSync } from 'node:fs';
import { ASSETS } from '../src/data/market-history.js';

const snapshot = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-yahoo-2026-09-29.json', import.meta.url)));
const gold = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-worldbank-gold-2026-09-29.json', import.meta.url)));
let errors = 0;
if (!gold.url?.startsWith('https://thedocs.worldbank.org/') || gold.checkedAt !== '2026-09-29' ||
    gold.workbookUpdatedAt !== '2026-09-02' || !/^[a-f0-9]{64}$/.test(gold.workbookSha256) ||
    gold.sheet !== 'Monthly Prices' || gold.column !== 'Gold' || gold.unit !== 'USD per troy ounce' ||
    gold.points.length !== 140 || ASSETS.or.points.length !== 140) {
  console.error('Or : capture Banque mondiale ou provenance incomplète');
  errors++;
} else {
  for (const [index, [date, price]] of gold.points.entries()) {
    const actual = ASSETS.or.points[index];
    if (actual?.date !== date || actual.price !== price) {
      console.error(`Or ${date} : ${actual?.price} au lieu de ${price}`);
      errors++;
    }
  }
}
for (const [name, record] of Object.entries(snapshot)) {
  const points = ASSETS[name]?.points;
  if (!points || points.length !== 140 || record.points.length !== 140 || !record.url || record.checkedAt !== '2026-09-29') {
    console.error(`${name} : série ou provenance incomplète`);
    errors++;
    continue;
  }
  for (const [index, [date, sourcePrice]] of record.points.entries()) {
    const actual = points[index];
    // Les séries historiques MacroTrends et Yahoo ajustent parfois les
    // dividendes de quelques centimes différemment. L'écart admis est 0,1 %.
    const tolerance = name === 'broadcom' || date === '2026-08' ? 0.011 : Math.max(0.03, sourcePrice * 0.001);
    if (actual?.date !== date || Math.abs(actual.price - sourcePrice) > tolerance) {
      console.error(`${name} ${date} : ${actual?.price} au lieu de ${sourcePrice}`);
      errors++;
    }
  }
}
console.log(`${Object.keys(snapshot).length} séries Yahoo et 1 série Banque mondiale × 140 points comparés aux captures ; ${errors} écart(s).`);
if (errors) process.exitCode = 1;
