// Preview-only adapter. Production exports only worker/index.js and requires Sites identity.
import http from 'node:http'
import {DatabaseSync} from 'node:sqlite'
import fs from 'node:fs'
import worker from '../worker/index.js'
const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync(new URL('../drizzle/0000_tweets.sql',import.meta.url),'utf8'))
sqlite.exec(fs.readFileSync(new URL('../drizzle/0001_preferences.sql',import.meta.url),'utf8'))
const DB={prepare(sql){let values=[];return {bind(...args){values=args;return this},async first(){return sqlite.prepare(sql).get(...values)||null},async all(){return {results:sqlite.prepare(sql).all(...values)}}}}}
http.createServer(async(req,res)=>{try{if(req.url==='/__mobile'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<html><body style="margin:0;background:#101a2e"><iframe title="Mobile 390px" src="/" style="width:390px;height:920px;border:0"></iframe></body></html>');return}const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id','local-preview-owner');const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});const response=await worker.fetch(request,{DB});const outgoing=Object.fromEntries(response.headers);if(outgoing['content-security-policy'])outgoing['content-security-policy']=outgoing['content-security-policy'].replace("frame-ancestors 'none'","frame-ancestors 'self'");res.writeHead(response.status,outgoing);res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end('Preview error')}}).listen(Number(process.env.PORT||process.argv[process.argv.indexOf('--port')+1]||3000),'0.0.0.0')
