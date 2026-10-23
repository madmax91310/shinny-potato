// Restrictions concern exact listings and observed windows, never an ISIN globally.
// Repeated prices alone are an investigation signal, not a universal rejection rule.
import RESTRICTIONS from './history-window-restrictions.json' with {type:'json'}
import FINANCIAL from './financial-history-restrictions.json' with {type:'json'}

function unresolvedFinancialWindow(asset,start,end){
  if([asset.historyConvention,asset.valuationBasis,asset.field,asset.basis].some(v=>v==='fund-nav-total-return'||v==='nav-total-return'))return null
  const currency=asset.originalCurrency??asset.currency
  for(const[isin,symbol,native,years]of FINANCIAL){
    if(asset.isin!==isin||currency!==native||!(asset.symbol===symbol||[asset.sourceUrl,...asset.sourceUrls??[]].some(u=>typeof u==='string'&&u.includes('/chart/'+encodeURIComponent(symbol)+'?'))))continue
    const affected=years.filter(year=>start<=`${year}-12`&&end>=`${year-1}-12`)
    if(affected.length)return {qualified:false,code:'financial-window-unconfirmed',reason:`Cotation ${symbol} : rapprochement financier non résolu pour ${affected.join(', ')}. Les périodes concernées restent indisponibles ; choisir une période vérifiée ou une voie VL qualifiée.`,cases:affected.map(y=>`${isin}/${y}`)}
  }
  return null
}

const dateOf = p => Array.isArray(p) ? p[0] : p.date
const priceOf = p => Array.isArray(p) ? p[1] : p.price
const index = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7))
export function qualifyHistoryWindow(asset, start, end, { contiguous = true } = {}) {
  if (!asset || !/^\d{4}-(0[1-9]|1[0-2])$/.test(start ?? '') || !/^\d{4}-(0[1-9]|1[0-2])$/.test(end ?? '') || start > end) return { qualified: false, reason: 'Fenêtre historique invalide.' }
  const convention=asset.historyConvention ?? asset.basis ?? asset.priceMethod ?? asset.field ?? asset.variant ?? asset.methodNote
  if(!asset.currency || !convention)return {qualified:false,reason:'Devise ou convention financière non documentée.'}
  for (const line of asset.portfolio?.lines ?? []) {
    const nested=qualifyHistoryWindow(line.asset,start,end,{contiguous})
    if(!nested.qualified)return nested
  }
  const financial=unresolvedFinancialWindow(asset,start,end)
  if(financial)return financial
  for(const rule of RESTRICTIONS){
    if(rule.inceptionMonth&&asset.isin===rule.isin&&start<rule.inceptionMonth)return {qualified:false,code:'before-inception',reason:rule.reason}
  }
  const points = asset.points ?? []
  const window = points.filter(p => dateOf(p) >= start && dateOf(p) <= end)
  if (!window.length || dateOf(window[0]) !== start || dateOf(window.at(-1)) !== end || window.some(p => !Number.isFinite(priceOf(p)) || priceOf(p) <= 0)) return { qualified: false, reason: 'Bornes ou niveaux historiques absents.' }
  if (contiguous && (window.length !== index(end) - index(start) + 1 || window.some((p, i) => i && index(dateOf(p)) !== index(dateOf(window[i-1])) + 1))) return { qualified: false, reason: 'Couverture mensuelle incomplète.' }
  for (const rule of RESTRICTIONS) {
    if(rule.inceptionMonth)continue
    if (asset.isin !== rule.isin || (asset.originalCurrency ?? asset.currency) !== rule.currency || (asset.symbol ?? `${asset.ticker}.${({XSWX:'SW',XAMS:'AS'})[asset.mic]}`) !== rule.symbol || start > rule.end || end < rule.start) continue
    const observed = (asset.qualityPoints ?? points).filter(p => dateOf(p) >= rule.start && dateOf(p) <= rule.end)
    // A changed source is investigated by the collector; this observed restriction
    // only applies while the known multi-month carried-forward prices persist.
    if (observed.some((p,i) => i >= 2 && priceOf(p) === priceOf(observed[i-1]) && priceOf(p) === priceOf(observed[i-2]))) return { qualified: false, code:'unreliable-window', reason: rule.reason }
  }
  return { qualified: true, convention, start, end }
}
export function requireHistoryWindow(asset, start, end, options) {
  const result = qualifyHistoryWindow(asset, start, end, options)
  if (!result.qualified) throw new Error(result.reason)
  return result
}
