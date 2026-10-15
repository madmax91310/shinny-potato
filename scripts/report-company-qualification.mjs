import fs from 'node:fs'
import { COMPANIES } from '../src/data/companies.js'
import { companyQualification } from '../src/pages/company-analysis/dataQualification.js'
import { companyCompleteness } from '../src/pages/company-analysis/completeness.js'
const now=new Date(),companies=COMPANIES.map(c=>({...companyQualification(c,now),legacyContract:companyCompleteness(c,now)}))
// Daily queue distinguishes source gaps from methods outside their valid domain.
const completionQueue=companies.filter(c=>!c.methods.earnings.available||!c.methods.cash.available||!c.legacyContract.complete).map(c=>({
  id:c.id,name:c.name,priority:!c.methods.earnings.available&&!c.methods.cash.available?1:!c.methods.cash.available?2:3,
  missingFields:Object.entries(c.fields).filter(([key,f])=>key!=='quarterly'&&!f.usable).map(([key,f])=>({field:key,present:f.present,period:f.period,sourceUrl:f.sourceUrl})),
  blockedMethods:Object.entries(c.methods).filter(([,m])=>!m.available).map(([method,m])=>({method,reasons:m.reasons})),
  incompleteContract:c.legacyContract.missing,
})).sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name))
const report={completionQueue,generatedAt:now.toISOString(),summary:{companies:companies.length,
  earnings:companies.filter(c=>c.methods.earnings.available).length,cash:companies.filter(c=>c.methods.cash.available).length,
  both:companies.filter(c=>c.methods.earnings.available&&c.methods.cash.available).length,
  neither:companies.filter(c=>!c.methods.earnings.available&&!c.methods.cash.available).map(c=>c.id)},companies}
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report.summary,null,2))
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\n## Disponibilité par méthode\n\n${report.summary.companies} entreprises : ${report.summary.earnings} méthodes bénéfices, ${report.summary.cash} méthodes FCF, ${report.summary.both} avec les deux.\n\n`+companies.filter(c=>!c.methods.cash.available||!c.methods.earnings.available).map(c=>`- ${c.name} : `+Object.entries(c.methods).filter(([,m])=>!m.available).map(([key,m])=>`${key} : ${m.reasons.join(' ')}`).join(' ; ')).join('\n')+'\n')

if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`\n### Dossiers à compléter automatiquement\n\n${completionQueue.map(c=>`- Priorité ${c.priority} · ${c.name} : ${c.blockedMethods.flatMap(m=>m.reasons).join(' ')||c.incompleteContract.join(' ; ')}`).join('\n')}\n\nLes méthodes exigeant un FCF positif ne sont pas activées en supprimant les exercices négatifs. Les classes d’actions et fractionnements restent soumis à qualification.\n`)
