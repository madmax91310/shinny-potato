#!/usr/bin/env node
// Vérifie que les outils consomment les registres communs par ISIN.
import { EXPOSURE_ADDITIONS } from '../src/data/exposure-additions.js';
import { readFileSync } from 'node:fs';
import { auditInstrumentListings } from './audit-instrument-listings.mjs';
import { INSTRUMENTS_BY_ISIN, getInstrumentName, getInstrumentPea, getInstrumentPeaStatus } from '../src/data/instruments.js';
import { INSTRUMENT_FACTS_BY_ISIN, getInstrumentFacts, getInstrumentTickers } from '../src/data/instrument-facts.js';
import { PEA_REVIEWS_BY_ISIN } from '../src/data/instrument-pea.js';
import { ETF_TER_BY_ISIN } from '../src/data/etf-ter.js';
import { INSTRUMENT_AUM_BY_ISIN, getInstrumentAum } from '../src/data/instrument-aum.js';
import { getInstrumentReturnValues } from '../src/data/instrument-returns.js';
import { COMPARATOR_ISIN_BY_FAMILY_KEY, getInstrumentComparatorReturns } from '../src/data/instrument-comparator-returns.js';
import { ETFS } from '../src/data/etf-cards.js';
import { DEFAULT_THEMES } from '../src/data/etf-themes.js';
import { FAMILIES } from '../src/data/index-comparisons.js';
import { ASSETS } from '../src/data/portfolio-assets.js';

const collections = [
  ['sheet', 'src/data/etf-cards.js', ETFS.map(item => ({ ...item, displayName: item.name }))],
  ['tweet', 'src/data/etf-themes.js', DEFAULT_THEMES.flatMap(theme => theme.etfs.map(item => ({ ...item, displayName: item.nom })))],
  ['index', 'src/data/index-comparisons.js', FAMILIES.flatMap(family => (family.etfGroups ?? []).flatMap(group => (group.funds ?? []).map(item => ({ ...item, displayName: item.name }))))],
  ['portfolio', 'src/data/portfolio-assets.js', ASSETS.filter(item => item.isin).map(item => ({ ...item, displayName: item.name }))],
];
const aumSnapshot = JSON.parse(readFileSync(new URL('./source-snapshots/etf-aum-2026-09-29.json', import.meta.url), 'utf8'));
const reviewSnapshot = JSON.parse(readFileSync(new URL('./source-snapshots/etf-review-2026-10-02.json', import.meta.url), 'utf8'));
const reviewedAum = new Map(reviewSnapshot.products.map(p => [p.isin, p.aum]));

