// A declared calendar day has no timezone. Use the browser's local day.
export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
}
export function validPublicationDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01' && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
}
export const publicationLabel = date => date ? `Publié le ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}` : 'Publié — date non renseignée'
