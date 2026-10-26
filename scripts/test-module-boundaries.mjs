import assert from 'node:assert/strict'
import { inspectModule, boundaryErrors } from './audit-module-boundaries.mjs'
const source = `// import './fake.js'
const text = "export * from './also-fake.js'";
import data from './data.js' with { type: 'json' };
export { x } from './model.js';
export * from './compat.js';
const lazy = () => import('./lazy.jsx');
const template = () => import(\`./literal.js\`);
const computed = path => import(path);
<div title="import('./jsx-fake.js')"/>;
`
const parsed = inspectModule(source, 'fixture.jsx')
assert.deepEqual(parsed.imports.map(edge => edge.specifier), ['./data.js', './model.js', './compat.js', './lazy.jsx', './literal.js'])
assert.deepEqual(parsed.imports.map(edge => edge.dynamic), [false, false, false, true, true])
assert.equal(parsed.computedImports.length, 1)
assert.throws(() => inspectModule('export {', 'broken.js'), /Cannot parse/)
const module = targets => ({ imports: [], edges: targets.map(target => ({ target, dynamic: false })), browserAccess: [] })
const graph = { 'src/lib/model.js': module(['src/data/record.js']), 'src/data/record.js': module([]) }
assert.deepEqual(boundaryErrors(graph, ['src/lib/model.js']), [])
graph['src/data/record.js'].edges.push({target:'src/lib/model.js', dynamic:true})
assert(boundaryErrors(graph, []).some(error => error.startsWith('Import cycle:')))
graph['src/data/record.js'].edges = [{target:'src/pages/tool/App.jsx', dynamic:true}]
graph['src/pages/tool/App.jsx'] = module([])
assert(boundaryErrors(graph, ['src/lib/model.js']).some(error => error.startsWith('Shared module imports a page:')))
assert(boundaryErrors(graph, ['src/lib/model.js']).some(error => error.startsWith('Calculation/model imports browser or UI code:')))
for (const source of ['document.createElement("canvas")', 'localStorage.getItem("key")', 'globalThis.sessionStorage.getItem("key")', 'new Image()']) {
  assert(inspectModule(source, 'browser.js').browserAccess.length, source)
}
const react = inspectModule("import {useState} from 'react'", 'react.js')
assert(boundaryErrors({'src/lib/model.js':{...react,edges:[]}}, ['src/lib/model.js']).length)
assert.equal(inspectModule('const document = "label"; const data = {document: 1}', 'plain.js').browserAccess.length, 0)
console.log('Architecture guard: real imports/re-exports, JSX, deferred/computed imports, cycles, inverted dependencies and transitive UI access verified.')
