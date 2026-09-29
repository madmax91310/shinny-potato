#!/usr/bin/env node
// Vérifie que les quatre bibliothèques de produits utilisent la même référence ISIN.
import { readFileSync } from 'node:fs';
import { INSTRUMENTS_BY_ISIN, getInstrumentName, getInstrumentPea } from '../src/data/instruments.js';
import { ETF_TER_BY_ISIN } from '../src/data/etf-ter.js';
import { ETFS } from '../src/pages/etf-sheets/data.js';
import { DEFAULT_THEMES } from '../src/pages/etf-tweets/data/themes.js';
import { FAMILIES } from '../src/pages/index-comparator/data.js';
import { ASSETS } from '../src/pages/portfolio-generator/data.js';

const collections = [
  ['sheet', 'src/pages/etf-sheets/data.js', ETFS.map(item => ({ ...item, displayName: item.name }))],
  ['tweet', 'src/pages/etf-tweets/data/themes.js', DEFAULT_THEMES.flatMap(theme => theme.etfs.map(item => ({ ...item, displayName: item.nom })))],
  ['index', 'src/pages/index-comparator/data.js', FAMILIES.flatMap(family => (family.etfGroups ?? []).flatMap(group => (group.funds ?? []).map(item => ({ ...item, displayName: item.name }))))],
  ['portfolio', 'src/pages/portfolio-generator/data.js', ASSETS.filter(item => item.isin).map(item => ({ ...item, displayName: item.name }))],
];

const seen = new Set();
let errors = 0;
let total = 0;
for (const [context, file, items] of collections) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const references = source.match(/name:\s*getInstrumentName\(|nom:\s*getInstrumentName\(/g) ?? [];
  if (references.length !== items.length) {
    console.error(`${file} : ${references.length} références au catalogue pour ${items.length} produits.`);
    errors++;
  }
  for (const item of items) {
    total++;
    seen.add(item.isin);
    const record = INSTRUMENTS_BY_ISIN[item.isin];
    if (!record) {
      console.error(`${file} : ISIN absent du catalogue : ${item.isin}`);
      errors++;
      continue;
    }
    if (item.displayName !== getInstrumentName(item.isin, context, context === 'portfolio' ? item.id : undefined)) {
      console.error(`${file} : libellé différent du catalogue pour ${item.isin} : ${item.displayName}`);
      errors++;
    }
    if (context === 'sheet' && item.pea !== getInstrumentPea(item.isin)) {
      console.error(`${file} : statut PEA différent du catalogue pour ${item.isin}`);
      errors++;
    }
    if (context !== 'portfolio' && !ETF_TER_BY_ISIN[item.isin]) {
      console.error(`${file} : frais absents pour ${item.isin}`);
      errors++;
    }
  }
}
for (const isin of Object.keys(INSTRUMENTS_BY_ISIN)) {
  if (!seen.has(isin)) {
    console.error(`Catalogue : ISIN inutilisé ${isin}`);
    errors++;
  }
}
console.log(`${total} usages, ${seen.size} ISIN, ${errors} erreur(s) dans le catalogue commun.`);
if (errors) process.exitCode = 1;
