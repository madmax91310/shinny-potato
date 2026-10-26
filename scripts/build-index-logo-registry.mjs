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
const reportDir = 'reports/index-logo-completion'
const baseline = read(`${reportDir}/before.json`)
const knownSecurities = new Map()
for (const [id, record] of Object.entries(aliases)) for (const isin of record.securities ?? []) {
  assert(!knownSecurities.has(isin) || knownSecurities.get(isin) === id, `Conflicting reviewed security ${isin}`)
  knownSecurities.set(isin, id)
}
const archived = process.argv.includes('--check') ? read(`${reportDir}/logo-coverage.json`) : null
const uses = []
for (const sheet of SHEETS) {
  const composition = getIndexConcentration(sheet.id)
  const entries = archived ? archived.uses.filter(row => row.sheet === sheet.id) : [
    ...sortedRows(sheet.holdings).slice(0, 4).map(([name]) => ({name, mode:'main', evidence: sheet.source})),
    ...(composition.available ? composition.top.map(row => ({...row, mode:'top10', evidence: [{url:composition.sourceUrl, label:composition.sourceLabel}], asOf:composition.asOf})) : []),
  ]
  bySheet[sheet.id] = {}
  for (const row of entries) {
    const securityIds = [...new Set((row.securities ?? []).map(isin => knownSecurities.get(isin)))]
    const securityId = securityIds.length === 1 && securityIds[0] ? securityIds[0] : null
    const nameId = byName.get(row.name)
    assert(!securityId || !nameId || securityId === nameId, `Name/security conflict: ${row.name}`)
    const id = row.securities?.length ? securityId : nameId
    assert(id, `Alias to review: ${sheet.id} / ${row.name}`)
    const source = added[id] ?? existing[id]
    if (!companies[id]) companies[id] = { id, aliases: aliases[id].aliases, securities: [], file: source?.file ?? null,
      provenance: source ? { page: source.page, source: source.source, sha256: source.sha256 } : null,
      status: source ? (baseline.companies.some(c => c.id === id && c.file) ? 'present' : 'added') : 'initials' }
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
  if (company.file.endsWith('.svg')) {
    const svg = bytes.toString('utf8')
    assert(!/<(?:script|foreignObject)\b/i.test(svg), `Active SVG ${company.id}`)
    for (const match of svg.matchAll(/(?:xlink:)?href=["']([^"']+)/g)) {
      assert(match[1].startsWith('#') || match[1].startsWith('data:image/'), `External SVG dependency ${company.id}`)
    }
  }
}
const runtime = {bySheet, bySecurity, companies:Object.fromEntries(Object.values(companies).map(c=>[c.id,{file:c.file, support:(added[c.id] ?? existing[c.id])?.support ?? 'light'}]))}
const output = JSON.stringify(runtime)+'\n', path = 'src/pages/factsheet-tweets/companyLogoRegistry.json'
if (process.argv.includes('--check')) assert.equal(readFileSync(path,'utf8'), output, 'Regenerate index logo registry')
else {
  writeFileSync(path, output)
  mkdirSync(reportDir,{recursive:true})
  const counts = Object.fromEntries(['present','added','initials'].map(status=>[status,Object.values(companies).filter(c=>c.status===status).length]))
  writeFileSync(`${reportDir}/logo-coverage.json`, JSON.stringify({sheets:SHEETS.length,top10:SHEETS.filter(s=>getIndexConcentration(s.id).available).length,counts,companies:Object.values(companies),uses},null,2)+'\n')
  writeFileSync(`${reportDir}/logo-coverage.csv`,'company,status,file,securities\n'+Object.values(companies).map(c=>[c.id,c.status,c.file??'',c.securities.join('|')].join(',')).join('\n')+'\n')
}
console.log(`Index logos: ${Object.keys(companies).length} companies / ${uses.length} appearances; ${Object.values(companies).filter(c=>c.file).length} local logos`)
