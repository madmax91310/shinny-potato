export async function waitPreview(server,url){
 const deadline=Date.now()+30000
 while(Date.now()<deadline){
  if(server.exitCode!==null)throw Error(`Preview exited with ${server.exitCode}`)
  try{if((await fetch(url.endsWith('/')?url:url+'/',{signal:AbortSignal.timeout(1000)})).ok)return}catch{}
  await new Promise(resolve=>setTimeout(resolve,100))
 }
 throw Error('Preview unavailable after 30 seconds: '+url)
}
