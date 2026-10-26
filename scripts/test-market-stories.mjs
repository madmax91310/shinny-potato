import assert from 'node:assert/strict';
import stories from '../src/pages/market-facts/stories.json' with { type: 'json' };
import additions from '../src/pages/market-facts/additions-20261026.json' with { type: 'json' };
import legacy from '../src/pages/market-facts/reviewed-legacy.json' with { type: 'json' };
import { FACTS, FAMILIES } from '../src/pages/market-facts/data.js';
import { buildTweetText } from '../src/pages/market-facts/lib.js';

assert.equal(stories.length, 50);
const narratives = FACTS.filter(row => row.kind !== 'measured-reference');
const fixed = FACTS.filter(row => typeof row.text === 'string');
for (const original of [...stories, ...additions]) assert(FACTS.some(row => row.id === original.id));
for (const id of Object.keys(legacy)) assert(FACTS.some(row => row.id === id), `Identifiant hérité conservé : ${id}`);
assert.equal(new Set(FACTS.map(row => row.id)).size, FACTS.length, 'Aucun identifiant remplacé ou dupliqué');
assert.equal(new Set(stories.map(row => row.text)).size, stories.length);
for (const story of fixed) {
  assert(story.category && story.period, story.id);
  assert(FAMILIES.some(family => family.id === story.family), story.id);
  assert(Array.isArray(story.indices) && story.indices.length, story.id);
  assert(story.text.endsWith('Pas un conseil financier.'), story.id);
  assert(!/https?:\/\/|undefined|NaN/.test(story.text), story.id);
  assert(story.text.split('\n\n').length >= 4 && story.text.length < 25000, story.id);
  assert(story.sources.length >= (story.kind === 'measured-reference' ? 1 : 2) && story.reserves.length, story.id);
  assert.equal(new Set(story.sources.map(source => source.url)).size, story.sources.length);
  for (const source of story.sources) {
    assert.equal(new URL(source.url).protocol, 'https:');
    assert(source.title && source.organization && source.checkedAt && source.facts.length, story.id);
    assert(Object.hasOwn(source, 'publishedAt'), 'Date connue ou explicitement absente');
  }
  assert.equal(buildTweetText(FACTS.find(row => row.id === story.id)), story.text);
  // Les performances et les champs de l'ancien format ne réécrivent jamais ces récits.
  assert.equal(buildTweetText({ ...story, hook: 'autre', context: 'autre', twist: 'autre' }), story.text);
}
assert.equal(new Set(stories.map(row => row.family)).size, 6);
for (const fact of FACTS) {
  const text = buildTweetText(fact);
  assert(!/(?<![\p{L}])(?:je|mon|mes)(?![\p{L}])/iu.test(text), `Pas d'expérience personnelle attribuée : ${fact.id}`);
  assert(text.endsWith('Pas un conseil financier.'), fact.id);
  assert(fact.sources?.length, `Sources accessibles : ${fact.id}`);
}
assert(narratives.every(row => typeof row.text === 'string'), 'Chaque récit est écrit, jamais dérivé des performances');
console.log(`${narratives.length} récits fixes et ${FACTS.length - narratives.length} repères : identifiants, catégories, preuves, réserves et copie exacte OK.`);
