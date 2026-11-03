// Reproducible audit of the prepared views; original imported records are never rewritten.
import { mkdirSync, writeFileSync } from 'node:fs'
import { BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES, BUDGET_COMPLETENESS, BUDGET_ORIGINAL_PUBLICATION_CONTEXT } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, budgetDisplayName, buildBudgetText, publicationContextFor } from '../src/pages/budget-profiles/lib.js'
const changed=BUDGET_PROFILES.filter(p=>BUDGET_COMPLETENESS[p.id].financialChange)
const added=BUDGET_PROFILES.filter(p=>BUDGET_COMPLETENESS[p.id].additions.length || BUDGET_COMPLETENESS[p.id].replacementExpensesReason)
const money=(n,c)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:c||'EUR',maximumFractionDigits:2}).format(n)
const keys=[['income','Ressources'],['expenses','Dépenses et provisions'],['available','Avant versements'],['savings','Versements'],['balance','Après versements']]
const lines=['# Complétude des budgets — revue du 3 novembre 2026','',`70 profils examinés ; ${added.length} complétés (${added.length-1} par ajouts, un changement explicite de périmètre) ; ${changed.length} révisions financières dont une correction de source. Aucun profil ajouté ni supprimé.`, '',
'La photographie de départ est celle de master `91b0c4d2e`. Les fichiers sources, leurs dates, les déclarations et les hypothèses héritées sont conservés. Cette passe relit les pièces du dépôt ; elle ne revendique aucune nouvelle consultation de source publique. Les sources inaccessibles lors des revues antérieures le restent dans leurs métadonnées.', '',
'Les compléments sont des hypothèses autorisées, avec des montants simples en devise d’origine. Ils ne décrivent pas de nouvelles déclarations authentiques. Les provisions annuelles restent nommées dans les deux images. Les versements réduits sont des propositions compatibles avec la version préparée ; les versements d’origine ne sont pas effacés. Un déficit reste visible et aucun revenu n’est ajouté pour l’absorber.', '',
'« Complet » signifie qu’aucun ajout n’est justifié dans le périmètre connu : une enveloppe large n’est pas ventilée une deuxième fois et une inconnue n’est pas assimilée à une gratuité. Les besoins de garde, voitures ou autres situations non établies ne sont pas inventés.', '',
'Cas de périmètre : Élodie passe du foyer préparé de 4 600 € (dont 2 600 € de salaire de conjoint supposé) à ses seules indemnités connues de 2 000 € et une quote-part préparée de dépenses. Les deux totaux ne sont pas directement comparables. Zoé ne bénéficie plus d’un loyer parental non établi. Samuel retrouve les 49 CHF de mobilier/plantes (35 + 14) au lieu des 48 CHF utilisés auparavant.', '',
'Calculs : `scripts/fixtures/budget-completeness-2026-11-03.json` est le rapprochement indépendant en centimes, établi avec Python Decimal / arrondi commercial des pourcentages. Les tests le comparent au moteur pour les 70 photographies avant et les 70 vues après. Les empreintes historiques des profils et contextes initiaux restent inchangées.', '',
'Les brouillons personnalisés restent intacts. Une référence financière distincte du texte permet de signaler leurs anciens chiffres après migration ; seule une vérification ou une régénération volontaire lève cet avertissement. Sauvegardes v2/v3 acceptées, export v4 ; aucune date de publication inventée. Les anciens onglets refusent le nouveau format au lieu de l’écraser.', '']
const rows=[]
for(const [i,p] of BUDGET_PROFILES.entries()){
 const old=BUDGET_ORIGINAL_PROFILES[i],r=BUDGET_COMPLETENESS[p.id],before=analyzeBudget(old),after=analyzeBudget(p),c=publicationContextFor(p),oc=BUDGET_ORIGINAL_PUBLICATION_CONTEXT[p.id]
 const title=budgetDisplayName(p)
 lines.push(`## ${i+1}. ${title}`, '', `Identifiant : \`${p.id}\`. Statut : **${r.status}**.`, '',`Source conservée : [${p.source.publisher}](${p.source.url}). Période : ${p.period}. Publication de source : ${p.publishedAt||'non renseignée'} ; vérification de source : ${p.checkedAt||'non renseignée'}. Accès de la revue antérieure : ${oc.review.access}.`, '',r.conclusion,'',`Ressources : ${r.resourcesReview}`,'','| Montant mensuel | Avant | Version préparée |','|---|---:|---:|',...keys.map(([key,label])=>`| ${label} | ${money(before[key],p.currency)} | ${money(after[key],p.currency)} |`),'')
 if(r.scopeChange)lines.push(`**Périmètre différent :** ${r.scopeChange}`,'')
 lines.push('Couverture examinée : '+Object.entries(r.coverage).map(([key,value])=>`${key} : ${value}`).join(' ; ')+'.','')
 if(r.additions.length)lines.push(...r.additions.map(row=>`- **Hypothèse ajoutée : ${row.label}, ${money(row.amount,p.currency)} / mois**${row.annualAmount?` (${money(row.annualAmount,p.currency)} / an, provision)` : ''}. ${row.reason}`),'')
 if(r.replacementExpensesReason)lines.push(r.replacementExpensesReason,'',...r.profileOverrides.expenses.map(row=>`- **Quote-part hypothétique : ${row.label}, ${money(row.amount,p.currency)} / mois**. ${row.periodicity==='annual-provision' ? `Provision de ${money(row.annualAmount,p.currency)} / an.` : 'Montant mensuel préparé.'}`),'')
 if(r.expenseCorrections)lines.push(...r.expenseCorrections.map(row=>`- **Correction déclarée : ${row.label}, ${money(row.amount,p.currency)}**. ${row.reason}`),'')
 if(r.savingsPlan)lines.push(`Versements adaptés : ${r.savingsReason}`, '',`D’origine : ${old.savings.map(row=>`${row.label} ${money(row.amount,p.currency)}`).join(' ; ')||'aucun'}.`, `Préparés : ${p.savings.map(row=>`${row.label} ${money(row.amount,p.currency)}`).join(' ; ')||'aucun'}.`,'')
 lines.push(`Questions : ${r.questionsReview}.`,'',...c.questions.map(q=>`- ${q.text} — ${q.origin==='expressed'?'interrogation sourcée conservée':q.adaptedFrom?'adaptation éditoriale aux lecteurs, origine conservée en métadonnées':'question éditoriale conservée'}.`),'')
 if(c.paragraphs.length)lines.push('Récit final : '+c.paragraphs.map(x=>x.text).join(' '),'')
 rows.push({id:p.id,name:title,status:r.status,source:p.source.url,period:p.period,currency:p.currency||'EUR',before:Object.fromEntries(keys.map(([k])=>[k,Math.round(before[k]*100)])),after:Object.fromEntries(keys.map(([k])=>[k,Math.round(after[k]*100)])),additions:r.additions,scopeChange:r.scopeChange||null,questions:c.questions})
}
mkdirSync('docs/budget-completeness',{recursive:true})
writeFileSync('docs/budget-completeness/2026-11-03.md',lines.join('\n')+'\n')
writeFileSync('docs/budget-completeness/2026-11-03.json',JSON.stringify(rows,null,2)+'\n')
if(process.argv.includes('--texts'))writeFileSync('test-artifacts/budget-completeness/final-texts.txt',BUDGET_PROFILES.map((p,i)=>`${i}. ${p.id}\n${buildBudgetText(p)}`).join('\n\n================================\n\n'))
console.log(`Budget audit: ${BUDGET_PROFILES.length} reviewed; ${added.length} completed; ${changed.length} financial revisions; ${BUDGET_PROFILES.filter(p=>analyzeBudget(p).balance<0).length} visible deficits.`)
