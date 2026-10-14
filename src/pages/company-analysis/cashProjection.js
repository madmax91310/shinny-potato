import { median } from './scenarioCalibration.js'
const clamp=(x,l,h)=>Math.max(l,Math.min(h,x)),positive=x=>Number.isFinite(x)&&x>0
// Project the operating components first. Share changes are applied once, after
// cash generation: never compound historical per-share CAGR plus buybacks.
export function projectCash(company,inputs,anchor) {
  const rows=company.decision.years,normal=company.valuationShareBasis?.normalisedYears
  const history=rows.map(r=>({...r,shares:normal?.find(n=>n.end===r.end)?.averageDilutedShares??r.averageDilutedShares}))
  if(history.some(r=>!positive(r.revenue)||!positive(r.shares)||!Number.isFinite(r.operatingCashFlow)||!Number.isFinite(r.capitalExpenditure)||r.capitalExpenditure<0))return null
  const latest=history.at(-1),lastThree=history.slice(-3)
  const cashMargin=median(lastThree.map(r=>r.operatingCashFlow/r.revenue)),latestMargin=latest.operatingCashFlow/latest.revenue
  // Do not assume a current investment programme disappears to manufacture FCF.
  const capexIntensity=Math.max(latest.capitalExpenditure/latest.revenue,median(lastThree.map(r=>r.capitalExpenditure/r.revenue)))
  const shareRates=history.slice(1).map((r,i)=>(r.shares/history[i].shares)**(365.25*86400000/(Date.parse(r.end)-Date.parse(history[i].end)))-1)
  const observedShares=median(shareRates),buybacks=latest.shareRepurchases,dividends=latest.dividendsPaid
  const fundingKnown=Number.isFinite(buybacks)&&buybacks>=0&&Number.isFinite(dividends)&&dividends>=0
  const funding=fundingKnown&&buybacks>0?clamp((latest.freeCashFlow-dividends)/buybacks,0,1):0
  const sharesGrowth=observedShares<0?(funding>0?Math.max(-.05,observedShares)*funding:0):clamp(observedShares,0,.10)
  const first=history[0],elapsed=(Date.parse(latest.end)-Date.parse(first.end))/86400000/365.25
  const revenueGrowth=clamp((latest.revenue/first.revenue)**(1/elapsed)-1,-.30,.30)
  const projected=[{end:latest.end,value:latest.freeCashFlow/latest.shares,revenue:latest.revenue,ocf:latest.operatingCashFlow,capex:latest.capitalExpenditure,shares:latest.shares,kind:'published'}]
  for(let i=1;i<=8;i++) {
    const previous=projected.at(-1),growth=revenueGrowth+(anchor-revenueGrowth)*Math.min(i/3,1)
    const revenue=previous.revenue*(1+growth),margin=latestMargin+(cashMargin-latestMargin)*Math.min(i/3,1)
    const ocf=revenue*margin,capex=revenue*capexIntensity,shares=previous.shares*(1+sharesGrowth)
    const date=new Date(`${latest.end}T00:00:00Z`);date.setUTCFullYear(date.getUTCFullYear()+i)
    projected.push({end:date.toISOString().slice(0,10),value:(ocf-capex)/shares,revenue,ocf,capex,shares,kind:'model'})
  }
  if(projected.some(p=>!positive(p.value)))return null
  const conversion=latest.netIncome>0?latest.freeCashFlow/latest.netIncome:null
  const abnormal=Math.abs(latestMargin-cashMargin)>.05||Math.abs(latestMargin-cashMargin)>Math.abs(cashMargin)*.25
  const sbc=Number.isFinite(latest.shareBasedCompensation)?latest.shareBasedCompensation/latest.operatingCashFlow:null
  return {curve:projected,history:history.map(r=>({end:r.end,value:r.freeCashFlow/r.shares})),cashMargin,latestMargin,capexIntensity,
    sharesGrowth,observedShares,funding,fundingKnown,conversion,sbc,abnormal,revenueGrowth,
    explanation:`CA projeté à partir de ${(revenueGrowth*100).toFixed(1)} % puis convergence vers ${(anchor*100).toFixed(1)} %. Marge de trésorerie ramenée sur trois ans vers sa médiane récente (${(cashMargin*100).toFixed(1)} %). Investissements maintenus à ${(capexIntensity*100).toFixed(1)} % du CA (maximum du dernier exercice et de la médiane sur trois ans). Actions diluées : ${(sharesGrowth*100).toFixed(2)} % par an${observedShares<0&&!fundingKnown?' ; baisse historique non prolongée faute de données complètes de financement':''}.`,
    limits:'La variation nette des actions couvre déjà les émissions et rachats observés : aucun rachat ni dividende ajouté au cours cible, aucune seconde déduction de la rémunération en actions. La normalisation des marges n’est pas un retraitement comptable des éléments exceptionnels. Acquisitions, locations et financement futur restent hors projection explicite.',
    warning:abnormal?'Marge de trésorerie atypique par rapport aux trois derniers exercices : examiner les éléments exceptionnels et le besoin en fonds de roulement.':null}
}
