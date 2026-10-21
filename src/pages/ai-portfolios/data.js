import WORKFLOW_POLICY from '../../data/automation-workflows.json' with {type:'json'}
export const MAX_CHECK_AGE_HOURS=WORKFLOW_POLICY['update-ai-portfolios.yml'].maxAgeHours
export const COLORS = ['#17866b','#be6b43','#6d68b1','#287fba','#b48b26','#a8537c','#477458','#555f77']
export const EXECUTION_RULE = 'Première séance commune à tout l’univers après le jour UTC d’enregistrement, et au plus tôt à la date de lancement. Clôture future, sans choix de cours. La fréquence mensuelle se compte par mois UTC d’enregistrement, conservation comprise. Pour les allocations initiales, cette date commune est fixée au lancement. Une clôture manquante attend son rattrapage, sans déplacer la date.'
export const METHOD = 'Rendement total ajusté. Unité synthétique = 100 en devise de cotation à la séance d’ancrage. Valeur du jour = 100 × cours ajusté du jour / cours ajusté d’ancrage. Ce ne sont pas des actions négociables. Dividendes et divisions intégrés une seule fois ; liquidités non rémunérées, frais simulés déduits en devise commune.'
export function defaultConfig(date = new Date().toISOString().slice(0,10)) {
  return { name:'Portefeuilles IA', initialCapital:10000, currency:'EUR', launchDate:date,
    minLines:3, maxLines:6, maxWeight:35, frequency:'monthly', feeBps:0,
    cash:'unremunerated', income:'synthetic-total-return', benchmark:'IE00B4L5Y983-ETFP', universe:['IE00B4L5Y983-ETFP','IE00B5BMR087-XLON','IE00BKM4GZ66-XAMS','US0378331005-XNAS','US5949181045-XNAS'],
    participants:['ChatGPT','Claude','Gemini'].map((name,i)=>({id:name.toLowerCase(),name,model:'À renseigner',color:COLORS[i]})) }
}
export const STATUS = {draft:'Brouillon',recorded:'Décision enregistrée',pending:'En attente de cours',executed:'Exécutée',failed:'En échec',cancelled:'Annulée avec trace'}
