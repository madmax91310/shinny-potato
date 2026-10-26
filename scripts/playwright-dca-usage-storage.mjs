import assert from 'node:assert/strict'
import { staticBrowser, staticBase as base } from './static-browser.mjs'

const key = 'el-dca-used-v1'
for (const width of [1440, 390]) {
  const { browser, context, page } = await staticBrowser(width), errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await context.addInitScript(key => {
      const get = Storage.prototype.getItem, set = Storage.prototype.setItem
      window.usageWrites = []
      window.rawUsage = () => get.call(localStorage, key)
      Storage.prototype.getItem = function(name) {
        if (name === key && window.usageFault === 'read') throw Error('Read denied')
        return get.call(this, name)
      }
      Storage.prototype.setItem = function(name, value) {
        if (name === key) {
          if (window.usageFault === 'write') throw Error('Quota exceeded')
          window.usageWrites.push(value)
        }
        return set.call(this, name, value)
      }
    }, key)
    async function open() {
      await page.locator('.dca-prepared > summary').click()
    }
    async function seed(raw, fault = '') {
      await page.goto(base)
      await page.evaluate(({ key, raw, fault }) => {
        window.usageFault = ''
        if (raw === null) localStorage.removeItem(key)
        else localStorage.setItem(key, raw)
        localStorage.removeItem('el-dca-draft-v1')
        sessionStorage.setItem('usage-test-fault', fault)
      }, { key, raw, fault })
      await page.goto(base + 'le-dca-de?mode=dca')
      await open()
      assert.deepEqual(await page.evaluate(() => window.usageWrites), [], 'no mount writes')
    }
    // Inject faults before React reads storage, on every navigation/reload.
    await context.addInitScript(() => { window.usageFault = sessionStorage.getItem('usage-test-fault') })
    const mark = () => page.getByRole('button', { name: 'Marquer utilisé', exact: true })
    const unmark = () => page.getByRole('button', { name: 'Marquer non utilisé', exact: true })
    const raw = () => page.evaluate(() => window.rawUsage())
    const picker = page.getByRole('group', { name: 'Choisir un profil DCA', exact: true })

    // Regression: an ordinary click must never replace unreadable historical bytes.
    for (const initial of ['{broken', '["older-profile",42]', 'null', '{}', '']) {
      await seed(initial)
      await mark().click()
      assert.equal(await raw(), initial, 'unreadable history survives the ordinary mark-used click')
      assert(await mark().isVisible(), 'a rejected write is not presented as saved')
      await page.getByRole('alert').filter({ hasText: 'historique' }).waitFor()
      await page.reload(); await open()
      assert.equal(await raw(), initial)
    }
    await seed(null)
    const id = await picker.getAttribute('data-value')
    await mark().click()
    // No wait for localStorage before reload: the event must commit synchronously.
    await page.reload(); await open()
    assert.deepEqual(JSON.parse(await raw()), [id])
    assert(await unmark().isVisible())
    await unmark().click(); await page.reload(); await open()
    assert.deepEqual(JSON.parse(await raw()), [])
    assert(await mark().isVisible())

    const valid = '[ "older-profile", "older-profile" ]'
    await seed(valid)
    assert.equal(await raw(), valid, 'valid legacy bytes unchanged on mount')
    await mark().click(); await page.reload(); await open()
    assert.deepEqual(JSON.parse(await raw()), ['older-profile', 'older-profile', id])
    assert(await unmark().isVisible())
    await page.locator('.dca-filters > summary').click()
    await page.getByRole('checkbox', { name: 'Masquer les profils déjà utilisés', exact: true }).check()
    assert.equal(await picker.locator(`[data-option][data-value="${id}"]`).count(), 0)

    const partial = JSON.stringify([id, 42])
    await seed(partial)
    assert(await unmark().isVisible(), 'recognized entries remain usable for display')
    await unmark().click()
    assert.equal(await raw(), partial, 'displaying recognized entries never authorizes dropping invalid entries')
    // A transient read failure stays locked for this mount, even if the API recovers.
    await seed(valid, 'read')
    await page.evaluate(() => { window.usageFault = '' })
    await mark().click()
    assert.equal(await raw(), valid)
    await page.getByRole('alert').filter({ hasText: 'historique' }).waitFor()

    await seed(valid, 'write')
    await mark().click()
    assert.equal(await raw(), valid)
    assert(await mark().isVisible())
    await page.getByRole('alert').filter({ hasText: 'historique' }).waitFor()
    await page.evaluate(() => { window.usageFault = '' })
    await mark().click()
    assert.deepEqual(JSON.parse(await raw()), ['older-profile', 'older-profile', id])

    await seed(valid)
    const other = await context.newPage(); await other.goto(base)
    const newer = JSON.stringify(['another-tab', id])
    await other.evaluate(({ key, newer }) => localStorage.setItem(key, newer), { key, newer })
    await mark().click()
    assert.equal(await raw(), newer, 'observed cross-tab change is never overwritten')
    await page.getByRole('alert').filter({ hasText: 'onglet' }).waitFor()
    await page.reload(); await open()
    assert(await unmark().isVisible())
    await unmark().click()
    assert.deepEqual(JSON.parse(await raw()), ['another-tab'])
    await other.close()

    await seed(valid)
    await page.evaluate(key => localStorage.setItem(key, '{late corruption'), key)
    await mark().click()
    assert.equal(await raw(), '{late corruption', 'record is revalidated at the write boundary')
    assert.deepEqual(errors, [])
    console.log(`DCA usage ${width}px: legacy/absent/invalid/corrupt, denied read, quota/retry, immediate reload, filters and cross-tab conflict OK.`)
  } finally { await browser.close() }
}
