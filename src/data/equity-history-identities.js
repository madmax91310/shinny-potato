import { ASSETS } from './market-history.js'
// Reuse the reviewed sector illustrations; never invent company logos.
const groups = {
 chip: ['oracle','salesforce','amd','qualcomm','texas-instruments','applied-materials','lam-research','micron','ibm','servicenow','intuit','palantir','dassault-systemes','infineon','samsung','sk-hynix'],
 finance: ['goldman-sachs','bank-of-america','morgan-stanley','blackrock','american-express','charles-schwab','allianz','munich-re','deutsche-boerse','axa','bnp-paribas','santander'],
 health: ['abbvie','merck','eli-lilly','abbott','thermo-fisher','essilorluxottica','bayer'],
 consumer: ['walmart','inditex','adidas','danone'],
 energy: ['chevron','conocophillips'],
 infrastructure: ['ge-aerospace','honeywell','siemens','airbus','safran','deutsche-telekom'],
 luxury: ['ferrari','bmw'], utilities: ['iberdrola'],
}
export const EQUITY_HISTORY_IDENTITIES = Object.fromEntries(Object.entries(groups).flatMap(([scene, ids]) => ids.filter(id => ASSETS[id]?.instrumentType === 'EQUITY').map(id => [id, {
 title: ASSETS[id].label.toUpperCase(), scene, currency: ASSETS[id].currency,
}])))
