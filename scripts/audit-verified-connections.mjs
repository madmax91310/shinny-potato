// Reproducible consumer audit. A registry declaration is never a successful route.
import { readFileSync, writeFileSync } from 'node:fs'
import { INSTRUMENTS_BY_ISIN } from '../src/data/instruments.js'
import { AUTOMATED_ETF } from '../src/data/automated-etf.js'
import INDICES from '../src/data/automated-indices.json' with {type:'json'}
import UNDERLIERS from '../src/data/vanguard-equity-underliers.json' with {type:'json'}
import { ETFS } from '../src/data/etf-cards.js'
import { SHEETS } from '../src/pages/factsheet-tweets/data.js'
import { ASSETS as HISTORY, ASSET_ORDER } from '../src/data/market-history.js'
import EQUITIES from '../src/data/equity-history-links.json' with {type:'json'}
import * as performance from '../src/pages/tweet-midi/data/performanceHistory.js'
import { derive } from '../src/pages/investment-calculator/lib.js'
import { RANKING_ASSETS, ANNUAL_ASSETS } from '../src/pages/performance-rankings/data.js'
import { commonCoverage } from '../src/pages/performance-rankings/engine.js'
import { ASSETS as PORTFOLIO } from '../src/data/portfolio-assets.js'
import { CATALOG } from '../src/data/duel-assets.js'
import { PROFILES } from '../src/pages/portfolio-generator/theses.js'
import { getRecipes } from '../src/pages/portfolio-generator/recipes.js'
import { assetReturn } from '../src/pages/portfolio-generator/performance.js'
import { latestCommonYears } from '../src/data/annual-window.js'
import { references } from '../src/pages/dca-profiles/records.js'
import { catalogCoverage, sharedPositions } from '../src/pages/dca-profiles/verification.js'
import { buildAssetFieldReport } from './report-asset-fields.mjs'
import { INDEX_HISTORY_ALIASES as aliases, canonicalIndexHistoryId } from '../src/data/index-history-identities.js'
import { returnConvention } from '../src/lib/return-convention.js'
import { QUALIFIED_FUND_CALENDARS, QUALIFIED_INDEX_CALENDARS } from '../src/data/qualified-annual-calendars.js'
const read=p=>JSON.parse(readFileSync(p,'utf8'))
const baselinePath='docs/verified-connections-baseline-2026-10-21.json'
const baseline=read(baselinePath)
const today=new Date()
const normalize=name=>name.replace(/^Indice /,'').toLowerCase().replace(/[^a-z0-9]/g,'')
// Audited exact-index aliases. Currency and return convention are still part of the key.
const universe=new Map(), sourceByAlias=new Map()
const monthlyConfig=[...read('scripts/monthly-automation.json').series,...read('scripts/non-bond-monthly-sources.json').series]
const observations={...read('src/data/automated-monthly.json'),...read('src/data/automated-etf-monthly.json'),...read('src/data/non-bond-monthly-records.json')}
const symbolIdentity=new Map(Object.values(EQUITIES).map(a=>[`${a.symbol}|${a.currency}`,a.isin]))
function key(a) {
 const id=canonicalIndexHistoryId(a.indexId??a.id), config=monthlyConfig.find(c=>c.id===id)
 const linked=a.isin??symbolIdentity.get(`${config?.symbol}|${a.currency}`)
 if(linked&&a.priceUnit!=='points')return linked
 if(a.priceUnit==='points'||a.indexId) {
  const index=aliases[id]??(INDICES[id]?id:null)
  return `index:${index??normalize((a.label??a.name??id).replace(/\s+(?:NETR|GRTR)$/,''))}:${returnConvention(a)??returnConvention({detail:a.anniversaryVariant})??'unspecified'}:${a.currency??'unknown'}`
 }
 return `series:${id}`
}
function insert(a,kind) {
 const k=key(a); if(!universe.has(k))universe.set(k,{key:k,name:a.name??a.label??k,isin:/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(k)?k:null,kind,aliases:new Set(),histories:[],indexId:a.indexId??aliases[a.id]??(INDICES[a.id]?a.id:null)})
 const entry=universe.get(k);if(a.id)entry.aliases.add(a.id)
 return entry
}
for(const[isin,a]of Object.entries(INSTRUMENTS_BY_ISIN))insert({...a,isin},a.instrumentType==='EQUITY'?'equity':'fund')
for(const[id,a]of Object.entries(HISTORY)){const item={...a,id,detail:a.methodNote};const entry=insert(item,a.priceUnit==='points'?'index':a.isin?'fund':'series');entry.histories.push({...item,evidence:observations[id]??(a.responseSha256?a:null)});sourceByAlias.set(id,key(item))}
for(const[id,record]of Object.entries(INDICES)) {
 const s=record.returns
 const name=s?.performance?.detail?.split(/[,·]/)[0].trim()??record.facts?.index??id
 const asset={id,indexId:id,label:name,priceUnit:'points',currency:s?.currency,variant:({NET:'NETR',GROSS:'GRTR'})[s?.variant]??s?.variant}
 const e=insert(asset,record.facts?'index':'reference');e.indexId=id;e.official=record
}
for(const[isin,a]of Object.entries(UNDERLIERS))insert({...a,isin},'fund')
for(const[id,a]of Object.entries({...RANKING_ASSETS,...ANNUAL_ASSETS}))insert({...a,id},a.priceUnit==='points'?'index':a.isin?'fund':'series')
for(const a of performance.MARKET_ASSETS)insert(a,a.priceUnit==='points'?'index':a.isin?'fund':'series')
const routeKey=a=>a.isin ? key(a) : sourceByAlias.get(a.id)??key(a)
const rawCompleteHoldings=read('src/data/dca-complete-holdings.json')
for(const isin of Object.keys(rawCompleteHoldings))if(!universe.has(isin))insert({isin,name:`Composition collectée · ${isin} (identité de la part à qualifier)`},'fund')
for(const a of PORTFOLIO)insert(a,a.isin?'fund':'reference')
const usedIds=new Set(PROFILES.flatMap(p=>Object.keys(p.riskCombos).flatMap(r=>getRecipes(p.id,r).flatMap(recipe=>recipe.assets.flatMap(slot=>slot.idOptions??[slot.id])))))
const tools=['performance-depuis','et-si-investi','qui-comparaison','qui-classement-annuel','presentation-etf','coulisses-indices','exposition-pays','exposition-secteurs','recouvrement-complet','portefeuille-manuel','duels','portefeuille-automatique']
const requirements={
 'performance-depuis':'Années civiles consécutives réelles ; clôtures décembre ou calendrier NAV/indice exact ; change aux deux bornes.',
 'et-si-investi':'Historique mensuel réel ; calcul en une fois et DCA, unités et devise, dates bornées aux observations ; aucun calendrier annuel synthétisé.',
 'qui-comparaison':'Mensuel continu avec convention homogène, ou banque annuelle officielle séparée ; période commune.',
 'qui-classement-annuel':'Au moins deux années civiles complètes consécutives communes ; convention homogène ; couleurs fixes et ex æquo.',
 'presentation-etf':'Indice, TER, AUM, réplication, distribution, devise et preuve PEA ou inconnu explicite.',
 'coulisses-indices':'Pays, secteurs, entreprises pondérées de l’indice exact ; rendement qualifié ; aucune substitution ETF.',
 'exposition-pays':'Observation datée, méthode qualifiée, exposition économique ; poids inconnus conservés.',
 'exposition-secteurs':'Observation datée, classification et exposition économique qualifiées ; inconnus conservés.',
 'recouvrement-complet':'Positions complètes actuelles et identifiées ≥99,5 %, périmètres/dates compatibles, identifiants entreprises vérifiés.',
 'portefeuille-manuel':'Au moins trois années réelles communes, devise et change documentés ; aucune extension avant lancement.',
 'duels':'Trois années communes réelles et change documenté ; cœurs de portefeuille existants préservés.',
 'portefeuille-automatique':'Six années qualifiées + rôle, profil, plafonds, doublons, PEA et bornes de risque validés.',
}
const memberships=new Map(tools.map(t=>[t,new Map()]))
function admit(tool,a,engine=true,detail='') {const k=routeKey(a),m=memberships.get(tool); if(!m.has(k))m.set(k,[]);m.get(k).push({id:a.id,engine,detail,currency:a.currency??a.returnCurrency,basis:a.basis??a.priceMethod,frequency:a.frequency??(a.points?'monthly':a.years||a.calendarReturns?'annual':null),variant:returnConvention(a)??returnConvention({detail}),periodStart:a.points?.[0]?.date??a.periodStart??null,periodEnd:a.points?.at(-1)?.date??a.periodEnd??null,points:a.points?.length??null,years:a.years??a.calendarReturns,sourceUrls:a.sourceUrls??[a.source].filter(v=>typeof v==='string'),checkedAt:a.checkedAt})}
for(const a of performance.MARKET_ASSETS)if(performance.getAnnualReturnStartYears(a.id).length)admit('performance-depuis',a,true,performance.performanceBasis(a.id))
for(const id of ASSET_ORDER){const a={...HISTORY[id],id},first=a.points[0].date;let valid=true,detail='Versement unique et DCA sur la période mensuelle réelle.';try{for(const mode of ['lump','dca']){const d=derive({assetId:id,startYear:Number(first.slice(0,4)),startMonth:Number(first.slice(5)),amountRaw:'1000',mode,currency:'EUR',overridePriceRaw:''});if(!Number.isFinite(d.result.finalValue))throw Error('Résultat non fini')}}catch(e){valid=false;detail=e.message}admit('et-si-investi',a,valid,detail)}
for(const a of Object.values({...RANKING_ASSETS,...ANNUAL_ASSETS})){
 let engine=true,detail='',years=[];try{years=commonCoverage([a,{...a,id:'audit-reference'}]).years}catch(e){engine=false;detail=e.message}
 admit('qui-comparaison',a,engine,detail);const annualReady=years.some((year,i)=>i>0&&year===years[i-1]+1)
 admit('qui-classement-annuel',a,engine&&annualReady,detail||(!annualReady?'Le classement annuel actuel exige deux années civiles complètes consécutives.':''))
}
for(const a of ETFS)admit('presentation-etf',{...a,label:a.name},true)
for(const a of SHEETS){const s=INDICES[a.id]?.returns;const item={...(a.compositionOnly?HISTORY[a.id]:{}),...a,indexId:a.id,label:a.indexFacts.index,priceUnit:'points',currency:s?.currency??HISTORY[a.id]?.currency,variant:({NET:'NETR',GROSS:'GRTR'})[s?.variant]??s?.variant};const e=insert(item,'index');if(a.compositionOnly)e.official={facts:a.indexFacts};admit('coulisses-indices',item,true)}
const coverage=catalogCoverage(references),manifest=read('src/pages/dca-profiles/holdings-manifest.json')
const holdings=Object.assign({},...[...new Set(Object.values(manifest))].map(n=>read(`src/pages/dca-profiles/holdings-${n}.json`)))
for(const c of coverage){const a={...references[c.asset],id:c.asset};insert(a,a.kind==='equity'?'equity':'fund')
 for(const f of ['countries','sectors'])admit(f==='countries'?'exposition-pays':'exposition-secteurs',a,c[f].coverage>0,c[f].reason)
 const line={asset:c.asset,isin:c.isin,label:c.name,weight:50};const copy={...references,[c.asset+'-copy']:references[c.asset]}
 const self=sharedPositions([line,{...line,asset:c.asset+'-copy'}],copy,today,{...holdings,[c.asset+'-copy']:holdings[c.asset]})
 admit('recouvrement-complet',a,self.pairs[0]?.full===true,self.pairs[0]?.full?'Liste complète identifiée ; regroupement entreprise vérifié.':`Recouvrement complet interdit ; couverture identifiée ${self.pairs[0]?.identifiedCoverage?.[0]??0} %, données partielles, anciennes ou hors classification.`)
}
for(const a of PORTFOLIO){const years=latestCommonYears([a.calendarReturns],{minimum:3});admit('portefeuille-manuel',a,years.length>=3&&years.every(y=>Number.isFinite(assetReturn(a,y))));if(usedIds.has(a.id)&&!a.manualOnly)admit('portefeuille-automatique',a,true)}
for(const a of CATALOG)admit('duels',a,true)
function blockers(e,tool) {
 const known=memberships.get(tool).get(e.key)
 if(known?.some(a=>a.engine))return ''
 if(known?.length)return known.map(a=>a.detail).filter(Boolean).join(' ; ')||'Sélecteur présent mais données insuffisantes au calcul.'
 if(tool==='presentation-etf')return 'Aucune fiche qualifiée : caractéristiques exactes absentes ou incomplètes ; ne pas déduire le PEA.'
 if(tool==='coulisses-indices')return !(e.official?.facts??INDICES[e.indexId]?.facts)?.holdings?.length?'Entreprises et poids de l’indice exact absents ; aucune substitution par un ETF.':'Composition physique présente ; ce périmètre, cette devise ou cette convention de rendement n’est pas exposé séparément par le gabarit existant.'
 if(tool==='portefeuille-automatique')return 'Aucun rôle automatique validé pour ce support ; longueur historique seule insuffisante. Voir manualOnly et recettes.'
 if(tool==='recouvrement-complet')return 'Positions complètes actuelles et identifiées absentes du moteur ; un top 10 ne suffit pas.'
 if(['exposition-pays','exposition-secteurs'].includes(tool))return 'Ventilation économique datée et qualifiée absente ; panier de substitution exclu.'
 if(tool==='et-si-investi')return 'Pas d’historique mensuel exact dans le calculateur ; calendrier annuel insuffisant pour un investissement mensuel ou à une date précise.'
 const frozen=e.histories.flatMap(h=>h.points?.filter((p,i,all)=>i>=2&&p.price===all[i-1].price&&p.price===all[i-2].price).map(p=>p.date)??[])
 if(e.aliases.has('soxx')&&tool.startsWith('qui-'))return 'SOXX : cours bruts hors dividendes ; identité ISIN et série ajustée non qualifiées.'
 if(frozen.length&&tool.startsWith('qui-'))return `Prix figés ≥3 clôtures : ${frozen.join(', ')} ; exclusion mensuelle maintenue, NAV annuelle examinée séparément.`
 return 'Historique exact insuffisant, devise/convention ou source non qualifiée ; aucun proxy ou remplissage autorisé.'
}
function outOfScope(e,t){return t==='presentation-etf'&&e.kind!=='fund'||t==='coulisses-indices'&&e.kind!=='index'}
const fieldReport=buildAssetFieldReport().rows
const rows=[]
for(const e of [...universe.values()].sort((a,b)=>a.key.localeCompare(b.key))) {
 const observationsPresent=e.histories.map(h=>({id:h.id,isin:h.isin??null,currency:h.currency,frequency:'monthly',basis:h.priceMethod??h.variant??h.anniversaryVariant??h.methodNote,
  first:h.points?.[0]?.date,last:h.points?.at(-1)?.date,checkedAt:h.evidence?.checkedAt??null,sourceUrls:h.evidence?.sourceUrls??[h.evidence?.sourceUrl].filter(Boolean),automatic:Boolean(h.evidence),points:h.points?.length??0}))
 const fund=AUTOMATED_ETF[e.isin],facts=fund?.characteristics
 const proposedIndexCalendar=QUALIFIED_INDEX_CALENDARS[e.indexId]
 const annual=QUALIFIED_FUND_CALENDARS[e.isin]??(proposedIndexCalendar&&key(proposedIndexCalendar)===e.key?proposedIndexCalendar:null)
 const fieldObservations=fieldReport.filter(r=>r.id===e.isin || r.id===e.indexId || e.aliases.has(r.id))
 const full=rawCompleteHoldings[e.isin]
 const evidence={fieldObservations,portfolioHistory:PORTFOLIO.filter(a=>routeKey(a)===e.key).map(a=>({id:a.id,basis:a.basis??'Voir la convention source, aucun statut exact-share déduit',currency:a.returnCurrency??null,years:a.calendarReturns,confidenceNote:a.confidenceNote??null})),completeHoldings:full?{asOf:full.asOf,checkedAt:full.checkedAt??null,sourceUrl:full.sourceUrl,basis:full.basis,complete:full.complete,positions:full.rows?.length,identifiedWeight:full.rows?.filter(r=>/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(r.isin??'')).reduce((n,r)=>n+r.weightPct,0)}:null,histories:observationsPresent,annual:annual??null,annualCalendars:Object.values(ANNUAL_ASSETS).filter(a=>routeKey(a)===e.key).map(a=>({id:a.id,currency:a.currency,basis:a.basis,years:a.years,sourceUrls:a.sourceUrls})),rawAnnual:fund?.performance??e.official?.returns??INDICES[e.indexId]?.returns??null,rawAnnualIdentityMatches:e.isin?Boolean(fund?.performance):Boolean(proposedIndexCalendar&&key(proposedIndexCalendar)===e.key),characteristics:facts??null,
  compositions:Object.values(references).filter(r=>r.isin===e.isin).map(r=>({compositionOnly:r.compositionOnly===true,countries:r.countries,sectors:r.sectors,outsideClassification:r.outsideClassification})),indexFacts:e.official?.facts??INDICES[e.indexId]?.facts??null}
 for(const tool of tools){const actual=memberships.get(tool).get(e.key)??[],engine=actual.some(a=>a.engine),before=baseline?.routes?.[`${e.key}|${tool}`]??false
  const addedRoutes=actual.filter(a=>a.engine && !(baseline?.routeIds?.[`${e.key}|${tool}`]??[]).includes(a.id)).map(a=>a.id)
  const status=engine?(before?'déjà raccordé':'raccordable'):outOfScope(e,tool)?'hors périmètre':'bloqué'
  rows.push({asset:e.key,name:e.name,isin:e.isin,indexId:e.indexId??null,kind:e.kind,aliases:[...e.aliases],tool,status,implementation:engine&&!before?'ajouté':engine?'existant':'aucun',selector:actual.length>0,engine,
    addedRoutes:before?addedRoutes:actual.filter(a=>a.engine).map(a=>a.id),required:requirements[tool],routes:actual,available:evidence,blocker:engine?'':outOfScope(e,tool)?'Type de support hors périmètre du gabarit de cet outil.':blockers(e,tool),files:tool.startsWith('qui-')?['src/pages/performance-rankings/data.js','src/pages/performance-rankings/engine.js','src/pages/performance-rankings/annualRanking.js','scripts/build-ranking-annual.mjs','src/data/ranking-index-annual.json','src/data/ranking-annual.json']:tool.includes('exposition')||tool.includes('recouvrement')?['scripts/build-dca-exposures.mjs','src/pages/dca-profiles/verification.js']:tool.includes('portefeuille')||tool==='duels'?['src/data/portfolio-assets.js','src/data/duel-assets.js','src/data/portfolio-admissions.js']:tool==='performance-depuis'?['src/pages/tweet-midi/data/performanceHistory.js','src/data/qualified-annual-calendars.js']:tool==='et-si-investi'?['src/pages/investment-calculator/lib.js','src/pages/investment-calculator/math.js','src/data/market-history.js']:tool==='presentation-etf'?['src/data/etf-cards.js']:['src/data/index-factsheets.js']})
 }
}
{
 const state=status=>({assets:new Set(rows.filter(r=>r.status===status).map(r=>r.asset)).size,pairs:rows.filter(r=>r.status===status).length})
 const summary={checkedAt:today.toISOString(),baselineRef:baseline.ref,financialIdentities:universe.size,pairs:rows.length,already:state('déjà raccordé'),added:state('raccordable'),blocked:state('bloqué'),outOfScope:state('hors périmètre'),byTool:Object.fromEntries(tools.map(t=>[t,Object.fromEntries(['déjà raccordé','raccordable','bloqué','hors périmètre'].map(s=>[s,rows.filter(r=>r.tool===t&&r.status===s).length]))]))}
 // Evidence is stored once per identity; CSV contains every actual consumer decision.
 const assets=Object.fromEntries(rows.filter((r,i)=>i%tools.length===0).map(r=>[r.asset,{name:r.name,isin:r.isin,aliases:r.aliases,kind:r.kind,available:r.available}]))
 const compact=rows.map(({available:_available,...r})=>r)
 writeFileSync('docs/verified-connections-matrix.json',JSON.stringify({summary,assets,rows:compact})+'\n')
 const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"'
 const header=['actif','nom','isin_part_exacte','alias','outil','statut_audit','implementation','selecteur','moteur','requis','disponible','devise_convention_frequence','sources_fraicheur_automatisation','blocage','fichiers']
 const csv=[header,...rows.map(r=>[r.asset,r.name,r.isin,r.aliases.join(' | '),r.tool,r.status,r.implementation,r.selector,r.engine,r.required,
  `Champs observés:${r.available.fieldObservations.filter(f=>f.present).map(f=>f.field).join(',')}; champs seulement configurés:${r.available.fieldObservations.filter(f=>!f.present&&f.automationConfigured).map(f=>f.field).join(',')}; Mensuels:${r.available.histories.map(h=>`${h.id} ${h.first}–${h.last} (${h.points} points)`).join('|')} ; annuels réels:${[...new Set([...Object.keys(r.available.annual?.years??r.available.rawAnnual?.years??{}),...r.available.annualCalendars.flatMap(a=>Object.keys(a.years??{}))])].sort().join(',')}; métadonnées observées:${Object.keys(r.available.characteristics??{}).join(',')}`,
  r.routes.map(a=>[a.id,a.currency,a.basis,a.variant,a.frequency,a.periodStart&&`${a.periodStart}–${a.periodEnd}`].filter(Boolean).join(':')).join(' | '),
  [...r.available.histories.map(h=>`${h.sourceUrls.join('|')} checked=${h.checkedAt??'inconnu'} auto=${h.automatic}`),r.available.annual?`${r.available.annual.sourceUrls.join('|')} checked=${r.available.annual.checkedAt} asOf=${r.available.annual.asOf} auto=true`:r.available.fieldObservations.map(f=>`${f.field}:present=${f.present},asOf=${f.asOf??'inconnu'},checked=${f.checkedAt??'inconnu'},state=${f.state},auto=${f.automationConfigured??'inconnu'},source=${f.sourceUrl??'absente'}`).join(' | ')].join(' ; '),r.blocker,r.files.join('|')])].map(row=>row.map(quote).join(';')).join('\n')+'\n'
 const exclusions=['soxx','etfIE00BDFBTQ78','etfIE000U9ODG19','etfGB00B15KXQ89'].map(id=>{
  const history=HISTORY[id],record=observations[id],alternative=id==='etfIE000U9ODG19'?RANKING_ASSETS['aerospace-paris-eur']:null
  return {id,isin:history.isin??null,name:history.label,currency:history.currency,monthlyExcluded:!RANKING_ASSETS[id],
   reason:id==='soxx'?'Cours bruts hors dividendes ; pas de série ajustée ni de preuve ISIN qualifiées.':'Au moins trois clôtures mensuelles identiques ; garde-fou maintenu.',
   frozenMonths:history.points.filter((point,i,all)=>i>=2&&point.price===all[i-1].price&&point.price===all[i-2].price).map(p=>p.date),
   sourceUrls:record?.sourceUrls??[],checkedAt:record?.checkedAt??null,configuredSource:monthlyConfig.find(c=>c.id===id),
   officialAnnualCalendars:Object.values(ANNUAL_ASSETS).filter(a=>history.isin&&a.isin===history.isin).map(a=>({id:a.id,basis:a.basis,currency:a.currency,years:Object.keys(a.years),sourceUrls:a.sourceUrls})),
   qualifiedAlternative:alternative?{id:alternative.id,isin:alternative.isin,currency:alternative.currency,symbol:alternative.symbol,mic:alternative.mic,first:alternative.points[0].date,last:alternative.points.at(-1).date,sourceUrls:alternative.sourceUrls,checkedAt:alternative.checkedAt,listingEvidenceId:alternative.listingEvidenceId,annualYears:commonCoverage([alternative,{...alternative,id:'audit-reference'}]).years,annualRankingAllowed:commonCoverage([alternative,{...alternative,id:'audit-reference'}]).years.some((year,i,years)=>i>0&&year===years[i-1]+1)}:null}
 })
 writeFileSync('docs/verified-history-exclusions.json',JSON.stringify({checkedAt:today.toISOString(),exclusions},null,2)+'\n')
 writeFileSync('docs/verified-connections-matrix.csv','\ufeff'+csv)
 console.log(JSON.stringify(summary,null,2))
}
