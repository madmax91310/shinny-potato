import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import fs from 'node:fs'
const {api}=await import('../worker/index.js')
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_tweets.sql','utf8'))
sqlite.exec(fs.readFileSync(new URL('../drizzle/0001_preferences.sql',import.meta.url),'utf8'))
export const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this},async first(){return sqlite.prepare(sql).get(...values)||null},async all(){return {results:sqlite.prepare(sql).all(...values)}}}}}
const id='70000000-0000-4000-8000-000000000001'
const payload={id,version:0,text:'Mon texte 👀\n\nSeconde ligne.',category:'Storytelling',formats:['Bilan de la semaine'],last_published:''}
const request=(method,body,origin='https://bank.test')=>new Request('https://bank.test/api/tweets',{method,headers:body?{'Origin':origin,'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined})
assert.equal((await api(request('GET'),{DB},null)).status,401)
assert.equal((await api(request('PUT',payload,'https://other.test'),{DB},'alice')).status,403)
assert.equal((await api(request('PUT',{...payload,text:' '}),{DB},'alice')).status,400)
assert.equal((await api(request('PUT',payload),{DB},'alice')).status,200)
let result=await (await api(request('GET'),{DB},'alice')).json();assert.equal(result.tweets[0].text,payload.text);assert.equal(result.tweets[0].version,1)
assert.equal((await (await api(request('GET'),{DB},'bob')).json()).tweets.length,0)
assert.equal((await api(request('PUT',payload),{DB},'alice')).status,409)
assert.equal((await api(request('PUT',{...payload,version:1,text:'Texte du PC'}),{DB},'alice')).status,200)
assert.equal((await api(request('PUT',{...payload,version:1,text:'Ancienne édition téléphone'}),{DB},'alice')).status,409)
assert.equal((await api(request('DELETE',{id,version:2}),{DB},'bob')).status,409)
assert.equal((await api(request('DELETE',{id,version:1}),{DB},'alice')).status,409)
assert.equal((await api(request('DELETE',{id,version:2}),{DB},'alice')).status,200)
assert.equal((await api(request('PUT',{...payload,version:2}),{DB},'alice')).status,409)
assert.equal((await (await api(request('GET'),{DB},'alice')).json()).tweets.length,0)
console.log('API: texte exact, persistance inter-appareils, isolation des comptes, CSRF, versions concurrentes et suppression vérifiés.')
const {preferencesApi}=await import('../worker/index.js')
const catalog=(await import('../worker/catalog.js')).default
const archived=catalog.tweets[0].id
const pref={id:archived,version:0,favorite:true,last_published:'2026-01-01'}
assert.equal((await preferencesApi(request('PUT',pref),{DB},null)).status,401)
assert.equal((await preferencesApi(request('PUT',pref,'https://evil.test'),{DB},'alice')).status,403)
assert.equal((await preferencesApi(request('PUT',pref),{DB},'alice')).status,200)
let prefs=await (await preferencesApi(request('GET'),{DB},'alice')).json()
assert.equal(prefs.preferences[0].favorite,1)
assert.equal(prefs.preferences[0].last_published,pref.last_published)
assert.equal((await (await preferencesApi(request('GET'),{DB},'bob')).json()).preferences.length,0)
assert.equal((await preferencesApi(request('PUT',pref),{DB},'alice')).status,409)
assert.equal((await preferencesApi(request('PUT',{...pref,version:1,favorite:false}),{DB},'alice')).status,200)
assert.equal((await preferencesApi(request('PUT',{...pref,id:'untrusted-id'}),{DB},'alice')).status,400)
assert.equal((await preferencesApi(request('PUT',{...pref,id}),{DB},'alice')).status,404)
assert.equal((await preferencesApi(request('PUT',{...pref,version:2,last_published:'2026-02-30'}),{DB},'alice')).status,400)
const {default:worker}=await import('../worker/index.js')
const broken=await worker.fetch(new Request('https://bank.test/api/catalog',{headers:{'oai-authenticated-user-id':'alice'}}),{CATALOG_FETCH:async()=>new Response('bad',{status:503})})
const fallback=await broken.json();assert.equal(fallback.catalogSource,'snapshot');assert.equal(fallback.tweets.length,catalog.tweets.length)
const fresh=await worker.fetch(new Request('https://bank.test/api/catalog',{headers:{'oai-authenticated-user-id':'alice'}}),{CATALOG_FETCH:async()=>Response.json(catalog)})
assert.equal((await fresh.json()).catalogSource,'published')
console.log('Archive preferences: two devices, account isolation, stale-write conflicts, dates and explicit catalogue fallback verified.')
