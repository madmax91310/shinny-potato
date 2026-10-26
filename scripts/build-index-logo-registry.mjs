import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { SHEETS } from '../src/pages/factsheet-tweets/data.js'
import { getIndexConcentration } from '../src/data/index-company-compositions.js'
import { sortedRows } from '../src/pages/factsheet-tweets/editorial.js'
const read = path => JSON.parse(readFileSync(path, 'utf8'))
const flagSources = read('public/asset-art/index-flags/sources.json')
for (const [code, record] of Object.entries(flagSources)) assert.equal(createHash('sha256').update(readFileSync(`public/asset-art/index-flags/${code}.svg`)).digest('hex'), record.sha256, `Unverified flag ${code}`)
readFileSync('public/asset-art/index-flags/LICENSE')
const aliases = read('src/pages/factsheet-tweets/companyLogoAliases.json')
const existing = read('public/asset-art/official-logos/sources.json')
const added = read('public/asset-art/index-logos/sources.json')
const byName = new Map(), bySecurity = {}, bySheet = {}, companies = {}
for (const [id, record] of Object.entries(aliases)) for (const name of record.aliases) {
  assert(!byName.has(name), `Duplicate reviewed alias ${name}`); byName.set(name, id)
}
const archived = process.argv.includes('--check') ? read('reports/index-relief/logo-coverage.json') : null
const uses = []
for (const sheet of SHEETS) {
  const composition = getIndexConcentration(sheet.id)
  const entries = archived ? archived.uses.filter(row => row.sheet === sheet.id) : [
    ...sortedRows(sheet.holdings).slice(0, 4).map(([name]) => ({name, mode:'main', evidence: sheet.source})),
    ...(composition.available ? composition.top.map(row => ({...row, mode:'top10', evidence: [{url:composition.sourceUrl, label:composition.sourceLabel}], asOf:composition.asOf})) : []),
  ]
  bySheet[sheet.id] = {}
  for (const row of entries) {
    const id = byName.get(row.name)
    assert(id, `Alias to review: ${sheet.id} / ${row.name}`)
    const source = added[id] ?? existing[id]
    if (!companies[id]) companies[id] = { id, aliases: aliases[id].aliases, securities: [], file: source?.file ?? null,
      provenance: source ? { page: source.page, source: source.source, sha256: source.sha256 } : null,
      status: added[id] ? 'added' : existing[id] ? 'present' : 'initials' }
    bySheet[sheet.id][row.name] = id
    for (const security of row.securities ?? []) {
      assert(!bySecurity[security] || bySecurity[security] === id, `Conflicting security ${security}`)
      bySecurity[security] = id
      if (!companies[id].securities.includes(security)) companies[id].securities.push(security)
    }
    uses.push({sheet:sheet.id, mode:row.mode, name:row.name, company:id, securities:row.securities ?? [], evidence:row.evidence, asOf:row.asOf ?? sheet.indexFacts?.asOf ?? sheet.snapshot})
  }
}
for (const company of Object.values(companies)) if (company.file) {
  const bytes = readFileSync(`public/asset-art/${company.file}`)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), company.provenance.sha256, `Unverified logo ${company.id}`)
  assert(company.provenance.source?.startsWith('https://'))
}
const runtime = {bySheet, bySecurity, companies:Object.fromEntries(Object.values(companies).map(c=>[c.id,{file:c.file, support:(added[c.id] ?? existing[c.id])?.support ?? 'light'}]))}
const output = JSON.stringify(runtime)+'\n', path = 'src/pages/factsheet-tweets/companyLogoRegistry.json'
if (process.argv.includes('--check')) assert.equal(readFileSync(path,'utf8'), output, 'Regenerate index logo registry')
else {
  writeFileSync(path, output)
  mkdirSync('reports/index-relief',{recursive:true})
  const counts = Object.fromEntries(['present','added','initials'].map(status=>[status,Object.values(companies).filter(c=>c.status===status).length]))
  writeFileSync('reports/index-relief/logo-coverage.json', JSON.stringify({sheets:SHEETS.length,top10:SHEETS.filter(s=>getIndexConcentration(s.id).available).length,counts,companies:Object.values(companies),uses},null,2)+'\n')
  writeFileSync('reports/index-relief/logo-coverage.csv','company,status,file,securities\n'+Object.values(companies).map(c=>[c.id,c.status,c.file??'',c.securities.join('|')].join(',')).join('\n')+'\n')
}
console.log(`Index logos: ${Object.keys(companies).length} companies / ${uses.length} appearances; ${Object.values(companies).filter(c=>c.file).length} local logos`)
