import assert from 'node:assert/strict'
import { downloadPublicationBlob } from '../src/design-system/downloadBlob.js'
import { downloadImage } from '../src/design-system/downloadImage.js'

const original = { window: globalThis.window, document: globalThis.document, timeout: globalThis.setTimeout, create: URL.createObjectURL, revoke: URL.revokeObjectURL }
try {
  for (const stage of ['', 'create-url', 'create-link', 'href', 'filename', 'append', 'click', 'notify', 'remove']) {
    const failure = Error(stage), urls = [], revoked = [], timers = [], links = [], events = []
    const fail = name => { if (stage === name) throw failure }
    URL.createObjectURL = blob => { fail('create-url'); assert.equal(blob.type, 'application/json'); urls.push('blob:export'); return urls.at(-1) }
    URL.revokeObjectURL = url => revoked.push(url)
    globalThis.setTimeout = (fn, delay) => { timers.push({ fn, delay }) }
    globalThis.window = { dispatchEvent(event) { fail('notify'); events.push(event.detail) } }
    globalThis.document = {
      createElement(tag) {
        assert.equal(tag, 'a'); fail('create-link')
        const link = { dataset: {}, set href(value) { fail('href'); this.url = value }, set download(value) { fail('filename'); this.filename = value },
          click() { fail('click'); this.clicked = true }, remove() { fail('remove'); this.attached = false } }
        links.push(link); return link
      },
      body: { append(link) { link.attached = true; fail('append') } },
    }
    const action = () => downloadPublicationBlob(new Blob(['{"kept":true}'], { type: 'application/json' }), 'unchanged.json')
    if (stage) assert.throws(action, error => error === failure)
    else {
      action()
      assert.equal(links[0].filename, 'unchanged.json'); assert.equal(links[0].url, 'blob:export')
      assert(links[0].clicked); assert.equal(links[0].dataset.publicationDownload, 'handled')
      assert.deepEqual(events, [{ message: 'Téléchargement lancé.', kind: 'success' }])
    }
    assert.equal(timers.length, stage === 'create-url' ? 0 : 1)
    assert.deepEqual(revoked, [], 'the transfer window is retained')
    if (links.length && stage !== 'remove') assert.equal(links[0].attached, false)
    for (const timer of timers) { assert.equal(timer.delay, 1000); timer.fn() }
    assert.deepEqual(revoked, urls, 'every acquired URL is released, even if cleanup throws')
  }
  // The data-URL mobile path keeps its distinct 60s lifetime and original PNG bytes.
  let blob, filename, removed = false, clicked = false, timer
  URL.createObjectURL = value => { blob = value; return 'blob:mobile' }
  URL.revokeObjectURL = value => assert.equal(value, 'blob:mobile')
  globalThis.window = { dispatchEvent() {} }
  globalThis.document = { createElement: () => ({ dataset: {}, set download(value) { filename = value }, click() { clicked = true }, remove() { removed = true } }), body: { append() {} } }
  globalThis.setTimeout = (fn, delay) => { timer = { fn, delay } }
  downloadImage('data:image/png;base64,AQID', 'mobile.png')
  assert.equal(blob.type, 'image/png'); assert.deepEqual([...new Uint8Array(await blob.arrayBuffer())], [1, 2, 3])
  assert.equal(filename, 'mobile.png'); assert(clicked && removed); assert.equal(timer.delay, 60000); timer.fn()
} finally {
  URL.createObjectURL = original.create; URL.revokeObjectURL = original.revoke
  globalThis.setTimeout = original.timeout
  for (const key of ['window', 'document']) { if (original[key] === undefined) delete globalThis[key]; else globalThis[key] = original[key] }
}
console.log('Export resources: URL/link acquisition, setup/append/click/notification/cleanup failures, unchanged MIME/name/bytes, 1s and 60s transfer windows OK.')
