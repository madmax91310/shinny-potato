import WORKFLOW_POLICY from '../../data/automation-workflows.json' with {type:'json'}
import MARKET_REGIONS from './market-regions.json' with {type:'json'}
export const STOCK_REGIONS=Object.keys(MARKET_REGIONS)
const MIC_REGION=new Map(Object.entries(MARKET_REGIONS).flatMap(([region,mics])=>mics.map(mic=>[mic,region])))
export const marketRegion=asset=>MIC_REGION.get(asset?.mic)??'Autres marchés'
export const MAX_CHECK_AGE_HOURS=WORKFLOW_POLICY['update-ai-portfolios.yml'].maxAgeHours
export const COLORS = ['#17866b','#be6b43','#6d68b1','#287fba','#b48b26','#a8537c','#477458','#555f77']
export const EXECUTION_RULE = 'Première séance commune à tout l’univers après le jour UTC d’enregistrement, et au plus tôt à la date de lancement. Clôture future, sans choix de cours. La fréquence mensuelle se compte par mois UTC d’enregistrement, conservation comprise. Pour les allocations initiales, cette date commune est fixée au lancement. Une clôture manquante attend son rattrapage, sans déplacer la date.'
export const AFFECTED_EXECUTION_RULE = 'Première séance commune aux positions détenues et aux actifs concernés par la décision, après le jour UTC d’enregistrement et au plus tôt au lancement. Les actifs simplement disponibles au catalogue ne retardent aucune opération. Au lancement, même séance pour les allocations initiales et la référence. Les journées crypto se terminent à 00:00 UTC le lendemain ; arrêtés datés de la journée observée. Une clôture manquante attend son rattrapage sans déplacer la date.'
export const METHOD = 'Rendement total ajusté. Unité synthétique = 100 en devise de cotation à la séance d’ancrage. Valeur du jour = 100 × cours ajusté du jour / cours ajusté d’ancrage. Ce ne sont pas des actions négociables. Dividendes et divisions intégrés une seule fois ; liquidités non rémunérées, frais simulés déduits en devise commune.'
export function defaultConfig(date = new Date().toISOString().slice(0,10), market = null) {
  const chosen=new Map()
  for(const a of market?.universe??[])if(a.status==='qualified'&&!a.selectionBlock&&!a.leveraged&&(a.instrumentType==='EQUITY'&&(!a.shareType||['ordinary','depositary-receipt','REIT','legacy-equity'].includes(a.shareType))&&STOCK_REGIONS.includes(marketRegion(a))||a.instrumentType==='ETF'&&a.ucits||['ETC','ETN','ETP','CRYPTOCURRENCY'].includes(a.instrumentType))&&a.isin!=='IE00B4L5Y983') {const key=a.instrumentId??a.isin??a.id;if(!chosen.has(key))chosen.set(key,a.id)}
  return { name:'Portefeuilles IA', initialCapital:10000, currency:'EUR', launchDate:date,
    minLines:3, maxLines:6, maxWeight:35, frequency:'monthly', feeBps:0,
    executionPolicy:'affected-markets-v2', admissionPolicy:'instrument-types-v2', stockRegions:[...STOCK_REGIONS], assetTypes:['ETF','EQUITY','CRYPTOCURRENCY','ETC','ETN','ETP'], requireUcits:true, cash:'unremunerated', income:'synthetic-total-return', benchmark:'IE00B4L5Y983-ETFP', universe:['IE00B4L5Y983-ETFP',...chosen.values()],
    participants:['ChatGPT','Claude','Gemini'].map((name,i)=>({id:name.toLowerCase(),name,model:'À renseigner',color:COLORS[i]})) }
}
export const STATUS = {draft:'Brouillon',recorded:'Décision enregistrée',pending:'En attente de cours',executed:'Exécutée',failed:'En échec',cancelled:'Annulée avec trace'}
