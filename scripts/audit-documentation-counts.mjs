import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { DATA_CATALOG } from '../src/data/catalog.js';
import { INDEX_FACTS } from '../src/data/index-facts.js';
import { ALL_ITEMS } from '../src/pages/tweet-midi/lib.js';
import { getDataProvenanceReport } from './data-provenance-report.mjs';

// Même catalogue, pool et classement que les audits métier ; aucun compteur copié.
const provenance = getDataProvenanceReport();
const counts = {
  'catalog-total': DATA_CATALOG.length,
  'index-facts': Object.keys(INDEX_FACTS).length,
  ...Object.fromEntries(['instrument', 'index', 'series', 'lexicon'].map(type => [
    { instrument: 'instruments', index: 'indices' }[type] ?? type,
    DATA_CATALOG.filter(record => record.type === type).length,
  ])),
  'tweet-midi': ALL_ITEMS.length,
  'active-gaps': provenance.activeSourceGaps.length,
  archives: provenance.unverifiableArchives.length,
};
const documents = {
  'src/data/README.md': ['index-facts', 'catalog-total', 'instruments', 'indices', 'series', 'lexicon'],
  'docs/sourcing-2026-09-30.md': ['catalog-total', 'indices', 'active-gaps', 'archives', 'tweet-midi'],
};
const format = value => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function synchronize(text, keys, write = false) {
  const seen = [];
  const result = text.replace(/<!-- data-count:([a-z-]+) -->([\s\S]*?)<!-- \/data-count -->/g, (match, key, value) => {
    assert(keys.includes(key), `Compteur documentaire inconnu : ${key}`);
    assert(/^\d+(?: \d{3})*$/.test(value), `Compteur documentaire invalide : ${key}`);
    seen.push(key);
    const expected = format(counts[key]);
    if (!write) assert.equal(value, expected, `${key} : documentation obsolète ; lancer npm run docs:update-counts`);
    return `<!-- data-count:${key} -->${expected}<!-- /data-count -->`;
  });
  assert.deepEqual(seen.sort(), [...keys].sort(), 'Compteur documentaire absent ou dupliqué');
  return result;
}

// La garde doit détecter une dérive, un compteur supprimé et un doublon.
const valid = `<!-- data-count:indices -->${format(counts.indices)}<!-- /data-count -->`;
const stale = '<!-- data-count:indices -->999999<!-- /data-count -->';
assert.throws(() => synchronize(stale, ['indices']), /obsolète/);
assert.equal(synchronize(stale, ['indices'], true), valid);
assert.throws(() => synchronize('', ['indices'], true), /absent ou dupliqué/);
assert.throws(() => synchronize(valid + valid, ['indices']), /absent ou dupliqué/);

assert(process.argv.slice(2).every(arg => arg === '--write'), 'Usage : node scripts/audit-documentation-counts.mjs [--write]');
// Valider tous les documents avant d'écrire pour éviter une mise à jour partielle.
const updates = Object.entries(documents).map(([path, keys]) => {
  const url = new URL(`../${path}`, import.meta.url);
  const before = readFileSync(url, 'utf8');
  return { url, before, after: synchronize(before, keys, process.argv.includes('--write')) };
});
for (const { url, before, after } of updates) if (after !== before) writeFileSync(url, after);
console.log(`Compteurs documentaires OK : ${counts['catalog-total']} fiches, ${counts.indices} indices, ${format(counts['tweet-midi'])} contenus Tweet Midi ; ${counts['active-gaps']} manque actif de source ; ${counts.archives} archives non recertifiables.`);
