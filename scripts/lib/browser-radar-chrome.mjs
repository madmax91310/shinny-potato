import {RADAR_POLICY_VERSION} from '../../src/lib/radar-overview.js'
import assert from 'node:assert/strict'

// Navigation data is not an export resource. Stub exactly this GET/fetch API
// so real export tests retain their strict same-origin asset checks and never
// contact the live editorial service or rely on its current publications.
const url='https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/summary.json'
export const isRadarChromeRequest=request=>request.url()===url&&request.method()==='GET'&&request.resourceType()==='fetch'
export async function mockRadarChrome(pageOrContext) {
  await pageOrContext.route(url,route=>{
    assert.ok(isRadarChromeRequest(route.request()),'Only the navigation JSON fetch is mocked; images/scripts are export resources')
    return route.fulfill({contentType:'application/json',body:JSON.stringify({schemaVersion:1,policyVersion:RADAR_POLICY_VERSION,checkedAt:new Date().toISOString(),groups:[],selection:[]})})
  })
}
