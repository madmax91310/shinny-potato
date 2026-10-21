import assert from 'node:assert/strict'
import {assetAutomation,assetAutomationCsv}from './lib/asset-automation.mjs'
const workflow={path:'.github/workflows/collect.yml',name:'Collecte',crons:['0 8 * * *'],outputs:['src/data/source.json']}
const field={id:'IE000TEST0001',type:'instrument',name:'Test, "part"',field:'Encours',fieldIndex:0,nature:{kind:'live'},sourceUrls:['https://issuer.example/fund'],checkedAt:'2026-10-20',asOf:'2026-09-30',consumers:[{path:'/fiches'}],upstreamWorkflows:[workflow.path],coverageReference:{id:'IE000TEST0001',field:'aum'}}
const connection={id:field.id,type:'instrument',name:field.name,field:'aum',actionState:'current',requiresAction:false}
const base={generatedAt:'2026-10-20T12:00:00Z',workflows:[workflow],fields:[field],connections:[connection]}
assert.equal(assetAutomation(base).assets[0].state,'connected')
assert.equal(assetAutomation({...base,connections:[{...connection,requiresAction:true,actionState:'collection-error'}]}).assets[0].state,'blocked','retained observations cannot certify recovery')
assert.equal(assetAutomation({...base,fields:[{...field,coverageReference:null}]}).assets[0].state,'qualification-needed','scheduled file is not individual field proof')
assert.equal(assetAutomation({...base,fields:[{...field,sourceUrls:[]}]}).assets[0].state,'blocked')
assert.equal(assetAutomation({...base,fields:[{...field,checkedAt:'2026-10-21'}]}).assets[0].state,'blocked')
assert.equal(assetAutomation({...base,fields:[{...field,nature:{kind:'reference'}}],connections:[]}).assets[0].state,'reference-only','identity alone never certifies a price or history')
const wait={...connection,requiresAction:false,actionState:'waiting-first-year'}
assert.equal(assetAutomation({...base,connections:[wait]}).assets[0].state,'reference-only')
assert.match(assetAutomationCsv(assetAutomation(base).assets),/"Test, ""part"""/)
console.log('Asset certificates: field proof, failed source retention, dates, identity-only, first-year wait and CSV passed.')

const boundWorkflow={...workflow,path:'.github/workflows/update-regulatory-data.yml'}
const bound={...field,id:'broker:test',type:'broker',registry:'src/data/broker-tariffs.js',field:'Tarif courtage automatisé',coverageReference:null,sourceStatus:'documented',upstreamWorkflows:[boundWorkflow.path]}
assert.equal(assetAutomation({...base,fields:[bound],connections:[],workflows:[boundWorkflow]}).assets[0].state,'scheduled-evidence')
assert.equal(assetAutomation({...base,fields:[{...bound,checkedAt:'2025-10-01'}],connections:[],workflows:[boundWorkflow]}).assets[0].state,'blocked','a facade contract does not renew old evidence')
assert.equal(assetAutomation({...base,fields:[{...bound,field:'Prévisions non observées'}],connections:[],workflows:[boundWorkflow]}).assets[0].state,'qualification-needed','unknown field is not certified by a file schedule')

assert.equal(assetAutomation({...base,fields:[{...field,asOf:'2026-10-21'}]}).assets[0].state,'blocked','future observation dates cannot certify current data')
