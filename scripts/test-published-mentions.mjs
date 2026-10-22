import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {mentionsInChunks,publishedMentions,isinsIn} from './compose-fallback-snapshot.mjs'

const text='start known-key known-key-long prefix.only suffix-key. etfIE00B4L5Y983 XIE000U9ODG19Z é:actif/漢 nested/path/asset end'
const ids=['start','end','known-key','known','key','known-key-long','only','prefix.only','suffix-key','IE00B4L5Y983','IE000U9ODG19','é:actif/漢','actif/漢','nested/path','path/asset','absent']
const tokens=new Set(text.split(/[^A-Za-z0-9_.-]+/));for(const isin of isinsIn(text))tokens.add(isin)
const expected=ids.filter(id=>/^[A-Za-z0-9_.-]+$/.test(id)?tokens.has(id):text.includes(id)).sort()
// One-character chunks, every boundary offset and overlapping complex identifiers.
for(let width=1;width<=text.length+2;width++){
 const chunks=[];for(let i=0;i<text.length;i+=width)chunks.push(text.slice(i,i+width))
 assert.deepEqual([...mentionsInChunks(chunks,ids)].sort(),expected,'Chunk width '+width)
}
assert.deepEqual([...mentionsInChunks([],['absent'])],[])
assert.deepEqual([...mentionsInChunks([],[''])],[''])

// Exceed V8's single-string limit under a small heap, without a giant fixture.
// A missing identifier forces the entire stream to be checked.
const stress=`
 import assert from 'node:assert/strict';
 import {mentionsInChunks} from ${JSON.stringify(new URL('./compose-fallback-snapshot.mjs',import.meta.url).href)};
 const block=' '.repeat(1024*1024);
 function* chunks(){for(let i=0;i<600;i++)yield block;yield ' last-token'}
 assert.deepEqual([...mentionsInChunks(chunks(),['last-token',...Array.from({length:600},(_,i)=>'never:present/'+i)])],['last-token']);
 console.log('600 MiB inspected with a 96 MiB heap.');
`
const result=execFileSync(process.execPath,['--max-old-space-size=96','--input-type=module','-e',stress],{encoding:'utf8',timeout:60000})
assert.match(result,/600 MiB/)

const cwd=mkdtempSync(path.join(tmpdir(),'mentions-proof-'))
try{
 const git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim()
 git('init','-q');git('config','user.name','Test');git('config','user.email','test@example.com')
 // Split a multibyte character across the real one-MiB file-read boundary.
 writeFileSync(path.join(cwd,'proof.txt'),Buffer.concat([Buffer.alloc(1024*1024-1,32),Buffer.from('é:actif/漢 etfIE00B4L5Y983 known-key')]))
 git('add','.');git('commit','-qm','Validated published identifiers');const code=git('rev-parse','HEAD')
 writeFileSync(path.join(cwd,'proof.txt'),'working-tree-only')
 const queries=['é:actif/漢','etfIE00B4L5Y983','known-key','key','working-tree-only','unknown']
 const known=publishedMentions(code,cwd,queries)
 assert.deepEqual(queries.filter(known),queries.slice(0,3),'Only committed identifiers, with original matching conventions')
 assert(publishedMentions(code,cwd)('known-key'),'Two-argument API remains available')
}finally{rmSync(cwd,{recursive:true,force:true})}
console.log('Published identifiers: token/ISIN/substring boundaries, UTF-8, immutable Git proof and bounded 600-MiB scan validated.')
