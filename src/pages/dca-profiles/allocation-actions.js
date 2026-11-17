import { MAX_EXPOSURE_POSITIONS } from './engine.js'

function checked(lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > MAX_EXPOSURE_POSITIONS ||
    lines.some(line => !line || !line.asset) || new Set(lines.map(line => line.isin || line.asset)).size !== lines.length)
    throw Error('Choisis au moins un actif, sans doublon.')
}

// Integer units keep the total at 100; increase precision for very large books.
// Monthly cash flows and security identities are never changed by these actions.
export function equalWeights(lines) {
  checked(lines)
  const units=Math.max(10000,10**Math.ceil(Math.log10(lines.length)))
  const base = Math.floor(units / lines.length), remainder = units % lines.length
  return lines.map((line, index) => ({...line, weight: (base + Number(index < remainder)) * 100 / units}))
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
