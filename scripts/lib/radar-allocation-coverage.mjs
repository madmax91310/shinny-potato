// A complete list of positions can still contain unclassified exposure. Such a
// residual cannot prove that an omitted country/sector has zero weight.
export function unknownAllocationGroups(rows) {
  return rows.filter(row => {
    const name = String(row.name ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()
    return Number.isFinite(row.weightPct) && row.weightPct !== 0 &&
      /^(?:non classe(?:e|s|es)?|non renseigne(?:e|s|es)?|unknown|unassigned|unclassified|not classified|other(?:s)?(?: countries| sectors)?|autres?(?: pays| secteurs)?|n\/?a|--)$/.test(name)
  })
}
