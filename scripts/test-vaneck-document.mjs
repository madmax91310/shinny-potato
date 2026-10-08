import assert from 'node:assert/strict';
import { officialDocument, regionalGate, requestDocument } from './vaneck-document.mjs';
const original = officialDocument('https://www.vaneck.com/ucits/library/fact-sheets/gdig-fact-sheet.pdf');
const regional = 'https://www.vaneck.com/nl/en/library/fact-sheets/gdig-fact-sheet.pdf';
assert.equal(officialDocument(regional+'?cken=true', 'gdig-fact-sheet.pdf').search, '?cken=true');
for (const query of ['?cken=false','?cken=true&redirect=https://evil.test','?returnUrl=https://evil.test']) assert.throws(()=>officialDocument(regional+query));
for (const target of [regional, encodeURIComponent(regional), '/nl/en/library/fact-sheets/gdig-fact-sheet.pdf']) {
  const gate = regionalGate(`https://www.vaneck.com/nl/en/?returnUrl=${encodeURIComponent(target)}`, original);
  assert.equal(gate.document, regional);
  assert.equal(new URL(gate.landing).searchParams.get('returnUrl'), new URL(regional).pathname);
}
for (const target of ['https://evil.test/nl/en/library/fact-sheets/gdig-fact-sheet.pdf', regional.replace('gdig', 'espo'), regional.replace('/nl/', '/fr/'), 'https://user@www.vaneck.com/nl/en/library/fact-sheets/gdig-fact-sheet.pdf']) {
  assert.throws(() => regionalGate(`https://www.vaneck.com/nl/en/?returnUrl=${encodeURIComponent(target)}`, original));
}
const pdf = Buffer.from('%PDF-test');
const response = (status, body=pdf, location) => ({status:()=>status, ok:()=>status===200, headers:()=>({location}), body:async()=>body});
function mock(responses) {
  const calls=[];
  return {calls, get:async(url, options)=>{calls.push({url,options}); const next=responses.shift(); if(next instanceof Error) throw next; assert(next, 'unexpected request'); return next;}};
}
let request=mock([response(302, null, '/nl/en/library/fact-sheets/gdig-fact-sheet.pdf'),response(200)]);
assert.deepEqual((await requestDocument(request,original.href,original,{})).body,pdf);
assert.equal(request.calls[1].url,regional);
assert(request.calls.every(c=>c.options.maxRedirects===0));
request=mock([response(302,null,`/nl/en/?returnUrl=${encodeURIComponent(encodeURIComponent(regional))}`)]);
assert.equal((await requestDocument(request,original.href,original,{})).gate.document,regional);
request=mock([response(302,null,regional+'?cken=true'),response(302,null,`/nl/en/?returnUrl=${encodeURIComponent(encodeURIComponent(regional))}`)]);
assert.equal((await requestDocument(request,original.href,original,{})).gate.document,regional);
assert.equal(request.calls[1].url, regional+'?cken=true');
for(const status of [404,403,503]) {
  request=mock([response(status),response(status)]);
  await assert.rejects(requestDocument(request,original.href,original,{}), new RegExp(String(status)));
  assert.equal(request.calls.length,status===503 ? 2 : 1);
}
request=mock([response(503),response(200)]);
assert.deepEqual((await requestDocument(request,original.href,original,{})).body,pdf);
request=mock([new Error('timeout'),response(200)]);
assert.deepEqual((await requestDocument(request,original.href,original,{})).body,pdf);
await assert.rejects(requestDocument(mock([new Error('timeout'),new Error('timeout')]),original.href,original,{}),/timeout/);
await assert.rejects(requestDocument(mock([response(302,null,original.href)]),original.href,original,{}),/loop/);
await assert.rejects(requestDocument(mock([response(302,null,'https://evil.test/doc.pdf')]),original.href,original,{}),/redirect/);
await assert.rejects(requestDocument(mock([response(200,Buffer.from('<html>gate</html>'))]),original.href,original,{}),/unavailable/);
await assert.rejects(requestDocument(mock([response(200,Buffer.alloc(8_000_001))]),original.href,original,{}),/unavailable/);
console.log('VanEck: regional URLs, double encoding, identity, redirect loop, 404, temporary outages and PDF validation passed.');
