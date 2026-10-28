// A shared message/host is a presentation similarity, not a proven cause.
// Keep product periods and unknown causes separate. Only typed producer evidence
// can establish one intervention covering several different points.
export function reviewCauseKey(row){
 const scope=[row.kind,row.workflow,row.runId??row.runUrl,row.attempt??1,row.stage]
 if(typeof row.proofId==='string'&&row.workflow&&scope[2])return JSON.stringify(['report',...scope,row.proofId])
 if(row.workflow&&scope[2]&&Array.isArray(row.failedSteps)&&row.failedSteps.length&&row.failedSteps.every(s=>s&&typeof s.job==='string'&&typeof s.step==='string'))return JSON.stringify(['steps',...scope,row.failedSteps.map(s=>[s.job,s.step]).sort()])
 return JSON.stringify(['point',row.id])
}
export function groupReviewIssues(rows){
 const groups=new Map()
 for(const row of rows){const key=reviewCauseKey(row);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row)}
 return groups
}
export function closureRequirement(row){
 if(row.kind==='history')return 'Preuve de résolution conservée dans les signalements ; une archive non qualifiée reste à documenter.'
 if(row.kind==='waiting')return 'Publication de la période attendue selon le calendrier de la source ; aucune panne déduite de l’attente.'
 if(row.kind==='not-applicable')return 'Justification de périmètre conservée ; aucun succès source déduit de ce statut.'
 if(row.stage==='Publication')return 'Empreintes du même périmètre enregistré retrouvées dans les fichiers réellement publiés.'
 if(row.kind==='monitoring')return 'Preuve de l’exécution, du rapport et de la tentative exacts ; une autre exécution verte ne suffit pas.'
 if(row.kind==='connection')return 'Observation du champ exact, validée, enregistrée, publiée puis effectivement chargée par le consommateur.'
 if(row.kind==='qualification')return 'Identité, convention, période, preuve du champ et usage exact rapprochés ; chaque réserve indiquée doit être levée.'
 return 'Contrôle ciblé réussi après la panne, sur le même actif, champ, période et étape ; dernières données conservées jusque-là.'
}
