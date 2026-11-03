import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import fs from 'node:fs'
const {api}=await import('../worker/index.js')
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync('drizzle/0000_tweets.sql','utf8'))
sqlite.exec(fs.readFileSync(new URL('../drizzle/0001_preferences.sql',import.meta.url),'utf8'))
export const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this},async first(){return sqlite.prepare(sql).get(...values)||null},async all(){return this._all()},_all(){return {results:sqlite.prepare(sql).all(...values)}}}},batch(statements){sqlite.exec('BEGIN');try{const rows=statements.map(s=>s._all());sqlite.exec('COMMIT');return rows}catch(error){sqlite.exec('ROLLBACK');throw error}}}
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

// Exercise real streams: a post-read length check consumes the whole input.
for (const [handler,limit] of [[api,100000],[preferencesApi,4000]]) {
 let cancelled=false,pulled=0
 const stream=new ReadableStream({pull(controller){pulled++;controller.enqueue(new Uint8Array(limit))},cancel(){cancelled=true}})
 const headers={Origin:'https://bank.test','Content-Type':'application/json'}
 const response=await handler(new Request('https://bank.test/api/tweets',{method:'PUT',headers,body:stream,duplex:'half'}),{DB},'alice')
 assert.equal(response.status,413);assert(cancelled);assert(pulled<=3,'bounded input, including one prefetched chunk')
 assert.equal((await handler(new Request('https://bank.test/api/tweets',{method:'PUT',headers,body:'{"bad":',duplex:'half'}),{DB},'alice')).status,400)
 const before=await (await api(request('GET'),{DB},'alice')).json()
 assert.equal((await handler(request('PUT',{...payload,text:'é'.repeat(limit)}),{DB},'alice')).status,413,'UTF-8 bytes are bounded')
 assert.deepEqual(await (await api(request('GET'),{DB},'alice')).json(),before,'rejected input cannot alter saved data')
}
const {mock}=await import('node:test')
mock.timers.enable({apis:['setTimeout']})
try {
 let cancelled=false
 const stream=new ReadableStream({cancel(){cancelled=true}})
 const stalled=api(new Request('https://bank.test/api/tweets',{method:'PUT',headers:{Origin:'https://bank.test','Content-Type':'application/json'},body:stream,duplex:'half'}),{DB},'alice')
 mock.timers.tick(10000)
 assert.equal((await stalled).status,408);assert(cancelled)
}finally{mock.timers.reset()}
console.log('Request streams: byte bounds, cancellation, malformed JSON, stalled input and unchanged saved rows verified.')

