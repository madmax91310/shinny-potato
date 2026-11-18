import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { expect } from 'playwright/test'
import { euro } from '../src/pages/budget-profiles/lib.js'
import { planSocialBudget } from '../src/pages/budget-profiles/socialImage.js'

export function captureBudgetCanvas() {
  const rectangle = CanvasRenderingContext2D.prototype.fillRect
  CanvasRenderingContext2D.prototype.fillRect = function (x, y, width, height) {
    if (x === 0 && y === 0 && width === 1080 && height === 1350 && this.canvas.width === 1080) {
      window.budgetCanvasText = []
      window.budgetBarDrawn = false
    }
    if (this.canvas.width === 1080 && y === 413 && height === 20 && width > 0) window.budgetBarDrawn = true
    return rectangle.call(this, x, y, width, height)
  }
  const fill = CanvasRenderingContext2D.prototype.fillText
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y, ...args) {
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
  assert(!drawn.some(line => /le budget de|budget (?:fictif|reconstitué)|exemple de budget|profil adapté|(?:sa|leur) part du budget/i.test(line.text)), profile.id)
  assert(drawn.some(line => line.text.startsWith(presentation.name.slice(0, 12))), profile.id)
  assert(drawn.some(line => line.text === 'ÉPARGNANT LIBRE'), profile.id)
  const money = amount => euro(amount, profile.currency)
  for (const amount of [totals.income, totals.expenses, totals.savings, totals.available, totals.balance]) {
    assert(drawn.some(line => line.text === money(amount) || line.text === `≈ ${money(amount)}`), `${profile.id}: total ${amount}`)
  }
  const ledger = drawn.filter(line => line.y > 712 && line.y < 1155)
  for (const row of [...expenses.flatMap(column => column.flatMap(group => group.rows)), ...planSocialBudget(profile).transferRows]) {
    assert(ledger.some(line => line.text === money(row.amount)), `${profile.id}: poste ${row.label} ${row.amount}`)
  }
  if (totals.balance < 0) assert(drawn.some(line => line.text === 'Reste négatif'), profile.id)
  for (const [index, a] of drawn.entries()) {
    assert(a.left >= 30 && a.right <= 1050 && a.y + a.size <= 1350 && a.size >= 23, `${profile.id}: ${JSON.stringify(a)}`)
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
  const { drawn, bar } = await page.evaluate(() => ({ drawn: window.budgetCanvasText, bar: window.budgetBarDrawn }))
  assert.equal(bar, planSocialBudget(profile).showAllocation, `${profile.id}: barre de répartition`)
  assert(!drawn.some(line => line.y >= 742 && line.y < 1155 && line.text.includes('…')), `${profile.id}: poste tronqué`)
  assertBudgetCanvas(drawn, profile)
  return bytes
}
