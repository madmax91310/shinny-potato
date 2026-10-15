import config from '../../scripts/non-bond-expansion-sources.json' with { type: 'json' }
import records from './non-bond-etf-records.json' with { type: 'json' }
export const NON_BOND_DEFINITIONS = config.instruments
export const NON_BOND_SHEETS = NON_BOND_DEFINITIONS.filter(c => records[c.isin]?.characteristics?.listings?.length).map(c => {
 const r=records[c.isin], f=r.characteristics
 const listing=f.listings.find(l=>l.symbol===c.preferredSymbol)
 if(!listing) throw new Error(`Cotation officielle absente : ${c.isin}`)
 const isEtc=c.instrumentType==='ETC'
 const swap=Number.isFinite(f.annualSwapRatePct)?` Frais de gestion : ${f.terPct.toLocaleString('fr-FR')} % ; frais annuels de swap : ${f.annualSwapRatePct.toLocaleString('fr-FR')} %, distincts.`:''
 return {...c,source:r.sourceUrl,listing,benchmark:f.index,incomePolicy:isEtc?'not-applicable':/^Accum/.test(f.distribution)?'accumulating':'distributing',
  replicationMethod:f.replicationMethod,domicile:f.domicile,checkedAt:f.checkedAt,
  hook:isEtc?`Investir dans le ${c.title.toLowerCase()} : que suit réellement ce produit ? 👇`:c.hook ?? (c.id==='nasdaq-equal'?'Le Nasdaq-100 change de visage quand on change les poids des entreprises 👇':'Petites capitalisations value européennes : qu’est-ce que ça change dans un portefeuille ? 👇'),
  whatToKnow:c.whatToKnow+swap,verdict:isEtc?'Une exposition à des contrats à terme sur une matière première.':'Une autre sélection ou pondération d’actions cotées.',question:'Tu utiliserais cette exposition pour compléter ton portefeuille ?',presentationOnly:false}
})
export const NON_BOND_INSTRUMENTS = Object.fromEntries(NON_BOND_SHEETS.map(r=>[r.isin,{name:r.name,pea:false}]))
export const NON_BOND_FACTS = Object.fromEntries(NON_BOND_SHEETS.map(r=>[r.isin,{
 distribution:r.instrumentType==='ETC'?'Sans distribution':r.incomePolicy==='accumulating'?'Capitalisant':'Distribuant',
 location:`${r.domicile}, ${r.replicationMethod}`,benchmark:r.benchmark,incomePolicy:r.incomePolicy,
 replicationMethod:r.replicationMethod,domicile:r.domicile,currencyHedge:false,instrumentType:r.instrumentType||'ETF',
 positionsLabel:r.instrumentType==='ETC'?'Contrats à terme, sans livraison physique':r.id==='nasdaq-equal'?'Top dix de l’indice suivi':'Actions du fonds',
 characteristicsSource:{url:r.source,checkedAt:r.checkedAt},reviewedAt:r.checkedAt?.split('-').reverse().join('/')}
]))
export const NON_BOND_LISTINGS = Object.fromEntries(NON_BOND_SHEETS.map(r=>[r.isin,records[r.isin].characteristics.listings]))
export const NON_BOND_LISTING_EVIDENCE = Object.fromEntries(Object.entries(NON_BOND_LISTINGS).flatMap(([isin,ls])=>ls.map(l=>[l.evidenceId,{isin,sourceUrl:l.sourceUrl,checkedAt:l.checkedAt,identityEvidence:isin,excerpt:l.excerpt,pageSha256:l.sha256}])))
export const NON_BOND_REFERENCE_EVIDENCE = Object.fromEntries(NON_BOND_SHEETS.map(r=>[r.isin,{sourceUrls:[r.source,r.listing.sourceUrl],checkedAt:r.checkedAt,dateStatus:'not-applicable',scope:`Part exacte ${r.isin}`,method:'Identité et cotation officielles collectées automatiquement ; historique de la part exacte',note:r.whatToKnow}]))
export const NON_BOND_HISTORY_IDENTITIES = Object.fromEntries(NON_BOND_DEFINITIONS.map(r=>[r.historyId,{icon:r.icon,scene:r.scene,title:r.title,ticker:r.preferredSymbol.split('.')[0],instrumentType:r.instrumentType||'ETF'}]))
