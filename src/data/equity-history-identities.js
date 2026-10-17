import { ASSETS } from './market-history.js'
import LINKS from './equity-history-links.json' with { type: 'json' }
import GLOBAL from './global-equities.json' with { type: 'json' }
// Reuse the reviewed sector illustrations; never invent company logos.
const groups = {
 chip: ['adi','cdns','palo-alto-networks','tsmc','tencent','oracle','salesforce','amd','qualcomm','texas-instruments','applied-materials','lam-research','micron','ibm','servicenow','intuit','palantir','dassault-systemes','infineon','samsung','sk-hynix'],
 finance: ['msci','fds','sp-global','moodys','goldman-sachs','bank-of-america','morgan-stanley','blackrock','american-express','charles-schwab','allianz','munich-re','deutsche-boerse','axa','bnp-paribas','santander'],
 health: ['syk','regn','vrtx','zts','novo-nordisk','novartis','astrazeneca','intuitive-surgical','abbvie','merck','eli-lilly','abbott','thermo-fisher','essilorluxottica','bayer'],
 consumer: ['hd','low','sbux','cl','mdlz','sony','nintendo','toyota','walmart','inditex','adidas','danone'],
 energy: ['nem','chevron','conocophillips'],
 infrastructure: ['unp','lmt','rsg','adp','etn','tt','thales','legrand','saint-gobain','michelin','abb','deere','linde','ge-aerospace','honeywell','siemens','airbus','safran','deutsche-telekom'],
 luxury: ['ferrari','bmw'], utilities: ['iberdrola'],
}
export const EQUITY_HISTORY_IDENTITIES = Object.fromEntries([...Object.entries(LINKS).filter(([id])=>ASSETS[id]).map(([id,r])=>[id,{title:r.label.toUpperCase(),currency:r.currency,scene:({'Information Technology':'chip','Financials':'finance','Health Care':'health','Energy':'energy','Consumer Staples':'consumer','Consumer Discretionary':'consumer','Utilities':'utilities'})[r.sector]??'infrastructure'}]), ...Object.entries(groups).flatMap(([scene, ids]) => ids.filter(id => ASSETS[id]?.instrumentType === 'EQUITY').map(id => [id, {
 title: ASSETS[id].label.toUpperCase(), scene, currency: ASSETS[id].currency,
}])), ...GLOBAL.filter(a => ASSETS[a.id]?.instrumentType === 'EQUITY').map(a => [a.id, {
 title: a.label.toUpperCase(), scene: a.scene, currency: a.currency,
}])])
