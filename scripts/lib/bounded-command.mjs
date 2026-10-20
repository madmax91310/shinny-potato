import {spawn} from 'node:child_process'

// Kill the whole process group: a timed-out browser must not keep pipes open.
export function runBounded(command,{timeoutMs=900000,env=process.env,maxBytes=64*1024*1024}={}) {
  return new Promise(resolve=>{
    const child=spawn(command,{shell:true,detached:process.platform!=='win32',env,stdio:['ignore','pipe','pipe']})
    let stdout='',stderr='',bytes=0,timedOut=false,overflow=false,finished=false
    const kill=()=>{try{process.platform==='win32'?child.kill('SIGKILL'):process.kill(-child.pid,'SIGKILL')}catch{}}
    const timer=setTimeout(()=>{timedOut=true;kill()},timeoutMs)
    const capture=key=>chunk=>{
      bytes+=chunk.length
      if(bytes>maxBytes){overflow=true;kill();return}
      if(key==='stdout')stdout+=chunk.toString();else stderr+=chunk.toString()
    }
    child.stdout.on('data',capture('stdout'));child.stderr.on('data',capture('stderr'))
    const done=(status,error)=>{
      if(finished)return;finished=true;clearTimeout(timer)
      resolve({status:timedOut||overflow||error?1:status,stdout,stderr,
        error:error?.message??(timedOut?`Command exceeded ${timeoutMs/1000}s`:overflow?'Command output limit exceeded':null)})
    }
    child.on('error',error=>done(1,error));child.on('close',status=>{kill();done(status)})
  })
}
