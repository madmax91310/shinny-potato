// Deterministic wrapping for the text detail pages; the poster measures its font.
export function labelLines(value, columns = 14, maxChars = Infinity) {
  const chars = [...String(value)]
  const short = chars.length > maxChars ? chars.slice(0, maxChars - 1).join('') + '…' : chars.join('')
  const lines = []; let line = ''
  for (const word of short.split(/\s+/)) {
    for (let part of word.match(new RegExp(`.{1,${columns}}`, 'gu')) ?? []) {
      if (line && [...line + ' ' + part].length > columns) { lines.push(line); line = '' }
      line = line ? line + ' ' + part : part
    }
  }
  if (line) lines.push(line)
  return lines
}
