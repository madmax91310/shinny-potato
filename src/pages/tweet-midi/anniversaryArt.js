import { OFFICIAL_ANNIVERSARY_LOGOS } from './officialAnniversaryLogos.js'
import {withHistoryVisuals} from '../../data/history-visual-identities.js'
import { EQUITY_HISTORY_IDENTITIES } from '../../data/equity-history-identities.js'
import { ANNIVERSARY_INDEX_VARIANTS } from '../../data/index-history-conventions.js'
import { ETF_HISTORY_IDENTITIES } from '../../data/etf-history-identities.js'
// Explicit identities: an issuer logo is never substituted for an index or fund.
// Sources and visual review: public/asset-art/README.md.
const BASE_ANNIVERSARY_ART = Object.freeze({
  ...Object.fromEntries(Object.entries(EQUITY_HISTORY_IDENTITIES).map(([id, asset]) => [id, {title:asset.title, indexTitle:asset.title, kind:'illustration', subtitle:asset.currency}])),
  ...Object.fromEntries(Object.entries(ETF_HISTORY_IDENTITIES).map(([id, asset]) => [id, {
    title: asset.title, subtitle: `${asset.instrumentType ?? 'ETF'} ${asset.ticker}`, kind: 'illustration', indexTitle: asset.ticker,
  }])),
  ...Object.fromEntries([
    ['msciEurope', 'MSCI EUROPE'],
    ['msciUsa', 'MSCI USA'],
    ['msciIndia', 'MSCI INDIA'],
    ['msciEmergingExChina', 'MSCI EMERGING MARKETS HORS CHINE'],
    ['msciWorldMomentum', 'MSCI WORLD MOMENTUM'],
    ['msciWorldQuality', 'MSCI WORLD QUALITY'],
    ['msciWorldValue', 'MSCI WORLD VALUE'],
    ['russell2000', 'RUSSELL 2000'],
    ['ftseAllWorld', 'FTSE ALL-WORLD'],
    ['cac40', 'CAC 40'], ['sp500', 'S&P 500'], ['stoxx600', 'STOXX EUROPE 600'],
    ['msciWorld', 'MSCI WORLD'], ['msciEmerging', 'MSCI EMERGING MARKETS'],
    ['msciWorldSmallCap', 'MSCI WORLD SMALL CAP'],
    ['msciAcwi','MSCI ACWI'], ['msciAcwiImi','MSCI ACWI IMI'], ['msciWorldExUsa','MSCI WORLD EX USA'],
  ].map(([id, title]) => [id, { title, subtitle: ANNIVERSARY_INDEX_VARIANTS[id], kind: 'illustration', unit: 'pts', indexTitle: title }])),
  ...Object.fromEntries([
    ['pepsico','PEPSICO'], ['unitedhealth','UNITEDHEALTH GROUP'], ['totalenergies','TOTALENERGIES'], ['vinci','VINCI'], ['sanofi','SANOFI'], ['booking','BOOKING HOLDINGS'],
    ['nvidia', 'NVIDIA'], ['amazon', 'AMAZON'], ['google', 'ALPHABET'],
    ['meta', 'META'], ['lvmh', 'LVMH'], ['airliquide', 'AIR LIQUIDE'],
    ['costco', 'COSTCO'], ['mcdonalds', 'MCDONALD’S'], ['intel', 'INTEL'],
    ['paypal', 'PAYPAL'], ['schneider', 'SCHNEIDER ELECTRIC'], ['hermes', 'HERMÈS'],
    ['loreal', 'L’ORÉAL'], ['nestle', 'NESTLÉ'], ['sap', 'SAP'],
    ['mastercard','MASTERCARD'], ['adobe','ADOBE'], ['home-depot','HOME DEPOT'], ['nike','NIKE'], ['disney','WALT DISNEY'], ['procter-gamble','PROCTER & GAMBLE'], ['johnson-johnson','JOHNSON & JOHNSON'], ['exxonmobil','EXXONMOBIL'], ['jpmorgan','JPMORGAN CHASE'], ['caterpillar','CATERPILLAR'], ['waste-management','WASTE MANAGEMENT'],
    ['netflix', 'NETFLIX'], ['visa', 'VISA'], ['cocacola', 'COCA-COLA'],
  ].map(([id, title]) => [id, { title, kind: 'illustration', indexTitle: title }])),
  bitcoin: { title: 'BITCOIN', mark: 'bitcoin.svg', kind: 'logo' },
  etfFR0011550185: { title: 'S&P 500', subtitle: 'BNP Paribas Easy · ETF ESE', kind: 'illustration', posterFundIdentity: true },
  ethereum: { title: 'ETHEREUM', mark: 'ethereum.svg', kind: 'logo' },
  nasdaq100: { title: 'NASDAQ-100', mark: 'nasdaq.svg', kind: 'illustration', unit: 'pts' },
  soxx: { title: 'SEMI-CONDUCTEURS', subtitle: 'ETF SOXX', mark: 'chip.svg', kind: 'illustration' },
  or: { title: 'OR', subtitle: 'Once · moyenne mensuelle', scene: 'gold.webp', kind: 'illustration', unit: '$/oz' },
  silver: { title: 'ARGENT', subtitle: 'Futures COMEX · once', scene: 'silver.webp', kind: 'illustration', unit: '$/oz' },
  apple: { title: 'APPLE', mark: 'apple.svg', kind: 'logo', scene: 'approved/anniversary-apple.webp', embeddedMark: true },
  microsoft: { title: 'MICROSOFT', mark: 'microsoft.svg', kind: 'logo' },
  broadcom: { title: 'BROADCOM', mark: 'broadcom.svg', kind: 'logo' },
  tesla: { title: 'TESLA', mark: 'tesla.svg', kind: 'logo' },
  berkshire: { title: 'BERKSHIRE HATHAWAY', subtitle: 'Classe B', mark: 'holding.svg', kind: 'illustration' },
  asml: { title: 'ASML', subtitle: 'Amsterdam · EUR', mark: 'asml.svg', kind: 'logo' },
})

// Only verified first-party files can replace an asset name. Do not use an
// issuer logo for an index/fund, nor a generated scene containing a brand mark.
const verifiedArt = Object.fromEntries(Object.entries(BASE_ANNIVERSARY_ART).map(([id, art]) => {
  const logo = OFFICIAL_ANNIVERSARY_LOGOS[id]
  if (logo) return [id, { ...art, mark: logo.file, kind: 'logo', scene: undefined, embeddedMark: false, indexTitle: undefined, markMaxWidth: logo.maxWidth, markMaxHeight: logo.maxHeight }]
  if (art.kind === 'logo' || art.mark) return [id, { ...art, mark: undefined, scene: undefined, embeddedMark: false, indexTitle: art.title }]
  return [id, art]
}))
export const ANNIVERSARY_ART = Object.freeze(withHistoryVisuals(verifiedArt))
export { loadArtImage, loadEditorialFont } from '../../lib/art-resources.js'

// Contain, centre and preserve the source colours/alpha; never shade a logo.
export function drawContainedMark(ctx, image, { width = 1160, height = 620 } = {}) {
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight)
  const w = image.naturalWidth * ratio, h = image.naturalHeight * ratio
  ctx.drawImage(image, (1600 - w) / 2, 605 - h / 2, w, h)
}
