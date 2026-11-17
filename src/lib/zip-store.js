// Small deterministic, uncompressed ZIP writer for browser-generated exports.
const encoder = new TextEncoder()
const table = Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0})
function crc32(bytes){let c=0xffffffff;for(const byte of bytes)c=table[(c^byte)&255]^(c>>>8);return (c^0xffffffff)>>>0}
function header(length){const bytes=new Uint8Array(length);return {bytes,view:new DataView(bytes.buffer)}}
export function zipStore(files){
  const chunks=[],central=[];let offset=0,size=0
  for(const file of files){
    const name=encoder.encode(file.name),bytes=file.bytes,crc=crc32(bytes)
    const local=header(30);local.view.setUint32(0,0x04034b50,true);local.view.setUint16(4,20,true);local.view.setUint16(6,0x800,true);local.view.setUint32(14,crc,true);local.view.setUint32(18,bytes.length,true);local.view.setUint32(22,bytes.length,true);local.view.setUint16(26,name.length,true)
    chunks.push(local.bytes,name,bytes)
    const record=header(46);record.view.setUint32(0,0x02014b50,true);record.view.setUint16(4,20,true);record.view.setUint16(6,20,true);record.view.setUint16(8,0x800,true);record.view.setUint32(16,crc,true);record.view.setUint32(20,bytes.length,true);record.view.setUint32(24,bytes.length,true);record.view.setUint16(28,name.length,true);record.view.setUint32(42,offset,true)
    central.push(record.bytes,name);offset+=30+name.length+bytes.length;size+=46+name.length
  }
  if(files.length>65535||offset+size>0xffffffff)throw new Error('Archive trop volumineuse ; utiliser les exports JSON et CSV.')
  const end=header(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,files.length,true);end.view.setUint16(10,files.length,true);end.view.setUint32(12,size,true);end.view.setUint32(16,offset,true)
  return new Blob([...chunks,...central,end.bytes],{type:'application/zip'})
}
export const dataURLBytes = url => Uint8Array.from(atob(url.split(',')[1]),char=>char.charCodeAt(0))
