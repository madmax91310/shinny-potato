export function formatCurrency(value) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} %`
}

export function formatSignedCurrency(value) {
  if (!Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatCurrency(value)}`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
