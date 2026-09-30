const number = (value) => value.toLocaleString('fr-FR')
export function describeDataField(field) {
  const value = field.value
  if (field.label === 'Statistique de ménages') return `${number(value.value)} ${value.unit === 'EUR' ? '€' : '%'}${value.secondValue != null ? ` / ${number(value.secondValue)} %` : ''} · ${value.referencePeriod} · ${value.metricLabel}`
  if (field.label.startsWith('Frais')) return `${value} % par an`
  if (field.label === 'Éligibilité PEA') return value === true ? 'Éligible PEA' : value === false ? 'Non éligible PEA' : 'Éligibilité non établie'
  if (field.label === 'Encours') return value.sheet ?? value.index ?? ''
  if (field.label === 'Encours daté publié par l’émetteur') return `${number(value.amountMillions)} millions ${value.currency}`
  if (value?.ticker) return `${value.ticker} · ${value.exchange} · ${value.currency}`
  if (field.label.startsWith('Photographie')) return [
    value.constituents != null && `${number(value.constituents)} titres`,
    value.targetConstituents != null && `Objectif de méthode : ${number(value.targetConstituents)} sociétés`,
    value.approximateConstituents != null && `Environ ${number(value.approximateConstituents)} titres (${value.constituentRange.join(' à ')})`,
    value.marketCount != null && `${value.marketCount} pays`, value.markets,
  ].filter(Boolean).join(' · ')
  if (field.label.startsWith('Rendements')) {
    const values = Array.isArray(value) ? value : value.values
    return values.map((item, i) => { const [year, amount] = Array.isArray(item) ? item : [field.label.includes('2020') ? 2020 + i : 2023 + i, item]; return amount == null ? `${year} : indisponible` : `${year} : ${amount > 0 ? '+' : ''}${number(amount)} %` }).join(' · ')
  }
  if (value?.points) return `${value.points.length} points · ${value.points[0]?.date} à ${value.points.at(-1)?.date}`
  return ''
}

export function describeEvidenceDate(metadata) {
  if (metadata.asOf) return metadata.sourceStatus === 'archive-unverifiable' ? `${metadata.asOf} (date héritée non recertifiée)` : metadata.asOf
  return {
    'not-applicable': 'Sans objet pour cette caractéristique',
    'not-published': 'Date de valeur non publiée par la source',
    'legacy-undated': 'Archive ancienne sans date de photographie conservée',
    'month-only': 'Période mensuelle connue ; jour exact non documenté',
  }[metadata.dateStatus] ?? 'Date non documentée'
}
