import { useEffect } from 'react'

export default function usePublicationViewport(container) {
  useEffect(() => {
    const node = container.current
    const viewport = window.visualViewport
    if (!node || !viewport) return
    const update = () => {
      // Pinch zoom is navigation, not the software keyboard.
      const inset = viewport.scale === 1 ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0
      node.style.setProperty('--keyboard-inset', `${inset}px`)
      node.style.setProperty('--visible-height', `${viewport.height}px`)
      node.style.setProperty('--visible-top', `${viewport.offsetTop}px`)
    }
    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [container])
}
