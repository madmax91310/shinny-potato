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
  const id = matches[0][0], source = additional[id] || official[id], logo = registry.companies[id]?.file ? registry.companies[id] : source
  return logo?.file && source ? { id, ...logo, ...source } : null
}
export async function positionLogo(row) {
  const identity = logoIdentity(row)
  if (!identity) return { image: null, identity: null }
  const file=identity.investorVariant?.file || identity.file
  let image=await loadArtImage(file).catch(()=>null)
  // Investor-only optical framing of the existing issuer asset. Remove the
  // website footer strip, preserving every Alphabet glyph and other consumers.
  if(image && !identity.investorVariant && identity.id==='alphabet' && image.width===800 && image.height===188) {
    const framed=document.createElement('canvas');framed.width=414;framed.height=102
    framed.getContext('2d').drawImage(image,0,0,414,102,0,0,414,102);image=framed
  }
  return {image,identity}
}
const mediaCache = new Map()
export async function portfolioPortrait(identity, supplied) {
  const fallback = { image: null, reason: 'Photo vérifiée et réutilisable indisponible.', person: identity.displayName }
  let source
  try {source=investorPortrait(identity.slug)} catch {return fallback}
  const historical = identity.slug==='berkshire' && source.illustration?.nature==='historical-association' && source.illustration?.person==='Warren Buffett'
  // Corporate ownership is never silently attributed to a former or unverified manager.
  if (entityPortfolio(identity.slug) && !historical) return { ...fallback, reason: 'Présentation de l’entité déclarante.' }
  if (!historical && (identity.personVerified !== true || !identity.personSource || !identity.personPeriod)) return { ...fallback, reason: 'Lien personne/déclarant non confirmé dans cette collecte.' }
  try {
    if(historical && supplied && (supplied.person!=='Warren Buffett' || supplied.illustration?.associationSource!==source.illustration.associationSource))return fallback
    if (!historical && source.person !== identity.displayName) return fallback
    if (supplied && supplied.sourceDigest !== mediaCache.get(identity.slug)?.sourceDigest) mediaCache.delete(identity.slug)
    if (!mediaCache.has(identity.slug)) {
      const response = supplied ? null : await fetch(`${import.meta.env.BASE_URL}data/investors/media/manifest.json`, { cache:'no-cache' })
      if (!supplied && !response.ok) return fallback
      const metadata = supplied || (await response.json())[identity.slug]
      if(historical && (metadata?.person!=='Warren Buffett' || metadata?.illustration?.associationSource!==source.illustration.associationSource))return fallback
      if (metadata?.status !== 'ready' || !metadata.file?.startsWith('data/investors/media/') || !(metadata.source === source.source && metadata.license === source.license || source.commonsPortrait && metadata.identityVerified === true && metadata.person === source.person && metadata.wikidataId === source.commonsPortrait.wikidataId && metadata.title === source.commonsPortrait.title && (/^CC BY(?:-SA)? /.test(metadata.license) || ['CC0','Domaine public'].includes(metadata.license)))) return { ...fallback, reason: metadata?.reason || fallback.reason }
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
export function portraitCredits(portfolio) {
  return {...investorPortrait(portfolio.identity.slug), ...(portfolio.media?.portrait || mediaCache.get(portfolio.identity.slug) || {})}
}
export function mediaCredits(portfolio) {
  return {portrait:portraitCredits(portfolio),logos:portfolio.holdings.map(logoIdentity).filter(Boolean)}
}
