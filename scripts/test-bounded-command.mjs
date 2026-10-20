import assert from 'node:assert/strict'
import {runBounded} from './lib/bounded-command.mjs'
const success=await runBounded(`node -e "console.log('ready')"`,{timeoutMs:3000})
assert.equal(success.status,0);assert.match(success.stdout,/ready/)
const failure=await runBounded(`node -e "process.exit(7)"`)
assert.equal(failure.status,7)
const start=Date.now()
const hung=await runBounded(`node -e "setInterval(()=>{},1000)"`,{timeoutMs:100})
assert.equal(hung.status,1);assert.match(hung.error,/exceeded/);assert.ok(Date.now()-start<3000)
console.log('Browser subprocess success, failure and bounded termination validated.')
