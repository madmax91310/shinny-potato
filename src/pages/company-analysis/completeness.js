import { activeDecision, activeHistory, canPublish } from './lib.js'
import { buildPriceScenarios, targetChart } from './priceTargets.js'

// One product contract for admission and daily monitoring. Candidate count is
// never substituted for usable-company count. Losses and negative FCF stay signed.
export function companyCompleteness(company,now=new Date()) {
  const missing=[]
  const need=(condition,reason)=>{if(!condition)missing.push(reason)}
  need(canPublish(company,now),'comptes récents')
  need(activeHistory(company,now).length>=4,'quatre exercices comparables')
  const decision=activeDecision(company,now),rows=decision?.years??[]
  need(rows.length>=4,'composantes annuelles')
  for(const key of ['operatingCashFlow','capitalExpenditure','freeCashFlow','averageDilutedShares'])
    need(rows.length>=4&&rows.every(r=>Number.isFinite(r[key])&&(key!=='averageDilutedShares'||r[key]>0)),key)
  need(Boolean(company.activity&&company.watch),'explication de l’activité et vigilance')
  let methods=[]
  try {
    const model=buildPriceScenarios(company,{},now)
    const inputs=model.inputs
    need(inputs.pe>0,'PER publié comparable')
    need(Number.isFinite(inputs.reportedCashPerShare),'FCF par action comparable')
    need(Boolean(model.evidence.earnings),'BPA prévisionnel et PER ajustés sourcés')
    methods=['cash','earnings'].filter(m=>Boolean(model.evidence[m]))
    need(methods.length>0,'méthode de valorisation adaptée')
    need(targetChart(company,model,methods[0]??'history').hasPriceHistory,'historique réel de cours')
    for(const years of [1,3,5]) {
      const m=buildPriceScenarios(company,{},now,years)
      for(const method of methods)need(m.scenarios.every(s=>{
        const t=s[method+'Target'];return t&&t.value>0&&Number.isFinite(t.annualised)&&Number.isFinite(t.upside)
      }),`scénarios ${method} à ${years} ans`)
    }
  }catch(error){missing.push(`modèle : ${error.message}`)}
  return {id:company.id,name:company.name,complete:missing.length===0,methods,missing:[...new Set(missing)]}
}
