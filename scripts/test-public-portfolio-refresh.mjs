import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { catalogue, CATALOGUE_REVISION, seedCatalogue, mergeFeed, validateFeed, sourceSnapshot } from '../src/pages/public-portfolios/refresh.js';
import { blankProfile } from '../src/pages/public-portfolios/lib.js';
import { publishFeed, readPrevious, BRANCH, FILE } from './refresh-public-portfolio-feed.mjs';
const feed = JSON.parse(readFileSync(new URL('../src/pages/public-portfolios/initial-feed.json', import.meta.url)));
validateFeed(feed);
const firstPrevious = await readPrevious('TEST_TOKEN', async () => ({ ok: false, status: 404 }));
assert.equal(firstPrevious.sha, '');
assert.deepEqual(firstPrevious.feed, feed, 'The first automated run preserves the already collected initial observations on failure');
assert.equal(catalogue.length, 30);
assert.equal(new Set(catalogue.map(row => row.url)).size, 30);
assert.equal(new Set(catalogue.map(row => row.pseudo.toLowerCase())).size, 30);
for (const row of catalogue) {
  assert.match(row.url, /^https:\/\/app\.getquin\.com\/en\/dashboard\/[a-zA-Z0-9]+$/);
  assert(row.evidence.length >= 2);
  assert(row.evidence.some(url => url.includes('/post/')));
  assert(!('age' in row || 'job' in row || 'income' in row || 'amount' in row));
}
const db = seedCatalogue({ version: 1, profiles: [] });
assert.equal(db.profiles.length, 30);
assert.equal(db.catalogueRevision, CATALOGUE_REVISION);
assert.equal(seedCatalogue(db), db);
const deleted = { ...db, profiles: db.profiles.slice(1) };
assert.equal(seedCatalogue(deleted).profiles.length, 29, 'Deleted seeds do not reappear');
assert.equal(seedCatalogue({ version: 1, profiles: [], error: 'unreadable' }).profiles.length, 0);
// An existing v1 reserve receives only the ten new entries, never deleted originals.
const legacyProfiles = db.profiles.filter(p => catalogue.find(c => c.id === p.catalogueId)?.introducedIn !== 2).slice(1);
const upgraded = seedCatalogue({ version: 1, catalogueRevision: 1, profiles: legacyProfiles });
assert.equal(upgraded.profiles.length, 29);
assert(!upgraded.profiles.some(p => p.catalogueId === catalogue[0].id));
assert.equal(upgraded.catalogueRevision, CATALOGUE_REVISION);
assert.equal(seedCatalogue(upgraded), upgraded);
const legacyFeed = { ...structuredClone(feed), entries: feed.entries.filter(e => catalogue.find(c => c.id === e.catalogueId)?.introducedIn !== 2) };
assert.equal(legacyFeed.entries.length, 20);
assert.throws(() => validateFeed(legacyFeed));
const previousVersion = await readPrevious('TEST_TOKEN', async () => ({ok:true,status:200,json:async()=>({sha:'old-lease',content:Buffer.from(JSON.stringify(legacyFeed)).toString('base64')})}));
assert.equal(previousVersion.feed.entries.length, 20, 'The weekly collector migrates its previous twenty-profile feed without losing observations');
const existing = { ...blankProfile(), url: catalogue[0].url.replace('/en/', '/'), pseudo: 'MON PSEUDO', nature: 'Démonstration / virtuel', strategy: 'Texte personnel' };
const migration = seedCatalogue({ version: 1, profiles: [existing] });
assert.equal(migration.profiles.length, 30);
assert.equal(migration.profiles[0].id, existing.id);
assert.equal(migration.profiles[0].nature, existing.nature);
assert.equal(migration.profiles[0].strategy, existing.strategy);
const observed = feed.entries.find(row => row.observation);
assert(observed, 'At least one real, directly read source must accompany the release');
const snapshot = sourceSnapshot(observed.observation);
assert.equal(snapshot.month.value, ''); assert.equal(snapshot.ytd.value, '');
assert.equal(snapshot.month.verified, false); assert.equal(snapshot.method, 'Non précisée');
assert.equal(snapshot.total, ''); assert.equal(snapshot.effective, '');
assert.deepEqual(snapshot.positions, observed.observation.positions);
const when = new Date(Date.now() + 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const fresh = structuredClone(feed);
fresh.collectedAt = when;
for (const row of fresh.entries) row.attemptedAt = when;
const nextEntry = fresh.entries.find(row => row.catalogueId === observed.catalogueId);
nextEntry.lastSuccessAt = when;
nextEntry.observation = { ...nextEntry.observation, id: 'a'.repeat(64), collectedAt: when };
const selected = db.profiles.find(row => row.catalogueId === observed.catalogueId);
selected.status = 'Publié'; selected.checked = '2026-01-01';
selected.draft = { text: 'TEST FICTIF brouillon personnel', snapshotId: selected.snapshots[0].id, episode: 2 };
selected.publications = [{ text: 'TEST FICTIF publication figée', snapshot: structuredClone(selected.snapshots[0]), image: { version: 1, episode: 1 } }];
const before = JSON.stringify(db);
const updated = mergeFeed(db, fresh);
const after = updated.db.profiles.find(row => row.id === selected.id);
assert.equal(JSON.stringify(db), before, 'Merge never mutates the stored database');
assert.equal(after.snapshots.length, selected.snapshots.length + 1);
assert.deepEqual(after.draft, selected.draft);
assert.deepEqual(after.publications, selected.publications);
assert.equal(after.checked, selected.checked); assert.equal(after.status, selected.status);
assert.equal(mergeFeed(updated.db, fresh).added, 0, 'Repeated loading is idempotent');
assert.equal(mergeFeed(updated.db, feed).added, 0, 'An older feed never rolls the source back');
assert.equal(mergeFeed(updated.db, feed).db.feedLoadedAt, when);
const failure = structuredClone(fresh);
failure.collectedAt = new Date(Date.now() + 2000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const failed = failure.entries.find(row => row.catalogueId === observed.catalogueId);
failed.attemptedAt = failure.collectedAt; failed.error = 'TEST : page indisponible';
const failedDb = mergeFeed(updated.db, failure).db;
const preserved = failedDb.profiles.find(row => row.id === after.id);
assert.deepEqual(preserved.snapshots, after.snapshots);
assert.deepEqual(preserved.publications, after.publications);
assert.equal(preserved.acquisition.lastSuccessAt, after.acquisition.lastSuccessAt);
assert.equal(preserved.acquisition.error, failed.error);
assert.equal(mergeFeed(failedDb, failure).failed, 1, 'A repeated loading still reports the unresolved source failure');
assert.equal(mergeFeed(failedDb, feed).failed, 1, 'An older successful feed cannot hide a more recent failure');
const otherUrl = { ...selected, url: 'https://example.com/test-only' };
assert.deepEqual(mergeFeed({ ...db, profiles: [otherUrl] }, fresh).db.profiles[0], otherUrl, 'Changing a source disconnects its old collector');
for (const mutate of [
  value => { value.version = 99; },
  value => { value.entries.push(value.entries[0]); },
  value => { value.entries[0].source = 'https://example.com/untrusted'; },
  value => { value.entries[0].lastSuccessAt = null; },
  value => { value.collectedAt = '2026-02-31T00:00:00Z'; },
  value => { value.entries.find(row => row.observation).observation.positions[0].weight = null; },
  value => { value.entries.find(row => row.observation).observation.positions[0].weight = -1; },
  value => { value.entries.find(row => row.observation).observation.currency = 'XXX'; },
]) {
  const bad = structuredClone(feed); mutate(bad);
  assert.throws(() => mergeFeed(db, bad), /invalide|incompatible/);
  assert.equal(JSON.stringify(db), before);
}
// Test the publisher against a fake HTTP transport. No external write from tests.
const calls = [];
const transport = async (url, options) => {
  calls.push({ url, options });
  if (url.includes('git/ref/heads/')) return { ok: true, status: 200, json: async () => ({ object: { sha: 'b'.repeat(40) } }) };
  if (options.method === 'PUT') return { ok: true, status: 200, json: async () => ({ commit: { sha: 'c'.repeat(40) } }) };
  return { ok: true, status: 200, json: async () => ({ sha: 'lease' }) };
};
assert.equal(await publishFeed(feed, 'lease', 'TEST_TOKEN', transport), 'c'.repeat(40));
const put = calls.find(row => row.options.method === 'PUT');
const body = JSON.parse(put.options.body);
assert.equal(body.branch, BRANCH); assert.equal(body.sha, 'lease');
assert(put.url.endsWith('/contents/' + FILE));
assert(calls.every(row => !row.url.includes('/git/refs/heads/master') && row.options.method !== 'PATCH'));
calls.length = 0;
await assert.rejects(() => publishFeed(feed, 'stale-lease', 'TEST_TOKEN', transport), /autre lancement/);
assert(!calls.some(row => row.options.method === 'PUT'));
const creationCalls = [];
const firstPublish = async (url, options) => {
  creationCalls.push({ url, options });
  if (url.endsWith('git/ref/heads/' + BRANCH) || url.includes('/contents/') && options.method !== 'PUT') return { ok: false, status: 404 };
  if (url.endsWith('git/ref/heads/master')) return { ok: true, status: 200, json: async () => ({ object: { sha: 'd'.repeat(40) } }) };
  return { ok: true, status: 200, json: async () => options.method === 'PUT' ? ({ commit: { sha: 'e'.repeat(40) } }) : ({ ref: 'refs/heads/' + BRANCH }) };
};
assert.equal(await publishFeed(feed, '', 'TEST_TOKEN', firstPublish), 'e'.repeat(40));
const createRef = creationCalls.find(row => row.options.method === 'POST');
assert.deepEqual(JSON.parse(createRef.options.body), { ref: 'refs/heads/' + BRANCH, sha: 'd'.repeat(40) });
assert.equal(creationCalls.filter(row => row.options.method === 'PUT').length, 1);
const workflow = readFileSync(new URL('../.github/workflows/refresh-public-portfolios.yml', import.meta.url), 'utf8');
assert(workflow.includes("cron: '10 7 * * 6'"));
assert(workflow.includes('cancel-in-progress: false'));
assert(workflow.includes('queue: max'));
assert(!workflow.includes('commit-validated-data') && !workflow.includes('deploy-pages.yml'));
execFileSync('python3', ['-m', 'unittest', 'discover', '-s', 'scripts', '-p', 'test_public_portfolio_collector.py'], { stdio: 'inherit' });
console.log('Réserve sourcée : 30 profils, migration/doublons/suppression, relevés partiels, pannes sans perte, historique, validation du flux et publication avec bail vérifiés.');
