import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { projectEditorialCalendar } from './project-editorial-calendar.mjs'
import { isDataModule } from './data-bytes-plugin.mjs'
import * as canonical from '../src/data/editorial-calendar.js'

const directory = mkdtempSync(join(tmpdir(), 'calendar-projection-'))
try {
  const filename = join(directory, 'calendar.mjs')
  const source = readFileSync(new URL('../src/data/editorial-calendar.js', import.meta.url), 'utf8')
  writeFileSync(filename, source)
  const plugin = projectEditorialCalendar({ filename })
  const result = await plugin.transform.call({ addWatchFile: file => assert.equal(file, filename) }, source, filename)
  const virtual = plugin.resolveId('\0virtual:editorial-calendar-values')
  const data = await plugin.load(virtual)
  assert.equal(isDataModule(virtual), true)
  assert.equal(isDataModule(filename), false, 'Runtime calendar code must remain budgeted')
  assert.ok(result.code.includes(source.slice(source.indexOf('export function publicationLabel'))), 'Canonical runtime function is preserved verbatim')
  writeFileSync(join(directory, 'values.mjs'), data)
  writeFileSync(join(directory, 'projected.mjs'), result.code.replace(JSON.stringify(virtual), "'./values.mjs'"))
  const projected = await import(pathToFileURL(join(directory, 'projected.mjs')))
  assert.deepEqual(projected.EDITORIAL_WEEK, canonical.EDITORIAL_WEEK)
  assert.deepEqual(projected.MIDDAY_SELECTIONS, canonical.MIDDAY_SELECTIONS)
  const paths = new Set(canonical.EDITORIAL_WEEK.flatMap(day => [...day.morning, ...day.midday, ...day.evening].map(entry => entry.path)))
  for (const path of [...paths, '/absent']) assert.equal(projected.publicationLabel(path), canonical.publicationLabel(path))
  const changed = source.replace('Ton bilan de la semaine', 'Nouveau bilan de la semaine')
  writeFileSync(filename, changed)
  await plugin.transform.call({}, changed, filename)
  assert.ok((await plugin.load(virtual)).includes('Nouveau bilan de la semaine'), 'Projection follows current authored choices')
  const { createServer } = await import('vite')
  const server = await createServer({ configFile: false, server: { middlewareMode: true, watch: null }, plugins: [projectEditorialCalendar()] })
  try {
    const actual = await server.ssrLoadModule('/src/data/editorial-calendar.js')
    assert.deepEqual(actual.EDITORIAL_WEEK, canonical.EDITORIAL_WEEK, 'Actual Vite loader accepts the projected module')
    for (const path of paths) assert.equal(actual.publicationLabel(path), canonical.publicationLabel(path))
  } finally { await server.close() }
  console.log(`Editorial calendar projection: choices, notes and labels preserved for ${paths.size} paths; runtime remains code`)
} finally { rmSync(directory, { recursive: true, force: true }) }
