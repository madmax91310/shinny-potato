import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { expect } from 'playwright/test'
import { euro } from '../src/pages/budget-profiles/lib.js'
import { planSocialBudget } from '../src/pages/budget-profiles/socialImage.js'

export function captureBudgetCanvas() {
  const fill = CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...args) {
    if (text === 'LE BUDGET DE') window.budgetCanvasText = []
    if (this.canvas.width === 1080 && window.budgetCanvasText) {
      const size = Number(this.font.match(/([\d.]+)px/)?.[1] || 0)
      const width = this.measureText(text).width
      const left = x - (this.textAlign === 'right' ? width : this.textAlign === 'center' ? width / 2 : 0)
      window.budgetCanvasText.push({ text: String(text), left, right: left + width, y, size })
    }
    return fill.call(this, text, x, y, ...args)
  }
}

export function assertBudgetCanvas(drawn, profile) {
  const { totals, expenses, presentation } = planSocialBudget(profile)
  assert(drawn.length > 0, profile.id)
  assert.equal(drawn.filter(line => line.text === 'LE BUDGET DE').length, 1)
  assert(drawn.some(line => line.text.startsWith(presentation.name.slice(0, 12))), profile.id)
  assert(drawn.some(line => line.text.includes('Épargnant Libre')), profile.id)
  const number = amount => euro(amount, profile.currency).replace(/\s*(?:€|CHF)$/, '')
  for (const amount of [totals.income, totals.expenses]) assert(drawn.some(line => line.text === euro(amount, profile.currency)), profile.id)
  const ledger = drawn.filter(line => line.y > 549 && line.y < 966)
  for (const group of expenses.flat()) {
    for (const row of group.rows) assert(ledger.some(line => line.text === number(row.amount)), `${profile.id}: dépense ${row.label} ${row.amount}`)
  }
  for (const amount of [totals.available, ...(profile.savings.length ? [totals.savings, totals.balance] : [])]) {
    assert(drawn.some(line => line.y > 986 && line.text === number(amount)), `${profile.id}: solde ${amount}`)
  }
  for (const [index, a] of drawn.entries()) {
    assert(a.left >= 30 && a.right <= 1050 && a.y + a.size <= 1350 && a.size >= 32, `${profile.id}: ${JSON.stringify(a)}`)
    for (const b of drawn.slice(index + 1)) {
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left)
      const overlapY = Math.min(a.y + a.size, b.y + b.size) - Math.max(a.y, b.y)
      assert(!(overlapX > 1 && overlapY > 1), `${profile.id}: ${JSON.stringify([a, b])}`)
    }
  }
}

export async function verifyBudgetPng(page, profile) {
  const region = page.getByRole('region', { name: 'Image du budget', exact: true })
  const image = region.locator('img')
  await expect(region).toHaveAttribute('aria-busy', 'false', { timeout: 30_000 })
  await expect(image).toHaveCount(1)
  await expect(region).toContainText('1 image · 1 080 × 1 350 px')
  await image.evaluate(img => img.decode())
  await expect(region.getByRole('link', { name: 'Ouvrir l’image' })).toHaveAttribute('href', await image.getAttribute('src'))
  const preview = await image.evaluate(async img => {
    const blob = await (await fetch(img.src)).blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  })
  const [download] = await Promise.all([page.waitForEvent('download'), region.getByRole('button', { name: 'Télécharger le PNG', exact: true }).click()])
  const bytes = readFileSync(await download.path())
  assert.deepEqual(bytes, Buffer.from(preview, 'base64'), 'Le téléchargement reprend les octets de l’aperçu')
  assert.equal(bytes.toString('ascii', 1, 4), 'PNG')
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [1080, 1350])
  const drawn = await page.evaluate(() => window.budgetCanvasText)
  assertBudgetCanvas(drawn, profile)
  return bytes
}
