// Connect a displaced label to its sector without crossing another annotation.
export function leaderPath(entry, entries, { cx, cy, outer }, previous = []) {
  const { anchor, box, mid } = entry
  const end = {
    x: Math.max(box.x, Math.min(anchor.x, box.x + box.width)),
    y: Math.max(box.y, Math.min(anchor.y, box.y + box.height)),
  }
  const elbow = { x: anchor.x + Math.cos(mid) * 12, y: anchor.y + Math.sin(mid) * 12 }
  function clear(a, b) {
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3))
    for (let i = 0; i <= steps; i++) {
      const x = a.x + (b.x - a.x) * i / steps
      const y = a.y + (b.y - a.y) * i / steps
      if (Math.hypot(x - cx, y - cy) < outer + 3) return false
      if (entries.some(other => other !== entry && x > other.box.x - 5 && x < other.box.x + other.box.width + 5
        && y > other.box.y - 5 && y < other.box.y + other.box.height + 5)) return false
      for (const route of previous) {
        for (let j = 1; j < route.length; j++) {
          const p = route[j - 1], q = route[j], dx = q.x - p.x, dy = q.y - p.y
          const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (y - p.y) * dy) / (dx * dx + dy * dy || 1)))
          if (Math.hypot(x - p.x - t * dx, y - p.y - t * dy) < 4) return false
        }
      }
    }
    return true
  }
  if (clear(anchor, end)) return [anchor, end]
  if (clear(elbow, end)) return [anchor, elbow, end]
  return null
}
