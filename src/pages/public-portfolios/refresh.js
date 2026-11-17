import catalogue from './catalogue.json' with { type: 'json' };
import initialFeed from './initial-feed.json' with { type: 'json' };
import { blankProfile, blankSnapshot, sourceKey, lastCompletedMonthEnd } from './lib.js';

export const FEED_URL = 'https://raw.githubusercontent.com/madmax91310/shinny-potato/public-portfolio-data/public/data/public-portfolios-feed.json';
export const COLLECTOR_URL = 'https://github.com/madmax91310/shinny-potato/actions/workflows/refresh-public-portfolios.yml';
export { catalogue };
export const CATALOGUE_REVISION = 4;
const stamp = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().replace('.000Z', 'Z') === v && Date.parse(v) <= Date.now() + 300000;
const fail = () => { throw Error('Flux de relevés invalide ou incompatible. Les dernières données sont conservées.'); };

export function validateFeed(feed, { allowSubset = false } = {}) {
  if (feed?.version !== 1 || !stamp(feed.collectedAt) || !Array.isArray(feed.entries) || !feed.entries.length || feed.entries.length > catalogue.length) fail();
  const ids = new Set();
  for (const entry of feed.entries) {
    const known = catalogue.find(row => row.id === entry.catalogueId);
    if (!known || ids.has(entry.catalogueId) || entry.source !== known.url || !stamp(entry.attemptedAt) || entry.attemptedAt > feed.collectedAt || typeof entry.error !== 'string' || entry.error.length > 500 || entry.capability !== 'partial') fail();
    ids.add(entry.catalogueId);
    if (typeof entry.lastSuccessAt !== 'string' || (entry.lastSuccessAt && (!stamp(entry.lastSuccessAt) || entry.lastSuccessAt > entry.attemptedAt))) fail();
    const o = entry.observation;
    if (!o) { if (!entry.error || entry.lastSuccessAt) fail(); continue; }
    if (!/^[a-f0-9]{64}$/.test(o.id) || o.source !== known.url || !stamp(o.collectedAt) || !entry.lastSuccessAt || o.collectedAt > entry.lastSuccessAt || (!(known.platform === 'eToro' && o.currency === '') && !/^[A-Z]{3}$/.test(o.currency)) || o.currency === 'XXX' || o.effective !== '' || typeof o.note !== 'string' || o.note.length > 1500 || !Array.isArray(o.positions) || !o.positions.length || o.positions.length > 500) fail();
    if (o.performances) validatePerformances(o, known);
    let sum = 0;
    for (const row of o.positions) {
      if (typeof row.name !== 'string' || !row.name.trim() || row.name.length > 500 || typeof row.identifier !== 'string' || row.identifier.length > 100 || typeof row.weight !== 'number' || !Number.isFinite(row.weight) || row.weight < 0 || row.weight > 100) fail();
      sum += row.weight;
    }
    if (sum <= 0 || sum > 100.5) fail();
  }
  if (!allowSubset && catalogue.some(row => (row.introducedIn || 1) <= 2 && !ids.has(row.id))) fail();
  return feed;
}

function validatePerformances(o, known) {
  const p=o.performances, end=lastCompletedMonthEnd(o.collectedAt.slice(0,10)), year=end.slice(0,4), count=Number(end.slice(5,7));
  const number=v=>typeof v==='number' && Number.isFinite(v) && v>=-100;
  if (known.platform!=='eToro' || p.source!==known.url || p.method!=='Autre' || typeof p.methodNote!=='string' || p.methodNote.length>1000 || !Array.isArray(p.series) || p.series.length>12) fail();
  const validMetric=(m,start)=>m && number(m.value) && m.start===start && m.end===end && m.kind==='Cumulée' && m.verified===false && m.na==='' && typeof m.original==='string' && m.original.length>0 && m.original.length<=500;
  if (!validMetric(p.month,end.slice(0,7)+'-01')) fail();
  if (p.month.original!==`eToro Performance · ${end.slice(0,7)}` || (p.ytd?.value!=='' && p.ytd.original!=='Cumul géométrique des mois eToro publiés, arrondis par la source')) fail();
  const keys=new Set();
  for (const row of p.series) {
    if (!new RegExp('^'+year+'-(0[1-9]|1[0-2])$').test(row.month) || row.month>end.slice(0,7) || keys.has(row.month) || !number(row.value)) fail();
    keys.add(row.month);
  }
  if (p.series.find(row=>row.month===end.slice(0,7))?.value!==p.month.value) fail();
  if (p.ytd?.value!=='') {
    if (!validMetric(p.ytd,year+'-01-01') || p.ytd.approximate!==true || p.series.length!==count) fail();
    const computed=Number(((p.series.reduce((product,row)=>product*(1+row.value/100),1)-1)*100).toFixed(2));
    if(p.ytd.value!==computed) fail();
  } else if (!p.ytd || p.ytd.verified!==false) fail();
}

