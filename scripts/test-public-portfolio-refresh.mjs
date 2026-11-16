import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { catalogue, CATALOGUE_REVISION, seedCatalogue, mergeFeed, validateFeed, sourceSnapshot } from '../src/pages/public-portfolios/refresh.js';
import { blankProfile, sourceKey, collectedPerformance } from '../src/pages/public-portfolios/lib.js';
import { publishFeed, readPrevious, BRANCH, FILE } from './refresh-public-portfolio-feed.mjs';
const feed = JSON.parse(readFileSync(new URL('../src/pages/public-portfolios/initial-feed.json', import.meta.url)));
const research = JSON.parse(readFileSync(new URL('../src/pages/public-portfolios/performance-research.json', import.meta.url)));
for (const candidate of research) {
  const source = catalogue.find(row => row.id === candidate.catalogueId);
  assert(source && source.evidence.includes(candidate.source));
  assert.equal(candidate.status, 'unqualified');
  assert(candidate.missing.length && Number.isFinite(candidate.declaredValue));
  assert(!('verified' in candidate) && !('observation' in candidate));
}
validateFeed(feed);
const firstPrevious = await readPrevious('TEST_TOKEN', async () => ({ ok: false, status: 404 }));
assert.equal(firstPrevious.sha, '');
assert.deepEqual(firstPrevious.feed, feed, 'The first automated run preserves the already collected initial observations on failure');
assert.equal(catalogue.length, 46);
assert.equal(catalogue.filter(row=>row.platform==='eToro').length,16);
const etoroObservations=feed.entries.filter(row=>catalogue.find(profile=>profile.id===row.catalogueId)?.platform==='eToro');
assert.equal(etoroObservations.length,16);
for(const row of etoroObservations){assert(row.observation.performances);assert.equal(row.observation.performances.month.verified,false);assert.equal(row.observation.performances.ytd.verified,false);assert.notEqual(row.observation.performances.ytd.value,'');}
assert.equal(new Set(catalogue.map(row => row.url)).size, catalogue.length);
assert.equal(new Set(catalogue.map(row => row.pseudo.toLowerCase())).size, catalogue.length);
for (const row of catalogue) {
  assert.match(row.url, row.platform === 'eToro' ? /^https:\/\/www\.etoro\.com\/people\/[a-zA-Z0-9_-]+\/stats$/ : /^https:\/\/app\.getquin\.com\/en\/dashboard\/[a-zA-Z0-9]+$/);
  assert(row.evidence.length >= 2);
  assert(row.evidence.some(url => url.includes(row.platform === 'eToro' ? '/portfolio' : '/post/')));
  assert(!('age' in row || 'job' in row || 'income' in row || 'amount' in row));
}
const db = seedCatalogue({ version: 1, profiles: [] });
assert.equal(db.profiles.length, catalogue.length);
assert.equal(db.catalogueRevision, CATALOGUE_REVISION);
assert.equal(seedCatalogue(db), db);
const deleted = { ...db, profiles: db.profiles.slice(1) };
assert.equal(seedCatalogue(deleted).profiles.length, catalogue.length - 1, 'Deleted seeds do not reappear');
assert.equal(seedCatalogue({ version: 1, profiles: [], error: 'unreadable' }).profiles.length, 0);
// An existing v1 reserve receives only the ten new entries, never deleted originals.
const legacyProfiles = db.profiles.filter(p => catalogue.find(c => c.id === p.catalogueId)?.introducedIn === undefined).slice(1);
const upgraded = seedCatalogue({ version: 1, catalogueRevision: 1, profiles: legacyProfiles });
assert.equal(upgraded.profiles.length, catalogue.length - 1);
assert(!upgraded.profiles.some(p => p.catalogueId === catalogue[0].id));
assert.equal(upgraded.catalogueRevision, CATALOGUE_REVISION);
assert.equal(seedCatalogue(upgraded), upgraded);
// Revision three receives only the new public eToro sources. Personal fields,
// prior deletions, virtual nature and frozen publication records remain intact.
const newEtoro=catalogue.find(row=>row.introducedIn===4);
const oldRows=db.profiles.filter(profile=>(catalogue.find(row=>row.id===profile.catalogueId).introducedIn||1)<=3).slice(1);
const personal={...blankProfile(),id:'TEST-FICTIF-existing-profile',url:newEtoro.url.replace('/stats','/portfolio'),nature:'Démonstration / virtuel',notes:'TEST FICTIF note personnelle',publications:[{id:'TEST-FICTIF-episode',text:'TEST FICTIF ancien texte',snapshot:{id:'TEST-FICTIF-frozen',positions:[{name:'TEST FICTIF ancien placement',weight:100}]}}]};
const oldPublications=structuredClone(personal.publications);
const revisionThree=seedCatalogue({version:1,catalogueRevision:3,profiles:[...oldRows,personal]});
assert.equal(revisionThree.profiles.length,catalogue.length-1);
assert(!revisionThree.profiles.some(profile=>profile.catalogueId===catalogue[0].id));
const retained=revisionThree.profiles.find(profile=>profile.id===personal.id);
assert.equal(retained.catalogueId,newEtoro.id);assert.equal(retained.nature,personal.nature);assert.equal(retained.notes,personal.notes);assert.deepEqual(retained.publications,oldPublications);
assert.equal(sourceKey(newEtoro.url),sourceKey(personal.url));
assert.equal(sourceKey(newEtoro.url),sourceKey(newEtoro.url.replace('/stats','').toUpperCase().replace('HTTPS://WWW.ETORO.COM/PEOPLE/','https://www.etoro.com/people/')));
assert.notEqual(sourceKey(newEtoro.url),sourceKey('https://www.etoro.com/people/TEST_FICTIF_DIFFERENT/stats'));
validateFeed({...structuredClone(feed),entries:feed.entries.filter(row=>(catalogue.find(profile=>profile.id===row.catalogueId).introducedIn||1)<=3)});
const legacyFeed = { ...structuredClone(feed), entries: feed.entries.filter(e => catalogue.find(c => c.id === e.catalogueId)?.introducedIn === undefined) };
assert.equal(legacyFeed.entries.length, 20);
assert.throws(() => validateFeed(legacyFeed));
const previousVersion = await readPrevious('TEST_TOKEN', async () => ({ok:true,status:200,json:async()=>({sha:'old-lease',content:Buffer.from(JSON.stringify(legacyFeed)).toString('base64')})}));
assert.equal(previousVersion.feed.entries.length, 20, 'The weekly collector migrates its previous twenty-profile feed without losing observations');
const existing = { ...blankProfile(), url: catalogue[0].url.replace('/en/', '/'), pseudo: 'MON PSEUDO', nature: 'Démonstration / virtuel', strategy: 'Texte personnel' };
const migration = seedCatalogue({ version: 1, profiles: [existing] });
assert.equal(migration.profiles.length, catalogue.length);
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
const etoroEntry=feed.entries.find(row=>row.catalogueId==='etoro-jaynemesis');
const etoroSnapshot=sourceSnapshot(etoroEntry.observation);
assert.equal(etoroSnapshot.month.verified,false);
assert.equal(etoroSnapshot.ytd.verified,false);
assert.equal(etoroSnapshot.ytd.approximate,true);
assert.equal(etoroSnapshot.currency,'');
assert.equal(etoroSnapshot.month.value,etoroEntry.observation.performances.month.value);
assert(etoroSnapshot.acquisition.series.length);
assert.equal(collectedPerformance(etoroSnapshot,'month').value,etoroSnapshot.month.value);
const editedEtoro=structuredClone(etoroSnapshot);editedEtoro.month.value+=1;
assert.equal(collectedPerformance(editedEtoro,'month'),null,'An edited value cannot keep the collected preview attribution');
validateFeed({...structuredClone(feed),entries:feed.entries.filter(row=>row.catalogueId!=='etoro-jaynemesis')});
for(const mutate of [
 value=>value.observation.performances.month.verified=true,
 value=>value.observation.performances.month.start=value.observation.performances.month.end,
 value=>value.observation.performances.ytd.value+=1,
 value=>value.observation.performances.series.pop(),
 value=>value.observation.performances.series[0].value=null,
]) {const bad=structuredClone(feed);mutate(bad.entries.find(row=>row.catalogueId==='etoro-jaynemesis'));assert.throws(()=>validateFeed(bad));}
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
// A -> B -> A is a new occurrence, including when A used a legacy content-only ID.
const legacyDb = structuredClone(db);
const legacyProfile = legacyDb.profiles.find(row => row.id === selected.id);
legacyProfile.snapshots[0].id = `collected:${observed.observation.id}`;
delete legacyProfile.snapshots[0].acquisition.observationId;
legacyProfile.draft.snapshotId = legacyProfile.snapshots[0].id;
const intermediate = mergeFeed(legacyDb, fresh).db;
const returned = structuredClone(fresh);
returned.collectedAt = new Date(Date.now() + 3000).toISOString().replace(/\.\d{3}Z$/, 'Z');
const returnEntry = returned.entries.find(row => row.catalogueId === observed.catalogueId);
returnEntry.attemptedAt = returnEntry.lastSuccessAt = returned.collectedAt;
returnEntry.observation = { ...structuredClone(observed.observation), collectedAt: returned.collectedAt };
const resultA = mergeFeed(intermediate, returned);
const returnedProfile = resultA.db.profiles.find(row => row.id === selected.id);
assert.equal(resultA.added, 1, 'Returning to a historical allocation creates a dated occurrence');
assert.deepEqual(returnedProfile.snapshots.at(-1).positions, observed.observation.positions);
assert.notEqual(returnedProfile.snapshots[0].id, returnedProfile.snapshots.at(-1).id);
assert.equal(returnedProfile.snapshots[0].id, legacyProfile.snapshots[0].id);
assert.deepEqual(returnedProfile.draft, legacyProfile.draft);
assert.deepEqual(returnedProfile.publications, legacyProfile.publications);
assert.equal(mergeFeed(resultA.db, returned).added, 0);
const unchangedA = structuredClone(returned);
unchangedA.collectedAt = new Date(Date.now() + 4000).toISOString().replace(/\.\d{3}Z$/, 'Z');
unchangedA.entries.find(row => row.catalogueId === observed.catalogueId).attemptedAt = unchangedA.collectedAt;
unchangedA.entries.find(row => row.catalogueId === observed.catalogueId).lastSuccessAt = unchangedA.collectedAt;
assert.equal(mergeFeed(resultA.db, unchangedA).added, 0, 'Consecutive identical reads do not create copies');
for (const lang of ['', 'de/', 'fr/', 'en/']) {
  assert.equal(sourceKey(catalogue[0].url.replace('/en/', '/' + lang) + '?utm_source=test#allocation'), sourceKey(catalogue[0].url));
}
assert.notEqual(sourceKey(catalogue[0].url), sourceKey(catalogue[1].url));
assert.notEqual(sourceKey('https://example.com/en/dashboard/ABC'), sourceKey('https://example.com/de/dashboard/ABC'));
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
console.log('Réserve sourcée : 46 profils, migration/doublons/suppression, relevés partiels, pannes sans perte, historique, validation du flux et publication avec bail vérifiés.');
