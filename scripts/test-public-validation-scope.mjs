import assert from 'node:assert/strict'
import {requiresPublicValidation} from './public-validation-scope.mjs'
const base='a'.repeat(40),options={event:'pull_request',base}
const diff=paths=>(...args)=>{assert.deepEqual(args,['diff','--name-only','-z',base,'HEAD','--']);return paths.join('\0')+'\0'}
assert.equal(requiresPublicValidation(options,diff(['services/tweet-bank-private/worker/index.js'])),false)
assert.equal(requiresPublicValidation(options,diff(['services/tweet-bank-private/tests/browser.mjs','.github/workflows/test-tweet-bank-private.yml'])),false)
for(const path of ['src/App.jsx','package-lock.json','scripts/build-tweet-bank-catalog.mjs','.github/workflows/deploy-pages.yml','public/data/anything.json','docs/claude/audit-application-2026-10-18.md','services/tweet-bank-private-unsafe/index.js'])assert(requiresPublicValidation(options,diff(['services/tweet-bank-private/README.md',path])),path)
assert(requiresPublicValidation(options,diff([])))
assert(requiresPublicValidation({...options,base:undefined},()=>{throw Error('must not query an unknown base')}))
assert(requiresPublicValidation(options,()=>{throw Error('missing history')}))
for(const event of ['push','workflow_call','workflow_dispatch'])assert(requiresPublicValidation({...options,event},()=>{throw Error('production must never skip based on paths')}))
console.log('Public validation selection: exact private namespace only, mixed/source/dependency/workflow/data changes and all uncertain/production cases keep full validation.')
