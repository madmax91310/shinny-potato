import assert from 'node:assert/strict'
import { HOME_TOOLS, TOOL_GROUPS } from '../src/tools.js'
import { EDITORIAL_WEEK } from '../src/data/editorial-calendar.js'

// Shared by the home, weekly-publication and full tool suites.
export async function checkCobaltHome(page) {
  await page.getByRole('button', { name: 'Vue d’ensemble', exact: true }).click()
  const paths = await page.locator('.workspace-tool-card').evaluateAll(cards => cards.map(card => new URL(card.href).pathname.split('/').at(-1)))
  assert.deepEqual(paths.slice().sort(), HOME_TOOLS.map(tool => tool.to.slice(1)).sort(), 'Each visible registry tool appears exactly once')
  assert.equal(new Set(paths).size, paths.length, 'No duplicate tools')
  assert.equal(await page.locator('.home-favorite').count(), HOME_TOOLS.length)
  for (const group of TOOL_GROUPS) {
    const cards = await page.locator(`[data-group="${group.id}"] .workspace-tool-card`).evaluateAll(cards => cards.map(card => '/' + new URL(card.href).pathname.split('/').at(-1)))
    assert(cards.every(path => group.tools.some(tool => tool.to === path)), `Wrong category: ${group.id}`)
  }
  assert.equal(await page.locator('.workspace-brand').count(), 0, 'No decorative hero')
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 844 })
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: horizontal overflow`)
    const problems = await page.locator('.workspace-tool-card').evaluateAll(cards => cards.flatMap(card => {
      const title = card.querySelector('h2').getBoundingClientRect()
      const day = card.querySelector('.workspace-publication-day')?.getBoundingClientRect()
      const box = card.getBoundingClientRect()
      return box.width <= 0 || box.height < 44 || title.bottom > box.bottom || title.right > box.right || (day && (title.bottom > day.top || day.bottom > box.bottom || day.right > box.right)) ? [card.textContent] : []
    }))
    assert.deepEqual(problems, [], `${width}: inaccessible or overlapping labels`)
  }
  await page.getByRole('button', {name:'Calendrier',exact:true}).click()
  assert.equal(await page.getByRole('tab').count(), 7)
  const snapshot = []
  for (const [index, day] of EDITORIAL_WEEK.entries()) {
    await page.getByRole('tab', {name:new RegExp(`^${day.day}`)}).click()
    const panel = page.getByRole('tabpanel')
    assert.equal(await panel.getAttribute('data-day'), String(index))
    assert.equal(await panel.locator('.home-day-band h2').innerText(), day.day)
    for (const period of ['midday','evening']) {
      const slot = panel.locator(`[data-period="${period}"]`)
      assert.deepEqual(await slot.locator('.workspace-tool-card').evaluateAll(cards => cards.map(card => new URL(card.href).pathname.split('/').at(-1) + new URL(card.href).search)), day[period].map(entry => (entry.href ?? entry.path).slice(1)), `${day.day}: exact ${period} destinations`)
      assert.deepEqual(await slot.locator('.workspace-tool-card h2').allTextContents(), day[period].map(entry => entry.title ?? HOME_TOOLS.find(tool => tool.to === entry.path).title))
      assert.deepEqual(await slot.locator('.workspace-publication-day').allTextContents(), day[period].map(entry => entry.note || `${day.day} ${period === 'midday' ? 'midi' : 'soir'}`))
      assert.deepEqual(await slot.locator('.home-day-note').allTextContents(), day[`${period}Note`] ? [day[`${period}Note`]] : [])
      snapshot.push([index, period, day[period].map(entry => entry.path)])
    }
  }
  const today = new Intl.DateTimeFormat('fr-FR', {weekday:'long',timeZone:'Europe/Paris'}).format(new Date())
  assert.equal((await page.getByRole('tab').filter({has:page.locator('.home-today')}).innerText()).replace('•','').trim().toLowerCase(), page.viewportSize().width < 700 ? `${today.slice(0,3)}.` : today)
  assert.equal(await page.locator('.home-calendar-intro').innerText(), 'Un format par créneau, le midi et le soir.')
  assert.equal(await page.locator('.home-calendar').getByText(/alternance|alternative|facultatif|matin|récap/i).count(), 0)
  await page.getByRole('button', {name:'Vue d’ensemble',exact:true}).click()
  return snapshot
}
