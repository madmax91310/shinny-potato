import assert from 'node:assert/strict'
import {staticBrowser,staticBase as base} from './static-browser.mjs'
const now=new Date().toISOString()
for(const width of [390,1440]){
 const {browser,page,context}=await staticBrowser(width),errors=[]
 page.on('pageerror',e=>errors.push(e.message))
 const incident=(id,name)=>({id,name,kind:'collection',workflow:'update-market-monthly.yml',field:'Change',cause:'HTTP 503: test source',tools:['Performances'],firstSeenAt:now})
 const monitoring={schemaVersion:1,checkedAt:now,active:{a:incident('a','Fixture A'),b:incident('b','Fixture B'),retired:{...incident('retired','Comptes retirés'),workflow:'update-company-analysis.yml',tools:['Analyse d’entreprise']}},resolved:[]}
 await context.route('**/automation-status/automation-status.json',route=>route.fulfill({json:{schemaVersion:1,workflows:{},monitoring}}))
 try{
  await page.goto(base+'donnees-a-revoir',{waitUntil:'networkidle'})
  const monitor=page.getByRole('region',{name:'Surveillance des données',exact:true})
  await monitor.getByText('2 point(s) à examiner',{exact:false}).waitFor()
  await monitor.getByText('1 cause(s) pour 2 incident(s)',{exact:false}).waitFor()
  await monitor.getByRole('heading',{name:'Fixture A',exact:true}).waitFor()
  assert.equal(await monitor.getByRole('heading',{name:'Comptes retirés',exact:true}).count(),0)
  await monitor.locator('summary').filter({hasText:'Retirés du périmètre'}).click()
  await monitor.getByText('Ces incidents ne sont pas comptés comme des données réparées.',{exact:true}).waitFor()
  const section=page.locator('section').filter({has:page.getByRole('heading',{name:'Inventaire de toutes les données',exact:true})})
  await section.locator('summary').click()
  await section.getByRole('combobox',{name:'Afficher',exact:true}).selectOption('usages')
  // A successful collection can remove this asset from the pending-only filter.
  // Verify its required usages without freezing a historical source incident.
  await section.getByRole('checkbox',{name:'Afficher seulement les champs à compléter ou à confirmer'}).uncheck()
  const tool=section.getByRole('combobox',{name:'Outil consommateur',exact:true})
  await tool.selectOption('/le-dca-de')
  await section.getByRole('textbox',{name:'Rechercher dans l’inventaire'}).fill('IE00BJGWQN72')
  await section.getByRole('heading',{name:/WisdomTree Cloud Computing/}).first().waitFor()
  await tool.selectOption('/france-100-menages')
  await section.getByRole('textbox',{name:'Rechercher dans l’inventaire'}).fill('')
  await section.getByRole('checkbox',{name:'Afficher seulement les champs à compléter ou à confirmer'}).uncheck()
  assert(await section.locator('article').count()>0,'Household observations remain obligations after company retirement')
  await tool.selectOption('/portefeuilles-investisseurs')
  await section.getByRole('heading',{name:/Positions et poids déclarés/}).first().waitFor()
  assert.equal(await page.locator('a[href$="/analyse-entreprise"]').count(),0)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false)
  assert.deepEqual(errors,[])
 }finally{await browser.close()}
}
console.log('Consumed-data UI: real obligations per tool, retained source failures, households, 13F, incident grouping and explicit retirement passed at 390/1440 px.')
