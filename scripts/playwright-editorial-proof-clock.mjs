import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { TWEETS } from '../src/pages/tweet-bank/data.js'
import { reviewPolicy } from '../src/pages/tweet-bank/validity.js'

const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4440/shinny-potato'
const out = process.env.TEST_OUTPUT_DIR ?? 'test-artifacts/editorial-proof-clock'
const server = process.env.TEST_BASE_URL ? null : spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4440'], { stdio: 'ignore' })
const tweet = TWEETS.find(item => item.id === 'guide:leveraged-etfs')
const policy = reviewPolicy(tweet)
assert(policy.reviewedAt && policy.evidence)
const day = 86400000
const reviewDate = Date.parse(policy.reviewedAt), sourceDate = Date.parse(policy.evidence)
const firstDay = Math.max(reviewDate, sourceDate)
const expiredDay = Math.max(reviewDate + (policy.maxAge + 1) * day, sourceDate)
let browser
try {
  await fs.mkdir(out, { recursive: true })
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break } catch {}
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.setFixedTime(new Date(firstDay + 12 * 3600000))
  await page.goto(base + '/banque-tweets', { waitUntil: 'networkidle' })
  let card = page.locator('[data-tweet-id="guide:leveraged-etfs"]')
  await card.waitFor()
  const firstReady = (firstDay - Math.min(reviewDate, sourceDate)) / day <= policy.maxAge
  assert.equal(await card.getByRole('button', { name: '📋 Copier', exact: true }).isEnabled(), firstReady)
  const text = await card.getByRole('textbox', { name: 'Texte de la publication', exact: true }).inputValue()
  await page.clock.setFixedTime(new Date(expiredDay + 12 * 3600000))
  await page.reload({ waitUntil: 'networkidle' })
  card = page.locator('[data-tweet-id="guide:leveraged-etfs"]')
  await card.waitFor()
  assert.equal(await card.getByRole('button', { name: '📋 Copier', exact: true }).isDisabled(), true)
  assert.equal(await card.getByRole('button', { name: "Marquer publié aujourd'hui", exact: true }).isDisabled(), true)
  assert.equal(await card.getByRole('textbox', { name: 'Texte de la publication', exact: true }).inputValue(), text)
  assert.equal(text, tweet.text)
  await card.scrollIntoViewIfNeeded()
  await page.screenshot({ path: out + '/revue-expiree.png' })
  assert.deepEqual(errors, [])
  await fs.writeFile(out + '/results.json', JSON.stringify({
    reviewedAt: policy.reviewedAt, evidenceCheckedAt: policy.evidence,
    simulatedExpiredDay: new Date(expiredDay).toISOString().slice(0, 10),
    copyAndPublicationBlocked: true, unchangedTweet: true, productionWrite: false,
    qualification: 'Horloge navigateur isolée ; aucune collecte fournisseur ni écriture de publication.', errors,
  }, null, 2))
  console.log('Editorial review and product evidence clocks bound copy/publication; prose unchanged.')
} finally {
  await browser?.close()
  server?.kill()
}
