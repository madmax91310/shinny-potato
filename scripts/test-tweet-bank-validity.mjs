import assert from 'node:assert/strict'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { contentValidity, evidenceCheckedAt, reviewPolicy } from '../src/pages/tweet-bank/validity.js'

// A product guide is valid while the shares it cites keep fresh registry controls: the policy
// reads the oldest control date among the cited ISINs, and a stale registry blocks reuse even
// when the hand-written review is recent. Dates come from the registry, never from this test.
const records = { IE00TEST0001: { characteristics: { checkedAt: '2026-10-01' }, aum: { checkedAt: '2026-10-05' } }, IE00TEST0002: { aum: { checkedAt: '2026-09-20T09:00:00Z' } } }
assert.equal(evidenceCheckedAt('Part IE00TEST0001 et IE00TEST0002', records), '2026-09-20')
assert.equal(evidenceCheckedAt('Part IE00TEST0001 et IE00UNKNOWN01', records), '2026-10-05')
assert.equal(evidenceCheckedAt('Aucun ISIN ici', records), null)

const guides = TWEETS.filter(tweet => reviewPolicy(tweet).kind === 'reviewed' && reviewPolicy(tweet).evidence)
assert.ok(guides.length >= 3, 'des guides citent des parts du registre')
for (const tweet of guides) {
  const policy = reviewPolicy(tweet)
  assert.ok(policy.checkedAt <= policy.reviewedAt || policy.checkedAt === policy.evidence, `${tweet.id} : la date retenue est bornée par la preuve`)
  const fresh = contentValidity(tweet, undefined, policy.checkedAt)
  assert.equal(fresh.ready, true, `${tweet.id} : prêt le jour du contrôle`)
  assert.match(fresh.label, /données contrôlées le/)
  const stale = new Date(Date.parse(policy.checkedAt) + (policy.maxAge + 1) * 86400000).toISOString().slice(0, 10)
  assert.equal(contentValidity(tweet, undefined, stale).ready, false, `${tweet.id} : périmé après ${policy.maxAge} jours sans contrôle`)
}
console.log(`${guides.length} product guides bounded by registry control dates; ${TWEETS.length} tweets in the bank.`)
