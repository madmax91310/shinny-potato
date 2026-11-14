import assert from 'node:assert/strict'
import {validateProfile,profilePositionLimit} from '../src/pages/dca-profiles/engine.js'
import {newManualLine} from '../src/pages/dca-profiles/placements.js'
import {exportPortfolio,importPortfolio} from '../src/pages/dca-profiles/portable-portfolios.js'
const profile={id:'subscriber:series',name:'Élodie',mode:'participant',scope:'Portefeuille investi',multiImage:true,lines:Array.from({length:50},(_,i)=>newManualLine({label:`Fonds euros épargne ${i}`,category:'Fonds en euros',weight:2,amount:i?0:100}))}
assert.equal(profilePositionLimit(profile),50)
assert.deepEqual(validateProfile(profile),[])
assert.ok(validateProfile({...profile,multiImage:false}).some(e=>e.includes('8 positions')))
assert.ok(validateProfile({...profile,lines:[...profile.lines,newManualLine()]}).some(e=>e.includes('50 positions')))
const record={id:'series',title:'Élodie',profile,draft:'Mon texte',field:'all'}
const restored=importPortfolio(exportPortfolio(record))
assert.equal(restored.profile.multiImage,true)
assert.deepEqual(restored.profile.lines,profile.lines)
assert.equal(new Set(restored.profile.lines.map(l=>l.asset)).size,50)
console.log('Image series: 50 lines, single mode capacity, stable manual identities and lossless transport passed.')
