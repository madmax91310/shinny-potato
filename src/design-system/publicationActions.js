export function notifyPublication(message, kind = 'success') {
  window.dispatchEvent(new CustomEvent('publication-feedback', { detail: { message, kind } }))
}

export async function copyPublicationText(text) {
  let copied = false
  if (navigator.clipboard?.writeText) {
    let timer
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Copie indisponible')), 800) }),
      ])
      copied = true
    } catch { /* Try the browser fallback below. */ }
    finally { clearTimeout(timer) }
  }
  if (!copied) {
    const previous = document.activeElement
    const selection = typeof previous?.selectionStart === 'number' ? [previous.selectionStart, previous.selectionEnd] : null
    const field = document.createElement('textarea')
    field.value = text
    field.readOnly = true
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none'
    document.body.append(field)
    try { field.select(); copied = document.execCommand('copy') }
    catch { /* Manual copying remains available. */ }
    finally {
      field.remove()
      previous?.focus({ preventScroll: true })
      if (selection) previous.setSelectionRange(...selection)
    }
  }
  if (!copied) {
    notifyPublication('Copie indisponible. Sélectionne le texte pour le copier.', 'error')
    throw new Error('Copie indisponible')
  }
  notifyPublication('Texte copié.')
}

// Browsers expose the start of a download, not its final save to the device.
export function startPublicationDownload(link) {
  link.dataset.publicationDownload = 'handled'
  try {
    link.click()
    notifyPublication('Téléchargement lancé.')
  } catch (error) {
    notifyPublication('Téléchargement impossible. Réessaie.', 'error')
    throw error
  }
}
