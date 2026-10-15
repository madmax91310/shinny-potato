import { activeBalance, activeSolidity, activeDecision, activeHistory, canPublish, fresh, latestAccountsEnd } from './lib.js'
import { buildPriceScenarios } from './priceTargets.js'

export const FINANCIAL_FIELDS = {
  revenue:['Chiffre d’affaires','Ventes consolidées de l’exercice','calculation'],
  operatingCashFlow:['Flux d’exploitation','Trésorerie générée par les activités opérationnelles','calculation'],
  capitalExpenditure:['Investissements','Dépenses d’investissement retenues dans OCF moins investissements','calculation'],
  freeCashFlow:['FCF','Flux d’exploitation moins investissements ; après intérêts selon les comptes utilisés','calculation'],
  averageDilutedShares:['Actions diluées','Nombre moyen pondéré dilué ; base après fractionnements contrôlée séparément','calculation'],
  shareBasedCompensation:['Rémunération en actions','Charge non monétaire publiée ; non déduite une seconde fois du FCF','risk'],
  shareRepurchases:['Rachats d’actions','Décaissements annuels ; utilisés pour borner la baisse projetée des actions','calculation'],
  dividendsPaid:['Dividendes versés','Décaissements annuels ; pris en compte dans le financement des rachats','calculation'],
  acquisitions:['Acquisitions','Flux de trésorerie publié pour les acquisitions ; hors projection explicite','risk'],
  debt:['Dette financière','Dette totale selon le fournisseur ; consulter la définition pour les locations','risk'],
  cash:['Trésorerie','Trésorerie et équivalents, hors placements à court terme','risk'],
  leaseLiabilities:['Dettes de location','Obligations locatives publiées ; ne pas les ajouter à une dette qui les inclut déjà','risk'],
}
export function financialDepth(company,now=new Date()) {
  const decision=activeDecision(company,now),annual=company.decision?.years?.at(-1)
  const extra=company.financialDepth
  const extraOK=extra?.version===1&&extra.currency===company.currency&&extra.annualEnd===company.annual?.end
    &&fresh(extra.observedAt,45,now)&&fresh(extra.sourceAsOf,200,now)&&canPublish(company,now)
  const balance=activeBalance(company,now),solidity=activeSolidity(company,now)?.latestBalance
  return Object.entries(FINANCIAL_FIELDS).map(([key,[label,definition,use]])=>{
    const fallback=['cash','debt'].includes(key)?[balance,solidity].find(b=>Number.isFinite(b?.[key])&&b.sourceUrl?.startsWith('https://')):null
    const observed=extra?.fields?.[key]??(fallback?{value:fallback[key],end:fallback.asOf,sourceUrl:fallback.sourceUrl,definition:key==='debt'?fallback.debtDefinition??definition:definition}:null)
    const fromAnnual=Number.isFinite(annual?.[key])
    const raw=fromAnnual?annual:observed
    const value=fromAnnual?annual[key]:observed?.value
    const sourceUrl=fromAnnual?(key==='averageDilutedShares'?annual.sharesBasisSource:['operatingCashFlow','capitalExpenditure','freeCashFlow','shareBasedCompensation','dividendsPaid','shareRepurchases'].includes(key)?annual.additionalSourceUrls?.[0]??annual.sourceUrl:annual.sourceUrl):observed?.sourceUrl
    const present=Number.isFinite(value)
    const isFresh=fromAnnual?Boolean(decision):Boolean(extra?.fields?.[key]?extraOK&&observed?.end===company.annual?.end:fallback)
    const usable=present&&isFresh&&Boolean(sourceUrl?.startsWith('https://'))
    return {key,label,definition:fromAnnual?(key==='freeCashFlow'?annual.freeCashFlowDefinition??definition:definition):observed?.definition??definition,use:fromAnnual?use:'risk',value:usable?value:null,present,fresh:isFresh,usable,
      end:fromAnnual?annual.end:raw?.end??null,sourceUrl:sourceUrl??null,
      status:usable?'qualified':present?'unqualified':'missing'}
  })
}
export function companyQualification(company,now=new Date(),model=buildPriceScenarios(company,{},now)) {
  const field=(present,isFresh,usable,period,sourceUrl)=>({present:Boolean(present),fresh:Boolean(isFresh),usable:Boolean(usable),period:period??null,sourceUrl:sourceUrl??null})
  const q=company.quote,f=company.targetForecast,b=company.valuationShareBasis
  const fields={
    accounts:field(company.annual,canPublish(company,now),canPublish(company,now),company.annual?.end,company.annual?.sourceUrl),
    quote:field(q,fresh(q?.asOf,10,now),model.inputs.price,q?.asOf,q?.sourceUrl),
    history:field(company.history, fresh(company.history?.observedAt,45,now),activeHistory(company,now).length>=4,company.history?.years?.at(-1)?.end,company.history?.years?.at(-1)?.sourceUrl),
    shareBasis:field(b,fresh(b?.observedAt,45,now),Number.isFinite(model.inputs.reportedCashPerShare),b?.annualEnd,b?.sourceUrl),
    estimates:field(f,fresh(f?.asOf,35,now)&&fresh(f?.observedAt,35,now),model.evidence.earnings,f?.points?.filter(p=>p.kind==='estimate').at(-1)?.end,f?.sourceUrl),
    quarterly:field(company.quarter??company.halfYear,fresh((company.quarter??company.halfYear)?.end,200,now)&&fresh((company.quarter??company.halfYear)?.observedAt??company.accountsObservedAt,45,now),false,(company.quarter??company.halfYear)?.end,(company.quarter??company.halfYear)?.sourceUrl),
  }
  // Quarterly data explain recent developments; target engines use annual data.
  fields.quarterly.role='context-only'
  const methods=Object.fromEntries(['earnings','cash'].map(method=>[method,{available:Boolean(model.evidence[method]),reasons:model.evidence.methodReasons[method],
    sourcedThrough:method==='earnings'?fields.estimates.period:company.annual?.end,
    historicalMultipleCount:model.evidence[method]?.calibration.multiples.count??0,
    limitations:model.evidence[method]?[model.evidence[method].trajectory,model.evidence[method].calibration.convention]:[]}]))
  const diagnostic=company.valuationCollection
  if(!methods.cash.available&&fresh(diagnostic?.observedAt,45,now)) {
    const detail=diagnostic.valuationShareBasisDetail??diagnostic.cashBasis??''
    const reason=detail.includes('Multiple share classes')?'Les différentes classes d’actions ne disposent pas encore d’une base FCF par action qualifiée.':detail.includes('Split in historical window')?'Un fractionnement figure dans l’historique : le retraitement des nombres d’actions doit être certifié par les publications de l’émetteur.':detail.includes('Four annual published')?'Quatre nombres moyens d’actions diluées publiés et sourcés sont nécessaires.':null
    if(reason)methods.cash.reasons=[reason,...methods.cash.reasons]
  }
  if(!methods.cash.available) {
    const years=(activeDecision(company,now)?.years??[]).filter(r=>Number.isFinite(r.freeCashFlow)&&r.freeCashFlow<=0).map(r=>r.end.slice(0,4))
    if(years.length)methods.cash.reasons=[`Le FCF publié est nul ou négatif en ${years.join(', ')}. Cette méthode exige un historique positif ; ces exercices sont conservés dans les données.`,...methods.cash.reasons]
  }
  return {id:company.id,name:company.name,checkedAt:now.toISOString(),latestAccountsEnd:latestAccountsEnd(company),fields,methods,financialDepth:financialDepth(company,now)}
}
