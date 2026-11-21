import { leaderPath } from './leader-layout.js'
import widths from './type-metrics.json' with {type:'json'}

export const POSTER = { cx: 540, cy: 733, outer: 368, inner: 175, top: 271, bottom: 1238, nameSize: 36, percentSize: 35 }
export const measure = (s, size) => [...String(s)].reduce((n, c) => n + (widths[c] ?? .7), 0) * size + 4

function wordLines(value, width, size) {
  const lines = []
  let line = ''
  for (const word of value.split(/\s+/)) {
    if (measure(word, size) > width) return null
    if (line && measure(line + ' ' + word, size) > width) {
      lines.push(line)
      line = ''
    }
    line = line ? line + ' ' + word : word
  }
  if (line) lines.push(line)
  return lines.length <= 2 ? lines : null
}

const clamp = (n, min, max) => Math.max(min, Math.min(max, n))
const delta = angle => Math.atan2(Math.sin(angle), Math.cos(angle))
const clashes = (a, b) => a.x < b.x + b.width + 9 && a.x + a.width + 9 > b.x && a.y < b.y + b.height + 9 && a.y + a.height + 9 > b.y

export function arrangeOrbit(rows, start) {
  const { cx, cy, outer, top, bottom, nameSize, percentSize } = POSTER
  const concentrated = rows.some(row => row.other && row.weight > .75)
  const shifts = [0, -.04, .04, -.09, .09, -.16, .16, -.24, .24, -.33, .33, -.44, .44, -.55, .55, -.64, .64]
  if (concentrated) shifts.push(-.75, .75, -.88, .88)
  const distanceLimit = concentrated ? 265 : 205
  const offsetLimit = concentrated ? .89 : .65
  let angle = start
  const entries = rows.map(row => {
    const end = angle + row.weight * Math.PI * 2
    const mid = (angle + end) / 2
    const entry = {
      ...row, start: angle, end, mid,
      anchor: { x: cx + Math.cos(mid) * (outer + 5), y: cy + Math.sin(mid) * (outer + 5) },
    }
    angle = end
    return entry
  })
  const candidates = entries.map(entry => {
    const found = []
    for (const width of [218, 166, 126, 265]) {
      const lines = wordLines(entry.label, width, nameSize)
      if (!lines) continue
      const w = Math.max(measure(entry.percent, percentSize), ...lines.map(line => measure(line, nameSize)))
      const h = lines.length * 39 + 39
      for (const shift of shifts) {
        const direction = entry.mid + shift
        const c = Math.cos(direction), s = Math.sin(direction)
        for (const extra of [0, 15, 34, 58]) {
          const r = outer + 17 + extra + Math.abs(c) * w / 2 + Math.abs(s) * h / 2
          const x = clamp(cx + c * r - w / 2, 22, 1058 - w)
          const y = clamp(cy + s * r - h / 2, top, bottom - h)
          if (Math.hypot(cx - clamp(cx, x, x + w), cy - clamp(cy, y, y + h)) < outer + 9) continue
          const offset = delta(Math.atan2(y + h / 2 - cy, x + w / 2 - cx) - entry.mid)
          const distance = Math.hypot(entry.anchor.x - clamp(entry.anchor.x, x, x + w), entry.anchor.y - clamp(entry.anchor.y, y, y + h))
          if (distance > distanceLimit || Math.abs(offset) > offsetLimit) continue
          found.push({ x, y, width: w, height: h, lines, angle: entry.mid + offset, distance, score: distance + 105 * Math.abs(offset) + 12 * (lines.length - 1) })
        }
      }
    }
    const keys = new Set()
    return found.sort((a, b) => a.score - b.score).filter(box => {
      const key = [box.x, box.y, box.width, box.height].map(n => Math.round(n / 4)).join(',')
      if (keys.has(key)) return false
      keys.add(key)
      return true
    }).slice(0, concentrated ? 105 : 75)
  })
  if (candidates.some(list => !list.length)) return null

  let attempts = 0
  function place(remaining) {
    if (++attempts > 260) return false
    if (!remaining.length) {
      const routes = []
      for (const entry of entries) {
        const offset = Math.abs(entry.box.angle - entry.mid)
        const needsLeader = entry.box.distance > 42 || offset > Math.min(.14, entry.weight * Math.PI + .035)
        entry.leader = needsLeader ? leaderPath(entry, entries, POSTER, routes) : null
        if (needsLeader && !entry.leader) return false
        if (entry.leader) routes.push(entry.leader)
      }
      return true
    }
    let index, choices
    for (const i of remaining) {
      const valid = candidates[i].filter(box => !entries.some((other, j) => other.box && (
        clashes(box, other.box) || (j < i ? other.box.angle >= box.angle : box.angle >= other.box.angle)
      )))
      if (!valid.length) return false
      if (!choices || valid.length < choices.length) {
        index = i
        choices = valid
      }
    }
    for (const box of choices) {
      entries[index].box = box
      if (place(remaining.filter(i => i !== index))) return true
      delete entries[index].box
    }
    return false
  }
  return place(entries.map((_, i) => i)) ? { entries } : null
}
