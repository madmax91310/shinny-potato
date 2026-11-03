import assert from 'node:assert/strict'
import {mkdtemp,mkdir,copyFile,writeFile,readFile,rm,access} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {spawnSync} from 'node:child_process'
const directory=await mkdtemp(join(tmpdir(),'browser-runner-'))
try{
 await mkdir(join(directory,'lib'))
 for(const file of ['run-browser-checks.mjs','browser-shards.mjs','browser-check-error.mjs','lib/bounded-command.mjs'])await copyFile(new URL(file,import.meta.url),join(directory,file))
 const fail='node -e "process.exit(7)"',later='node -e "require(\'fs\').writeFileSync(\'unexpected\',\'ran\')"'
 await writeFile(join(directory,'ci-browser-checks.json'),JSON.stringify([fail,later]))
 await writeFile(join(directory,'ci-browser-durations.json'),JSON.stringify({seconds:{[fail]:2,[later]:1}}))
 const run=(...args)=>spawnSync(process.execPath,[join(directory,'run-browser-checks.mjs'),...args],{cwd:directory,encoding:'utf8',timeout:10000})
 const failed=run('0','1');assert.equal(failed.status,7,failed.stderr)
 const result=JSON.parse(await readFile(join(directory,'test-artifacts/browser-durations-0.json')))
 assert.deepEqual(result.checks.map(c=>[c.command,c.status]),[[fail,7]],'incomplete run remains failed and reports the exact failed command')
 await assert.rejects(access(join(directory,'unexpected')))
 assert.notEqual(run('1','1').status,0,'invalid shard cannot pass')
 const success='node -e "console.log(\'ok\')"'
 await writeFile(join(directory,'ci-browser-checks.json'),JSON.stringify([success]))
 const completed=run('0','1');assert.equal(completed.status,0,completed.stderr)
 assert.equal(JSON.parse(await readFile(join(directory,'test-artifacts/browser-durations-0.json'))).checks[0].status,0)
 console.log('Browser runner: clean output directory, exact failure status/receipt, incomplete suite cannot pass, invalid partition and success verified.')
}finally{await rm(directory,{recursive:true,force:true})}
