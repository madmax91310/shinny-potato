import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { compose, fallbackFiles } from './compose-fallback-snapshot.mjs'

assert.deepEqual(fallbackFiles(['src/data/a.json', 'src/app.js', 'public/data/x/1.json'], ['src/data/a.json', 'public/data/x']), ['src/data/a.json', 'public/data/x/1.json'])

const dir = mkdtempSync(path.join(tmpdir(), 'fallback-'))
try {
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim()
  const write = (file, text) => { mkdirSync(path.dirname(path.join(dir, file)), { recursive: true }); writeFileSync(path.join(dir, file), text) }
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't')
  write('app.js', 'good code'); write('data/prices.json', '{"v":1}'); write('data/other.json', '{"o":1}')
  git('add', '.'); git('commit', '-qm', 'published')
  const published = git('rev-parse', 'HEAD')
  write('app.js', 'broken code'); write('data/prices.json', '{"v":2}'); write('data/new.json', '{"n":1}')
  git('add', '.'); git('commit', '-qm', 'code change + fresh data')
  const head = git('rev-parse', 'HEAD')
  const result = compose({ published, data: head, cwd: dir, allowed: ['data/prices.json', 'data/new.json'] })
  assert.equal(result.codeSha, published); assert.equal(result.dataSha, head)
  assert.equal(readFileSync(path.join(dir, 'app.js'), 'utf8'), 'good code', 'published code is kept')
  assert.equal(readFileSync(path.join(dir, 'data/prices.json'), 'utf8'), '{"v":2}', 'fresh automation data is overlaid')
  assert(existsSync(path.join(dir, 'data/new.json')))
  assert.equal(readFileSync(path.join(dir, 'data/other.json'), 'utf8'), '{"o":1}')
  // Unrelated history never composes.
  git('checkout', '-q', '--orphan', 'other'); git('rm', '-rqf', '.'); write('x', '1'); git('add', '.'); git('commit', '-qm', 'x')
  assert.throws(() => compose({ published: git('rev-parse', 'HEAD'), data: head, cwd: dir, allowed: [] }))
} finally { rmSync(dir, { recursive: true, force: true }) }
console.log('Fallback snapshot: published code + fresh automation data composed; unrelated history refused.')
