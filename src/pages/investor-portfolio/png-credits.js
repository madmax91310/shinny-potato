// UTF-8 provenance travels with a standalone PNG as an iTXt chunk, without
// adding technical lines to the poster. Canvas pixels remain unchanged.
export function pngCredits(url,metadata) {
  const input=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0))
  const content=new TextEncoder().encode('Description\0\0\0\0\0'+JSON.stringify(metadata))
  const chunk=new Uint8Array(content.length+12),view=new DataView(chunk.buffer)
  view.setUint32(0,content.length);chunk.set([105,84,88,116],4);chunk.set(content,8)
  let crc=0xffffffff
  for(const byte of chunk.subarray(4,-4)){crc^=byte;for(let i=0;i<8;i++)crc=crc&1?(crc>>>1)^0xedb88320:crc>>>1}
  view.setUint32(chunk.length-4,(crc^0xffffffff)>>>0)
  const bytes=new Uint8Array(input.length+chunk.length)
  bytes.set(input.subarray(0,-12));bytes.set(chunk,input.length-12);bytes.set(input.subarray(-12),input.length-12+chunk.length)
  const parts=[];for(let i=0;i<bytes.length;i+=32768)parts.push(String.fromCharCode(...bytes.subarray(i,i+32768)))
  return 'data:image/png;base64,'+btoa(parts.join(''))
}
