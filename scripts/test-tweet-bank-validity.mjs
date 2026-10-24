import assert from 'node:assert/strict'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { contentValidity, evidenceCheckedAt, reviewPolicy, renderBankCopy } from '../src/pages/tweet-bank/validity.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'

// A product guide needs both a fresh editorial review and fresh registry controls: the policy
// reads the oldest control date among the cited ISINs, and a stale registry blocks reuse even
// when the hand-written review is recent. Dates come from the registry, never from this test.
const records = { IE00TEST0001: { characteristics: { checkedAt: '2026-10-01' }, aum: { checkedAt: '2026-10-05' } }, IE00TEST0002: { characteristics: { checkedAt: '2026-09-20T09:00:00Z' }, aum: { checkedAt: '2026-10-21' } } }
assert.equal(evidenceCheckedAt('Part IE00TEST0001 et IE00TEST0002', records), '2026-09-20')
assert.equal(evidenceCheckedAt('Part IE00TEST0001 et IE00UNKNOWN01', records), '2026-10-01')
assert.equal(evidenceCheckedAt('Aucun ISIN ici', records), null)

const guides = TWEETS.filter(tweet => reviewPolicy(tweet).kind === 'reviewed' && reviewPolicy(tweet).evidence)
assert.ok(guides.length >= 3, 'des guides citent des parts du registre')
for (const tweet of guides) {
  const policy = reviewPolicy(tweet)
  assert.ok(policy.checkedAt <= policy.reviewedAt && policy.checkedAt <= policy.evidence, `${tweet.id} : preuve et revue bornent toutes deux la validité`)
  const fresh = contentValidity(tweet, undefined, policy.checkedAt)
  assert.equal(fresh.ready, true, `${tweet.id} : prêt le jour du contrôle`)
  assert.match(fresh.label, /données contrôlées le/)
  const stale = new Date(Date.parse(policy.checkedAt) + (policy.maxAge + 1) * 86400000).toISOString().slice(0, 10)
  assert.equal(contentValidity(tweet, undefined, stale).ready, false, `${tweet.id} : périmé après ${policy.maxAge} jours sans contrôle`)
}

// A collector checks product data, not the unchanged prose of a previously reviewed guide.
// Isolated registry fixtures never touch the on-disk observations or any publication.
const fixtureIsin = 'IE00TEST0001', previous = AUTOMATED_ETF[fixtureIsin]
const guide = { id: 'guide:active-etfs', text: `Guide inchangé : ${fixtureIsin}` }
try {
  AUTOMATED_ETF[fixtureIsin] = { characteristics: { checkedAt: '2026-11-01' } }
  assert.equal(reviewPolicy(guide).reviewedAt, '2026-10-13')
  assert.equal(reviewPolicy(guide).checkedAt, '2026-10-13', 'un nouveau contrôle ne renouvelle pas la revue du texte')
  assert.equal(contentValidity(guide, undefined, '2026-11-15').ready, false, 'texte périmé même si la preuve produit a moins de trente jours')
  assert.throws(() => renderBankCopy(guide, undefined, '2026-11-15'), /vérifié avant copie/)
  const reviewedDraft = { text: guide.text, checkedAt: '2026-11-15', asOf: '2026-11-01', verifiedText: guide.text, verifiedAsOf: '2026-11-01' }
  assert.equal(contentValidity(guide, reviewedDraft, '2026-11-15').ready, true, 'une nouvelle revue explicite reste possible')
  AUTOMATED_ETF[fixtureIsin] = { characteristics: { checkedAt: '2026-09-01' } }
  assert.equal(contentValidity(guide, undefined, '2026-10-13').ready, false, 'une revue récente ne rajeunit pas une preuve ancienne')
  AUTOMATED_ETF[fixtureIsin] = { characteristics: { checkedAt: '2026-10-20' } }
  assert.equal(contentValidity(guide, undefined, '2026-10-23').ready, true)
  assert.equal(renderBankCopy(guide, undefined, '2026-10-23'), guide.text, 'rédaction copiée inchangée')
} finally {
  if (previous === undefined) delete AUTOMATED_ETF[fixtureIsin]
  else AUTOMATED_ETF[fixtureIsin] = previous
}
console.log(`${guides.length} product guides bounded by registry control dates; ${TWEETS.length} tweets in the bank.`)
