// Reconcile every original alert; no threshold or source value is rewritten.
import fs from 'node:fs'
import {ASSETS} from '../src/data/market-history.js'
import {AUTOMATED_ETF} from '../src/data/automated-etf.js'
import {convertCalendarReturn} from '../src/data/calendar-fx.js'
import {qualifyHistoryWindow} from '../src/data/history-window-quality.js'
import FX from '../src/data/monthly-fx.json' with {type:'json'}
const folder='reports/corrections-2026-10-22'
const read=name=>JSON.parse(fs.readFileSync(`${folder}/preuves/${name}`))
const original=read('comparaisons-originales.json'),market=new Map(read('historiques-recollectes.json').map(r=>[r.id,r])),nav=new Map(read('nav-recollectes.json').map(r=>[r.isin,r]))
const inceptionProof=read('ssga-2016-verification.json')
const csv=(rows,columns)=>'\ufeff'+[columns,...rows.map(row=>columns.map(c=>typeof row[c]==='object'?JSON.stringify(row[c]):row[c]))].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n')+'\r\n'
const rows=original.alerts.map(old=>{
 const m=market.get(old.id),n=nav.get(old.isin),record=m?.record,performance=n?.record?.performance
 const start=record?.proofRows.find(p=>p.date.startsWith(`${old.year-1}-12`)),end=record?.proofRows.find(p=>p.date.startsWith(`${old.year}-12`))
 const price=start&&end?100*(end.value/start.value-1):null,observedNav=performance?.years?.[old.year]
 const converted=Number.isFinite(observedNav)?convertCalendarReturn(observedNav,old.year,performance.currency,old.currency):null
 const quality=qualifyHistoryWindow(ASSETS[old.id],`${old.year-1}-12`,`${old.year}-12`)
 const blocked=!quality.qualified&&quality.reason.includes('cours reportés')
 const partialYear=old.isin===inceptionProof.isin.value&&old.year===2016
 const partialValue=partialYear?Number(Object.values(inceptionProof.calendar.attrs).find(p=>p.label==='2016').originalValue):null
 return {...old,marketStartDate:start?.date,marketEndDate:end?.date,marketStartValue:start?.value,marketEndValue:end?.value,
  marketSymbol:record?.symbol,marketMic:record?.mic,marketSource:record?.sourceUrls,marketHash:record?.responseSha256,
  marketConvention:record?.method,navSource:performance?.sourceUrl??n?.record?.sourceUrl??AUTOMATED_ETF[old.isin]?.sourceUrl,
  navConvention:performance?.method??old.navMethod,navCalendarStart:partialYear?null:`${old.year}-01-01`,navCalendarEnd:`${old.year}-12-31`,
  shareInceptionDate:partialYear?'2016-04-29':null,publishedNonComparableReturn:partialValue,
  navExactValuationDates:'Non exposées par le calendrier annuel ; ne pas assimiler aux dates de séance de la cotation.',
  fxStartDate:FX.months[`${old.year-1}-12`]?.asOf,fxEndDate:FX.months[`${old.year}-12`]?.asOf,
  recollectedMarketReturn:price,recollectedNavReturn:observedNav??null,recollectedNavConverted:converted,
  recollectedDifferencePp:Number.isFinite(price)&&Number.isFinite(converted)?price-converted:null,
  lastSuccess:m?.ok?record?.checkedAt??null:null,navRecheck:n?.ok?'Collecte réelle réussie':'Bloquée : '+n?.error,
  navYearRecheck:partialYear?'2016 est affiché, mais exclu des années qualifiées : part lancée le 29 avril 2016':Number.isFinite(observedNav)?'Année toujours publiée':'Année absente des années qualifiées par le collecteur actuel ; valeur initiale conservée séparément',
  investigationFlags:[
   ...(performance?.currency!==old.currency?[`Devise NAV ${performance?.currency} / cotation ${old.currency} ; conversion nécessaire, pas une explication démontrée de l’écart`]:['NAV et cotation dans la même devise']),
   `Bornes de cotation réellement reçues : ${start?.date??'absente'} / ${end?.date??'absente'}`,
   'Dates quotidiennes exactes des NAV annuelles non exposées par cette source',
   ...(Number.isFinite(price)&&Number.isFinite(observedNav)&&Math.abs(price-observedNav)<.02&&performance?.currency!==old.currency?['Proximité numérique avant conversion : rechercher une ancienne convention de cotation ou un changement de devise ; hypothèse non démontrée']:[]),
  ],
  status:partialYear?'comparaison non pertinente':blocked?'erreur corrigée':'anomalie encore inexpliquée',
  demonstratedCause:partialYear?'La source officielle confirme la création de cette part le 29 avril 2016 et affiche 26,33 % pour 2016. La cotation Yahoo commence en 2015 : son rendement décembre 2015-décembre 2016 ne peut pas être comparé à celui de cette part sur une année civile complète. Le collecteur excluait déjà 2016, mais la fusion réintroduisait la valeur ancienne.':blocked?'Clôtures reportées et aucun volume déclaré dans la source pendant la fenêtre ; calendrier NAV et cotation alternative distincte confirment que le 0 % ne valorise pas le placement. Cause amont du fournisseur non démontrée.':'La différence entre clôtures ajustées de marché et calendrier NAV persiste. L’identité courante, la devise, les séances de décembre et la collecte ont été relues ; aucune attribution quantitative complète de l’écart n’est démontrée.',
  correction:partialYear?'Fenêtres antérieures au lancement refusées. La valeur 2016 est conservée dans excludedYears avec son ancienne preuve ; elle n’est plus réintroduite dans le calendrier qualifié. Les années complètes à partir de 2017 subsistent.':blocked?quality.reason+' Refus ciblé des calculs ; périodes indépendamment valides conservées. Cotation alternative présentée séparément avec sa devise.':'Aucune modification des valeurs ni du seuil ; alerte conservée. Obtenir les NAV quotidiennes historiques et la documentation des ajustements/cotations pour ces deux bornes.',
  proof:`preuves/historiques-recollectes.json#${old.id} ; preuves/nav-recollectes.json#${old.isin} ; ${partialYear?'preuves/ssga-2016-verification.json ; preuves/ssga-application.json':'preuves/qualification-quatre-historiques.json'}`,
 }
})
if(rows.length!==90||new Set(rows.map(r=>r.isin)).size!==53||new Set(rows.map(r=>r.isin+'/'+r.year)).size!==90)throw Error('Audit cases lost or duplicated')
fs.writeFileSync(`${folder}/reconciliation-90-ecarts.csv`,csv(rows,Object.keys(rows[0])))
fs.writeFileSync(`${folder}/reconciliation-90-ecarts.json`,JSON.stringify({counts:rows.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{}),cases:rows},null,2))
console.log({cases:rows.length,shares:new Set(rows.map(r=>r.isin)).size,status:rows.reduce((a,r)=>(a[r.status]=(a[r.status]??0)+1,a),{}),liveNavShares:[...nav.values()].filter(r=>r.ok).length,uncomparablePreserved:original.uncompared.length})
