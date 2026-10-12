import records from './qualified-exposure-etfs.json' with { type: 'json' }
import config from '../../scripts/qualified-exposure-sources.json' with { type: 'json' }
const descriptions = {
 'world-midcap-equal': ['Les moyennes entreprises ont aussi leur place dans les marchés mondiaux 👇', 'Tu suis des moyennes capitalisations des pays développés, avec une pondération égale aux rééquilibrages. Ce panier diffère du World classique.', 'Tu explores une autre taille d’entreprise et une autre pondération.', 'L’équipondération et la taille des entreprises peuvent produire des performances différentes du World.'],
 'water-ishares': ['L’eau est indispensable. Mais que détient un ETF consacré à ce thème ? 👇', 'Tu détiens des actions d’entreprises liées à l’eau : équipements, traitement et services. Tu n’achètes pas directement de l’eau.', 'Tu peux examiner une activité précise à travers plusieurs entreprises.', 'Un besoin essentiel ne garantit pas un bon rendement boursier. Le secteur reste sensible aux valorisations et aux risques des entreprises.'],
 'agribusiness-ishares': ['Investir dans l’agriculture ne signifie pas forcément acheter des matières premières 👇', 'Tu détiens des actions d’entreprises de l’agro-industrie, sélectionnées par le S&P Commodity Producers Agribusiness.', 'Tu examines les entreprises de la chaîne agricole à travers un panier mondial.', 'La performance de ces actions est différente du prix du blé ou du maïs. Les coûts, la météo et les marchés peuvent peser sur leur activité.'],
 'timber-ishares': ['Un ETF consacré au bois détient quoi, exactement ? 👇', 'Tu détiens des actions d’entreprises liées au bois et à l’exploitation forestière, plutôt qu’une forêt achetée directement.', 'Tu explores une activité différente des mines et de l’énergie.', 'Ces entreprises restent exposées aux cycles économiques, aux prix et aux risques environnementaux.'],
 'private-equity-ishares': ['Un ETF private equity coté reste un investissement en Bourse 👇', 'Tu détiens des actions de sociétés cotées liées au private equity. Tu ne souscris pas directement à un fonds non coté.', 'Tu peux examiner les acteurs du capital-investissement à travers un ETF négociable en Bourse.', 'Le cours de ces sociétés peut fortement varier. Leur liquidité en Bourse ne supprime pas les risques de leurs participations.'],
}
export const QUALIFIED_EXPOSURE_SHEETS = config.instruments.filter(c => records[c.id]).map(c => {
 const r=records[c.id], f=r.characteristics
 const copy=descriptions[c.id] ?? [`Un ETF consacré à ${c.label.toLowerCase()} : que contient ce panier ? 👇`, `Tu suis le secteur à travers l’indice ${f.index}. Le périmètre exact et ses éventuels filtres figurent dans cet indice.`, 'Tu peux comparer cette exposition sectorielle à un indice mondial large.', 'Une sélection sectorielle conserve le risque actions et peut déjà recouper les entreprises de tes ETF mondiaux.']
 return {id:c.id,isin:r.isin,name:r.name,category:c.category,source:r.sourceUrl,scene:c.scene,listing:r.listing,benchmark:f.index,
  incomePolicy:f.distribution==='Accumulating'?'accumulating':'distributing',replicationMethod:f.replicationMethod,domicile:f.domicile,
  hook:copy[0],whatIs:copy[1],whyInteresting:copy[2],whatToKnow:copy[3],verdict:`Tu cibles ${c.label.toLowerCase()} avec un risque actions.`,question:'Tu utiliserais cette exposition pour compléter ton portefeuille ?',
  checkedAt:r.checkedAt.slice(0,10),presentationOnly:true}
})
export const QUALIFIED_INSTRUMENTS = Object.fromEntries(QUALIFIED_EXPOSURE_SHEETS.map(r=>[r.isin,{name:r.name}]))
export const QUALIFIED_FACTS = Object.fromEntries(QUALIFIED_EXPOSURE_SHEETS.map(r=>[r.isin,{
 distribution:r.incomePolicy==='accumulating'?'Capitalisant':'Distribuant',location:`${r.domicile}, ${r.replicationMethod}`,benchmark:r.benchmark,incomePolicy:r.incomePolicy,replicationMethod:r.replicationMethod,domicile:r.domicile,currencyHedge:null,reviewedAt:r.checkedAt.split('-').reverse().join('/'),instrumentType:'ETF',positionsLabel:`Exposition suivie : ${r.benchmark}`,characteristicsSource:{url:r.source,checkedAt:r.checkedAt}}]))
export const QUALIFIED_LISTINGS = Object.fromEntries(Object.values(records).map(r=>[r.isin,r.listings]))

export const QUALIFIED_LISTING_EVIDENCE = Object.fromEntries(Object.values(records).flatMap(r=>r.listings.map(l=>[l.evidenceId,{isin:r.isin,sourceUrl:l.sourceUrl,checkedAt:l.checkedAt,identityEvidence:r.isin,excerpt:l.excerpt,pageSha256:r.pageSha256}])))

export const QUALIFIED_AUTOMATED_RECORDS = Object.fromEntries(Object.values(records).map(r=>[r.isin,r.automatedRecord]))
