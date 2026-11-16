import catalogue from './catalogue.json' with { type: 'json' };
import initialFeed from './initial-feed.json' with { type: 'json' };
import { blankProfile, blankSnapshot, canonicalUrl } from './lib.js';

export const FEED_URL = 'https://raw.githubusercontent.com/madmax91310/shinny-potato/public-portfolio-data/public/data/public-portfolios-feed.json';
export const COLLECTOR_URL = 'https://github.com/madmax91310/shinny-potato/actions/workflows/refresh-public-portfolios.yml';
export { catalogue };
const stamp = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().replace('.000Z', 'Z') === v && Date.parse(v) <= Date.now() + 300000;
const sourceKey = (url) => {
  const value = canonicalUrl(url);
  const match = value.match(/^https:\/\/app\.getquin\.com\/(?:[a-z]{2}\/)?dashboard\/([a-zA-Z0-9]+)$/);
  return match ? `getquin:${match[1]}` : value;
};
const fail = () => { throw Error('Flux de relevés invalide ou incompatible. Les dernières données sont conservées.'); };

export function validateFeed(feed) {
  if (feed?.version !== 1 || !stamp(feed.collectedAt) || !Array.isArray(feed.entries) || feed.entries.length !== catalogue.length) fail();
  const ids = new Set();
  for (const entry of feed.entries) {
    const known = catalogue.find(row => row.id === entry.catalogueId);
    if (!known || ids.has(entry.catalogueId) || entry.source !== known.url || !stamp(entry.attemptedAt) || entry.attemptedAt > feed.collectedAt || typeof entry.error !== 'string' || entry.error.length > 500 || entry.capability !== 'partial') fail();
    ids.add(entry.catalogueId);
    if (typeof entry.lastSuccessAt !== 'string' || (entry.lastSuccessAt && (!stamp(entry.lastSuccessAt) || entry.lastSuccessAt > entry.attemptedAt))) fail();
    const o = entry.observation;
    if (!o) { if (!entry.error || entry.lastSuccessAt) fail(); continue; }
    if (!/^[a-f0-9]{64}$/.test(o.id) || o.source !== known.url || !stamp(o.collectedAt) || !entry.lastSuccessAt || o.collectedAt > entry.lastSuccessAt || !/^[A-Z]{3}$/.test(o.currency) || o.currency === 'XXX' || o.effective !== '' || typeof o.note !== 'string' || o.note.length > 1500 || !Array.isArray(o.positions) || !o.positions.length || o.positions.length > 500) fail();
    let sum = 0;
    for (const row of o.positions) {
      if (typeof row.name !== 'string' || !row.name.trim() || row.name.length > 500 || typeof row.identifier !== 'string' || row.identifier.length > 100 || typeof row.weight !== 'number' || !Number.isFinite(row.weight) || row.weight < 0 || row.weight > 100) fail();
      sum += row.weight;
    }
    if (sum <= 0 || sum > 100.5) fail();
  }
  return feed;
}

export function sourceSnapshot(observation) {
  return { ...blankSnapshot(), id: `collected:${observation.id}`, consulted: observation.collectedAt.slice(0, 10), effective: observation.effective,
    currency: observation.currency, source: observation.source, positions: structuredClone(observation.positions),
    acquisition: { kind: 'public-html', collectedAt: observation.collectedAt, note: observation.note } };
}

export function mergeFeed(db, input) {
  const feed = validateFeed(input);
  let added = 0, unchanged = 0;
  const profiles = db.profiles.map(profile => {
    const entry = feed.entries.find(row => row.catalogueId === profile.catalogueId);
    const known = catalogue.find(row => row.id === profile.catalogueId);
    if (!entry || !known || sourceKey(profile.url) !== sourceKey(known.url)) return profile;
    if (entry.attemptedAt <= (profile.acquisition?.attemptedAt || '')) { unchanged++; return profile; }
    const snapshots = [...profile.snapshots];
    // A repeated/old observation cannot replace a reviewed snapshot, change a
    // draft's binding, reclassify the portfolio or mutate a published episode.
    const o = entry.observation;
    const newestCollection = snapshots.reduce((date, row) => row.acquisition?.collectedAt > date ? row.acquisition.collectedAt : date, '');
    if (o && o.collectedAt >= newestCollection && !snapshots.some(row => row.id === `collected:${o.id}`)) { snapshots.push(sourceSnapshot(o)); added++; }
    else unchanged++;
    const lastSuccessAt = [profile.acquisition?.lastSuccessAt || '', entry.lastSuccessAt || ''].sort().at(-1);
    return { ...profile, snapshots, acquisition: { capability: entry.capability, attemptedAt: entry.attemptedAt,
      lastSuccessAt, error: entry.error, source: entry.source } };
  });
  const failed = profiles.filter(profile => profile.acquisition?.error).length;
  return { db: { ...db, profiles, feedLoadedAt: [db.feedLoadedAt || '', feed.collectedAt].sort().at(-1) }, added, failed, unchanged };
}

export function seedCatalogue(db) {
  if (db.error || db.catalogueRevision >= 1) return db;
  const profiles = [...db.profiles];
  for (const entry of catalogue) {
    const existing = profiles.find(row => sourceKey(row.url) === sourceKey(entry.url));
    if (existing) {
      // Link a source without changing any personal fields or old publications.
      profiles[profiles.indexOf(existing)] = { ...existing, catalogueId: entry.id };
    } else profiles.push({ ...blankProfile(), id: `catalogue:${entry.id}`, catalogueId: entry.id,
      platform: entry.platform, pseudo: entry.pseudo, url: entry.url, strategy: entry.strategy, objective: entry.objective || '',
      nature: entry.nature, notes: entry.note, evidence: entry.evidence.join('\n') });
  }
  return mergeFeed({ ...db, profiles, catalogueRevision: 1 }, initialFeed).db;
}

export async function fetchLatestFeed(signal) {
  const response = await fetch(`${FEED_URL}?t=${Date.now()}`, { signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw Error(`Flux indisponible (HTTP ${response.status}). Derniers relevés conservés.`);
  const text = await response.text();
  if (text.length > 2000000) fail();
  try { return validateFeed(JSON.parse(text)); }
  catch { return fail(); }
}
