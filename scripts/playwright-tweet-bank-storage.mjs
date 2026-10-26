import assert from 'node:assert/strict'
import { staticBrowser, staticBase as base } from './static-browser.mjs'
import { DRAFTS_KEY, LAST_PUBLICATION_KEY } from '../src/pages/tweet-bank/storage.js'
import { bankToday } from '../src/pages/tweet-bank/validity.js'

const id = 'story:parler-investissement-proches'
const keys = [DRAFTS_KEY, LAST_PUBLICATION_KEY]
const text = 'Mon brouillon conservé'
const legacy = { [id]: { text, asOf:'2026-09-01', checkedAt:bankToday(), verifiedText:text, verifiedAsOf:'2026-09-01' },
  unknown: { text:'Une autre sauvegarde', futureField:'Conservé' } }
for (const width of [1440, 390]) {
  const { browser, context, page } = await staticBrowser(width), errors = []
  page.on('pageerror', error => errors.push(error.message))
  try {
    await context.addInitScript(keys => {
      window.bankWrites = []
      const set = Storage.prototype.setItem
      Storage.prototype.setItem = function(key, value) {
        if (keys.includes(key)) window.bankWrites.push(key)
        return set.call(this, key, value)
      }
    }, keys)
    await page.goto(base)
    async function seed(drafts, dates) {
      await page.evaluate(({keys,drafts,dates}) => {
        localStorage.setItem(keys[0], drafts); localStorage.setItem(keys[1], dates)
      }, {keys,drafts,dates})
      await page.goto(base+'banque-tweets')
      await page.locator('.tb-tweet-text').first().waitFor()
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      assert.deepEqual(await page.evaluate(() => window.bankWrites), [], 'mount does not save')
    }
    const card = page.locator(`[data-tweet-id="${id}"]`)
    const rawDrafts = JSON.stringify(legacy), rawDates = JSON.stringify({[id]:'2026-09-01',unknown:'2026-08-01'})
    await seed(rawDrafts, rawDates)
    assert.equal(await card.getByLabel('Texte de la publication').inputValue(), text)
    assert.deepEqual(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), keys), [rawDrafts,rawDates])
    await card.getByLabel('Texte de la publication').fill('Texte modifié')
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.['story:parler-investissement-proches']?.text === 'Texte modifié', DRAFTS_KEY)
    const updated = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), DRAFTS_KEY)
    assert.equal(updated[id].checkedAt, null, 'editing still revokes editorial verification')
    assert.deepEqual(updated.unknown, legacy.unknown)
    await card.getByLabel('Date de référence', {exact:true}).fill(bankToday())
    await card.getByLabel('J’ai vérifié ce texte et sa date de référence.').check()
    await card.getByLabel('Date de dernière publication', {exact:true}).fill(bankToday())
    await page.waitForFunction(({key,id}) => JSON.parse(localStorage.getItem(key))?.[id] !== '2026-09-01', {key:LAST_PUBLICATION_KEY,id})
    await page.reload(); await card.waitFor()
    assert.equal(await card.getByLabel('Texte de la publication').inputValue(), 'Texte modifié')
    assert(await card.getByLabel('J’ai vérifié ce texte et sa date de référence.').isChecked())
    assert.equal(await card.getByLabel('Date de dernière publication', {exact:true}).inputValue(), bankToday())
    // A second tab's observed write must not be silently replaced by this editor.
    const other = await context.newPage(); await other.goto(base)
    const otherRaw = JSON.stringify({...legacy,[id]:{text:'Autre onglet'}})
    await other.evaluate(({key,raw}) => localStorage.setItem(key,raw), {key:DRAFTS_KEY,raw:otherRaw})
    await card.getByLabel('Texte de la publication').fill('Édition locale en conflit')
    await page.getByRole('alert').filter({hasText:'autre onglet'}).waitFor()
    assert.equal(await page.evaluate(key => localStorage.getItem(key),DRAFTS_KEY),otherRaw)
    await other.close()
    await seed('{broken','{broken')
    assert.equal(await page.getByRole('alert').count(),2)
    await card.getByLabel('Texte de la publication').fill('Édition en mémoire')
    await card.getByLabel('Date de dernière publication', {exact:true}).fill(bankToday())
    assert.equal(await card.getByLabel('Texte de la publication').inputValue(),'Édition en mémoire')
    assert.deepEqual(await page.evaluate(keys => keys.map(key => localStorage.getItem(key)), keys), ['{broken','{broken'])
    // A corrupt date map must not prevent saving the independent draft map.
    await seed('{}','{broken')
    await card.getByLabel('Texte de la publication').fill('Brouillon indépendant')
    await page.waitForFunction(key => JSON.parse(localStorage.getItem(key))?.['story:parler-investissement-proches']?.text === 'Brouillon indépendant', DRAFTS_KEY)
    assert.equal(await page.evaluate(key => localStorage.getItem(key),LAST_PUBLICATION_KEY),'{broken')
    await context.addInitScript(() => {
      Object.defineProperty(window,'localStorage',{configurable:true,get(){throw new Error('Storage denied')}})
    })
    await page.reload(); await card.waitFor()
    await page.getByRole('alert').filter({hasText:'sauvegarde des brouillons'}).waitFor()
    await card.getByLabel('Texte de la publication').fill('Sans stockage')
    assert.equal(await card.getByLabel('Texte de la publication').inputValue(),'Sans stockage')
    assert.deepEqual(errors,[])
    console.log(`Tweet bank ${width}px: existing maps/reviews, no mount writes, edit/reload, cross-tab conflict, corrupt/blocked storage and independent maps OK.`)
  } finally { await browser.close() }
}
