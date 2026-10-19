import {execFileSync} from 'node:child_process'
import {mkdirSync,writeFileSync} from 'node:fs'
import assert from 'node:assert/strict'
import {exposureGroup} from '../src/data/asset-labels.js'
const cases=[['EURO STOXX 50 Index','Europe'],['S&P 500 Index','États-Unis'],['MSCI Total Return Net World Index','Monde'],['MSCI India Index','Émergents']]
for(const [benchmark,expected]of cases)assert.equal(exposureGroup({benchmark}),expected)
execFileSync('npm',['run','build'],{stdio:'inherit'})
execFileSync('node',['scripts/test-etf-themes-coverage.mjs'],{stdio:'inherit'})
execFileSync('node',['scripts/playwright-metadata-connections.mjs'],{stdio:'inherit'})
mkdirSync('test-artifacts/metadata-connections',{recursive:true})
writeFileSync('test-artifacts/metadata-connections/classification-validation.json',JSON.stringify({cases,passed:true,methods:['exact benchmark family assertions','theme coverage','real ETF sheets and comparison on mobile and desktop']},null,2))
