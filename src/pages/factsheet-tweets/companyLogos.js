import registry from './companyLogoRegistry.json' with { type: 'json' }
const images = new Map()
// Source names are explicitly reviewed and scoped to an index. Top 10 uses ISINs;
// neither fuzzy names nor ambiguous ticker symbols participate in resolution.
export function companyLogoIdentity(sheet, name, securities) {
  if (securities?.length) {
    const ids = [...new Set(securities.map(isin => registry.bySecurity[isin]).filter(Boolean))]
    if (ids.length !== 1 || securities.some(isin => registry.bySecurity[isin] !== ids[0])) return null
    return {id:ids[0], ...registry.companies[ids[0]]}
  }
  const id = registry.bySheet[sheet.id]?.[name]
  return id ? {id, ...registry.companies[id]} : null
}
export async function companyLogo(sheet, name, securities) {
  const identity = companyLogoIdentity(sheet, name, securities)
  if (!identity?.file) return null
  if (!images.has(identity.file)) {
    const pending = new Promise(resolve => {
      const image = new Image()
      let finished = false
      const finish = result => {
        if (finished) return
        finished = true; clearTimeout(timer)
        if (!result) images.delete(identity.file)
        resolve(result)
      }
      const timer = setTimeout(() => finish(null), 5000)
      image.dataset.support = identity.support
      image.onload = () => finish(image)
      image.onerror = () => finish(null)
      image.src = `${import.meta.env.BASE_URL}asset-art/${identity.file}`
    })
    images.set(identity.file, pending)
  }
  return images.get(identity.file)
}
export const companyInitials = name => (String(name).match(/[\p{L}\p{N}]+/gu) ?? []).slice(0,2).map(word=>word[0]).join('').toUpperCase() || '·'
