// Reconcile labelled lines against the preceding and current ledgers. A number
// in free prose can describe a project or a stock, so it needs its own evidence.
const amountPattern = /[−+-]?\d(?:[\d \u00a0\u202f]*\d)?(?:[,.]\d{1,2})?[ \u00a0\u202f]*€/u
const normalize = value => value.normalize('NFC').toLocaleLowerCase('fr').trim()
const valueOf = value => Number(value.replace(/[\s€]/gu, '').replace('−', '-').replace(',', '.'))

export function reconcileBudgetDraftLines(text, ledger, money, sections = []) {
  const changes = []
  let unresolved = false
  const lines = text.split(/(\r?\n)/)
  const revised = lines.map((line, index) => {
    if (index % 2) return line
    const questionPrefix = line.startsWith('💬 ') ? '💬 ' : ''
    const section = sections.find(([previous]) => line.slice(questionPrefix.length) === previous)
    if (section) {
      const [before, after, label] = section
      changes.push({ label, before, after: after || 'passage retiré' })
      if (!after && index + 1 < lines.length) lines[index + 1] = ''
      return after ? questionPrefix + after : ''
    }
    const colon = line.indexOf(':')
    const label = colon < 0 ? '' : normalize(line.slice(0, colon).replace(/^[^\p{L}\p{N}]+/u, ''))
    const suffix = colon < 0 ? '' : line.slice(colon + 1)
    const prefix = /^\s*(?:environ\s+|≈\s*)?/i.exec(suffix)[0]
    const amount = amountPattern.exec(suffix.slice(prefix.length))
    const entry = ledger.get(label)
    if (!entry || !amount || amount.index !== 0 || valueOf(amount[0]) !== entry.before) {
      if (amountPattern.test(line) || /\b(?:bonus|prime|épargne retraite|crédit automobile à 4 %)/i.test(line)) unresolved = true
      return line
    }
    if (entry.after === undefined) {
      changes.push({ label: line.slice(0, colon).trim(), before: amount[0], after: 'ligne retirée' })
      // Remove only the obsolete line and the newline immediately following it.
      if (index + 1 < lines.length) lines[index + 1] = ''
      return ''
    }
    const start = colon + 1 + prefix.length
    let following = line.slice(start + amount[0].length)
    if (entry.percent !== undefined) following = following.replace(/^(\s*(?:\/ mois\s*)?)\(\s*[−+-]?\d+\s*%\s*\)/u,
      (_, separator) => `${separator}(${entry.percent} %)`)
    const replacement = line.slice(0, start) + (entry.before === entry.after ? amount[0] : money(entry.after)) + following
    if (replacement !== line) {
      changes.push({ label: line.slice(0, colon).trim(), before: line.slice(colon + 1).trim(), after: replacement.slice(colon + 1).trim() })
    }
    return replacement
  }).join('')
  return { text: revised, changes, unresolved }
}
