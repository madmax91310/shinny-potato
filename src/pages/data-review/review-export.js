// Keep the existing JSON schema and every proof. Serialize one row/scope at a
// time: the full monitor must never become a single, multi-hundred-MB JS string.
export function* reviewExportChunks(document) {
  yield '{\n'
  let first = true
  for (const [key, value] of Object.entries(document)) {
    if (value === undefined) continue
    if (!first) yield ',\n'
    first = false
    yield JSON.stringify(key) + ': '
    if (Array.isArray(value)) {
      yield '[\n'
      for (let i = 0; i < value.length; i++) {
        if (i) yield ',\n'
        yield JSON.stringify(value[i], null, 2) ?? 'null'
      }
      yield '\n]'
    } else if (value && Object.getPrototypeOf(value) === Object.prototype) {
      yield '{\n'
      let firstEntry = true
      for (const [name, entry] of Object.entries(value)) {
        const serialized = JSON.stringify(entry, null, 2)
        if (serialized === undefined) continue
        if (!firstEntry) yield ',\n'
        firstEntry = false
        yield JSON.stringify(name) + ': ' + serialized
      }
      yield '\n}'
    } else {
      yield JSON.stringify(value)
    }
  }
  yield '\n}\n'
}

export async function reviewExportBlob(document) {
  const iterator = reviewExportChunks(document)
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    pull(controller) {
      try {
        const next = iterator.next()
        if (next.done) controller.close()
        else controller.enqueue(encoder.encode(next.value))
      } catch (error) { controller.error(error) }
    },
    cancel() { iterator.return() },
  })
  return new Response(stream, {headers: {'Content-Type': 'application/json'}}).blob()
}
