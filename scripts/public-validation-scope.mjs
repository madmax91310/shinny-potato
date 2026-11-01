import {execFileSync} from 'node:child_process'
import {appendFileSync} from 'node:fs'
import {pathToFileURL} from 'node:url'
// This independent service is built/tested by test-tweet-bank-private.yml.
// Production snapshots always retain the full publication gate, even for a service-only push.
export function requiresPublicValidation({event,base,head='HEAD'},git=(...args)=>execFileSync('git',args,{encoding:'utf8'})) {
 if(event!=='pull_request')return true
 if(!/^[a-f0-9]{40}$/.test(base??''))return true
 try{
  const paths=git('diff','--name-only','-z',base,head,'--').split('\0').filter(Boolean)
  return !paths.length || paths.some(path=>!path.startsWith('services/tweet-bank-private/')&&path!=='.github/workflows/test-tweet-bank-private.yml')
 }catch{return true}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const required=requiresPublicValidation({event:process.env.GITHUB_EVENT_NAME,base:process.env.PUBLIC_VALIDATION_BASE})
 appendFileSync(process.env.GITHUB_OUTPUT,`required=${required}\n`)
 console.log(required?'Public application validation required.':'Private-service-only PR: public application unchanged; private API/build/browser workflow remains required.')
}
