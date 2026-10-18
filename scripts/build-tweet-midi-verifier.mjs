import { spawnSync } from 'node:child_process'

// Package the exact inputs once. All shards use the same data and reference date,
// including when queued jobs start on opposite sides of midnight.
const referenceDate = new Date().toISOString()
// Initialize TODAY before loading the engine that enumerates the pool. This
// affects only the bundled test program, never the application source.
const entry = `import { TODAY } from './src/pages/tweet-midi/constants.js';
TODAY.setTime(Date.parse(${JSON.stringify(referenceDate)}));
await import('./scripts/verify-tweet-midi.mjs');`
const result = spawnSync('npx', ['esbuild', '--bundle', '--format=esm', '--platform=node',
  '--sourcefile=tweet-midi-verifier-entry.mjs', '--outfile=test-artifacts/tweet-midi-verifier.mjs'],
{ input: entry, stdio: ['pipe', 'inherit', 'inherit'] })
if (result.error) throw result.error
if (result.status !== 0) throw new Error(`Verifier bundle failed: ${result.status ?? result.signal}`)
console.log(`Tweet Midi verifier: data bundled; reference date ${referenceDate}.`)
