// Writes one public observation file on its own branch. Never writes master or
// financial automation paths and never needs credentials in the browser.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { validateFeed } from '../src/pages/public-portfolios/refresh.js';
import initialFeed from '../src/pages/public-portfolios/initial-feed.json' with { type: 'json' };
export const BRANCH = 'public-portfolio-data';
export const FILE = 'public/data/public-portfolios-feed.json';
const REPO = 'madmax91310/shinny-potato';

export async function githubRequest(path, token, options = {}, transport = fetch) {
  const response = await transport(`https://api.github.com/repos/${REPO}/${path}`, {
    ...options, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw Error(`GitHub HTTP ${response.status} : publication du flux interrompue, aucune tentative d’écrasement.`);
  return response.json();
}
export async function readPrevious(token, transport = fetch) {
  const file = await githubRequest(`contents/${FILE}?ref=${BRANCH}`, token, {}, transport);
  return file ? { sha: file.sha, feed: validateFeed(JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')), { allowSubset: true }) } : { sha: '', feed: validateFeed(initialFeed) };
}
export async function publishFeed(feed, expectedSha, token, transport = fetch) {
  validateFeed(feed);
  const branch = await githubRequest(`git/ref/heads/${BRANCH}`, token, {}, transport);
  if (!branch) {
    if (expectedSha) throw Error('Branche de données retirée depuis le début de la collecte.');
    const master = await githubRequest('git/ref/heads/master', token, {}, transport);
    if (!master?.object?.sha) throw Error('Référence master absente.');
    await githubRequest('git/refs', token, { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${BRANCH}`, sha: master.object.sha }) }, transport);
  }
  // Verify the lease after collection, then let the Contents API enforce it
  // atomically. A concurrent writer is never overwritten or force-pushed.
  const current = await githubRequest(`contents/${FILE}?ref=${BRANCH}`, token, {}, transport);
  if ((current?.sha || '') !== expectedSha) throw Error('Un autre lancement a actualisé le flux. Relancer la collecte ; aucune donnée écrasée.');
  const result = await githubRequest(`contents/${FILE}`, token, { method: 'PUT', body: JSON.stringify({
    message: 'Actualiser les allocations publiques collectées', branch: BRANCH,
    content: Buffer.from(JSON.stringify(feed, null, 2) + '\n').toString('base64'), ...(expectedSha ? { sha: expectedSha } : {}),
  }) }, transport);
  if (!result?.commit?.sha) throw Error('GitHub ne confirme pas la publication du flux.');
  return result.commit.sha;
}
async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token || process.env.GITHUB_REPOSITORY !== REPO) throw Error('Identifiants de publication ou dépôt inattendus.');
  const previous = await readPrevious(token);
  const dir = mkdtempSync(join(tmpdir(), 'public-portfolios-'));
  try {
    const old = join(dir, 'previous.json'), out = join(dir, 'feed.json');
    if (previous.feed) writeFileSync(old, JSON.stringify(previous.feed));
    execFileSync('python3', ['scripts/public_portfolio_collector.py', '--previous', old, '--output', out], { stdio: 'inherit', timeout: 1200000 });
    const feed = validateFeed(JSON.parse(readFileSync(out, 'utf8')));
    feed.collectorCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const sha = await publishFeed(feed, previous.sha, token);
    const failures = feed.entries.filter(entry => entry.error).length;
    console.log(`Flux publié au commit ${sha}. Sources en échec : ${failures}/${feed.entries.length}. Leurs observations précédentes sont conservées.`);
    if (failures) process.exitCode = 1; // visible incident, after preserving every independent success
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
