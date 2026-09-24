#!/usr/bin/env node
// Le registre de contrôle est interne et doit refléter les entrées du code.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const expected = JSON.parse(readFileSync(new URL('./source-inventory.json', import.meta.url), 'utf8'));
const current = JSON.parse(execFileSync(process.execPath,
  [new URL('./check-freshness.mjs', import.meta.url).pathname, '--missing-json'],
  { encoding: 'utf8' }));

if (JSON.stringify(expected) !== JSON.stringify(current)) {
  console.error('Inventaire interne périmé : exécuter node scripts/check-freshness.mjs --missing-json > scripts/source-inventory.json');
  process.exitCode = 1;
} else {
  console.log(`${current.length} entrées sans date individuelle inventoriées ; registre synchronisé.`);
}
