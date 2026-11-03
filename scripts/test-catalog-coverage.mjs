import assert from 'node:assert/strict'
import {catalogCoverage} from './lib/catalog-coverage.mjs'
import {assetAutomation} from './lib/asset-automation.mjs'
import {consumerUsage} from './lib/consumer-usage.mjs'
import {monthlyFingerprint} from './lib/monthly-certificate.mjs'
const id='IE00BM67HV82',record={id,type:'instrument'}
const monthly={id,field:'monthly',currency:'EUR',method:'Adjusted exact-share monthly closes',periodStart:'2016-04',periodEnd:'2026-09',sourceUrl:'https://source.example/exact-EUR-listing'}
const annual={id,field:'performance'}
const coverage=new Map([[`${id}:monthly`,monthly],[`${id}:performance`,annual]])
const history={label:'Série historique',registry:'src/data/market-history.js',metadata:{sourceUrls:[monthly.sourceUrl]},value:{isin:id,currency:'EUR',method:monthly.method,periodStart:monthly.periodStart,periodEnd:monthly.periodEnd,points:[{date:'2016-04',price:100},{date:'2026-09',price:123}]}}
assert.equal(catalogCoverage(history,{id:'history:alias',type:'series'},coverage,{}),monthly)
for(const changes of [{currency:'USD'},{periodEnd:'2026-08'},{method:'Unadjusted share prices'},{isin:'OTHER'}])assert.equal(catalogCoverage({...history,value:{...history.value,...changes}},{id:'history:alias',type:'series'},coverage,{}),null)
assert.equal(catalogCoverage({...history,metadata:{sourceUrls:['https://source.example/other-listing']}},{id:'history:alias',type:'series'},coverage,{}),null)
const exact={...monthly,seriesFingerprint:monthlyFingerprint(history.value),sourceUrl:'https://issuer.example/fund-profile',sourceUrls:[monthly.sourceUrl]}
const boundMap=new Map([[`${id}:monthly`,exact]])
assert.equal(catalogCoverage(history,{id:'history:alias',type:'series'},boundMap,{}),exact,'Registered query URLs bind the actual series, independently of the product homepage')
assert.equal(catalogCoverage({...history,value:{...history.value,points:[{date:'2026-09',price:999},{date:'2026-10',price:1000}]}},{id:'history:alias',type:'series'},boundMap,{}),null,'Same identity/source/calendar never substitutes different observations')
const facade={...history,value:{...history.value,method:undefined,periodStart:undefined,periodEnd:undefined},metadata:{...history.metadata,method:monthly.method,periodStart:monthly.periodStart,periodEnd:monthly.periodEnd}}
assert.equal(catalogCoverage(facade,{id:'history:alias',type:'series'},boundMap,{}),exact,'A presentation facade retains the registered evidence conventions independently of its point objects')
assert.equal(catalogCoverage({...facade,metadata:{...facade.metadata,method:'Different financial convention'}},{id:'history:alias',type:'series'},boundMap,{}),null)
const field={label:'Rendements 2023–2025',registry:'src/data/instrument-returns.js',metadata:{currency:'EUR'},value:[1,2.34,3]}
const etfs={[id]:{performance:{currency:'EUR',years:{2023:1,2024:2.342,2025:3}}}}
assert.equal(catalogCoverage(field,record,coverage,etfs),annual)
for(const change of [{value:[1,99,3]},{value:[1,2.34]},{metadata:{currency:'USD'}},{registry:'src/data/manual-review.js'},{label:'Historique de simulation 2023–2025'}])assert.equal(catalogCoverage({...field,...change},record,coverage,etfs),null)
assert.equal(catalogCoverage(field,record,coverage,{[id]:{performance:{currency:'EUR',years:{2024:2.342,2025:3}}}}),null)
const workflow={path:'.github/workflows/source.yml',name:'Collector',crons:['0 8 * * *']}
const certificate={id,type:'instrument',name:'Exact fund',field:'Historique',fieldIndex:0,nature:{kind:'history'},sourceUrls:[monthly.sourceUrl],checkedAt:'2026-10-12',asOf:'2026-09-30',upstreamWorkflows:[workflow.path],coverageReference:{id,field:'monthly'}}
const connection={id,field:'monthly',actionState:'current',requiresAction:false}
const inventory={generatedAt:'2026-10-21T12:00:00Z',fields:[certificate],connections:[connection],workflows:[workflow]}
assert.equal(assetAutomation(inventory).assets[0].fields[0].state,'connected','Monthly proof uses the shared monthly policy, not the seven-day allocation policy')
assert.equal(assetAutomation({...inventory,connections:[{...connection,requiresAction:true,actionState:'collection-error'}]}).assets[0].fields[0].state,'blocked','A matched source failure remains blocked')
assert.equal(assetAutomation({...inventory,fields:[{...certificate,checkedAt:'2026-08-01'}]}).assets[0].fields[0].state,'blocked')
console.log('Catalogue certificates: exact NAV years, share/currency/listing/method/window identity, source failures and field-specific freshness passed.')

