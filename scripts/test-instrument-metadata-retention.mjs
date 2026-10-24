import assert from 'node:assert/strict'
import {withInstrumentMetadata} from '../src/data/instrument-metadata.js'
const proof={value:'Accumulating',checkedAt:'2026-10-23',sourceUrl:'https://qualified.example/exact-share',sha256:'a'.repeat(64)}
const primary=value=>({characteristics:{distribution:value,checkedAt:'2026-10-24'},characteristicChecks:{distribution:{checkedAt:'2026-10-24',sourceUrl:'https://issuer.example/exact-share'}}})
const retained=withInstrumentMetadata('TEST',primary('N/A'),{distribution:proof})
assert.equal(retained.characteristics.distribution,'Accumulating')
assert.equal(retained.characteristicChecks.distribution.checkedAt,'2026-10-23','Unknown primary values cannot renew the last successful check')
assert.equal(retained.characteristics.checkedAt,'2026-10-24','Other characteristic checks keep their own date')
const newer=withInstrumentMetadata('TEST',primary('Distributing'),{distribution:proof})
assert.equal(newer.characteristics.distribution,'Distributing','A newer valid primary observation still wins')
const invalid=withInstrumentMetadata('TEST',primary('Distributing'),{distribution:{...proof,value:'N/A',checkedAt:'2026-10-25'}})
assert.equal(invalid.characteristics.distribution,'Distributing','A source URL and hash do not make N/A a valid distribution policy')
console.log('Qualified income policy survives newer unknown values without redating; valid primary dates and field scope remain strict.')
