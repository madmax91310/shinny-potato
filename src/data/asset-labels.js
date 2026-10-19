import { normalizeSearch } from './search-text.js'
export const shortAssetName = name => String(name ?? '').replace(/\s+UCITS\s+ETF/gi, '').replace(/\s*\((Acc|Dist)\)/gi, '').trim()

// Navigation only: labels derive from the existing identity, never from returns.
export function exposureGroup(asset) {
  if (asset.instrumentType === 'EQUITY' || asset.kind === 'equity') return 'Actions individuelles'
  if (asset.cat === 'multi_actifs' || asset.category === 'Multi-actifs' || /lifestrategy/i.test(asset.name ?? asset.label ?? '')) return 'Multi-actifs'
  const text = normalizeSearch(`${asset.name ?? asset.label ?? asset.title ?? ''} ${asset.benchmark ?? ''}`)
  if (asset.cat === 'obligataire' || /bond|treasury|oblig|€str|overnight|fonds euros/.test(text)) return 'Obligations et monétaire'
  if (asset.cat === 'crypto' || /bitcoin|ethereum|crypto/.test(text)) return 'Crypto'
  if (asset.cat === 'matieres_premieres' || /gold|silver|\bargent\b|palladium|platinum|platine|commodity|commodities|copper|\bor\b/.test(text)) return 'Matières premières'
  if (asset.cat === 'immobilier' || /property|epra|reit|immobili|scpi|gpr/.test(text)) return 'Immobilier'
  if (asset.cat === 'dividendes' || /dividend|buywrite|covered.call/.test(text)) return 'Dividendes et revenus'
  if (['Sectoriels classiques', 'Thématiques émergentes', 'Spatial'].includes(asset.category) || /industrials|semiconductor|energy|defen[cs]e|cyber|water|luxury|financial|technology|quantum|artificial|robot|blockchain|uranium|battery|space|infrastructure|health|consumer|utilities/.test(text)) return 'Secteurs et thématiques'
  if (/quality|momentum|value|volatility|equal weight/.test(text)) return 'Facteurs et pondérations'
  if (asset.cat === 'emergents' || /emerging|emergent|china|chine|india|\binde\b|taiwan|korea|coree|latin|emea/.test(text)) return 'Émergents'
  if (/europe|euro stoxx|eurostoxx|cac 40|cac40|stoxx.*600/.test(text)) return 'Europe'
  if (/\bworld\b.*\bex[-\s]+(?:usa|us|united states)\b/.test(text)) return 'Monde'
  if (/s&p.?500|sp500|nasdaq|russell|usa|americain/.test(text)) return 'États-Unis'
  if (/world|acwi|all country|monde/.test(text)) return 'Monde'
  if (/\b(?:asia|asie|far east)\b/.test(text) && /\bex[-\s]+(?:japan|japon)\b/.test(text)) return 'Asie hors Japon'
  if (/japan|japon|topix/.test(text) && !/\bex[-\s]+(?:japan|japon)\b/.test(text)) return 'Japon'
  return asset.group ?? 'Autres actifs'
}

