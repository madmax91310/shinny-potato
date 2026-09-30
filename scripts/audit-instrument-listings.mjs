#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js';
import { getInstrumentTickers } from '../src/data/instrument-facts.js';
import { INSTRUMENT_LISTINGS_BY_ISIN, getPreferredInstrumentListing } from '../src/data/instrument-listings.js';
import { validateListingEvidence } from './lib/listing-evidence.mjs';
import { ETFS } from '../src/data/etf-cards.js';
import { FAMILIES } from '../src/pages/index-comparator/data.js';

export function validatePublishedListingSelection(items) {
  return items.flatMap(item => {
    const expected = getPreferredInstrumentListing(item.isin);
    if (item.listing !== expected || Object.hasOwn(item, 'ticker') || Object.hasOwn(item, 'tickers')) {
      return [`Cotation publiée divergente du registre pour ${item.isin}`];
    }
    return [];
  });
}

export function auditInstrumentListings() {
  const snapshot = JSON.parse(readFileSync(new URL('./source-snapshots/instrument-listings-2026-09-30.json', import.meta.url), 'utf8'));
  const published = Object.fromEntries(Object.keys(INSTRUMENTS_BY_ISIN).map(isin => [isin, getInstrumentTickers(isin)]));
  // Vérifie aussi les valeurs effectivement affichées : un ticker codé directement
  // dans un outil ne doit pas pouvoir contourner le registre commun.
  const selectionErrors = validatePublishedListingSelection(ETFS);
  for (const item of [...ETFS, ...FAMILIES.flatMap(family =>
    (family.etfGroups ?? []).flatMap(group => group.funds ?? []))]) {
    const tickers = [...(item.tickers ?? []), ...(item.ticker ? [item.ticker] : []), ...(item.listing ? [item.listing.ticker] : [])];
    if (!ETFS.includes(item) && (item.listing || item.ticker || item.tickers)) {
      selectionErrors.push(...validatePublishedListingSelection([item]));
    }
    published[item.isin] = [...new Set([...(published[item.isin] ?? []), ...tickers])];
  }
  return [...selectionErrors, ...validateListingEvidence({ published, listings: INSTRUMENT_LISTINGS_BY_ISIN, evidence: snapshot.evidence })];
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const errors = auditInstrumentListings();
for (const error of errors) console.error(error);
console.log(`${Object.keys(INSTRUMENT_LISTINGS_BY_ISIN).length} ISIN, ${Object.values(INSTRUMENT_LISTINGS_BY_ISIN).flat().length} cotations documentées, ${errors.length} erreur(s). Contrôle des preuves conservées, sans nouvelle certification en ligne.`);
if (errors.length) process.exitCode = 1;
}
