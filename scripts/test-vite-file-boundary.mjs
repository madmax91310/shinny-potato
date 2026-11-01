// Controlled synthetic secret: never read a real environment file in this test.
import assert from 'node:assert/strict'
import {mkdtemp,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createServer} from 'vite'
const directory=await mkdtemp(join(tmpdir(),'vite-file-boundary-'))
let server
try{
 await writeFile(join(directory,'.env'),'TEST_ONLY_SYNTHETIC_FIXTURE=not-a-secret\n')
 server=await createServer({root:directory,configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}})
 await server.listen()
 const port=server.httpServer.address().port
 for(const suffix of ['', '?vite-wasm-instance']){
  const response=await fetch(`http://127.0.0.1:${port}/.env${suffix}`),text=await response.text()
  assert(response.status>=400,'denied files must never be served successfully')
  assert(!text.includes('TEST_ONLY')&&!text.includes('54 45 53 54'),'first four fixture bytes must not appear even in a WebAssembly error')
 }
 console.log('Vite dev-server file boundary: plain and wasm-instance requests cannot disclose the synthetic denied fixture.')
}finally{await server?.close();await rm(directory,{recursive:true,force:true})}
