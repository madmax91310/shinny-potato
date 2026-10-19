import { readFileSync } from 'node:fs'
import profiles from '../src/data/company-profiles.json' with {type:'json'}
import { ASSETS } from '../src/data/market-history.js'
import { COMPANY_HISTORY } from '../src/data/company-history.js'
export const EQUITY_ALIASES={'novo-nordisk':'novo','saint-gobain':'saintgobain',linde:'lin',moodys:'mco','air-liquide':'airliquide',totalenergies:'total','waste-management':'wasteManagement','bnp-paribas':'bnp','coca-cola':'cocacola',google:'alphabet','home-depot':'hd',mcdonalds:'mcd',abbvie:'abbv','thermo-fisher':'tmo',oracle:'orcl',qualcomm:'qcom','texas-instruments':'txn',micron:'mu','applied-materials':'amat',exxonmobil:'xom',chevron:'cvx',conocophillips:'cop'}
export function equityUniverse({includeUnqualified=false}={}){
 const rows={}
 const put=(id,r)=>{id=EQUITY_ALIASES[id]||id;rows[id]={...rows[id],...r,id,aliases:Object.keys(EQUITY_ALIASES).filter(k=>EQUITY_ALIASES[k]===id)}}
 for(const p of profiles.filter(p=>!p.candidateOnly))put(p.id,{name:p.name,tickers:[p.symbol],currency:p.currency,sourceUrl:p.sourceUrl})
 const historyIds=[...Object.keys(COMPANY_HISTORY),'lvmh','apple','microsoft','broadcom','tesla','nvidia','amazon','google','meta','nestle','sap','visa','netflix','cocacola',...Object.keys(ASSETS).filter(k=>ASSETS[k].instrumentType==='EQUITY')]
 for(const id of historyIds){const a=ASSETS[id];put(id,{name:a.label,...(a.isin?{isin:a.isin}:{}),...(a.ticker?{tickers:[a.ticker]}:{}),currency:a.currency})}
 for(const file of ['monthly-automation.json','non-bond-monthly-sources.json'])for(const r of JSON.parse(readFileSync(new URL(file,import.meta.url))).series){const id=EQUITY_ALIASES[r.id]||r.id;if(rows[id]&&r.symbol)rows[id].tickers=[...new Set([...(rows[id].tickers||[]),r.symbol])]}
 const ids={...JSON.parse(readFileSync(new URL('dca-equity-identities.json',import.meta.url))),...JSON.parse(readFileSync(new URL('dca-equity-extra-identities.json',import.meta.url)))}
 // A curated candidate joins the exposure catalogue once the issuer holdings have classified
 // its exact ISIN; until then it only exists for the classification collector.
 const candidates=JSON.parse(readFileSync(new URL('global-equity-candidates.json',import.meta.url))).candidates
 const classified=JSON.parse(readFileSync(new URL('../src/data/dca-security-classifications.json',import.meta.url)))
 const unclassifiedCandidates=new Set(candidates.filter(c=>!classified[c.isin]).map(c=>c.isin))
 for(const [id,isin]of Object.entries(ids))if(!unclassifiedCandidates.has(isin))put(id,{isin})
 // Curated international identities keep their published label and expected listing before and after qualification.
 for(const r of [...JSON.parse(readFileSync(new URL('../src/data/global-equities.json',import.meta.url))),...candidates.filter(c=>!unclassifiedCandidates.has(c.isin))])put(r.id,{name:r.label,isin:r.isin,currency:r.currency,...(r.symbol?{tickers:[...new Set([...(rows[r.id]?.tickers||[]),r.symbol])]}:{})})
 // Issuer harmonised the NYSE ordinary-share listing on 2 February 2026; the ADR programme closed.
 // https://www.astrazeneca.com/media-centre/press-releases/2026/astrazeneca-begins-trading-on-NYSE.html
 if(rows.astrazeneca)rows.astrazeneca.name='AstraZeneca (NYSE)'
 const primaryByIsin=new Map()
 for(const [id,row] of Object.entries(rows)){
  if(!row.isin)continue
  const primary=primaryByIsin.get(row.isin)
  if(!primary){primaryByIsin.set(row.isin,row);continue}
  primary.aliases=[...new Set([...(primary.aliases??[]),id,...(row.aliases??[])])]
  primary.tickers=[...new Set([...(primary.tickers??[]),...(row.tickers??[])])]
  delete rows[id]
 }
 for(const r of Object.values(rows)){r.kind='equity';r.tickers||=[];r.name||=r.id;r.isin||=''}
 // Financial-account qualification does not establish an exact security identity.
 // Keep these companies in the analysis tool and report the missing exposure identity.
 return includeUnqualified?rows:Object.fromEntries(Object.entries(rows).filter(([,r])=>/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(r.isin)))
}

export function equityExposureGaps(){
 const reason='Entreprise disponible dans l’analyse financière, mais ISIN exact non qualifié pour les outils d’exposition. Raccorder une identité sourcée avant la classification pays/secteur.'
 return Object.values(equityUniverse({includeUnqualified:true})).filter(r=>!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(r.isin)).map(r=>({id:r.id,name:r.name,type:'equity',field:'identity',label:'Identité ISIN pour les expositions',state:'unqualified',present:false,automationConfigured:false,checkedAt:null,asOf:null,sourceUrl:r.sourceUrl??null,tools:['dca-profiles'],reason,diagnostic:{code:'missing-isin',reason}}))
}

