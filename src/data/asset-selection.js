import { INSTRUMENT_FACTS_BY_ISIN } from './instrument-facts.js'
import { INSTRUMENTS_BY_ISIN, getInstrumentName, getInstrumentPeaStatus } from './instruments.js'
import { getPreferredInstrumentListing } from './instrument-listings.js'
import { ETF_TER_BY_ISIN } from './etf-ter.js'

export const normalizeSearch = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const shortAssetName = name => String(name ?? '').replace(/\s+UCITS\s+ETF/gi, '').replace(/\s*\((Acc|Dist)\)/gi, '').trim()

// Navigation only: labels derive from the existing identity, never from returns.
export function exposureGroup(asset) {
  const text = normalizeSearch(`${asset.name ?? asset.label ?? asset.title ?? ''} ${asset.benchmark ?? ''}`)
  if (asset.cat === 'obligataire' || /bond|treasury|oblig|€str|overnight|fonds euros/.test(text)) return 'Obligations et monétaire'
  if (asset.cat === 'crypto' || /bitcoin|ethereum|crypto/.test(text)) return 'Crypto'
  if (asset.cat === 'matieres_premieres' || /gold|silver|commodity|commodities|copper|\bor\b/.test(text)) return 'Matières premières'
  if (asset.cat === 'immobilier' || /property|epra|reit|immobili|scpi|gpr/.test(text)) return 'Immobilier'
  if (asset.cat === 'dividendes' || /dividend|buywrite|covered.call/.test(text)) return 'Dividendes et revenus'
  if (['Sectoriels classiques', 'Thématiques émergentes', 'Spatial'].includes(asset.category) || /semiconductor|energy|defen[cs]e|cyber|water|luxury|financial|technology|quantum|artificial|robot|blockchain|uranium|battery|space|infrastructure|health|consumer|utilities/.test(text)) return 'Secteurs et thématiques'
  if (/quality|momentum|value|volatility|equal weight/.test(text)) return 'Facteurs et pondérations'
  if (asset.cat === 'emergents' || /emerging|emergent|china|chine|india|inde|taiwan|latin|emea/.test(text)) return 'Émergents'
  if (/europe|euro stoxx|eurostoxx|cac 40|cac40|stoxx.*600/.test(text)) return 'Europe'
  if (/s&p.?500|sp500|nasdaq|russell|usa|americain/.test(text)) return 'États-Unis'
  if (/world|acwi|monde/.test(text)) return 'Monde'
  if (/japan|japon|topix/.test(text)) return 'Japon'
  return asset.group ?? 'Autres actifs'
}

export function instrumentOption(asset) {
  const facts = INSTRUMENT_FACTS_BY_ISIN[asset.isin] ?? {}
  const listing = getPreferredInstrumentListing(asset.isin)
  const pea = INSTRUMENTS_BY_ISIN[asset.isin] ? getInstrumentPeaStatus(asset.isin) : null
  const name = asset.name ?? asset.label ?? (INSTRUMENTS_BY_ISIN[asset.isin] ? getInstrumentName(asset.isin) : '')
  return {
    ...asset, id: asset.id ?? asset.isin, name, label: shortAssetName(name),
    group: exposureGroup({ ...asset, name, benchmark: facts.benchmark }),
    detail: facts.benchmark ?? '',
    search: `${name} ${asset.isin ?? ''} ${asset.listing?.ticker ?? listing?.ticker ?? ''} ${facts.benchmark ?? ''}`,
    badges: [pea === true ? 'PEA' : pea === false ? 'CTO · hors PEA' : null,
      facts.distribution, ETF_TER_BY_ISIN[asset.isin] ? `${ETF_TER_BY_ISIN[asset.isin]} %` : null].filter(Boolean),
  }
}

// Explicit aliases only. Do not erase ESG, IMI, factors, leverage or hedging.
export function benchmarkKey(isin) {
  const facts = INSTRUMENT_FACTS_BY_ISIN[isin]
  if (!facts?.benchmark) return null
  const aliases = {
    'MSCI ACWI Index (EUR, Net Return)': 'MSCI All Country World (ACWI)',
    'MSCI World ex USA Index (Net Total Return)': 'MSCI World ex USA',
  }
  return `${aliases[facts.benchmark] ?? facts.benchmark}|hedge:${facts.currencyHedge ?? 'none'}`
}
export function sameBenchmarkSupports(isin) {
  const key = benchmarkKey(isin)
  if (!key) return []
  return Object.keys(INSTRUMENTS_BY_ISIN).filter(other => other !== isin && benchmarkKey(other) === key)
    .map(other => instrumentOption({ isin: other })).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}
