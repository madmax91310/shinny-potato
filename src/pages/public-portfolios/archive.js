// ZIP STORE (uncompressed): PNG is already compressed. One download avoids the
// browser's blocking of a series of automatic downloads. Filenames are ASCII.
export function pngArchive(entries) {
  const parts = [],
    directory = [];
  let offset = 0;
  const crc32 = (bytes) => {
    let c = 0xffffffff;
    for (const b of bytes) {
      c ^= b;
      for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
    return (c ^ 0xffffffff) >>> 0;
  };
  const header = (size, signature) => {
    const bytes = new Uint8Array(size);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, signature, true);
    return { bytes, view };
  };
  for (const { name, data } of entries) {
    const filename = new TextEncoder().encode(name),
      crc = crc32(data),
      local = header(30, 0x04034b50),
      central = header(46, 0x02014b50);
    local.view.setUint16(4, 20, true);
    local.view.setUint32(14, crc, true);
    local.view.setUint32(18, data.length, true);
    local.view.setUint32(22, data.length, true);
    local.view.setUint16(26, filename.length, true);
    central.view.setUint16(4, 20, true);
    central.view.setUint16(6, 20, true);
    central.view.setUint32(16, crc, true);
    central.view.setUint32(20, data.length, true);
    central.view.setUint32(24, data.length, true);
    central.view.setUint16(28, filename.length, true);
    central.view.setUint32(42, offset, true);
    parts.push(local.bytes, filename, data);
    directory.push(central.bytes, filename);
    offset += 30 + filename.length + data.length;
  }
  const size = directory.reduce((sum, b) => sum + b.length, 0),
    end = header(22, 0x06054b50);
  end.view.setUint16(8, entries.length, true);
  end.view.setUint16(10, entries.length, true);
  end.view.setUint32(12, size, true);
  end.view.setUint32(16, offset, true);
  return new Blob([...parts, ...directory, end.bytes], {
    type: "application/zip",
  });
}
