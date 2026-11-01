import assert from 'node:assert/strict'
import parseTweet from 'twitter-text/dist/parseTweet.js'
import { chromium } from 'playwright'
import { staticBrowser, staticBase } from './static-browser.mjs'
import { SUNDAY_QUESTIONS, SUNDAY_THEMES } from '../src/pages/tweet-bank/sunday-questions.js'
import { LAST_PUBLICATION_KEY } from '../src/pages/tweet-bank/storage.js'
const publicBase=process.env.SUNDAY_PUBLIC_URL
for (const width of [1440,390]) {
  let browser,context,page
  if (publicBase) {
    browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']})
    context=await browser.newContext({viewport:{width,height:950}}); page=await context.newPage()
  } else ({browser,context,page}=await staticBrowser(width))
  const base=publicBase || staticBase, errors=[]
  page.on('pageerror',error=>errors.push(error.message))
  await context.addInitScript(()=>{
    window.copiedTexts=[]
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedTexts.push(text)}}})
  })
  try {
    await page.goto(base+'banque-tweets')
    await page.getByRole('button',{name:'☀️ Question dimanche',exact:true}).click()
    assert.equal(await page.locator('[data-tweet-id]').count(),36)
    for (const theme of SUNDAY_THEMES) {
      await page.getByRole('button',{name:theme,exact:true}).click()
      assert.equal(await page.locator('[data-tweet-id]').count(),SUNDAY_QUESTIONS.filter(t=>t.theme===theme).length)
    }
    await page.getByRole('button',{name:'Tous les thèmes',exact:true}).click()
    const id=SUNDAY_QUESTIONS[0].id, card=page.locator(`[data-tweet-id="${id}"]`)
    assert.equal(await card.getByLabel('Texte de la publication').inputValue(),SUNDAY_QUESTIONS[0].text)
    await card.getByRole('button',{name:'📋 Copier',exact:true}).click()
    assert.equal(await page.evaluate(()=>window.copiedTexts.at(-1)),SUNDAY_QUESTIONS[0].text)
    assert(!await card.getByLabel('Publié',{exact:true}).isChecked())
    const edited=SUNDAY_QUESTIONS[0].text+'\n\nMon ajout.'
    await card.getByLabel('Texte de la publication').fill(edited)
    await card.getByRole('button',{name:'📋 Copier',exact:true}).waitFor()
    await card.getByRole('button',{name:'📋 Copier',exact:true}).click()
    assert.equal(await page.evaluate(()=>window.copiedTexts.at(-1)),edited)
    assert((await card.locator('.tb-character-count').textContent()).startsWith(String(parseTweet(edited).weightedLength)))
    await card.getByLabel('Publié',{exact:true}).check()
    assert(await card.getByLabel('Date de dernière publication').inputValue())
    await page.reload()
    await page.getByRole('button',{name:'☀️ Question dimanche',exact:true}).click()
    assert.equal(await card.getByLabel('Texte de la publication').inputValue(),edited)
    assert(await card.getByLabel('Publié',{exact:true}).isChecked())
    await page.getByLabel('Non publiées',{exact:true}).check()
    assert.equal(await page.locator('[data-tweet-id]').count(),35)
    await page.getByLabel('Non publiées',{exact:true}).uncheck()
    await card.getByLabel('Publié',{exact:true}).uncheck()
    assert.equal(await card.getByLabel('Date de dernière publication').inputValue(),'')
    await page.getByText('＋ Ajouter une question personnelle',{exact:true}).click()
    const own='Mon choix personnel :\n\nVous feriez quoi avec 123 € ?'
    await page.getByLabel('Ma question',{exact:true}).fill(own)
    await page.getByRole('button',{name:'Ajouter à la banque',exact:true}).click()
    assert.equal(await page.locator('[data-tweet-id]').count(),37)
    await page.getByLabel('Ma question',{exact:true}).fill(own)
    await page.getByRole('button',{name:'Ajouter à la banque',exact:true}).click()
    await page.getByRole('alert').filter({hasText:'existe déjà'}).waitFor()
    const personal=page.locator('[data-tweet-id^="sunday:personal:"]')
    const personalId=await personal.getAttribute('data-tweet-id')
    await personal.getByLabel('Texte de la publication').fill(own+'\nÉdition conservée.')
    await personal.getByLabel('Publié',{exact:true}).check()
    await page.reload()
    await page.getByRole('button',{name:'☀️ Question dimanche',exact:true}).click()
    assert.equal(await personal.getByLabel('Texte de la publication').inputValue(),own+'\nÉdition conservée.')
    assert(await personal.getByLabel('Publié',{exact:true}).isChecked())
    // Only one never-published question remains, even though all others have old dates.
    await page.evaluate(({key,ids,personalId,except})=>localStorage.setItem(key,JSON.stringify(Object.fromEntries([...ids,personalId].filter(id=>id!==except).map(id=>[id,'2020-01-01'])))),{key:LAST_PUBLICATION_KEY,ids:SUNDAY_QUESTIONS.map(t=>t.id),personalId,except:id})
    await page.reload(); await page.getByRole('button',{name:'☀️ Question dimanche',exact:true}).click()
    await page.getByRole('button',{name:'Tirer une question non publiée',exact:true}).click()
    assert.equal(await page.locator('[data-tweet-id]').count(),1)
    assert.equal(await page.locator('[data-tweet-id]').getAttribute('data-tweet-id'),id)
    await page.getByRole('button',{name:'Revoir toutes les questions',exact:true}).click()
    await page.getByRole('searchbox',{name:'Rechercher dans les archives'}).fill('123')
    assert.equal(await page.locator('[data-tweet-id]').count(),1)
    assert.equal(await page.locator('[data-tweet-id]').getAttribute('data-tweet-id'),personalId)
    await page.getByRole('searchbox').fill('')
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow')
    assert(await page.locator('.tb-tweet-text').evaluateAll(elements=>elements.every(el=>el.scrollHeight<=el.clientHeight+2)),'Full question text visible')
    await page.screenshot({path:`/workspace/sunday-${publicBase?'public':'local'}-${width}.png`,fullPage:false})
    await card.getByLabel('Publié',{exact:true}).check()
    await page.getByRole('button',{name:'Tirer une question non publiée',exact:true}).isDisabled().then(value=>assert(value))
    await page.getByLabel('Non publiées',{exact:true}).check()
    assert.equal(await page.locator('[data-tweet-id]').count(),0)
    assert.deepEqual(errors,[])
    console.log(`${publicBase?'Public':'Build'} ${width}px: 36 full questions, six themes, exact multiline copy, edit/add/dedup, manual publication/date, reload, never-published random, search, no overflow OK.`)
  } finally { await browser.close() }
}
