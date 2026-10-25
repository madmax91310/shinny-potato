import assert from 'node:assert/strict';
import stories from '../src/pages/market-facts/stories.json' with { type: 'json' };
import { FACTS, FAMILIES } from '../src/pages/market-facts/data.js';
import { buildTweetText } from '../src/pages/market-facts/lib.js';

assert.equal(stories.length, 50);
assert.equal(new Set(FACTS.map(row => row.id)).size, FACTS.length, 'Aucun identifiant remplacé ou dupliqué');
assert.equal(new Set(stories.map(row => row.text)).size, stories.length);
for (const story of stories) {
  assert(story.id.startsWith('story:') && story.category && story.period, story.id);
  assert(FAMILIES.some(family => family.id === story.family), story.id);
  assert(Array.isArray(story.indices) && story.indices.length, story.id);
  assert(story.text.endsWith('Pas un conseil financier.'), story.id);
  assert(!/https?:\/\/|undefined|NaN/.test(story.text), story.id);
  assert(story.text.split('\n\n').length >= 4 && story.text.length < 25000, story.id);
  assert(story.sources.length >= 2 && story.reserves.length, story.id);
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
console.log(`${stories.length} récits fixes : identifiants, catégories, preuves, réserves et copie exacte OK.`);
