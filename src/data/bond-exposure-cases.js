import { getInstrumentReturnValues } from './instrument-returns.js';
import { EXPOSURE_BY_ISIN } from './exposure-additions.js';
const pct = n => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' %';
const long = EXPOSURE_BY_ISIN.IE00B1FZS913, usd = EXPOSURE_BY_ISIN.IE00B2NPKV68;
export const BOND_EXPOSURE_CASES = [
 { id: 'oblig-courtes-longues-reel', category: 'Obligations', title: 'Courtes ou longues : 2022 en chiffres',
 text: `Deux ETF d’obligations d’État en euros. Pourtant, leur durée change tout 👇\n\nEn 2022, revenus réinvestis :\n\n🔹 iShares € Govt Bond 0–1yr : ${pct(getInstrumentReturnValues('IE00B3FH7618')[2])}.\n🔹 iShares € Govt Bond 15–30yr : ${pct(getInstrumentReturnValues(long.isin)[2])}.\n\nLes taux montent : les obligations longues y sont beaucoup plus sensibles. Le mot « État » ne transforme pas un fonds en réserve stable. Les deux paniers diffèrent aussi par leurs emprunts et leurs pays.\n\n💬 Avant d’acheter des obligations, tu vérifies leur durée ?`,
 sources: [{label:'iShares 0–1yr, rendements NAV EUR',url:'https://www.ishares.com/uk/individual/en/products/251741/ishares-euro-government-bond-01yr-ucits-etf'},{label:'iShares 15–30yr, rendements NAV EUR',url:long.perfSource}] },
 { id: 'em-dette-dollar-local', category: 'Obligations', title: 'Dette émergente : dollars ou monnaies locales ?',
 text: '🌍 Tu veux des obligations émergentes. Mais dans quelle monnaie les emprunteurs s’endettent-ils ?\n\n🔹 Dette en dollars : les emprunteurs doivent payer en dollars. Pour toi, le change euro/dollar compte aussi.\n🔹 Dette en monnaies locales : les taux locaux et les monnaies des pays influencent le résultat.\n\nLes deux choix gardent un risque de crédit et de taux. Une distribution mensuelle ne rend pas le capital garanti, et le rendement des coupons ne représente pas à lui seul la performance totale.\n\n💬 Tu regardes d’abord le revenu annoncé ou les risques derrière ?',
 sources:[{label:'iShares dette émergente USD',url:usd.source},{label:'iShares dette émergente locale',url:'https://www.ishares.com/uk/individual/en/literature/fact-sheet/emga-ishares-j-p-morgan-em-local-govt-bond-ucits-etf-fund-fact-sheet-en-gb.pdf'}] },
];
