// Duels dérivés des familles : A/B, A/C, B/C, sans recopier les données.
export function getIndexComparisonPairs(family) {
  if (family.pairPositions) return [family]
  const pairs = []
  for (let a = 0; a < family.indices.length - 1; a++) {
    for (let b = a + 1; b < family.indices.length; b++) {
      const pairPositions = [a, b]
      const indices = pairPositions.map(position => family.indices[position])
      pairs.push({ ...family, pairId: `${family.id}-${a}-${b}`, pairPositions,
        label: indices.map(index => index.name).join(' / '), indices,
        // Les familles de plus de deux indices ont un groupe ETF par indice,
        // dans le même ordre. Les duels existants gardent leurs groupes propres.
        etfGroups: family.indices.length === 2 ? family.etfGroups : pairPositions.map(position => family.etfGroups[position]),
      })
    }
  }
  return pairs
}

export function asIndexComparisonPair(family) {
  return family.pairPositions ? family : getIndexComparisonPairs(family)[0]
}