export function sourceSnapshot(observation) {
  return { ...blankSnapshot(), id: `collected:${observation.id}:${observation.collectedAt}`, consulted: observation.collectedAt.slice(0, 10), effective: observation.effective,
    currency: observation.currency, source: observation.source, positions: structuredClone(observation.positions),
    ...(observation.performances ? {month:{...observation.performances.month,verified:false},ytd:{...observation.performances.ytd,verified:false},method:observation.performances.method,methodNote:observation.performances.methodNote} : {}),
    acquisition: { kind: 'public-html', observationId: observation.id, collectedAt: observation.collectedAt, note: observation.note,
      ...(observation.performances ? {performanceSource:observation.performances.source,series:structuredClone(observation.performances.series),performanceValues:{month:structuredClone(observation.performances.month),ytd:structuredClone(observation.performances.ytd)}} : {}) } };
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
    const collected = snapshots.filter(row => row.id.startsWith('collected:') && row.acquisition?.kind === 'public-html');
    const latest = collected.reduce((newest, row) => !newest || row.acquisition.collectedAt >= newest.acquisition.collectedAt ? row : newest, null);
    // Legacy IDs contain only the content hash. Never rewrite their references:
    // drafts and published episodes may still point to them.
    const latestContent = latest?.acquisition.observationId || latest?.id.split(':')[1];
    const newestCollection = latest?.acquisition.collectedAt || '';
    if (o && o.collectedAt >= newestCollection && latestContent !== o.id) { snapshots.push(sourceSnapshot(o)); added++; }
    else unchanged++;
    const lastSuccessAt = [profile.acquisition?.lastSuccessAt || '', entry.lastSuccessAt || ''].sort().at(-1);
    return { ...profile, snapshots, acquisition: { capability: entry.capability, attemptedAt: entry.attemptedAt,
      lastSuccessAt, error: entry.error, source: entry.source } };
  });
  const failed = profiles.filter(profile => profile.acquisition?.error).length;
  return { db: { ...db, profiles, feedLoadedAt: [db.feedLoadedAt || '', feed.collectedAt].sort().at(-1) }, added, failed, unchanged };
}

export function seedCatalogue(db) {
  if (db.error || db.catalogueRevision >= CATALOGUE_REVISION) return db;
  const profiles = [...db.profiles];
  for (const entry of catalogue) {
    if ((entry.introducedIn || 1) <= (db.catalogueRevision || 0)) continue;
    const existing = profiles.find(row => sourceKey(row.url) === sourceKey(entry.url));
    if (existing) {
      // Link a source without changing any personal fields or old publications.
      profiles[profiles.indexOf(existing)] = { ...existing, catalogueId: entry.id };
    } else profiles.push({ ...blankProfile(), id: `catalogue:${entry.id}`, catalogueId: entry.id,
      platform: entry.platform, pseudo: entry.pseudo, url: entry.url, strategy: entry.strategy, objective: entry.objective || '',
      nature: entry.nature, notes: entry.note, evidence: entry.evidence.join('\n') });
  }
  return mergeFeed({ ...db, profiles, catalogueRevision: CATALOGUE_REVISION }, initialFeed).db;
}

export async function fetchLatestFeed(signal) {
  const response = await fetch(`${FEED_URL}?t=${Date.now()}`, { signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw Error(`Flux indisponible (HTTP ${response.status}). Derniers relevés conservés.`);
  const text = await response.text();
  if (text.length > 2000000) fail();
  try { return validateFeed(JSON.parse(text)); }
  catch { return fail(); }
}
