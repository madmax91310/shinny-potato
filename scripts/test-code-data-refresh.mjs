import assert from 'node:assert/strict'
import {codeDataSnapshot} from './prepare-code-data-refresh.mjs'
const base={code:'validated',head:'latest',ancestor:()=>true,allowed:['src/data/a.json','src/data/inflation-monthly.js']}
assert.equal(codeDataSnapshot({...base,changed:()=>['src/data/a.json']}),'latest')
assert.equal(codeDataSnapshot({...base,changed:()=>['src/data/inflation-monthly.js']}),'latest')
for(const path of ['src/pages/App.jsx','scripts/collector.py','.github/workflows/deploy-pages.yml','src/data/unknown.json'])assert.equal(codeDataSnapshot({...base,changed:()=>[path]}),'validated')
assert.throws(()=>codeDataSnapshot({...base,ancestor:()=>false,changed:()=>[]}))
const prefix={...base,history:()=>['data1','code2','data3'],changed:(a,b)=>b==='data1'?['src/data/a.json']:['src/pages/App.jsx','src/data/a.json']}
assert.equal(codeDataSnapshot(prefix),'data1')
assert.equal(codeDataSnapshot({...prefix,history:()=>['code2','data3']}),'validated')
assert.equal(codeDataSnapshot({...prefix,changed:(a,b)=>b==='data1'?['src/data/a.json']:['src/data/unknown.json']}),'data1')
console.log('Validated code adopts only declared data; changed consumers, collectors, gates and divergent histories require full validation.')
// Exercise the real composite: code stays immutable, data changes, unknown assets
// remain held back by the shared composer instead of silently reaching the UI.
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {compose} from './compose-fallback-snapshot.mjs'
const cwd=mkdtempSync(join(tmpdir(),'code-data-refresh-'))
try{
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 git('init','--quiet');git('config','user.name','Test');git('config','user.email','test@example.com')
 mkdirSync(join(cwd,'src/data'),{recursive:true})
 writeFileSync(join(cwd,'src/data/a.json'),'{"known":{"value":1}}\n')
 writeFileSync(join(cwd,'app.js'),'export const known = true\n')
 git('add','.');git('commit','-qm','Validated code');const code=git('rev-parse','HEAD')
 writeFileSync(join(cwd,'src/data/a.json'),'{"known":{"value":2}}\n');git('add','.');git('commit','-qm','Qualified new data');const data=git('rev-parse','HEAD')
 const result=compose({published:code,data,cwd,allowed:['src/data/a.json']})
 assert.equal(result.codeSha,code);assert.equal(result.dataSha,data);assert.deepEqual(result.heldBack,[])
 assert.equal(readFileSync(join(cwd,'app.js'),'utf8'),'export const known = true\n')
 assert.equal(JSON.parse(readFileSync(join(cwd,'src/data/a.json'))).known.value,2)
 git('reset','--hard',data);writeFileSync(join(cwd,'src/data/a.json'),'{"unknownAsset":{"value":3}}\n');git('add','.');git('commit','-qm','Unknown asset')
 const held=compose({published:code,data:git('rev-parse','HEAD'),cwd,allowed:['src/data/a.json']})
 assert.equal(held.heldBack.length,1)
 assert.equal(JSON.parse(readFileSync(join(cwd,'src/data/a.json'))).known.value,1)
 git('reset','--hard',data);writeFileSync(join(cwd,'app.js'),'export const changed = true\n');git('add','.');git('commit','-qm','Later unvalidated consumer')
 writeFileSync(join(cwd,'src/data/a.json'),'{"known":{"value":4}}\n');git('add','.');git('commit','-qm','Data after consumer')
 const head=git('rev-parse','HEAD')
 assert.equal(codeDataSnapshot({code,head,ancestor:()=>true,allowed:['src/data/a.json'],
  changed:(a,b)=>git('diff','--name-only',a,b).split('\n').filter(Boolean),
  history:(a,b)=>git('rev-list','--first-parent','--reverse',`${a}..${b}`).split('\n').filter(Boolean)}),data)
}finally{rmSync(cwd,{recursive:true,force:true})}

const {publicationCodeEpoch}=await import('./publication-code-epoch.mjs')
const history=(...args)=>args[0]==='rev-list'?'data2\ncode1\ndata0':args.at(-1)==='data2'?'src/data/a.json':'src/pages/App.jsx'
assert.equal(publicationCodeEpoch('old','head',history,['src/data/a.json']),'code1')
const dataOnly=(...args)=>args[0]==='rev-list'?'data2\ndata1':'src/data/a.json'
assert.equal(publicationCodeEpoch('old','head',dataOnly,['src/data/a.json']),'old')
