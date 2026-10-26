import { startPublicationDownload } from './publicationActions.js'

// The caller owns encoding/MIME/name. This function owns only the temporary URL/link.
// Most exports retain the historical 1s transfer window; large mobile PNGs use 60s.
export function downloadPublicationBlob(blob, filename, revokeAfterMs = 1000) {
  const url = URL.createObjectURL(blob)
  let link
  try {
    link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    startPublicationDownload(link)
  } finally {
    try { link?.remove() }
    finally { setTimeout(() => URL.revokeObjectURL(url), revokeAfterMs) }
  }
}
