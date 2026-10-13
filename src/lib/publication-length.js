export function getLengthStatus(length) {
  if (length <= 280) {
    return { level: 'ok', label: `${length} / 280 — format tweet classique` }
  }
  if (length <= 25000) {
    return {
      level: 'warn',
      label: `${length} caractères — nécessite une note longue (X Premium) ou un thread`,
    }
  }
  return { level: 'danger', label: `${length} caractères — trop long, à scinder en thread` }
}
