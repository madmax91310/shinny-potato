import assert from 'node:assert/strict'
import {blankProfile,blankSnapshot,issues,buildText,publication,pct,canonicalUrl,benchmarkIssue} from '../src/pages/public-portfolios/lib.js'
import {load,save} from '../src/pages/public-portfolios/storage.js'
const bytes=new Map();globalThis.localStorage={getItem:k=>bytes.get(k)??null,setItem:(k,v)=>bytes.set(k,v)}
let db=load();const p=blankProfile();assert(save({...db,profiles:[p]}));assert.equal(load().profiles[0].url,'');p.pseudo='TEST FICTIF';p.url='https://example.com/test';p.nature='Réel déclaré par son auteur'
const s=blankSnapshot();s.consulted='2026-11-15';s.source=p.url;s.positions=[{name:'Placement fictif',weight:100}];Object.assign(s.month,{value:-2.45,start:'2026-10-01',end:'2026-10-31',original:'October return',verified:true});Object.assign(s.ytd,{value:0,start:'2026-01-01',end:'2026-10-31',original:'YTD cumulative',verified:true});assert.deepEqual(issues(p,s),[]);assert.equal(pct(0),'0 %');assert.equal(pct(''),'Non renseignée');assert.match(buildText(p,s,2),/-2,45/)
for(const original of ['Annual return since Jan 2026','30 days return','rolling return']){const bad=structuredClone(s);bad.ytd.original=original;assert(issues(p,bad).length)}
const rolling=structuredClone(s);rolling.month.start='2026-10-02';assert(issues(p,rolling).length)
const missing=structuredClone(s);missing.month.value='';assert(issues(p,missing).length)
const incomplete=structuredClone(s);incomplete.positions[0].weight=80;assert(issues(p,incomplete).some(x=>x.includes('80')))
const virtual={...p,nature:'Démonstration / virtuel'};assert(issues(virtual,s).length)
const published=publication(p,s,{episode:2,text:buildText(p,s,2)},'2026-11-15','');s.month.value=40;assert.equal(published.snapshot.month.value,-2.45);assert.equal(published.profile.publications.length,0)
p.snapshots=[s,structuredClone(s)];p.publications=[published];db={version:1,profiles:[p]};assert(save(db));assert.equal(load().profiles[0].snapshots.length,2);assert.equal(load().profiles[0].publications[0].snapshot.month.value,-2.45)
bytes.set('el-public-portfolios-v1','changed elsewhere');assert.equal(save(db),false);assert.equal(canonicalUrl('javascript:alert(1)'),'');assert(benchmarkIssue(s));console.log('Portefeuilles publics : stockage, conflits, périodes ambiguës, zéros, pertes, allocation et historique vérifiés.')
