import assert from 'node:assert/strict'
import { firstError } from './browser-check-error.mjs'
const log = `node:internal/modules/run_main:123\n    triggerUncaughtException(\n    ^\n\nlocator.click: Error: strict mode violation: locator('.pg-replacement summary') resolved to 2 elements:\n    at testAssetSelection (/x.mjs:1304:51)`
assert.equal(firstError(log), "locator.click: Error: strict mode violation: locator('.pg-replacement summary') resolved to 2 elements:")
assert.equal(firstError('AssertionError [ERR_ASSERTION]: 50% expected\n'), 'AssertionError [ERR_ASSERTION]: 50%25 expected')
assert.equal(firstError(''), 'Échec sans message')
assert.equal(firstError('plain last line'), 'plain last line')
console.log('Browser check error annotation: first error line extracted and escaped.')
