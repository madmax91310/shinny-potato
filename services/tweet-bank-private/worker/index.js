import CATALOG from './catalog.js'
import PAGE from './page.js'
import * as Discovery from './discovery.js'
const CATEGORIES = ['Storytelling','Bilan patrimoine','Guide ETF','Pédagogie','Engagement & débat','Actu & humour','Simulation & chiffres','Fiches pratiques','Histoires de marché']
const FORMATS = ['Preuve vendredi soir','Bilan de la semaine','Explication pédagogique']
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})
const validDate = x => x === '' || (typeof x==='string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString().slice(0,10)===x)
export async function api(request, env, user) {
 if(!user) return json({error:'Connexion requise.'},401)
 if(!env.DB) return json({error:'La sauvegarde est momentanément indisponible.'},503)
 const url = new URL(request.url)
 if(request.method==='GET') {
  const rows=await env.DB.prepare('SELECT * FROM tweets WHERE owner = ? ORDER BY updated_at DESC, id').bind(user).all()
  return json({tweets:rows.results.map(r=>({...r,formats:JSON.parse(r.formats)}))})
 }
 if(!['PUT','DELETE'].includes(request.method))return json({error:'Méthode refusée.'},405)
 if(request.headers.get('Origin')!==url.origin || !request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Requête refusée.'},403)
 const raw=await request.text();if(raw.length>100000)return json({error:'Texte trop volumineux.'},413)
 let b;try{b=JSON.parse(raw)}catch{return json({error:'Contenu invalide.'},400)}
 if(!b || typeof b!=='object' || !/^[a-f0-9-]{36}$/.test(b.id??'') || !Number.isSafeInteger(b.version) || b.version<0)return json({error:'Identifiant ou version invalide.'},400)
 if(request.method==='DELETE') {
  const row=await env.DB.prepare('DELETE FROM tweets WHERE owner = ? AND id = ? AND version = ? RETURNING id').bind(user,b.id,b.version).first()
  return row?json({deleted:true}):json({error:'Ce tweet a changé sur un autre appareil. Recharge la liste avant de supprimer.'},409)
 }
 if(typeof b.text!=='string'||!b.text.trim()||b.text.length>32000||!CATEGORIES.includes(b.category)||!Array.isArray(b.formats)||b.formats.some(f=>!FORMATS.includes(f))||!validDate(b.last_published??''))return json({error:'Vérifie le texte, la catégorie, le format et la date.'},400)
 const now=new Date().toISOString()
 const row=await env.DB.prepare(`INSERT INTO tweets (owner,id,text,category,formats,last_published,created_at,updated_at,version)
 SELECT ?,?,?,?,?,?,?,?,1 WHERE ? = 0
 ON CONFLICT(owner,id) DO NOTHING RETURNING *`).bind(user,b.id,b.text,b.category,JSON.stringify([...new Set(b.formats)]),b.last_published??'',now,now,b.version).first()
 let saved=row
 if(!saved && b.version>0) saved=await env.DB.prepare('UPDATE tweets SET text=?,category=?,formats=?,last_published=?,updated_at=?,version=version+1 WHERE owner=? AND id=? AND version=? RETURNING *').bind(b.text,b.category,JSON.stringify([...new Set(b.formats)]),b.last_published??'',now,user,b.id,b.version).first()
 return saved?json({tweet:{...saved,formats:JSON.parse(saved.formats)}}):json({error:'Ce tweet a changé sur un autre appareil. Ton texte reste dans le formulaire : copie-le avant de recharger la liste.'},409)
}
const archiveIds = new Set(CATALOG.tweets.map(t=>t.id))
const discoveryCode = 'export const THEMES = {'+Object.entries(Discovery.THEMES).map(([k,v])=>JSON.stringify(k)+':'+v.toString()).join(',')+'};\n'+Object.entries(Discovery).filter(([,v])=>typeof v==='function').map(([k,v])=>'export '+v.toString()).join('\n')
export async function preferencesApi(request,env,user) {
 if(!user)return json({error:'Connexion requise.'},401)
 if(!env.DB)return json({error:'Sauvegarde indisponible.'},503)
 if(request.method==='GET') {
  const rows=await env.DB.prepare('SELECT * FROM tweet_preferences WHERE owner = ?').bind(user).all()
  return json({preferences:rows.results})
 }
 if(request.method!=='PUT')return json({error:'Méthode refusée.'},405)
 if(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Requête refusée.'},403)
 const raw=await request.text();if(raw.length>4000)return json({error:'Requête trop volumineuse.'},413)
 let b;try{b=JSON.parse(raw)}catch{return json({error:'Contenu invalide.'},400)}
 if(typeof b?.id==='string'&&b.id.startsWith('archive:')&&!archiveIds.has(b.id))await catalogResponse(env)
 if(!b||typeof b.id!=='string'||!(archiveIds.has(b.id)||/^[a-f0-9-]{36}$/.test(b.id))||typeof b.favorite!=='boolean'||!validDate(b.last_published)||!Number.isSafeInteger(b.version)||b.version<0)return json({error:'Préférences invalides.'},400)
 if(!archiveIds.has(b.id)&&!await env.DB.prepare('SELECT id FROM tweets WHERE owner=? AND id=?').bind(user,b.id).first())return json({error:'Tweet introuvable.'},404)
 const now=new Date().toISOString()
 let row=await env.DB.prepare('INSERT INTO tweet_preferences(owner,tweet_id,favorite,last_published,version,updated_at) SELECT ?,?,?,?,?,? WHERE ?=0 ON CONFLICT(owner,tweet_id) DO NOTHING RETURNING *').bind(user,b.id,b.favorite?1:0,b.last_published,1,now,b.version).first()
 if(!row&&b.version>0)row=await env.DB.prepare('UPDATE tweet_preferences SET favorite=?,last_published=?,version=version+1,updated_at=? WHERE owner=? AND tweet_id=? AND version=? RETURNING *').bind(b.favorite?1:0,b.last_published,now,user,b.id,b.version).first()
 return row?json({preference:row}):json({error:'Ces préférences ont changé sur un autre appareil. Actualise avant de réessayer.'},409)
}
async function catalogResponse(env) {
 try{
  const response=await (env.CATALOG_FETCH||fetch)('https://madmax91310.github.io/shinny-potato/data/tweet-bank-catalog.json',{signal:AbortSignal.timeout(7000)})
  if(!response.ok)throw Error('catalog')
  const data=await response.json()
  if(data.version!==1||!Array.isArray(data.tweets)||!data.tweets.length||new Set(data.tweets.map(t=>t.id)).size!==data.tweets.length||data.tweets.some(t=>!String(t.id).startsWith('archive:')||typeof t.text!=='string'||!t.review))throw Error('catalog')
  // Keep the snapshot's known IDs admissible and admit newly published archive IDs.
  data.tweets.forEach(t=>archiveIds.add(t.id))
  return json({...data,catalogSource:'published'})
 }catch{return json({...CATALOG,catalogSource:'snapshot'})}
}

export default {async fetch(request,env){
 const user=request.headers.get('oai-authenticated-user-id')
 const path=new URL(request.url).pathname
 try{
  if(path==='/api/tweets')return await api(request,env,user)
  if(path==='/api/preferences')return await preferencesApi(request,env,user)
  if(path==='/api/catalog'){if(!user)return json({error:'Connexion requise.'},401);return await catalogResponse(env)}
  if(path==='/discovery.js'){if(!user)return json({error:'Connexion requise.'},401);return new Response(discoveryCode,{headers:{'Content-Type':'text/javascript','Cache-Control':'no-store'}})}
  if(path!=='/')return new Response('Introuvable',{status:404})
  if(!user)return new Response('Connexion requise. <a href="/signin-with-chatgpt?returnTo=%2F" target="_top">Se connecter avec ChatGPT</a>',{status:401,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})
  const nonce=crypto.randomUUID().replaceAll('-','')
  return new Response(PAGE.replaceAll('__NONCE__',nonce).replace('__CATEGORIES__',JSON.stringify(CATEGORIES)).replace('__FORMATS__',JSON.stringify(FORMATS)),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':`default-src 'self'; img-src 'self' https://madmax91310.github.io; script-src 'self' 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`}})
 }catch{return json({error:'Le service est momentanément indisponible. Ton texte reste dans le formulaire.'},503)}
}}
