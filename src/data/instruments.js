// Répertoire commun des produits identifiés par ISIN. Noms repris des outils existants :
// cette migration ne constitue pas une nouvelle vérification auprès des émetteurs.
// Les variantes ne changent que le libellé éditorial affiché par un outil.
import { PEA_REVIEWS_BY_ISIN } from './instrument-pea.js';
export const INSTRUMENTS_BY_ISIN = Object.freeze({
  "CH0454664001": Object.freeze({name: "21Shares Bitcoin ETP"}),
  "DE000A0H08Q4": Object.freeze({name: "iShares STOXX Europe 600 Technology UCITS ETF (DE)"}),
  "DE000A27Z304": Object.freeze({name: "Bitwise Physical Bitcoin ETP"}),
  "FR0010342592": Object.freeze({name: "Amundi Nasdaq-100 Daily (2x) Leveraged UCITS ETF Acc"}),
  "FR0010524777": Object.freeze({name: "Amundi MSCI New Energy UCITS ETF Dist"}),
  "FR0010527275": Object.freeze({pea: false, name: "Amundi MSCI Water UCITS ETF (Dist)", labels: {"portfolio": "Amundi MSCI Water UCITS ETF"}}),
  "FR0010755611": Object.freeze({name: "Amundi MSCI USA Daily (2x) Leveraged UCITS ETF Acc"}),
  "FR0011440478": Object.freeze({name: "Amundi PEA Emergent EMEA (MSCI Emerging EMEA) ESG Transition UCITS ETF"}),
  "FR0011550185": Object.freeze({name: "BNP Paribas Easy S&P 500 UCITS ETF (Acc)"}),
  "FR0011550193": Object.freeze({name: "BNP Paribas Easy STOXX Europe 600 UCITS ETF"}),
  "FR0011869320": Object.freeze({name: "Amundi PEA Inde (MSCI India) UCITS ETF"}),
  "FR0011871078": Object.freeze({name: "Amundi PEA Chine (MSCI China) Screened UCITS ETF"}),
  "FR0011871110": Object.freeze({pea: true, name: "Amundi PEA Nasdaq-100 UCITS ETF", labels: {"index": "Amundi PEA Nasdaq-100 UCITS ETF (Acc)"}}),
  "FR0011871128": Object.freeze({pea: true, name: "Amundi PEA S&P 500 UCITS ETF", labels: {"index": "Amundi PEA S&P 500 UCITS ETF (Acc)"}}),
  "FR0013380607": Object.freeze({name: "Amundi CAC 40 UCITS ETF"}),
  "FR0013411980": Object.freeze({name: "Amundi PEA Japan (TOPIX) UCITS ETF", labels: {"index": "Amundi PEA Japon (TOPIX) UCITS ETF"}}),
  "FR0013411998": Object.freeze({pea: true, name: "Amundi PEA Japon (TOPIX) UCITS ETF EUR Hedged Acc"}),
  "FR0013412004": Object.freeze({name: "Amundi PEA Amérique Latine (MSCI Emerging Latin America Selection) UCITS ETF"}),
  "FR0013412012": Object.freeze({name: "Amundi PEA Asie Emergente (MSCI Emerging Asia) Screened UCITS ETF"}),
  "FR0013412020": Object.freeze({name: "Amundi PEA Emergent (MSCI Emerging) ESG Transition UCITS ETF"}),
  "FR0013412038": Object.freeze({name: "Amundi PEA MSCI Europe UCITS ETF (Acc)"}),
  "FR0013416716": Object.freeze({name: "Amundi Physical Gold ETC"}),
  "FR001400S9V0": Object.freeze({name: "Amundi PEA Luxe Monde UCITS ETF"}),
  "FR001400U5Q4": Object.freeze({pea: true, name: "Amundi PEA Monde (MSCI World) UCITS ETF", labels: {"index": "Amundi PEA Monde (MSCI World) UCITS ETF (Acc)"}}),
  "FR0014017NX3": Object.freeze({name: "Amundi PEA Global (MSCI ACWI) UCITS ETF (Acc)"}),
  "GB00B15KXQ89": Object.freeze({name: "WisdomTree Copper"}),
  "GB00BJYDH287": Object.freeze({name: "WisdomTree Physical Bitcoin"}),
  "GB00BLD4ZL17": Object.freeze({pea: false, name: "CoinShares Physical Bitcoin ETP"}),
  "GB00BLD4ZM24": Object.freeze({name: "CoinShares Ethereum Staking ETP"}),
  "IE0000N55FP4": Object.freeze({name: "iShares MSCI Europe Small Cap UCITS ETF"}),
  "IE0002XZSHO1": Object.freeze({name: "iShares MSCI World Swap PEA UCITS ETF (Acc)"}),
  "IE0002Y8CX98": Object.freeze({name: "WisdomTree Europe Defence UCITS ETF"}),
  "IE0006WW1TQ4": Object.freeze({name: "Xtrackers MSCI World ex USA UCITS ETF 1C"}),
  "IE0007Y8Y157": Object.freeze({pea: false, name: "VanEck Quantum Computing UCITS ETF A", labels: {"tweet": "VanEck Quantum Computing UCITS ETF"}}),
  "IE000C6ITGC8": Object.freeze({name: "iShares Quantum Computing UCITS ETF"}),
  "IE000DQLYVB9": Object.freeze({pea: true, name: "iShares S&P 500 Swap PEA UCITS ETF", labels: {"index": "iShares S&P 500 Swap PEA UCITS ETF (Acc)"}}),
  "IE000I8KRLL9": Object.freeze({pea: false, name: "iShares MSCI Global Semiconductors UCITS ETF"}),
  "IE000L6ZMMC4": Object.freeze({name: "Xtrackers FTSE All-World UCITS ETF 1C"}),
  "IE000M7V94E1": Object.freeze({pea: false, name: "VanEck Uranium and Nuclear Technologies UCITS ETF"}),
  "IE000QDFFK00": Object.freeze({name: "BNP Paribas Easy II Nasdaq 100 UCITS ETF (Acc)"}),
  "IE000RDRMSD1": Object.freeze({pea: false, name: "iShares Blockchain Technology UCITS ETF"}),
  "IE000W8WMSL2": Object.freeze({name: "WisdomTree Quantum Computing UCITS ETF"}),
  "IE000XZSV718": Object.freeze({name: "SPDR S&P 500 UCITS ETF Acc"}),
  "IE000YU9K6K2": Object.freeze({pea: false, name: "VanEck Space Innovators UCITS ETF"}),
  "IE000YYE6WK5": Object.freeze({pea: false, name: "VanEck Defense UCITS ETF"}),
  "IE00B02KXK85": Object.freeze({name: "iShares China Large Cap UCITS ETF (Dist)"}),
  "IE00B0M62X26": Object.freeze({name: "iShares € Inflation Linked Govt Bond UCITS ETF"}),
  "IE00B0M63623": Object.freeze({name: "iShares MSCI Taiwan UCITS ETF"}),
  "IE00B14X4Q57": Object.freeze({name: "iShares € Govt Bond 1-3yr UCITS ETF"}),
  "IE00B1FZS350": Object.freeze({pea: false, name: "iShares Developed Markets Property Yield UCITS ETF USD (Dist)", labels: {"portfolio": "iShares Developed Markets Property Yield UCITS ETF"}}),
  "IE00B1XNHC34": Object.freeze({name: "iShares Global Clean Energy Transition UCITS ETF"}),
  "IE00B3F81R35": Object.freeze({pea: false, name: "iShares Core € Corp Bond UCITS ETF (Dist)", labels: {"portfolio": "iShares Core € Corp Bond UCITS ETF"}}),
  "IE00B3T9LM79": Object.freeze({name: "SPDR € Corp Bond UCITS ETF"}),
  "IE00B3VVMM84": Object.freeze({name: "Vanguard FTSE Emerging Markets UCITS ETF (Dist)"}),
  "IE00B3WJKG14": Object.freeze({name: "iShares S&P 500 Information Technology Sector UCITS ETF"}),
  "IE00B40B8R38": Object.freeze({name: "iShares S&P 500 Consumer Staples Sector UCITS ETF"}),
  "IE00B42NKQ00": Object.freeze({name: "iShares S&P 500 Energy Sector UCITS ETF"}),
  "IE00B43HR379": Object.freeze({name: "iShares S&P 500 Health Care Sector UCITS ETF"}),
  "IE00B44Z5B48": Object.freeze({name: "SPDR MSCI ACWI UCITS ETF", labels: {"index": "SPDR MSCI ACWI UCITS ETF (Acc)"}}),
  "IE00B469F816": Object.freeze({name: "SPDR MSCI Emerging Markets UCITS ETF"}),
  "IE00B4JNQZ49": Object.freeze({name: "iShares S&P 500 Financials Sector UCITS ETF"}),
  "IE00B4K48X80": Object.freeze({name: "iShares Core MSCI Europe UCITS ETF"}),
  "IE00B4K6B022": Object.freeze({name: "HSBC EURO STOXX 50"}),
  "IE00B4KBBD01": Object.freeze({name: "iShares S&P 500 Utilities Sector UCITS ETF"}),
  "IE00B4L5Y983": Object.freeze({name: "iShares Core MSCI World UCITS ETF (Acc)", labels: {"portfolio": "iShares Core MSCI World UCITS ETF"}}),
  "IE00B4L5YX21": Object.freeze({name: "iShares Core MSCI Japan IMI UCITS ETF (Acc)", labels: {"portfolio": "iShares Core MSCI Japan IMI UCITS ETF"}}),
  "IE00B4NCWG09": Object.freeze({name: "iShares Physical Silver ETC"}),
  "IE00B4ND3602": Object.freeze({pea: false, name: "iShares Physical Gold ETC"}),
  "IE00B4WXJJ64": Object.freeze({pea: false, name: "iShares Core Euro Government Bond UCITS ETF (Dist)", labels: {"portfolio": "iShares Core € Govt Bond UCITS ETF"}}),
  "IE00B52SFT06": Object.freeze({name: "iShares MSCI USA UCITS ETF (Acc)"}),
  "IE00B53L3W79": Object.freeze({name: "iShares Core EURO STOXX 50 UCITS ETF", labels: {"index": "iShares Core EURO STOXX 50 (Acc)"}}),
  "IE00B53SZB19": Object.freeze({name: "iShares Nasdaq 100 UCITS ETF"}),
  "IE00B579F325": Object.freeze({name: "Invesco Physical Gold ETC"}),
  "IE00B5BMR087": Object.freeze({name: "iShares Core S&P 500 UCITS ETF"}),
  "IE00B5M1WJ87": Object.freeze({name: "SPDR S&P Euro Dividend Aristocrats UCITS ETF (Dist)"}),
  "IE00B5W4TY14": Object.freeze({name: "iShares MSCI Korea UCITS ETF"}),
  "IE00B66F4759": Object.freeze({pea: false, name: "iShares Euro High Yield Corporate Bond UCITS ETF (Dist)", labels: {"portfolio": "iShares € High Yield Corp Bond UCITS ETF"}}),
  "IE00B6R52259": Object.freeze({pea: false, name: "iShares MSCI ACWI UCITS ETF USD (Acc)", labels: {"portfolio": "iShares MSCI ACWI UCITS ETF"}}),
  "IE00B6YX5D40": Object.freeze({pea: false, name: "SPDR S&P US Dividend Aristocrats UCITS ETF"}),
  "IE00B8FHGS14": Object.freeze({pea: false, name: "iShares Edge MSCI World Minimum Volatility UCITS ETF"}),
  "IE00B8GKDB10": Object.freeze({name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF", labels: {"index": "Vanguard FTSE All-World High Dividend Yield UCITS ETF (Dist)", "portfolio": "Vanguard FTSE All-World High Dividend Yield UCITS ETF Dist"}}),
  "IE00B9CQXS71": Object.freeze({name: "SPDR S&P Global Dividend Aristocrats UCITS ETF", variants: {"strat_dividendes_dist": "SPDR S&P Global Dividend Aristocrats UCITS ETF Dist"}}),
  "IE00BD4TXV59": Object.freeze({name: "UBS Core MSCI World UCITS ETF"}),
  "IE00BD6FTQ80": Object.freeze({name: "Invesco Bloomberg Commodity UCITS ETF"}),
  "IE00BDFBTQ78": Object.freeze({name: "VanEck S&P Global Mining UCITS ETF"}),
  "IE00BDFL4P12": Object.freeze({name: "iShares Diversified Commodity Swap UCITS ETF"}),
  "IE00BF0M2Z96": Object.freeze({pea: false, name: "L&G Battery Value-Chain UCITS ETF"}),
  "IE00BF3N7094": Object.freeze({pea: false, name: "iShares € High Yield Corp Bond UCITS ETF (Acc)"}),
  "IE00BF4RFH31": Object.freeze({pea: false, name: "iShares MSCI World Small Cap UCITS ETF"}),
  "IE00BFZPF546": Object.freeze({pea: false, name: "iShares J.P. Morgan EM Local Govt Bond UCITS ETF (Acc)"}),
  "IE00BG0J4C88": Object.freeze({name: "iShares Digital Security UCITS ETF"}),
  "IE00BGV5VN51": Object.freeze({name: "Xtrackers Artificial Intelligence and Big Data UCITS ETF"}),
  "IE00BJ5JNY98": Object.freeze({pea: false, name: "iShares MSCI World Information Technology Sector Advanced UCITS ETF USD (Dist)", labels: {"portfolio": "iShares MSCI World Information Technology Sector Advanced UCITS ETF"}}),
  "IE00BJ5JNZ06": Object.freeze({name: "iShares MSCI World Health Care Sector Advanced UCITS ETF"}),
  "IE00BJ5JP097": Object.freeze({pea: false, name: "iShares MSCI World Financials Sector Advanced UCITS ETF USD (Dist)"}),
  "IE00BJ5JPG56": Object.freeze({name: "iShares MSCI China UCITS ETF (Acc)"}),
  "IE00BK5BCD43": Object.freeze({pea: false, name: "L&G Artificial Intelligence UCITS ETF"}),
  "IE00BK5BCH80": Object.freeze({name: "L&G Clean Energy UCITS ETF"}),
  "IE00BK5BQT80": Object.freeze({pea: false, name: "Vanguard FTSE All-World UCITS ETF (USD) Accumulating", labels: {"tweet": "Vanguard FTSE All-World UCITS ETF", "index": "Vanguard FTSE All-World UCITS ETF (Acc)", "portfolio": "Vanguard FTSE All-World UCITS ETF"}}),
  "IE00BK5BR626": Object.freeze({name: "Vanguard FTSE All-World High Dividend Yield UCITS ETF"}),
  "IE00BK5BR733": Object.freeze({name: "Vanguard FTSE Emerging Markets UCITS ETF (Acc)", labels: {"portfolio": "Vanguard FTSE Emerging Markets UCITS ETF"}}),
  "IE00BK95B138": Object.freeze({name: "iShares $ Treasury Bond UCITS ETF"}),
  "IE00BKM4GZ66": Object.freeze({pea: false, name: "iShares Core MSCI EM IMI UCITS ETF", labels: {"index": "iShares Core MSCI EM IMI UCITS ETF (Acc)"}}),
  "IE00BKPSFC54": Object.freeze({name: "iShares MSCI World Quality Dividend Advanced UCITS ETF"}),
  "IE00BKPX3K41": Object.freeze({name: "iShares MSCI AC Far East ex-Japan UCITS ETF"}),
  "IE00BM67HK77": Object.freeze({name: "Xtrackers MSCI World Health Care UCITS ETF"}),
  "IE00BM67HS53": Object.freeze({name: "Xtrackers MSCI World Materials UCITS ETF"}),
  "IE00BM8R0J59": Object.freeze({pea: false, name: "Global X Nasdaq 100 Covered Call UCITS ETF", labels: {"portfolio": "Global X Nasdaq 100 Covered Call UCITS ETF (QYLD)"}}),
  "IE00BMG6Z448": Object.freeze({name: "iShares MSCI EM ex-China UCITS ETF (Acc)"}),
  "IE00BMW42413": Object.freeze({name: "iShares MSCI Europe Information Technology Sector UCITS ETF"}),
  "IE00BP3QZ601": Object.freeze({pea: false, name: "iShares Edge MSCI World Quality Factor UCITS ETF (Acc)", labels: {"portfolio": "iShares Edge MSCI World Quality Factor UCITS ETF"}}),
  "IE00BP3QZ825": Object.freeze({pea: false, name: "iShares Edge MSCI World Momentum Factor UCITS ETF (Acc)", labels: {"portfolio": "iShares Edge MSCI World Momentum Factor UCITS ETF"}}),
  "IE00BP3QZB59": Object.freeze({pea: false, name: "iShares Edge MSCI World Value Factor UCITS ETF", labels: {"index": "iShares Edge MSCI World Value Factor UCITS ETF (Acc)"}}),
  "IE00BQT3WG13": Object.freeze({name: "iShares MSCI China A UCITS ETF (Acc)"}),
  "IE00BTJRMP35": Object.freeze({name: "Xtrackers MSCI Emerging Markets UCITS ETF"}),
  "IE00BYPLS672": Object.freeze({pea: false, name: "L&G Cyber Security UCITS ETF"}),
  "IE00BYTRR863": Object.freeze({pea: false, name: "SPDR MSCI World Energy UCITS ETF"}),
  "IE00BYXG2H39": Object.freeze({pea: false, name: "iShares Nasdaq US Biotechnology UCITS ETF"}),
  "IE00BYYHSQ67": Object.freeze({name: "iShares MSCI World Quality Dividend Advanced UCITS ETF (Dist)", labels: {"portfolio": "iShares MSCI World Quality Dividend Advanced UCITS ETF Dist"}}),
  "IE00BYZK4552": Object.freeze({pea: false, name: "iShares Automation & Robotics UCITS ETF"}),
  "IE00BZ163G84": Object.freeze({name: "Vanguard € Corp Bond UCITS ETF"}),
  "IE00BZ56SW52": Object.freeze({name: "WisdomTree Global Quality Dividend Growth UCITS ETF"}),
  "JE00B1VS3770": Object.freeze({name: "WisdomTree Physical Gold"}),
  "LU0908500753": Object.freeze({name: "Amundi Core STOXX Europe 600 UCITS ETF"}),
  "LU1437018838": Object.freeze({name: "Amundi FTSE EPRA NAREIT Global UCITS ETF"}),
  "LU1681043599": Object.freeze({name: "Amundi MSCI World Swap UCITS ETF (Acc)", labels: {"portfolio": "Amundi MSCI World UCITS ETF"}}),
  "LU1681045370": Object.freeze({name: "Amundi MSCI Emerging Markets UCITS ETF"}),
  "LU1681047236": Object.freeze({pea: true, name: "Amundi Core EURO STOXX 50 UCITS ETF"}),
  "LU1681048630": Object.freeze({pea: false, name: "Amundi S&P Global Luxury UCITS ETF", labels: {"tweet": "Amundi Global Luxury UCITS ETF", "portfolio": "Amundi Global Luxury UCITS ETF"}}),
  "LU1737652823": Object.freeze({name: "Amundi FTSE EPRA NAREIT Global UCITS ETF Dist"}),
  "LU1834983550": Object.freeze({pea: true, name: "Amundi STOXX Europe 600 Basic Resources UCITS ETF"}),
  "LU1834983634": Object.freeze({name: "Amundi STOXX Europe 600 Basic Materials UCITS ETF"}),
  "LU1834986900": Object.freeze({name: "Amundi STOXX Europe 600 Healthcare UCITS ETF"}),
  "LU1834988518": Object.freeze({name: "Amundi STOXX Europe 600 Technology UCITS ETF"}),
  "LU1875395870": Object.freeze({name: "Xtrackers Nikkei 225 UCITS ETF"}),
  "LU1931975079": Object.freeze({name: "Amundi Core EUR Corporate Bond UCITS ETF"}),
  "LU2089238385": Object.freeze({name: "Amundi Prime Japan UCITS ETF"}),
  "LU2196470426": Object.freeze({name: "Xtrackers Nikkei 225 UCITS ETF 1C (Acc)"}),
  "LU2970735911": Object.freeze({name: "Amundi Core EUR High Yield Bond UCITS ETF"}),
  "LU3038520774": Object.freeze({name: "Amundi STOXX Europe Defense UCITS ETF"}),
  "NL0009690239": Object.freeze({name: "VanEck Global Real Estate UCITS ETF"}),
  "NL0011683594": Object.freeze({name: "VanEck Morningstar Developed Markets Dividend Leaders UCITS ETF"}),
});

export function getInstrument(isin) {
  const instrument = INSTRUMENTS_BY_ISIN[isin];
  if (!instrument) throw new Error(`Produit inconnu : ${isin}`);
  return instrument;
}

export function getInstrumentName(isin, context, variant) {
  const instrument = getInstrument(isin);
  return (variant && instrument.variants?.[variant]) || instrument.labels?.[context] || instrument.name;
}

// Seules les fiches qui ont documenté le statut PEA sont renseignées.
// Une absence est inconnue, jamais assimilée à « non éligible ».
export function getInstrumentPeaStatus(isin) {
  const review = PEA_REVIEWS_BY_ISIN[isin];
  if (review) return review.eligible;
  const { pea } = getInstrument(isin);
  return typeof pea === 'boolean' ? pea : null;
}

export function getInstrumentPea(isin) {
  const pea = getInstrumentPeaStatus(isin);
  if (pea === null) throw new Error(`Éligibilité PEA non documentée pour ${isin}`);
  return pea;
}

export function affirmInstrumentPea(isin, expected, wording) {
  const actual = getInstrumentPeaStatus(isin);
  if (actual !== expected) throw new Error(`Mention PEA non documentée ou contradictoire pour ${isin}`);
  return wording;
}
