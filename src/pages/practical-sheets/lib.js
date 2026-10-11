import { TOPICS, FUND_GROUPS, DEFAULT_SCENARIO } from './data.js'
import { AUTOMATED_ETF } from '../../data/automated-etf.js'
import { INSTRUMENT_FACTS_BY_ISIN } from '../../data/instrument-facts.js'
import { INSTRUMENT_REFERENCE_EVIDENCE } from '../../data/instrument-reference-evidence.js'
import { getInstrumentName, getInstrumentPeaStatus } from '../../data/instruments.js'
import { formatEtfTer, ETF_TER_EVIDENCE } from '../../data/etf-ter.js'
import { getPreferredInstrumentListing } from '../../data/instrument-listings.js'
import { getCurrentIndexFacts } from '../../data/index-facts.js'
import { REGULATORY as R, REGULATORY_OBSERVATIONS } from '../../data/regulatory-data.js'
import { INSURANCE } from '../../data/insurance.js'
import { currentSavingsObservation } from '../../data/economic-data.js'
import references from '../../data/automated-practical-sheets.json' with {type:'json'}

export const number = (n, digits=2) => Number.isFinite(n) ? n.toLocaleString('fr-FR',{maximumFractionDigits:digits}).replace(/\u202f/g,' ') : 'Non publié'
export const money = n => `${number(n,0)} €`
export const pct = n => `${number(n)} %`
export const date = s => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '') ? s.split('-').reverse().join('/') : 'date non publiée'
const plain = s => String(s).replace(/[\p{Extended_Pictographic}\uFE0F]/gu,'').trim()
export function topicById(id) { return TOPICS.find(t=>t.id===id) ?? TOPICS[0] }
export function fundOptions(topic) { return (FUND_GROUPS[topic.fundGroup] ?? []).filter(isin=>getInstrumentPeaStatus(isin)===true).map(isin=>({isin,name:getInstrumentName(isin),ticker:getPreferredInstrumentListing(isin)?.ticker ?? ''})) }
function source(label,url,checkedAt,asOf=null) { return {label,url,checkedAt,asOf} }
export function getSources(topic) {
 return topic.sources.map(key=> {
  const r=REGULATORY_OBSERVATIONS[key] ?? references.sources[key]
  return {...source(r?.title ?? r?.label ?? key,r?.sourceUrl,r?.checkedAt,r?.publishedAt),key,status:r?.status ?? (r ? 'ok':'error'),reviewRequired:r?.reviewRequired ?? false,error:r?.error}
 })
}
function characteristics(isin) {
 const record=AUTOMATED_ETF[isin] ?? {}, facts=INSTRUMENT_FACTS_BY_ISIN[isin] ?? {}
 // The exact class policy wins over generic "capitalisation and/or distribution" wording.
 const policy=record.characteristics?.distribution
 return {index:record.characteristics?.index ?? facts.benchmark ?? (record.sectors?.basis==='index' ? record.sectors.index : null) ?? 'Indice exact non documenté',
  distribution:policy && !/and\/or|et\/ou/i.test(policy) ? policy : facts.distribution ?? (/\bAcc\b/i.test(getInstrumentName(isin))?'Capitalisant':'À vérifier sur le DIC'),
  record,facts}
}
const SHORT_NAMES = {'FR001400U5Q4':'Amundi PEA Monde','IE0002XZSHO1':'iShares World PEA','LU1681043599':'Amundi World CW8','FR0013412038':'Amundi MSCI Europe','FR0011550193':'BNP STOXX Europe 600','LU1681047236':'Amundi Euro STOXX 50','IE000DQLYVB9':'iShares S&P 500 PEA','FR0011871128':'Amundi PEA S&P 500','FR0011550185':'BNP S&P 500','FR0013412020':'Amundi PEA Émergents','FR001400ZGO4':'Amundi PEA Émergents S','FR0013412012':'Amundi PEA Asie Émergente'}
function fundTable(topic, selected) {
 const options=fundOptions(topic), allowed=new Set(options.map(o=>o.isin))
 const isins=selected ?? options.map(o=>o.isin)
 if(isins.length<2 || isins.length>3 || new Set(isins).size!==isins.length || isins.some(isin=>!allowed.has(isin))) throw new Error('Choisis deux ou trois parts PEA de cette famille.')
 const funds=isins.map(isin=>({isin,...characteristics(isin)}))
 const evidence=funds.flatMap(({isin,record,facts})=>{
  const ter=ETF_TER_EVIDENCE[isin]
  const identity=INSTRUMENT_REFERENCE_EVIDENCE[isin]
  return [source(`${isin} · part`,identity?.sourceUrls?.[0],identity?.checkedAt),...(record.characteristics?.detailsSource?[source(`${isin} · indice et revenus`,record.characteristics.detailsSource.url,record.characteristics.detailsSource.checkedAt)]:[]),source(`${isin} · frais`,ter.sourceUrls?.[0],ter.checkedAt),
   source(`${isin} · caractéristiques`,record.characteristics?.sourceUrl ?? facts.characteristicsSource?.url ?? record.sourceUrl,record.characteristics?.checkedAt ?? facts.characteristicsSource?.checkedAt),
   ...(record.aum ? [source(`${isin} · encours`,record.aum.sourceUrl ?? record.sourceUrl,record.aum.checkedAt,record.aum.asOf)] : [])]
 }).filter(e=>e.url)
 const rows=[['Indice',...funds.map(f=>f.index)],['Frais annuels',...funds.map(f=>`${formatEtfTer(f.isin)} %`)],['Revenus',...funds.map(f=>f.distribution)],['Encours',...funds.map(({record})=> record.aum ? `${number(record.aum.amount/1e6,0)} M ${record.aum.currency}\n${record.aum.scope==='fund'?'Fonds':'Part'} · ${date(record.aum.asOf)}` : 'Non publié')]]
 const perfs=funds.map(f=>f.record.performance)
 let performanceNote=''
 if(perfs.every(p=>p?.basis==='fund' && p.currency==='EUR' && /reinvest|total return/i.test(p.method ?? ''))) {
  const completed=Number(new Date().getUTCFullYear())-1
  const common=Object.keys(perfs[0].years).map(Number).filter(y=>y<=completed && perfs.every(p=>Number.isFinite(p.years[y]))).sort((a,b)=>b-a).slice(0,2).reverse()
  for(const year of common) rows.push([`${year} · EUR`,...perfs.map(p=>`${p.years[year]>=0?'+':''}${pct(p.years[year])}`)])
  if(common.length) {
   performanceNote='Rendements des parts en EUR, revenus réinvestis, frais des fonds inclus.'
   evidence.push(...funds.map(f=>source(`${f.isin} · performance`,f.record.performance.sourceUrl ?? f.record.sourceUrl,f.record.performance.checkedAt,f.record.performance.asOf)))
  }
 }
 const columns=funds.map(f=>`${SHORT_NAMES[f.isin] ?? getInstrumentName(f.isin)}\n${getPreferredInstrumentListing(f.isin)?.ticker ?? ''} · ${f.isin}`)
 return {columns,rows,sources:evidence,notes:[performanceNote,...(['europe','em'].includes(topic.fundGroup)?['Les indices diffèrent : comparer les expositions avant de comparer les rendements.']:[]),...(!performanceNote?['Pas d’année complète commune suffisamment documentée : aucune performance extrapolée.']:[])].filter(Boolean)}
}
function indexTable(topic) {
 const facts=topic.indices.map(id=>getCurrentIndexFacts(id))
 if(facts.some(f=>!f)) throw new Error('Composition d’indice indisponible.')
 const rows=[['Périmètre',...facts.map(f=>plain(f.markets ?? f.index))],['Titres',...facts.map(f=>number(f.constituents,0))],['Première ligne',...facts.map(f=>f.holdings?.length?`${plain(f.holdings[0][0])}\n${pct(f.holdings[0][1])}`:'Non publiée')],['Photographie',...facts.map(f=>date(f.asOf))]]
 return {columns:facts.map(f=>f.index),rows,sources:facts.map(f=>source(f.source?.label ?? f.index,f.source?.url,f.source?.checkedAt,f.asOf)).filter(s=>s.url),notes:['Compositions d’indices ; les photographies peuvent avoir des dates différentes.']}
}
export function validateScenario(input,mode='fees') {
 const s={...DEFAULT_SCENARIO,...input}
 const keys=mode==='switch'?['capital','feeA','feeB','tradeCost']:mode==='delay'?['capital','years','returnRate','feeA','delay']:['capital','years','returnRate','feeA','feeB']
 for(const key of keys) if(!Number.isFinite(s[key])) throw new Error('Tous les paramètres doivent être des nombres.')
 if(s.capital<=0 || s.capital>1e9 || keys.some(key=>key.startsWith('fee')&&(s[key]<0||s[key]>10)) || (mode==='switch'&&(s.tradeCost<0||s.tradeCost>s.capital)) || (mode!=='switch'&&(s.years<1||s.years>60||s.returnRate<=-100||s.returnRate>30)) || (mode==='delay'&&(s.delay<0||s.delay>s.years))) throw new Error('Vérifie le capital, la durée et les taux du scénario.')
 return s
}
export function calculateScenario(mode,input) {
 const s=validateScenario(input,mode)
 if(mode==='switch') {
  const saving=s.capital*(s.feeB-s.feeA)/100
  return {...s,saving,payback:saving>0?s.tradeCost/saving:null}
 }
 const grow=(years,fee)=>s.capital*((1+s.returnRate/100)*(1-fee/100))**years
 if(mode==='delay') return {...s,a:grow(s.years,s.feeA),b:grow(s.years-s.delay,s.feeA)}
 return {...s,a:grow(s.years,s.feeA),b:grow(s.years,s.feeB)}
}
export function buildSheet(id,settings={}) {
 const topic=topicById(id)
 let table={columns:topic.columns ?? [],rows:(topic.rows ?? []).map(row=>[...row]),sources:[],notes:[]}
 if(topic.mode==='funds') table=fundTable(topic,settings.isins)
 if(topic.mode==='indices') table=indexTable(topic)
 if(topic.id==='pea-cto') {
  table.rows[1][1]=money(R.peaCeiling)
  table.rows[2][1]=`Après 5 ans : exonération d’IR sur les gains ; prélèvements sociaux ${pct(R.peaSocial)}`
  table.rows[2][2]=`PFU par défaut : ${pct(R.ctoTotal)} sur les gains réalisés ; option globale au barème`
  table.notes.push('Résident fiscal français ; régime général. Avant 5 ans : règles et exceptions spécifiques.')
 }
 if(topic.id==='av-cto') table.notes.push(`Après 8 ans, abattement annuel d’IR sur les gains retirés : ${money(R.avSingleAllowance)} (seul) ou ${money(R.avCoupleAllowance)} (couple imposé ensemble), tous contrats confondus ; prélèvements sociaux dus.`)
 if(topic.mode==='savings') {
  const savings=currentSavingsObservation()
  table.rows[1][1]=`Taux : ${pct(savings.rate)} · effet ${date(savings.effectiveAt ?? savings.asOf)}`
 }
 if(topic.mode==='gold') {
  const contract=INSURANCE.find(c=>c.id===(settings.contractId ?? 'linxea-spirit-2'))
  if(contract) {
   table.columns[0]=contract.name
   table.rows[2][1]=`UC : ${pct(contract.fees.units)}/an + support ; opérations selon barème`
   table.sources.push(source(`${contract.name} · frais`,contract.fees.sourceUrl ?? contract.sourceUrl,contract.checkedAt))
  }
  const supports=references.sources['gold-contract']
  if(supports?.listedIsins?.includes('FR0013416716') && supports?.contractIds?.includes(contract?.id)) {
   table.rows[0][1]=`Amundi Physical Gold\nFR0013416716 · contrat confirmé`
   table.rows[1][1]='Or physique ; exposition non couverte contre le change'
   const gold=AUTOMATED_ETF.FR0013416716
   if(Number.isFinite(gold?.characteristics?.terPct)) {
    table.rows[2][1]=`Contrat : ${pct(contract.fees.units)}/an ; ETC : ${pct(gold.characteristics.terPct)}/an`
    table.sources.push(source('FR0013416716 · frais',gold.characteristics.sourceUrl ?? gold.sourceUrl,gold.characteristics.checkedAt))
   }
  }
  if(supports?.contractIds?.includes(contract?.id)) table.rows[2][1]+=` ; transaction ETC ${pct(supports.transactionPct)} à l’achat et à la vente`
  if(!supports?.contractIds?.includes(contract?.id)) table.rows[0][1]='Support or à vérifier dans la liste du contrat ; accès non confirmé ici'
  table.notes.push('Disponibilité de l’ETC non déduite de la présence d’ETF ; un contrat peut proposer un autre support or.')
 }
 if(['fees','switch','delay'].includes(topic.mode)) {
  const c=calculateScenario(topic.mode,settings.scenario)
  if(topic.mode==='switch') table={...table,columns:['Ancien ETF','Nouvel ETF'],rows:[['Capital',money(c.capital),money(c.capital)],['Frais annuels',pct(c.feeB),pct(c.feeA)],['Économie annuelle','Sur capital constant',c.saving>0?money(c.saving):'Pas d’économie'],['Coût total du changement','Vente, achat et spread',money(c.tradeCost)],['Amortissement','Hors fiscalité',c.payback===null?'Non amorti':c.tradeCost===0?'Immédiat':`${number(c.payback,1)} ans`]]}
  else table={...table,columns:topic.mode==='fees'?['Scénario A','Scénario B']:['Investir maintenant','Investir plus tard'],rows:[['Capital initial',money(c.capital),money(c.capital)],['Durée investie',`${c.years} ans`,`${topic.mode==='delay'?c.years-c.delay:c.years} ans`],['Frais annuels',pct(c.feeA),pct(topic.mode==='delay'?c.feeA:c.feeB)],['Capital final',money(c.a),money(c.b)],['Écart',money(c.a-c.b),'Entre les deux scénarios']]}
  if(topic.mode==='switch') table.notes.push('Capital constant, écart de frais constant ; courtage et spread saisis, hors fiscalité et suivi de l’indice.')
  else table.notes.push(`Simulation : rendement brut constant ${pct(c.returnRate)}, frais annuels appliqués au capital, hors courtage et fiscalité${topic.mode==='delay'?'; somme en attente supposée non rémunérée':''}.`)
 }
 const sources=[...getSources(topic),...table.sources]
 const unique=sources.filter((s,i)=>sources.findIndex(t=>t.url===s.url && t.label===s.label)===i)
 const warnings=unique.filter(s=>s.status==='error'||s.reviewRequired).map(s=>`${s.label} : ${s.reviewRequired?'source modifiée, explication à vérifier':'dernier contrôle en échec, dernière observation conservée'}`)
 if(table.rows.every(row=>row.length===2)) table={...table,columns:[table.columns[1]],rowLabel:table.columns[0]}
 return {...topic,...table,sources:unique,warnings,blocked:unique.some(s=>s.reviewRequired || !s.url || !s.checkedAt),notes:[...table.notes],takeaway:topic.takeaway}
}
export function buildTweet(sheet) {
 const blocks=sheet.rows.map(row=>`${row[0]}\n${sheet.columns.map((column,i)=>`${sheet.columns.length===1?'':column.split('\n')[0]+' : '}${String(row[i+1]).replaceAll('\n',' · ')}`).join('\n')}`)
 return ['🔖 Sauvegarde ce tweet',sheet.hook+' 👇',...blocks,sheet.takeaway,...sheet.notes,sheet.sources.length?'Sources : '+[...new Set(sheet.sources.map(s=>s.url).filter(Boolean))].join('\n'):null].filter(Boolean).join('\n\n')
}