// Backup is a coherent server snapshot, not the possibly stale displayed export.
const {backupApi}=await import('../worker/index.js')
const backupRequest=(method,body,origin='https://bank.test')=>new Request('https://bank.test/api/backup',{method,headers:body?{Origin:origin,'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined})
const readBackup=async user=>{const r=await backupApi(backupRequest('GET'),{DB},user);assert.equal(r.status,200);return r.json()}
const restore=(data,user='alice',database=DB)=>backupApi(backupRequest('POST',data),{DB:database},user)
await api(request('PUT',payload),{DB},'alice')
await api(request('PUT',{...payload,id:id.replace(/1$/,'2'),text:'Propriétaire distinct'}),{DB},'bob')
const snapshot=await readBackup('alice'),bobBefore=await readBackup('bob')
assert.equal(snapshot.version,3);assert.equal(snapshot.owner,'alice')
assert.equal((await backupApi(backupRequest('GET'),{DB},null)).status,401)
assert.equal((await backupApi(backupRequest('POST',snapshot,'https://other.test'),{DB},'alice')).status,403)
const content=data=>({tweets:data.tweets,preferences:data.preferences})
const original=content(snapshot)
sqlite.prepare('DELETE FROM tweets WHERE owner=?').run('alice');sqlite.prepare('DELETE FROM tweet_preferences WHERE owner=?').run('alice')
assert.equal((await restore(snapshot)).status,200)
assert.deepEqual(content(await readBackup('alice')),original,'real SQLite restoration preserves IDs, text, publication, favorites, timestamps and versions')
assert.deepEqual(content(await readBackup('bob')),content(bobBefore),'another owner is untouched')
assert.equal((await restore(snapshot)).status,200,'retry after an uncertain response is idempotent')
assert.deepEqual(content(await readBackup('alice')),original)
const legacy=structuredClone(snapshot);legacy.version=2;delete legacy.owner
sqlite.prepare('DELETE FROM tweets WHERE owner=?').run('alice');sqlite.prepare('DELETE FROM tweet_preferences WHERE owner=?').run('alice')
assert.equal((await restore(legacy)).status,200,'the actually distributed v2 export is supported')
assert.deepEqual(content(await readBackup('alice')),original)
for(const data of [{...snapshot,version:1},{...snapshot,version:99},{...snapshot,tweets:[{...snapshot.tweets[0],text:null}]},{...snapshot,tweets:[...snapshot.tweets,...snapshot.tweets]},{...snapshot,preferences:[{...snapshot.preferences[0],futureField:'must not be silently lost'}]}]){
 assert.equal((await restore(data)).status,400);assert.deepEqual(content(await readBackup('alice')),original)
}
for(const data of [bobBefore,{...snapshot,preferences:[{...snapshot.preferences[0],owner:'bob'}]}]){
 assert.equal((await restore(data)).status,403);assert.deepEqual(content(await readBackup('alice')),original);assert.deepEqual(content(await readBackup('bob')),content(bobBefore))
}
const corrupt=new Request('https://bank.test/api/backup',{method:'POST',headers:{Origin:'https://bank.test','Content-Type':'application/json'},body:'{"version":3'})
assert.equal((await backupApi(corrupt,{DB},'alice')).status,400)
assert.deepEqual(content(await readBackup('alice')),original)
// Force a real failure after the first INSERT, inside the same SQLite transaction.
sqlite.prepare('DELETE FROM tweets WHERE owner=?').run('alice');sqlite.prepare('DELETE FROM tweet_preferences WHERE owner=?').run('alice')
await api(request('PUT',{...payload,id:id.replace(/1$/,'4'),text:'Valide avant restauration'}),{DB},'alice')
const beforeInterrupted=content(await readBackup('alice'))
const interruptedDB={...DB,batch(statements){let calls=0;return DB.batch(statements.map(s=>({_all(){if(calls++===1)throw Error('simulated interrupted transaction');return s._all()}})))}}
const interrupted=await worker.fetch(new Request('https://bank.test/api/backup',{method:'POST',headers:{Origin:'https://bank.test','Content-Type':'application/json','oai-authenticated-user-id':'alice'},body:JSON.stringify(snapshot)}),{DB:interruptedDB})
assert.equal(interrupted.status,503);assert.deepEqual(content(await readBackup('alice')),beforeInterrupted,'the first insert rolls back and valid preexisting rows survive')
sqlite.prepare('DELETE FROM tweets WHERE owner=?').run('alice')
assert.equal((await restore(snapshot)).status,200)
// A conflicting preference must roll back a previously missing tweet as well.
const extra={...snapshot.tweets[0],id:id.replace(/1$/,'3'),text:'Restauration partielle interdite'}
const conflicting={...snapshot,tweets:[extra],preferences:snapshot.preferences.map(p=>({...p,favorite:p.favorite?0:1}))}
assert.equal((await restore(conflicting)).status,409);assert.deepEqual(content(await readBackup('alice')),original)
const historical={...snapshot,tweets:[],preferences:[{...snapshot.preferences[0],tweet_id:id.replace(/1$/,'9')},{...snapshot.preferences[0],tweet_id:'archive:old-version-no-longer-listed'}]}
assert.equal((await restore(historical)).status,200)
assert((await readBackup('alice')).preferences.some(p=>p.tweet_id==='archive:old-version-no-longer-listed'))
assert.equal((await api(request('PUT',{...payload,version:snapshot.tweets[0].version,text:'Après restauration'}),{DB},'alice')).status,200)
assert.equal((await restore(snapshot)).status,409,'an older backup cannot erase a later edit')
assert.equal((await (await api(request('GET'),{DB},'alice')).json()).tweets[0].text,'Après restauration')
console.log('Manual backup/restore: v3 and legacy v2, real transaction rollback, no partial conflict writes, idempotent retries, exact versions/history and owner isolation verified.')

const beforeInvalidStream=content(await readBackup('alice'))
const brokenStream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('{"version":3,'));controller.error(Error('test interruption'))}})
const brokenRequest=new Request('https://bank.test/api/backup',{method:'POST',headers:{Origin:'https://bank.test','Content-Type':'application/json'},body:brokenStream,duplex:'half'})
assert.equal((await backupApi(brokenRequest,{DB},'alice')).status,400)
const oversized=new Request('https://bank.test/api/backup',{method:'POST',headers:{Origin:'https://bank.test','Content-Type':'application/json'},body:'x'.repeat(1024*1024+1)})
assert.equal((await backupApi(oversized,{DB},'alice')).status,413)
assert.deepEqual(content(await readBackup('alice')),beforeInvalidStream)
const largeDB={...DB,batch:()=>[{results:Array.from({length:40},(_,i)=>({...snapshot.tweets[0],id:'70000000-0000-4000-8000-'+String(i).padStart(12,'0'),text:'é'.repeat(32000),formats:'[]'}))},{results:[]}]}
assert.equal((await backupApi(backupRequest('GET'),{DB:largeDB},'alice')).status,413,'never label an unrestorable oversized file as a successful backup')
console.log('Backup interruptions and UTF-8 size limits preserve existing valid data; oversized backups are explicitly refused.')

const d1Wrapped={...DB,batch(statements){try{return DB.batch(statements)}catch(cause){throw new Error('D1_ERROR',{cause})}}}
assert.equal((await restore(snapshot,'alice',d1Wrapped)).status,409,'D1 wrapped transaction conflicts remain understandable')
