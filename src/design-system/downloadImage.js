import { startPublicationDownload } from './publicationActions.js'
import { downloadPublicationBlob } from './downloadBlob.js'

// A Blob URL avoids mobile browser limits on large data-URL downloads.
export function downloadImage(canvas, filename) {
  const source = typeof canvas === 'string' ? canvas : canvas.toDataURL('image/png')
  if (source.startsWith('data:image/png;base64,')) {
    const bytes = Uint8Array.from(atob(source.split(',')[1]), ch => ch.charCodeAt(0))
    // Preserve the large mobile PNG transfer window.
    downloadPublicationBlob(new Blob([bytes], { type: 'image/png' }), filename, 60000)
    return
  }
  const link = document.createElement('a')
  link.href = source; link.download = filename
  try { document.body.append(link); startPublicationDownload(link) }
  finally {
    link.remove()
  }
}
