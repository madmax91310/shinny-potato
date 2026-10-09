import { useEffect, useState } from 'react'
import { cachedSignalIds, readIds, READ_EVENT } from '../pages/editorial-radar/client.js'
const unreadCount = () => { const read = new Set(readIds()); return cachedSignalIds().filter(id => !read.has(id)).length }
// Other tools and exports stay local. Only the radar page fetches its feed.
export default function RadarCount() {
  const [count, setCount] = useState(unreadCount)
  useEffect(() => {
    const refresh = () => setCount(unreadCount())
    window.addEventListener(READ_EVENT, refresh); window.addEventListener('storage', refresh)
    return () => { window.removeEventListener(READ_EVENT, refresh); window.removeEventListener('storage', refresh) }
  }, [])
  return count ? <span className="radar-nav-count" title="Signaux non lus dans le dernier flux consulté" aria-label={`${count} signaux non lus`}>{count}</span> : null
}
