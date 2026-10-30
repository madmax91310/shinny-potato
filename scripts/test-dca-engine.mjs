import { exposureDisplay } from '../src/pages/dca-profiles/exposure.js'
import assert from 'node:assert/strict'
import {PROFILES} from '../src/pages/dca-profiles/data.js'
import {prepareProfile,analyzeProfile,validateProfile,publicationReady,observation,references} from '../src/pages/dca-profiles/engine.js'
import {buildTweetText} from '../src/pages/dca-profiles/lib.js'
for(const [i,p] of PROFILES.entries()){
 const prepared=prepareProfile(p,i), a=analyzeProfile(prepared)
 assert.deepEqual(a.errors,[],p.id)
 assert.equal(a.monthly,p.monthly)
 assert.equal(prepared.lines.reduce((s,l)=>s+l.weight,0),100)
 assert(buildTweetText(prepared).includes('💼'))
 assert(!/NaN|undefined|profil fictif/.test(buildTweetText(prepared)))
 for(const field of ['countries','sectors'])assert(a[field].coverage>=0&&a[field].coverage<=100.001)
}
const p={...prepareProfile(PROFILES[0]),lines:[{asset:'world',label:'World',weight:80,amount:50,isin:references.world.isin},{asset:'sp500',label:'S&P 500',weight:20,amount:50,isin:references.sp500.isin}]}
assert.equal(analyzeProfile(p).changes[0].share,50)
assert.equal(analyzeProfile(p).changes[0].delta,-30)
// Physical funds retain their observed cash allocation outside the equity pocket.
const expectedCoverage = profile => profile.lines.reduce((sum, line) => sum + line.weight * (references[line.asset].equitySleeve?.weightPct ?? 100) / 100, 0)
assert(Math.abs(analyzeProfile(p).countries.coverage - expectedCoverage(p)) < 1e-8)
const countries=analyzeProfile(p).countries
assert(countries.coverage>0 && countries.coverage<=100)
assert(Math.abs(countries.coverage+countries.neutralWeight+exposureDisplay(countries).missing-100)<1e-9,'Current holdings retain unknown countries and non-equity weights')
const g=analyzeProfile(p).countries.groups.find(g=>g.rows.some(r=>r.name==='États-Unis'))
assert(g)
assert(g.rows.every(r=>r.weight<=g.coverage+0.01))
assert(validateProfile({...p,lines:p.lines.map(l=>({...l,weight:10}))}).length)
assert(validateProfile({...p,lines:[p.lines[0],p.lines[0]]}).length)
assert(validateProfile({...p,lines:[{...p.lines[0],weight:NaN}]}).length)
const noDca={...p,lines:p.lines.map(l=>({...l,amount:0}))}
assert.equal(analyzeProfile(noDca).monthly,0)
assert(observation(noDca).includes('Aucun versement'))
const newPosition={...p,lines:[{...p.lines[0],weight:100,amount:0},{...p.lines[1],weight:0,amount:100}]}
assert.deepEqual(validateProfile(newPosition),[])
assert(Math.abs(analyzeProfile(newPosition).countries.coverage - expectedCoverage(newPosition)) < 1e-8)
const newCountries=analyzeProfile(newPosition).countries
assert(Math.abs(newCountries.coverage+newCountries.neutralWeight+exposureDisplay(newCountries).missing-100)<1e-9)
const unconfirmed={...p,lines:p.lines.map(l=>({...l,isin:''}))}
assert.equal(analyzeProfile(unconfirmed).countries.coverage,0)
assert(!publicationReady({...p,mode:'participant',approved:false}))
assert(publicationReady({...p,mode:'participant',approved:true}))
console.log('DCA moteur : 100 profils, pondérations, couverture, absences, zéro DCA, première position et validation vérifiés.')

// The donut represents the entire portfolio, including uncovered weight.
const {donutData,integerPercentages}=await import('../src/pages/dca-profiles/image.js')
const {incomeLabel}=await import('../src/pages/dca-profiles/lib.js')
for(const [i,raw] of PROFILES.entries()){
 const p=prepareProfile(raw,i),d=donutData(analyzeProfile(p))
 assert(Math.abs(d.rows.reduce((s,r)=>s+r.weight,0)-100)<1e-8)
 assert(d.rows.every(r=>r.weight>0))
}
const snapshot=(coverage,rows,asOf='2026-10-01')=>({coverage,rows,asOf,basis:'fund'})
const partial=donutData({countries:{groups:[snapshot(60,[{name:'France',weight:30},{name:'Japon',weight:30}]),snapshot(40,[{name:'États-Unis',weight:40}],'2026-09-30')]}})
assert.equal(partial.rows.find(r=>r.name==='Non ventilé ici').weight,40)
assert(!partial.rows.some(r=>r.name==='États-Unis'))
assert.equal(donutData({countries:{groups:[]}}).rows[0].weight,100)
assert.equal(incomeLabel({job:'retraité',variable:false}),'Retraite')
const karim={...p,name:'Karim',emoji:'👦',age:32,job:'informaticien',income:2500,lines:[
 {asset:'world',label:'MSCI World',emoji:'🌍',weight:70,amount:350,isin:references.world.isin},
 {asset:'europe',label:'STOXX Europe 600',emoji:'🇪🇺',weight:20,amount:100,isin:references.europe.isin},
 {asset:'emerging',label:'MSCI Emerging Markets',emoji:'🌏',weight:10,amount:50,isin:references.emerging.isin}],variable:false}
