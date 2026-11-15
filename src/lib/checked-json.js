// Bounded UTF-8 JSON transport verification shared by monitor formats.
export const record = value => value && typeof value === 'object' && !Array.isArray(value)
export const keys = (value, names) => record(value) && Object.keys(value).length === names.length && names.every(key => Object.hasOwn(value,key))
export async function checkedJSON(bytes, sha) {
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), b=>b.toString(16).padStart(2,'0')).join('')
  if (hash !== sha) throw Error()
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))
}
export async function inflate({data,decodedBytes,sha256}, limit) {
  if (!Number.isSafeInteger(decodedBytes) || decodedBytes <= 0 || decodedBytes > limit || !/^[a-f0-9]{64}$/.test(sha256) || typeof data !== 'string' || !data || data.length > limit * 2) throw Error()
  const binary = atob(data)
  if (btoa(binary) !== data) throw Error()
  let size = 0
  const stream = new Blob([Uint8Array.from(binary,c=>c.charCodeAt(0))]).stream()
    .pipeThrough(new DecompressionStream('gzip'))
    .pipeThrough(new TransformStream({transform(chunk,controller) {
      size += chunk.byteLength
      if (size > decodedBytes) throw Error()
      controller.enqueue(chunk)
    }}))
  const raw = new Uint8Array(await new Response(stream).arrayBuffer())
  if (raw.byteLength !== decodedBytes) throw Error()
  return checkedJSON(raw,sha256)
}
