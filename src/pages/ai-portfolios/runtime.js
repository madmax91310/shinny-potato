import {fingerprint} from './request-transport.js'
// An old creation draft can already have been recorded on another tab/device.
// Restore its fields onto that existing competition, never offer a second create.
export function restoreOwnerDraft(draft,book){
 const recorded=book.audit.find(e=>e.requestId===draft.request?.requestId)
 const competition=book.competitions.find(c=>c.id===recorded?.competitionId||c.id===draft.request?.requestId)
 if(!competition)return draft
 return {...draft,selected:competition.id,request:{...draft.request,trackingOnly:true},receipt:{state:'recorded',event:recorded}}
}
// Catalogue identity and publication metadata are distinct from the small
// overview, retained archived identities and incrementally hydrated price series.
export function sameCatalogue(a,b){return Boolean(a&&b&&a.market.asOf===b.market.asOf&&a.catalogue?.revision===b.catalogue?.revision&&a.catalogue?.count===b.catalogue?.count&&a.catalogue?.fingerprint===b.catalogue?.fingerprint)}
export function mergeRuntime(previous,incoming){
 if(!previous?.catalogueLoaded||!sameCatalogue(previous,incoming))return {...incoming,catalogueLoaded:incoming.version!==2}
 const retained=new Map(previous.market.universe.map(a=>[a.id,a]))
 for(const a of incoming.market.universe)retained.set(a.id,{...retained.get(a.id),...a})
 return {...incoming,catalogueLoaded:true,market:{...incoming.market,universe:[...retained.values()],catalogueIds:previous.market.catalogueIds,series:{...previous.market.series,...incoming.market.series}}}
}
export function decodeCatalogue(payload){
 if(payload.version!==1||!Array.isArray(payload.columns)||!Array.isArray(payload.rows))throw Error('Catalogue incompatible. Recharger la version publiée.')
 return payload.rows.map(row=>Object.fromEntries(payload.columns.flatMap((key,i)=>row[i]==null?[]:[[key,row[i]]])))
}
export async function loadCatalogue(bundle,fetcher=fetch,base=import.meta.env.BASE_URL){
 const response=await fetcher(base+'data/ai-portfolios/'+(bundle.catalogue?.url??'catalogue.json'),{cache:'no-store'})
 if(!response.ok)throw Error('Catalogue indisponible. Réessayer ; les portefeuilles publiés restent consultables.')
 const payload=await response.json()
 if(payload.asOf!==bundle.market.asOf)throw Error('Publication en cours : dates du catalogue et du tableau différentes. Recharger le dépôt.')
 if(payload.revision!=null&&payload.revision!==bundle.catalogue?.revision)throw Error('Publication en cours : versions du catalogue et du tableau différentes. Actualisez le livre avant de préparer la demande.')
 const assets=decodeCatalogue(payload)
 if(bundle.catalogue?.count!=null&&assets.length!==bundle.catalogue.count)throw Error('Catalogue incomplet : le nombre d’identités diffère du tableau. Actualisez le livre ; aucun actif retiré.')
 if(new Set(assets.map(a=>a.id)).size!==assets.length)throw Error('Catalogue incompatible : identifiants dupliqués.')
 const expected=bundle.catalogue?.fingerprint??payload.fingerprint
 if(expected&&(payload.fingerprint!==expected||await fingerprint(assets.map(a=>a.id).sort())!==expected))throw Error('Catalogue incompatible : empreinte différente de la publication attendue. Actualisez le livre et le catalogue ; aucun actif retiré.')
 const retained=new Map(bundle.market.universe.map(a=>[a.id,a]))
 const ids=new Set(assets.map(a=>a.id))
 return {...bundle,market:{...bundle.market,catalogueIds:assets.map(a=>a.id),universe:[...assets.map(a=>({...a,...retained.get(a.id)})),...bundle.market.universe.filter(a=>!ids.has(a.id))]},catalogueLoaded:true}
}
export async function loadDetails(market,ids,fetcher=fetch,base=import.meta.env.BASE_URL){
 const files=new Map()
 for(const id of ids){const bytes=new TextEncoder().encode(id),hash=await crypto.subtle.digest('SHA-256',bytes),bucket=[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join('').slice(0,2);files.set(bucket,true)}
 const additions={}
 for(const bucket of files.keys()){const r=await fetcher(base+'data/ai-portfolios/details/'+bucket+'.json',{cache:'no-store'});if(!r.ok)throw Error('Preuves indisponibles. Réessayer.');const data=await r.json();for(const id of ids)if(data[id])additions[id]=data[id]}
 return additions
}
