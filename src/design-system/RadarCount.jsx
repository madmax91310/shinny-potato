import { useEffect, useState } from 'react'
import { fetchRadar, readIds, READ_EVENT } from '../pages/editorial-radar/client.js'

export default function RadarCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let feed, active = true, controller
    const update = () => { if (active && feed) { const read = readIds(); setCount(feed.events.filter(event => !read.includes(event.id)).length) } }
    async function refresh() {
      controller?.abort(); controller = new AbortController()
      try { feed = await fetchRadar(controller.signal); update() } catch { /* The radar page reports unavailable/stale checks. */ }
    }
    refresh(); const timer = setInterval(refresh, 300000)
    window.addEventListener(READ_EVENT, update); window.addEventListener('storage', update)
    return () => { active = false; clearInterval(timer); controller?.abort(); window.removeEventListener(READ_EVENT, update); window.removeEventListener('storage', update) }
  }, [])
  return count > 0 ? <span className="radar-nav-count" aria-label={`${count} signaux non lus`}>{count > 99 ? '99+' : count}</span> : null
}
