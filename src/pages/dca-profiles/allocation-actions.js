import { MAX_POSITIONS } from './engine.js'

function checked(lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > MAX_POSITIONS ||
    lines.some(line => !line || !line.asset) || new Set(lines.map(line => line.isin || line.asset)).size !== lines.length)
    throw Error('Choisis entre 1 et 50 actifs distincts.')
}

// Integer hundredths make the remainder explicit and keep the total at 100.
// Monthly cash flows and security identities are never changed by these actions.
export function equalWeights(lines) {
  checked(lines)
  const base = Math.floor(10000 / lines.length), remainder = 10000 % lines.length
  return lines.map((line, index) => ({...line, weight: (base + Number(index < remainder)) / 100}))
}

export function assignRemainder(lines, index) {
  checked(lines)
  if (!Number.isInteger(index) || !lines[index]) throw Error('Choisis une position.')
  const others = lines.filter((_, i) => i !== index)
  if (others.some(line => !Number.isFinite(line.weight) || line.weight < 0 || line.weight > 100))
    throw Error('Corrige les autres poids avant d’affecter le solde.')
  const weight = Math.round((100 - others.reduce((sum, line) => sum + line.weight, 0)) * 1e8) / 1e8
  if (weight < 0 || weight > 100) throw Error('Les autres positions dépassent 100 %.')
  return lines.map((line, i) => i === index ? {...line, weight} : {...line})
}
