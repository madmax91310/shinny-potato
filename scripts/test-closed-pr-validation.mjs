import assert from'node:assert/strict'
import{retiredRuns}from'./cancel-closed-pr-validation.mjs'
const repo='owner/repo',pr={number:9,state:'closed',head:{sha:'head',ref:'feature',repo:{full_name:repo}}}
const run={id:42,event:'pull_request',path:'.github/workflows/deploy-pages.yml',head_sha:'head',head_branch:'feature',head_repository:{full_name:repo},pull_requests:[{number:9}],status:'in_progress'}
assert.deepEqual(retiredRuns([run],pr,repo),[42])
for(const change of [{event:'push'},{head_branch:'master'},{head_sha:'other'},{pull_requests:[]},{pull_requests:[{number:10}]},{status:'completed'},{head_repository:{full_name:'fork/repo'}},{path:'.github/workflows/collect.yml'}])assert.deepEqual(retiredRuns([{...run,...change}],pr,repo),[])
assert.deepEqual(retiredRuns([run],{...pr,state:'open'},repo),[])
assert.deepEqual(retiredRuns([{...run,pull_requests:[]}],pr,repo,[]),[42])
assert.deepEqual(retiredRuns([{...run,pull_requests:[]}],pr,repo,[{state:'open',head:pr.head}]),[])
console.log('Closed PR cleanup cannot cancel master, publications, forks, other PRs, collectors or completed runs.')
