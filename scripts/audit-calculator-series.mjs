#!/usr/bin/env node
// Rejoue le recoupement des 140 points des cinq séries depuis la capture datée.
// Une capture ne garantit pas qu'un fournisseur ne corrigera jamais l'historique.
import { readFileSync } from 'node:fs';
import { ASSETS } from '../src/pages/investment-calculator/data.js';

const snapshot = JSON.parse(readFileSync(new URL('./source-snapshots/calculator-yahoo-2026-09-29.json', import.meta.url)));
let errors = 0;
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
console.log(`${Object.keys(snapshot).length} séries × 140 points comparés à la capture Yahoo ; ${errors} écart(s). Or spot hors périmètre.`);
if (errors) process.exitCode = 1;