const seen = new Set();
const listingErrors = auditInstrumentListings();
for (const error of listingErrors) console.error(error);
let errors = listingErrors.length;
let total = 0;
const unresolved = [];
let aumUsages = 0;
let returnUsages = 0;
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
for (const isin of Object.keys(INSTRUMENTS_BY_ISIN)) {
  if (!Object.hasOwn(PEA_REVIEWS_BY_ISIN, isin) && getInstrumentPeaStatus(isin) !== null) {
    console.error(`PEA : statut publié sans revue ciblée pour ${isin}`);
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
  // Les nouveaux thèmes construisent les libellés par une fonction commune ;
  // chaque résultat est comparé au registre par ISIN dans la boucle ci-dessous.
  if (context !== 'tweet' && references.length + (source.includes('EXPOSURE_ADDITIONS.map(') ? EXPOSURE_ADDITIONS.length - 1 : 0) + (context === 'index' ? 3 : 0) !== items.length) {
    console.error(`${file} : ${references.length} références au catalogue pour ${items.length} produits.`);
    errors++;
  }
  if (context === 'sheet' || context === 'index') {
    const aumReferences = source.match(/aum:\s*getInstrumentAum\(/g) ?? [];
    const aumItems = items.filter(item => item.aum);
    if (aumReferences.length + (source.includes('EXPOSURE_ADDITIONS.map(') ? EXPOSURE_ADDITIONS.length - 1 : 0) + (context === 'index' ? 2 : 0) !== aumItems.length) {
      console.error(`${file} : ${aumReferences.length} références d'encours pour ${aumItems.length} valeurs.`);
      errors++;
    }
    aumUsages += aumItems.length;
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
    if (context === 'sheet' && item.pea === null && /(?:n['’]est pas éligible|non éligible)\s*(?:au\s*)?PEA/i.test(item.whatToKnow ?? '')) {
      console.error(`${file} : refus PEA affirmé sans preuve pour ${item.isin}`);
      errors++;
    }
    if (item.aum && (context === 'sheet' || context === 'index') && item.aum !== getInstrumentAum(item.isin, context)) {
      console.error(`${file} : encours différent du registre pour ${item.isin}`);
      errors++;
    }
    if (context === 'sheet') {
      const facts = getInstrumentFacts(item.isin);
      for (const key of ['distribution', 'location']) {
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
    if (context === 'tweet' && /PEA à confirmer|éligibilité PEA à confirmer/i.test(item.differenciateur ?? '') && getInstrumentPeaStatus(item.isin) !== null) {
      console.error(`${file} : mention PEA incertaine malgré un statut revu pour ${item.isin}`);
      errors++;
    }
    if (context !== 'portfolio' && !ETF_TER_BY_ISIN[item.isin]) {
      console.error(`${file} : frais absents pour ${item.isin}`);
      errors++;
    }
  }
}
for (const [isin, entry] of Object.entries(INSTRUMENT_AUM_BY_ISIN)) {
  if (!INSTRUMENTS_BY_ISIN[isin] || !entry.sheet && !entry.index) {
    console.error(`Encours : entrée invalide ${isin}`);
    errors++;
  }
  if (entry.source && (!entry.source.url || !/^\d{4}-\d{2}-\d{2}$/.test(entry.source.checkedAt) ||
      entry.source.asOf !== null && !/^\d{4}-\d{2}-\d{2}$/.test(entry.source.asOf) ||
      !Number.isFinite(entry.source.amount ?? entry.source.amountMillions))) {
    console.error(`Encours : source ou date invalide pour ${isin}`);
    errors++;
  }
  if (entry.source && entry.sheet && entry.index && entry.sheet !== entry.index) {
    console.error(`Encours : deux valeurs divergentes malgré une source unique pour ${isin}`);
    errors++;
  }
  if (entry.source?.amountMillions) {
    const amount = `${String(entry.source.amountMillions).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} M€`;
    const date = entry.source.checkedAt.split('-').reverse().join('/');
    if ([entry.sheet, entry.index].filter(Boolean).some(label => label !== `${amount} (relevé le ${date})`)) {
      console.error(`Encours : libellé non synchronisé avec le relevé pour ${isin}`);
      errors++;
    }
  }
}
for (const [isin, millions] of Object.entries(aumSnapshot.values)) {
  const source = INSTRUMENT_AUM_BY_ISIN[isin]?.source;
  if (source?.checkedAt === reviewSnapshot.checkedAt && JSON.stringify(INSTRUMENT_AUM_BY_ISIN[isin]) === JSON.stringify(reviewedAum.get(isin))) continue;
  if (!source || source.amountMillions !== millions || source.checkedAt !== aumSnapshot.checkedAt ||
      source.currency !== 'EUR' || source.asOf !== null || !source.url.includes(`isin=${isin}`)) {
    console.error(`Encours : relevé justETF non synchronisé pour ${isin}`);
    errors++;
  }
}
if (Object.entries(aumSnapshot.values).filter(([isin]) => INSTRUMENT_AUM_BY_ISIN[isin]?.source?.amountMillions || INSTRUMENT_AUM_BY_ISIN[isin]?.source?.checkedAt === reviewSnapshot.checkedAt).length !== Object.keys(aumSnapshot.values).length) {
  console.error('Encours : nombre de relevés justETF différent du registre.');
  errors++;
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
    if (fund.listing && !getInstrumentTickers(fund.isin).includes(fund.listing.ticker)) {
      console.error(`Comparateur : ticker contradictoire pour ${fund.isin} (${fund.listing.ticker}).`);
      errors++;
    }
  }
}
for (const asset of ASSETS.filter(item => item.isin)) {
  if (asset.r !== getInstrumentReturnValues(asset.isin)) {
    console.error(`Générateur : série locale ou divergente pour ${asset.isin}`);
    errors++;
  }
  returnUsages++;
}
for (const family of FAMILIES) for (const row of family.perfFunds ?? []) {
  if (!Number.isFinite(row.y2023)) continue;
  const isin = COMPARATOR_ISIN_BY_FAMILY_KEY[family.id]?.[row.key];
  const values = isin && getInstrumentComparatorReturns(isin);
  if (!values || Object.entries(values).some(([year, value]) => row[year] !== value)) {
    console.error(`Comparateur : série hors registre pour ${family.id}/${row.key}`);
    errors++;
  }
}
const portfolioSource = readFileSync(new URL('../src/data/portfolio-assets.js', import.meta.url), 'utf8');
if ((portfolioSource.match(/r:\s*getInstrumentReturnValues\(/g) ?? []).length + EXPOSURE_ADDITIONS.length - 1 !== returnUsages) {
  console.error('Générateur : une série ISIN reste codée dans l’outil.');
  errors++;
}
const comparatorSeriesSource = readFileSync(new URL('../src/data/index-comparisons.js', import.meta.url), 'utf8');
if ((comparatorSeriesSource.match(/\.\.\.getInstrumentComparatorReturns\(/g) ?? []).length + 2 !==
    FAMILIES.flatMap(family => family.perfFunds ?? []).filter(row => Number.isFinite(row.y2023)).length) {
  console.error('Comparateur : une série ETF reste codée dans l’outil.');
  errors++;
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
console.log(`${aumUsages} encours servis par le registre commun pour ${Object.keys(INSTRUMENT_AUM_BY_ISIN).length} ISIN ; ${Object.values(INSTRUMENT_AUM_BY_ISIN).filter(x => x.source).length} sources individuelles enregistrées.`);
console.log(`${returnUsages} usages de rendements du Générateur servis par ISIN ; séries du Comparateur raccordées au même registre.`);
if (unresolved.length) { console.error(`Réplication contradictoire : ${unresolved.join(', ')}`); errors += unresolved.length; }
if (errors) process.exitCode = 1;
