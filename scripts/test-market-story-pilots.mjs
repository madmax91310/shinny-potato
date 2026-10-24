import assert from 'node:assert/strict'
import { MARKET_STORIES } from '../src/pages/tweet-bank/market-stories.js'
import { TWEETS, CATEGORIES } from '../src/pages/tweet-bank/data.js'
import { contentValidity, renderBankCopy } from '../src/pages/tweet-bank/validity.js'
import { filterAndSortTweets } from '../src/pages/tweet-bank/lib.js'

assert.ok(CATEGORIES.includes('Histoires de marché'))
assert.equal(new Set(TWEETS.map(t => t.id)).size, TWEETS.length)
assert.equal(MARKET_STORIES.length, 3)
assert.equal(new Set(MARKET_STORIES.map(t => t.angle)).size, 3)
const selected = filterAndSortTweets(TWEETS, {}, { category: 'Histoires de marché' })
assert.equal(selected.length, 3)
for (const story of MARKET_STORIES) {
  assert.equal(renderBankCopy(story, undefined, '2026-10-23'), story.text)
  assert.equal(contentValidity(story, undefined, '2030-01-01').ready, true, 'un récit historique ne devient pas un chiffre de marché périmé')
  assert.equal(contentValidity(story, { text: story.text + ' changement' }, '2026-10-23').ready, false)
  assert.equal(contentValidity({ ...story, id: 'unreviewed' }, undefined, '2026-10-23').ready, false, 'la catégorie seule ne valide pas un texte')
  assert.equal(contentValidity({ ...story, text: story.text + ' changement' }, undefined, '2026-10-23').ready, false, 'un texte différent ne reçoit pas la revue du pilote')
  for (const step of story.timeline) for (const id of step.sources) assert.ok(story.sources.some(source => source.id === id))
  assert.ok(!story.text.includes('https://'), 'sources séparées de la copie')
  assert.ok(story.alternativeHook.length > 0)
  assert.ok(story.uncertainties.length > 0)
}
console.log('Trois pilotes : revue explicite, copie sans sources, recherche de catégorie et invalidation des modifications validées.')
