import fs from 'node:fs'
import { COMPANIES } from '../src/data/companies.js'
import { companyQualification } from '../src/pages/company-analysis/dataQualification.js'
import { companyCompleteness } from '../src/pages/company-analysis/completeness.js'
const now=new Date(),companies=COMPANIES.map(c=>({...companyQualification(c,now),legacyContract:companyCompleteness(c,now)}))
const report={generatedAt:now.toISOString(),summary:{companies:companies.length,
  earnings:companies.filter(c=>c.methods.earnings.available).length,cash:companies.filter(c=>c.methods.cash.available).length,
  both:companies.filter(c=>c.methods.earnings.available&&c.methods.cash.available).length,
  neither:companies.filter(c=>!c.methods.earnings.available&&!c.methods.cash.available).map(c=>c.id)},companies}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report.summary,null,2))
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\n## Disponibilité par méthode\n\n${report.summary.companies} entreprises : ${report.summary.earnings} méthodes bénéfices, ${report.summary.cash} méthodes FCF, ${report.summary.both} avec les deux.\n\n`+companies.filter(c=>!c.methods.cash.available||!c.methods.earnings.available).map(c=>`- ${c.name} : `+Object.entries(c.methods).filter(([,m])=>!m.available).map(([key,m])=>`${key} : ${m.reasons.join(' ')}`).join(' ; ')).join('\n')+'\n')
