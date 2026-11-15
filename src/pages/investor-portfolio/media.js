import { entityPortfolio } from './publication.js'
export { companyInitials } from '../factsheet-tweets/companyLogos.js'
import registry from '../factsheet-tweets/companyLogoRegistry.json' with { type: 'json' }
import aliases from '../factsheet-tweets/companyLogoAliases.json' with { type: 'json' }
import official from '../../../public/asset-art/official-logos/sources.json' with { type: 'json' }
import additional from '../../../public/asset-art/index-logos/sources.json' with { type: 'json' }
import { loadArtImage } from '../../lib/art-resources.js'
import { investorPortrait } from './portrait.js'

// Exact reviewed aliases only. No fuzzy names or globally ambiguous tickers.
export function logoIdentity(row) {
  const matches = Object.entries(aliases).filter(([,v]) => v.aliases.includes(row.issuerName) || (row.isin && v.securities?.includes(row.isin)) || (row.cusip && v.securities?.some(isin => /^(US|CA)/.test(isin) && isin.slice(2,11) === row.cusip)))
  if (matches.length !== 1) return null
  const id = matches[0][0], source = additional[id] || official[id], logo = registry.companies[id] || source
  return logo?.file && source ? { id, ...logo, ...source } : null
}
export async function positionLogo(row) {
  const identity = logoIdentity(row)
  if (!identity) return { image: null, identity: null }
  return { image: await loadArtImage(identity.file).catch(() => null), identity }
}
const mediaCache = new Map()
export async function portfolioPortrait(identity) {
  const fallback = { image: null, reason: 'Photo vérifiée et réutilisable indisponible.', person: identity.displayName }
  // Corporate ownership is never silently attributed to a former or unverified manager.
  if (entityPortfolio(identity.slug)) return { ...fallback, reason: 'Présentation de l’entité déclarante.' }
  if (identity.personVerified !== true || !identity.personSource || !identity.personPeriod) return { ...fallback, reason: 'Lien personne/déclarant non confirmé dans cette collecte.' }
  try {
    const source = investorPortrait(identity.slug)
    if (source.person !== identity.displayName) return fallback
    if (!mediaCache.has(identity.slug)) {
      const response = await fetch(`${import.meta.env.BASE_URL}data/investors/media/manifest.json`, { cache:'no-cache' })
      if (!response.ok) return fallback
      const metadata = (await response.json())[identity.slug]
      if (metadata?.status !== 'ready' || !metadata.file?.startsWith('data/investors/media/') || metadata.source !== source.source || metadata.license !== source.license) return { ...fallback, reason: metadata?.reason || fallback.reason }
      mediaCache.set(identity.slug, metadata)
    }
    const metadata = mediaCache.get(identity.slug)
    const image = await new Promise(resolve => {
      const img = new Image(); const timer = setTimeout(() => resolve(null), 5000)
      img.onload = () => { clearTimeout(timer); resolve(img) }; img.onerror = () => { clearTimeout(timer); resolve(null) }
      img.src = `${import.meta.env.BASE_URL}${metadata.file}`
    })
    if (!image) { mediaCache.delete(identity.slug); return fallback }
    return { image, ...metadata, person: source.person }
  } catch { mediaCache.delete(identity.slug); return fallback }
}
export function mediaCredits(portfolio) {
  return { portrait: investorPortrait(portfolio.identity.slug), logos: portfolio.holdings.map(logoIdentity).filter(Boolean) }
}
