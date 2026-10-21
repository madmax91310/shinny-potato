// Exact existing issuer-qualified listings. This projection never alters other tools.
import EQUITY_LINKS from '../src/data/equity-history-links.json' with {type:'json'}
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js'
import { getInstrumentListings } from '../src/data/instrument-listings.js'
export function universe() {
  const selections = [
    ['IE00B4L5Y983','ETFP','SWDA','Europe/Rome','XMIL'],
    ['IE00B5BMR087','XLON','CSPX','Europe/London','XLON'],
    ['IE00B53SZB19','XAMS','CNDX','Europe/Amsterdam','XAMS'],
    ['IE00BKM4GZ66','XAMS','EMIM','Europe/Amsterdam','XAMS'],
  ]
  const etfs=selections.map(([isin,mic,ticker,timezone,calendar]) => {
    const listing = getInstrumentListings(isin).find(r=>r.mic===mic&&r.ticker===ticker)
    if (!listing?.symbol) throw Error(`Cotation exacte non qualifiée : ${isin}/${mic}/${ticker}`)
    return { id: `${isin}-${mic}`, isin, name: INSTRUMENTS_BY_ISIN[isin].name,
      ...listing, timezone, calendar, instrumentType:'ETF', ucits:true, leveraged:false }
  })
  // Existing ISIN↔symbol proofs from the exact-equity registry. Venue is checked
  // against the live NMS metadata as part of admission, never inferred from currency.
  const equities=['US0378331005','US5949181045'].map(isin=>{
    const proof=Object.values(EQUITY_LINKS).find(r=>r.isin===isin)
    if(!proof)throw Error('Identité action manquante : '+isin)
    return {id:isin+'-XNAS',isin,name:INSTRUMENTS_BY_ISIN[isin].name,ticker:proof.symbol,symbol:proof.symbol,
      mic:'XNAS',exchange:'Nasdaq',currency:proof.currency,timezone:'America/New_York',calendar:'XNYS',
      yahooExchange:'NMS',instrumentType:'EQUITY',sourceUrl:proof.sourceUrl,checkedAt:proof.checkedAt,
      evidenceId:isin+'-XNAS-'+proof.symbol+'-'+proof.currency,leveraged:false,ucits:false}
  })
  return [...etfs,...equities]
}
