import fs from 'node:fs'
import { COMPANIES } from '../src/data/companies.js'
import { buildScenarios } from '../src/pages/company-analysis/valuation.js'
const report = {generatedAt: new Date().toISOString(), companies: COMPANIES.map(company => {
  const {inputs,scenarios} = buildScenarios(company)
  return {id:company.id, cashReady:inputs.cashReady, earningsReady:inputs.earningsReady,
    historyYears:inputs.history.length, quoteAsOf:company.quote?.asOf, reasons:inputs.reasons,
    scenarios:scenarios.map(s=>({name:s.name,cash:s.cash?.value??null,earnings:s.earnings}))}
})}
console.log(JSON.stringify(report,null,2))
if (process.argv[2]) fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n')
