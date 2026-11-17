// One result per selected snapshot for both download controls and the preview.
// A rejected render must be retried, never retained as a permanent failure.
export function cachedImageRenderer(render) {
  let pending
  return () => {
    if (!pending) {
      const attempt = Promise.resolve().then(render)
      pending = attempt
      attempt.catch(() => { if (pending === attempt) pending = undefined })
    }
    return pending
  }
}
