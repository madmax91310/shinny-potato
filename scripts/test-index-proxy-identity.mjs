import assert from 'node:assert/strict'
import {qualifyPhysicalProxyIdentity}from '../src/data/index-concentration-core.js'
const p={observedBenchmark:'Exact Index Net'},o={index:'Exact Index Net',productStructure:'Physical',replicationMethod:'Optimised',replicationMethodRaw:{productStructure:'Physical',fundMethodologyTypeCode:'Optimised'}}
assert.deepEqual(qualifyPhysicalProxyIdentity(o,p),{structure:'Physical',methodology:'Optimised'})
assert.equal(qualifyPhysicalProxyIdentity({...o,replicationMethod:'Replicated'},p).structure,'Physical')
for(const bad of [{...o,index:'Other Index Net'},{...o,productStructure:'Synthetic',replicationMethod:'Physical'},{...o,productStructure:null,replicationMethodRaw:{},replicationMethod:'Optimised'}])assert.throws(()=>qualifyPhysicalProxyIdentity(bad,p))
console.log('Exact benchmark, explicit physical structure, separate methodology; synthetic and unknown refused. No official-index certification inferred.')
