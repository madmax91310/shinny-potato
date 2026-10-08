import assert from 'node:assert/strict'
import {readFileSync, writeFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {REGULATORY as R, regulatoryNumber as n, regulatoryMoney as money} from '../src/data/regulatory-data.js'
import {TERMES} from '../src/data/financial-lexicon.js'
import {getFicheLexiqueText} from '../src/pages/tweet-midi/data/ficheLexique.js'
import {BROKERS} from '../src/pages/broker-comparator/data.js'
import {buildBrokerTweet} from '../src/pages/broker-comparator/lib.js'
import {BROKER_EVIDENCE} from '../src/pages/broker-comparator/evidence.js'
import {brokerTariffCopy, BROKER_TARIFFS} from '../src/data/broker-tariffs.js'
import {DATA_CATALOG} from '../src/data/catalog.js'
const terms=Object.fromEntries(TERMES.map(t=>[t.id,t]))
assert(terms.pea.mecanismeContenu.includes(n('peaCeiling')))
assert(terms.cto.fraisContenu.includes(n('ctoTotal')) && terms.cto.fraisContenu.includes(n('dividendTotal')))
assert(getFicheLexiqueText('pea').includes(money(15000-5000*R.peaSocial/100)))
assert(getFicheLexiqueText('cto').includes(money(1300-300*R.ctoTotal/100)))
assert(getFicheLexiqueText('flat-tax').includes(money(1000-1000*R.ctoTotal/100)))
assert(getFicheLexiqueText('prelevements-sociaux').includes(money(5000*R.avSocial/100)))
assert(getFicheLexiqueText('ldds').includes(money(R.lddsCeiling*R.lddsRate/100)))
for (const id of Object.keys(BROKER_TARIFFS)) {
 const broker=BROKERS.find(b=>b.id===id), copy=brokerTariffCopy(id)
 assert.equal(broker.frais.resume,copy.resume);assert.equal(broker.post.frais[0],copy.full)
 assert.equal(BROKER_EVIDENCE[id].frais.summary,copy.full)
 assert(buildBrokerTweet([broker,BROKERS.find(b=>b.id===(id==='tr'?'xtb':'tr'))]).includes(copy.full))
 const record=DATA_CATALOG.find(r=>r.id===`broker:${id}`)
 assert.equal(record.fields[0].value.description,copy.full)
}
for (const id of ['pea','cto','livret-a','ldds','assurance-vie']) {
 assert(DATA_CATALOG.find(r=>r.id===`lexicon:${id}`).fields.some(f=>f.registry==='src/data/regulatory-data.js'))
 assert(!/undefined|NaN/.test(getFicheLexiqueText(id)))
}
if (!process.argv.includes('--child')) {
 const paths=['src/data/automated-regulatory.json','src/data/automated-broker-tariffs.json']
 const originals=paths.map(p=>readFileSync(p,'utf8'))
 try {
  const regulatory=JSON.parse(originals[0]), tariffs=JSON.parse(originals[1])
  Object.assign(regulatory.sources.cto.values,{ctoIncome:15,ctoSocial:21,ctoTotal:36})
  Object.assign(regulatory.sources.social.values,{peaSocial:20})
  Object.assign(regulatory.sources.av.values,{avSocial:19})
  Object.assign(regulatory.sources.ldds.values,{lddsCeiling:13000,lddsRate:4})
  Object.assign(tariffs.brokers.fortuneo.values,{threshold:700,rate:.45})
  paths.forEach((p,i)=>writeFileSync(p,JSON.stringify(i?tariffs:regulatory)))
  const test=spawnSync(process.execPath,[process.argv[1],'--child'],{encoding:'utf8'})
  assert.equal(test.status,0,test.stdout+test.stderr)
 } finally {paths.forEach((p,i)=>writeFileSync(p,originals[i]))}
}
console.log('Regulatory consumers: exact scopes, recalculated examples, changed rates/fees and shared catalogue OK')