const combined=assetAutomation({...inventory,fields:[{...certificate,consumers:[{path:'/performance-depuis'}]}],connections:[{...connection,tools:['performance-rankings','investment-calculator']}]})
assert.deepEqual(new Set(consumerUsage(combined.assets).tools.map(t=>t.path)),new Set(['/performance-depuis','/classements-performances','/calculateur-investissement']),'Matching a catalogue field must preserve every coverage consumer, including tools absent from its facade')
assert.equal(combined.assets[0].fields.length,1,'A verified shared field removes the duplicate coverage certificate, not its consumers')

// The twelve new native NAV histories already work in both ranking formats.
// Their facade must declare that consumer even without a coverage-table row.
// This is a usage declaration, never a source/freshness certificate.
const { DATA_CATALOG } = await import('../src/data/catalog.js')
const { RANKING_ASSETS } = await import('../src/pages/performance-rankings/data.js')
const navHistories = DATA_CATALOG.filter(record => record.id.startsWith('history:') && record.fields.some(field => field.value?.valuationBasis === 'fund-nav-total-return' && field.value.points?.length))
assert(navHistories.length > 0, 'Real NAV catalogue is required for this integration regression')
const { default: navInputPlan } = await import('./new-distributing-nav-sources.json', { with: { type: 'json' } })
for (const expected of navInputPlan.filter(source => source.consumerScope === 'catalog')) {
  const record = navHistories.find(candidate => candidate.id === `history:${expected.id}`)
  assert(record, `Configured native NAV consumer omitted: ${expected.id}`)
  const series = record.fields.find(field => field.value?.valuationBasis === 'fund-nav-total-return').value
  assert.equal(series.isin, expected.isin, 'Exact planned share must be preserved')
  assert.equal(series.currency, expected.currency, 'Native NAV currency must be preserved')
}
for (const record of navHistories) {
  const id = record.id.slice('history:'.length)
  assert.equal(RANKING_ASSETS[id]?.basis, 'fund-nav-total-return', `Declared ranking consumer must really admit ${id} with its exact convention`)
  assert.equal(record.consumers.filter(consumer => consumer.path === '/classements-performances').length, 1, `Exactly one ranking facade consumer required for ${id}`)
  const row = { id: record.id, fields: record.fields.map((field, index) => ({key: `catalog:${index}`, label:field.label, state:'qualification-needed',consumers:record.consumers})) }
  const usage = consumerUsage([row]).tools.find(tool => tool.path === '/classements-performances')
  assert.equal(usage?.rows.length, record.fields.length, `Ranking field contract missing for ${id}`)
  assert(usage.rows.every(field => field.state === 'qualification-needed'), 'Declaring a real consumer must not qualify its data')
}
console.log(`NAV ranking consumers: ${navHistories.length} existing histories match the actual engine; no new admission or source certificate.`)
