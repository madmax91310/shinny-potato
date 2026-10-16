import monthly from './monthly-duel-returns.json' with {type:'json'}
import { getInstrumentName } from './instruments.js'
import { latestCommonYears } from './annual-window.js'
// Qualify exact shares after every monthly refresh. Never backfill a new fund.
export const DISTINCT_PORTFOLIO_CANDIDATES = [
 ['nasdaq-equal','IE000L2SA8K5','actions_larges','⚖️','Nasdaq-100 équipondéré','Les plus grands émetteurs pèsent moins au rééquilibrage ; le risque actions reste présent.'],
 ['small-value-world-avantis','IE0003R87OG3','actions_larges','🔎','Petites capitalisations value en gestion active','La sélection active peut s’écarter longtemps du marché mondial.'],
 ['copper-miners-globalx','IE0003Z9E2Y3','actions_larges','🪨','Actions de mines de cuivre','Les coûts et la gestion des mines comptent ; il ne s’agit pas du prix du cuivre.'],
 ['ibonds-euro-2028','IE0008UEVOE0','obligataire','📅','Obligations euro à échéance 2028','Le capital et le rendement ne sont pas garantis. Le fonds a une fin définie.'],
 ['ibonds-euro-2029','IE000SNLFDR7','obligataire','📅','Obligations euro à échéance 2029','Le capital et le rendement ne sont pas garantis. Le fonds a une fin définie.'],
 ['defense-vaneck','IE000YYE6WK5','actions_larges','🛡️','Actions de la défense','Une poche thématique concentrée, sensible aux budgets et aux valorisations.'],
 ['nuclear-vaneck','IE000M7V94E1','actions_larges','⚛️','Uranium et infrastructures nucléaires','Ces actions ne suivent pas directement le prix de l’uranium.'],
 ['quantum-vaneck','IE0007Y8Y157','actions_larges','🔬','Informatique quantique','Thème récent : potentiel technologique et rendement boursier restent distincts.'],
].map(([id,isin,cat,emoji,label,note])=>({id,isin,cat,emoji,label,note}))

export const DISTINCT_PORTFOLIO_ASSETS = DISTINCT_PORTFOLIO_CANDIDATES.flatMap(c=>{
 const expiry=c.id.match(/^ibonds-euro-(\d{4})$/)?.[1]
 if(expiry && new Date().getUTCFullYear()>Number(expiry))return []
 const s=monthly[c.isin]
 if(!s || latestCommonYears([s.years],{minimum:3}).length<3)return []
 const complete=latestCommonYears([s.years]).length===6
 return [{...c,distinctCandidate:true,name:getInstrumentName(c.isin,'portfolio'),manualOnly:!complete,r:s.values,
  calendarReturns:s.years,returnCurrency:s.currency,
  desc:[c.label,c.note,'Rendements de marché de la part exacte, ajustés des revenus et divisions.'],confidenceNote:s.note}]
})
