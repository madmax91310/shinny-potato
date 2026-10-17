import assert from 'node:assert/strict';
import { FACTS, FAMILIES } from '../src/pages/market-facts/data.js';
import { EDITORIAL, NEWTON_STORY } from '../src/pages/market-facts/editorial.js';
import { HISTORY_FACTS } from '../src/data/history-statistics.js';
import { selectMonthlyMarketStories } from '../src/data/market-story-selection.js';

assert.equal(FACTS[0].id, 'records-1987-pire-seance');
assert.equal(FACTS[0].context, EDITORIAL[FACTS[0].id].context);
assert.equal(FACTS[1], NEWTON_STORY);
assert(!FACTS.some(fact => fact.id.startsWith('monthly-dca-')));
assert(!FACTS.some(fact => fact.id === 'monthly-drawdown-cac40' || fact.id === 'crash-1987'));
assert(FACTS.every(fact => FAMILIES.some(family => family.id === fact.family)));

const stories = selectMonthlyMarketStories(HISTORY_FACTS);
// Six hand-written angles come first with distinct twists; every other measured decline on a
// total-return series gets a templated angle whose twist follows the recovery state.
const written = stories.filter(story => !story.derived), derived = stories.filter(story => story.derived);
assert.equal(written.length, 6);
assert.equal(new Set(written.map(story => story.twist)).size, written.length);
assert.deepEqual(stories.slice(0, 6).map(story => story.derived), [undefined, undefined, undefined, undefined, undefined, undefined]);
assert.equal(stories.length, HISTORY_FACTS.filter(fact => fact.id.startsWith('monthly-drawdown-') && fact.hook.includes(' a perdu ') && /réinvestis/.test(fact.methodNote) && !/non réinvestis/.test(fact.methodNote)).length);
assert(derived.length >= 30, 'les baisses mesurées sans angle écrit reçoivent un angle gabarit');
for (const story of derived) {
  const recovered = /pour retrouver le niveau/.test(HISTORY_FACTS.find(fact => fact.id === story.id).context);
  assert.equal(/pas encore/.test(story.twist), !recovered, `${story.id} : la chute doit correspondre à l’état de récupération`);
  assert(story.category && story.hook.length > 40 && !/undefined/.test(story.hook + story.twist + story.category), story.id);
}
for (const story of stories) {
  const original = HISTORY_FACTS.find(fact => fact.id === story.id);
  assert(story.context.includes(original.context), 'Dates et récupération doivent suivre les calculs');
  assert.equal(story.methodNote, original.methodNote);
  assert.equal(story.source, original.source);
}
// Actualisation : un récit perd son fondement si la série ne montre plus de baisse.
const changed = HISTORY_FACTS.map(fact => fact.id === 'monthly-drawdown-meta'
  ? { ...fact, hook: 'L’historique mensuel ne montre aucune baisse depuis un sommet.' }
  : fact);
assert(!selectMonthlyMarketStories(changed).some(story => story.id === 'monthly-drawdown-meta'));
assert.deepEqual(selectMonthlyMarketStories([]), []);
console.log('Sélection éditoriale : références, exclusions, calculs conservés et actualisation OK.');
