import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {EDITORIAL_WEEK,publicationLabel} from '../src/data/editorial-calendar.js'
import {TOOLS} from '../src/tools.js'
const labels=JSON.parse(readFileSync(new URL('../src/data/editorial-publication-labels.json',import.meta.url),'utf8'))
const seen=new Set()
for(const day of EDITORIAL_WEEK)for(const period of ['morning','midday','evening'])for(const slot of day[period]) {
  seen.add(slot.path)
  assert(Object.hasOwn(labels,slot.path))
  assert.equal(labels[slot.path],publicationLabel(slot.path),slot.path)
}
assert.equal(Object.keys(labels).length,seen.size)
for(const path of ['/idees-classements','/portefeuilles-investisseurs','/portefeuilles-publics'])assert.equal(TOOLS.find(tool=>tool.to===path).publicationDay,publicationLabel(path))
console.log(`${seen.size} libellés dérivés du calendrier canonique, notes et créneaux conservés.`)
