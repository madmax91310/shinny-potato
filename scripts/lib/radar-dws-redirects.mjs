// First-party DWS redirects observed on 6 November 2026. Permit only the two
// corresponding press documents, never a new source, path or query.
const MIGRATIONS={
 'www.dws.com':{host:'www.deutsche-am.com',prefix:'/en-gb/our-profile/media/media-releases'},
 'etf.dws.com':{host:'etf.deutsche-am.com',prefix:'/en-gb/about-us/press-releases'},
}
export function sameRadarDocument(requested,actual){
 if(!actual)return true // Response test doubles without a resolved URL.
 const from=new URL(requested),to=new URL(actual)
 if(from.hostname===to.hostname)return true // Existing same-host policy.
 const rule=MIGRATIONS[from.hostname],path=from.pathname.toLowerCase()
 return Boolean(rule && from.protocol==='https:' && to.protocol==='https:'
  && !from.port && !to.port && !from.username && !from.password && !to.username && !to.password
  && to.hostname===rule.host && (path===rule.prefix || path.startsWith(rule.prefix+'/'))
  && from.pathname.replace(/\/$/,'')===to.pathname.replace(/\/$/,'') && from.search===to.search)
}
