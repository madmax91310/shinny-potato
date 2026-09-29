#!/usr/bin/env node
// Vérifie que les quatre bibliothèques de produits utilisent la même référence ISIN.
import { readFileSync } from 'node:fs';
import { INSTRUMENTS_BY_ISIN, getInstrumentName, getInstrumentPea, getInstrumentPeaStatus } from '../src/data/instruments.js';
import { INSTRUMENT_FACTS_BY_ISIN, getInstrumentFacts, getInstrumentTickers } from '../src/data/instrument-facts.js';
import { PEA_REVIEWS_BY_ISIN } from '../src/data/instrument-pea.js';
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
const unresolved = [];
for (const [isin, review] of Object.entries(PEA_REVIEWS_BY_ISIN)) {
  if (!INSTRUMENTS_BY_ISIN[isin] || !review.sourceUrl || !/^\d{4}-\d{2}-\d{2}$/.test(review.checkedAt)) {
    console.error(`PEA : identité, source ou date manquante pour ${isin}`);
    errors++;
  }
  if (review.eligible === null && !review.note) {
    console.error(`PEA : absence de motif pour le statut inconnu ${isin}`);
    errors++;
  }
}
for (const [isin, facts] of Object.entries(INSTRUMENT_FACTS_BY_ISIN)) {
  if (!INSTRUMENTS_BY_ISIN[isin]) {
    console.error(`Caractéristiques : ISIN absent du catalogue : ${isin}`);
    errors++;
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(facts.reviewedAt)) {
    console.error(`Caractéristiques : date de revue manquante pour ${isin}`);
    errors++;
  }
  if (!facts.characteristicsSource?.url || !/^\d{4}-\d{2}-\d{2}$/.test(facts.characteristicsSource?.checkedAt ?? '')) {
    console.error(`Caractéristiques : source ou date de contrôle manquante pour ${isin}`);
    errors++;
  }
  if (!facts.benchmark || !facts.incomePolicy || !facts.replicationMethod || !facts.domicile) {
    console.error(`Caractéristiques : valeur structurelle manquante pour ${isin}`);
    errors++;
  }
  if (facts.incomePolicy === 'accumulating' !== facts.distribution.startsWith('Capitalisant')) {
    console.error(`Caractéristiques : contradiction de distribution pour ${isin}`);
    errors++;
  }
  if (facts.location.includes('intégrale') && !facts.replicationMethod.includes('Full') ||
      facts.location.includes('optimisée') && !facts.replicationMethod.includes('sampling') ||
      facts.location.includes('échantillonnage') && !/sampling|Sampled/i.test(facts.replicationMethod)) {
    unresolved.push(isin);
  }
}
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
    if (context === 'sheet') {
      const facts = getInstrumentFacts(item.isin);
      for (const key of ['tickers', 'distribution', 'location']) {
        if (JSON.stringify(item[key]) !== JSON.stringify(facts[key])) {
          console.error(`${file} : ${key} différent de la bibliothèque pour ${item.isin}`);
          errors++;
        }
      }
      if (item.lastVerified !== facts.reviewedAt) {
        console.error(`${file} : date de revue différente pour ${item.isin}`);
        errors++;
      }
    }
    if (context === 'tweet' && /\béligible PEA\b/i.test(item.differenciateur ?? '') && getInstrumentPeaStatus(item.isin) === false) {
      console.error(`${file} : mention PEA contradictoire pour ${item.isin}`);
      errors++;
    }
    if (context !== 'portfolio' && !ETF_TER_BY_ISIN[item.isin]) {
      console.error(`${file} : frais absents pour ${item.isin}`);
      errors++;
    }
  }
}
for (const family of FAMILIES) for (const group of family.etfGroups ?? []) {
  for (const fund of group.funds ?? []) {
    const status = getInstrumentPeaStatus(fund.isin);
    if (Object.hasOwn(fund, 'pea') && fund.pea !== status) {
      console.error(`Comparateur : statut PEA de la part différent du registre pour ${fund.isin}.`);
      errors++;
    }
    // pea:true sur un groupe signifie « au moins une part PEA », pas toutes.
    if (status === true && group.pea === false) {
      console.error(`Comparateur : groupe marqué CTO malgré une part PEA ${fund.isin} (${family.id}).`);
      errors++;
    }
    if (fund.ticker && !getInstrumentTickers(fund.isin).includes(fund.ticker)) {
      console.error(`Comparateur : ticker contradictoire pour ${fund.isin} (${fund.ticker}).`);
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
console.log(`${Object.keys(INSTRUMENT_FACTS_BY_ISIN).length} fiches avec caractéristiques sourcées et datées ; ${unresolved.length} divergence(s) de méthode.`);
console.log(`${Object.keys(PEA_REVIEWS_BY_ISIN).length} statuts PEA revus individuellement, dont ${Object.values(PEA_REVIEWS_BY_ISIN).filter(x => x.eligible === null).length} non tranchés.`);
if (unresolved.length) { console.error(`Réplication contradictoire : ${unresolved.join(', ')}`); errors += unresolved.length; }
if (errors) process.exitCode = 1;