assert(buildTweetText(karim).startsWith('👦 Karim, 32 ans, informaticien\n💸 Salaire : 2500€/mois\n📊 DCA de 500€ par mois'))
assert(!buildTweetText(karim).includes('Le World reste son placement principal.'))
assert(!/undefined|NaN/.test(buildTweetText({...karim,age:null,job:'',income:0})))
console.log('Donuts : total, couverture partielle, dates séparées et accroche validée.')

for(const raw of PROFILES){
 assert.deepEqual(prepareProfile(raw,0),prepareProfile(raw,99),'Holdings must not depend on list order')
 const rows=donutData(analyzeProfile(prepareProfile(raw))).rows
 const rounded=integerPercentages(rows)
 assert.equal(rounded.reduce((a,b)=>a+b,0),100)
 rounded.forEach((n,i)=>{assert(Number.isInteger(n));assert(Math.abs(n-rows[i].weight)<1.000001)})
}
assert.deepEqual(integerPercentages([{weight:33.4},{weight:33.3},{weight:33.3}]),[34,33,33])

const {PROFILE_SCOPES}=await import('../src/pages/dca-profiles/engine.js')
for(const scope of PROFILE_SCOPES){
 const selected={...p,scope}
 assert.deepEqual(validateProfile(selected),[])
 if(scope!=='Portefeuille investi')assert(buildTweetText(selected).includes(`(${scope})`))
}
for(const scope of [undefined,'undefined','','Inconnu'])assert(validateProfile({...p,scope}).length)


// Publication ordering is independent for holdings and flows, including manual edits.
const {sortHoldings,sortContributions}=await import('../src/pages/dca-profiles/lib.js')
const {allocationRows}=await import('../src/pages/dca-profiles/image.js')
function checkOrder(profile){
 const held=sortHoldings(profile.lines),flows=sortContributions(profile.lines)
 const tweet=buildTweetText(profile)
 assert.deepEqual(allocationRows(profile.lines).map(r=>r.name),held.map(l=>l.label))
 for(const [rows,entry] of [[held,l=>`${l.emoji || '•'} ${l.weight.toLocaleString('fr-FR',{maximumFractionDigits:2})} % ${l.label}`],[flows,l=>`→ ${l.amount.toLocaleString('fr-FR',{useGrouping:false,maximumFractionDigits:2})}€ sur ${l.label}`]]){
  const positions=rows.map(l=>tweet.indexOf(entry(l)))
  assert(positions.every(n=>n>=0))
  assert(positions.every((n,i)=>!i||n>positions[i-1]))
 }
}
for(const raw of PROFILES){
 const profile=prepareProfile(raw),before=structuredClone(profile)
 checkOrder(profile)
 assert.deepEqual(profile,before,'Publication must preserve editor and saved row order')
}
const manual={...karim,mode:'participant',lines:[
 {...karim.lines[0],weight:10,amount:80},
 {...karim.lines[1],weight:70,amount:20},
 {...karim.lines[2],weight:20,amount:80},
]}
checkOrder(manual)
assert.deepEqual(sortHoldings(manual.lines).map(l=>l.asset),['europe','emerging','world'])
assert.deepEqual(sortContributions(manual.lines).map(l=>l.asset),['world','emerging','europe'],'Equal amounts retain input order')
manual.lines[0]={...manual.lines[0],weight:75,amount:100}
manual.lines[1]={...manual.lines[1],weight:5}
checkOrder(manual)
manual.lines=manual.lines.map(l=>({...l,weight:l.weight*.5})).concat({...p.lines[1],weight:50,amount:250})
checkOrder(manual)
assert.equal(sortHoldings(manual.lines)[0].asset,'sp500','Manually appended row is sorted by weight')
assert.equal(sortContributions(manual.lines)[0].asset,'sp500','Manually appended row is sorted by amount')
const zero={...manual,lines:manual.lines.slice(0,2).map((l,i)=>({...l,weight:i===0?100:0,amount:i===1?100:0}))}
checkOrder(zero)
const many=Array.from({length:10},(_,i)=>({label:`Position ${i}`,weight:i+1}))
assert.deepEqual(allocationRows(many).map(r=>r.weight),[10,9,8,7,6,6,5,4])
assert.equal(allocationRows(many).find(r=>r.name==='3 autres positions').weight,6)
assert.deepEqual(many.map(l=>l.weight),[1,2,3,4,5,6,7,8,9,10])
console.log('Tri DCA : tous les profils, saisie manuelle, modifications, égalités, zéros et image regroupée validés.')
