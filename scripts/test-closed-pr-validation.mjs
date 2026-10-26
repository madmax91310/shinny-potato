import{readFileSync}from'node:fs'
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

const deploy=readFileSync(new URL('../.github/workflows/deploy-pages.yml',import.meta.url),'utf8')
assert.match(deploy,/group: pages-validation-v4-.*github\.ref/)
for(const name of ['deploy','deploy-fallback']){
 const publication=deploy.split('\n  '+name+':\n')[1]?.split(/\n  [a-z][a-z0-9-]*:\n/)[0]
 assert(publication,`${name}: publication lane remains declared`)
 assert.match(publication,/group: pages-production\s+cancel-in-progress: false/,`${name}: old and new gate generations must share the same uncancellable publication lock`)
}
assert.match(deploy,/cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/,'Only superseded PR validations may be cancelled; production validations remain serialized')
assert.match(deploy,/queue: \$\{\{ github\.event_name == 'pull_request' && 'single' \|\| 'max' \}\}/,'PR replacement requires the single pending queue; production retains the max queue')
const monthly=readFileSync(new URL('../.github/workflows/update-market-monthly.yml',import.meta.url),'utf8')
assert.match(monthly,/group: active-market-data-.*github\.event_name == 'pull_request'.*github\.ref.*\|\| 'production'/,'PR checks must never share the production writer group')
assert.match(monthly,/cancel-in-progress: false\s+queue: max/,'Preserve the existing monthly producer queue; changing an unrelated workflow also prevents queued old gates adopting current code')
