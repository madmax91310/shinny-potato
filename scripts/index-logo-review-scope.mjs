import assert from 'node:assert/strict'

// The logo evidence is an explicit reviewed snapshot. Source refreshes can
// admit another financial factsheet without inventing a reviewed logo alias.
// Those sheets keep the renderer's initials fallback; the browser suite still
// renders every live sheet. Reviewed aliases, hashes and images remain checked.
export function reviewedLogoSheets(sheets, archive) {
  if (!archive) return sheets
  const reviewed = new Set(archive.uses.map(row => row.sheet))
  const available = new Set(sheets.map(sheet => sheet.id))
  for (const id of reviewed) assert(available.has(id), `Reviewed logo sheet missing: ${id}`)
  return sheets.filter(sheet => reviewed.has(sheet.id))
}
