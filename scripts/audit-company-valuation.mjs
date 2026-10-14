import fs from 'node:fs'
import { COMPANIES } from '../src/data/companies.js'
import { buildPriceScenarios } from '../src/pages/company-analysis/priceTargets.js'
const report = {generatedAt: new Date().toISOString(), companies: COMPANIES.map(company => {
  const {inputs,scenarios,evidence} = buildPriceScenarios(company)
  return {id:company.id, cashReady:inputs.cashReady, earningsReady:inputs.earningsReady,
    qualifiedEvidence: {cash:evidence.cash?.rationale,earnings:evidence.earnings?.rationale},
    priceHistoryPoints:company.quote?.history?.length??0,
    dataCoverage: {
      annualCashFlowYears: (company.decision?.years ?? []).filter(r => Number.isFinite(r.freeCashFlow)).length,
      publishedShareCountYears: (company.decision?.years ?? []).filter(r => r.averageDilutedShares > 0 && r.sharesBasisSource).length,
      shareBasisQualified: Boolean(company.valuationShareBasis),
      sourcedEstimateThrough: company.targetForecast?.points?.filter(p => p.kind === 'estimate').at(-1)?.end ?? null,
      historicalCashMultiples: company.targetCashReference?.historicalMultiples?.length ?? 0,
    },
    priceTargets:[1,3,5].map(years=>{const m=buildPriceScenarios(company,{},new Date(),years);return {years,date:m.targetDate,scenarios:m.scenarios.map(s=>({name:s.name,cash:s.cashTarget,earnings:s.earningsTarget}))}}),
    historyYears:inputs.history.length, quoteAsOf:company.quote?.asOf, reasons:inputs.reasons,
    scenarios:scenarios.map(s=>({name:s.name,cash:s.cashTarget?.value??null,earnings:s.earningsTarget?.value??null}))}
})}
report.summary = {
  companies: report.companies.length,
  cashReady: report.companies.filter(c => c.cashReady).length,
  earningsReady: report.companies.filter(c => c.earningsReady).length,
  incomplete: report.companies.filter(c => !c.cashReady || !c.earningsReady).map(c => ({id:c.id, ...c.dataCoverage, reasons:c.reasons})),
}
console.log(JSON.stringify(report,null,2))
if (process.argv[2]) fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n')
