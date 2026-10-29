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

export function historicalResolutionProof(row,now){
 const p=row.resolutionEvidence,validDate=v=>Number.isFinite(Date.parse(v))&&Date.parse(v)<=now,sha=(v,n)=>typeof v==='string'&&new RegExp('^[a-f0-9]{'+n+'}$').test(v),url=v=>typeof v==='string'&&/^https:\/\//.test(v)
 if(!p||typeof p!=='object'||Array.isArray(p)||!validDate(row.resolvedAt))return false
 const evidence=p.evidence??p
 if(p.kind){
  if(!validDate(p.checkedAt))return false
  switch(p.kind){
   case 'qualified-monthly-return-window': {
    const w=p.window,expected=row.unqualifiedReturnWindow,runtime=w?.sourceRuntime,check=w?.sourceCheck
    const bounds=row.id.match(/^history:automated-etf-monthly:[^:]+:return-window:(\d{4}-\d{2}):(\d{4}-\d{2})$/)
    return Boolean(bounds&&w&&expected&&check&&runtime&&p.dataId===row.dataId&&/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(p.dataId)&&
     p.currency===row.currency&&typeof p.method==='string'&&p.method.length>0&&p.method===row.method&&sha(p.responseSha256,64)&&
     w.start===bounds[1]&&w.end===bounds[2]&&w.start===expected.start&&w.end===expected.end&&w.year===expected.year&&
     Number.isInteger(w.year)&&w.start===`${w.year-1}-12`&&w.end===`${w.year}-12`&&w.convention==='fund-nav-total-return'&&
     runtime.kind==='github'&&['push','schedule','workflow_dispatch'].includes(runtime.event)&&/^[1-9]\d*$/.test(String(runtime.runId))&&
     /^[1-9]\d*$/.test(String(runtime.attempt))&&sha(runtime.codeRevision,40)&&check.year===w.year&&
     typeof check.start==='string'&&typeof check.end==='string'&&check.start.slice(0,7)===w.start&&check.end.slice(0,7)===w.end&&
     validDate(check.start)&&validDate(check.end)&&check.start<check.end&&
     [check.startValue,check.endValue].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>0)&&
     [check.dailyDerived,check.published].every(v=>typeof v==='number'&&Number.isFinite(v)))
   }
   case 'verified-existing-field-binding':return p.publishedFilesVerified===true&&p.subject===row.id.replace(/^field:/,'')&&sha(p.seriesFingerprint,64)&&url(p.sourceUrl)&&p.sourceFiles&&Object.keys(p.sourceFiles).length>0&&Object.values(p.sourceFiles).every(v=>sha(v,40))
   case 'verified-source-revision':return p.evidenceVerified===true&&p.status==='confirmed'&&sha(p.sourceHash,64)&&url(p.sourceUrl)
   case 'matching-public-source-fingerprints':return sha(p.receiptCommit,40)&&sha(p.codeSha,40)&&sha(p.dataSha,40)&&Number.isInteger(p.fileCount)&&p.fileCount>0
   case 'matching-public-inventory-projection':return sha(p.inventoryBlobSha,40)&&sha(p.codeSha,40)
   case 'explicit-public-artifact-check':return url(p.runUrl)
   case 'observer-or-heartbeat-recovered':return p.scope===row.id
   case 'fully-enumerated-skipped-interval':return p.complete===true&&p.eligibleMissing===0&&Number.isInteger(p.anchorRunId)&&Array.isArray(p.enumerationSha256)&&p.enumerationSha256.length>0&&p.enumerationSha256.every(v=>sha(v,64))
   default:return false
  }
 }
 if(typeof evidence.file==='string'&&sha(evidence.sha256,64))return true
 if(url(p.runUrl)&&validDate(p.completedAt)&&Array.isArray(p.checks)&&p.checks.length>0&&p.checks.every(c=>c&&typeof c.job==='string'&&typeof c.step==='string'))return true
 if(row.id.startsWith('history:')){const periods=[...(row.missingPeriods??[]),...(row.invalidPeriods??[])];return validDate(p.checkedAt)&&typeof p.asOf==='string'&&['currency','method'].every(k=>!row[k]||row[k]===p[k])&&(row.id.endsWith(':delay')?p.asOf>(row.asOf??''):periods.length>0&&Array.isArray(p.restoredPeriods)&&periods.every(v=>p.restoredPeriods.includes(v)))}
 return /^(field|calendar):/.test(row.id)&&validDate(p.checkedAt)&&url(p.sourceUrl)&&typeof p.asOf==='string'
}
