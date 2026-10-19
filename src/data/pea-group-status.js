export function groupPeaStatus(statuses) {
 if(statuses.some(value=>value===true))return true
 if(statuses.length&&statuses.every(value=>value===false))return false
 return undefined
}

export function refreshPeaStatusNotes(input,statusForIsin) {
 let changed=false
 const funds=(input.funds??[]).map(fund=>{
  if(!/PEA (?:non confirmé|confirmé par|non documenté)/i.test(fund.note??''))return fund
  const value=statusForIsin(fund.isin),pea=typeof value==='boolean'?value:null
  const label=pea===true?'PEA documenté':pea===false?'non éligible au PEA':'PEA non documenté'
  changed=true
  return {...fund,pea,note:fund.note.replace(/PEA non confirmé|PEA confirmé par [^);]+|PEA non documenté/gi,label)}
 })
 const group=changed?{...input,funds}:input
 if(!/statut PEA non documenté/i.test(group.choiceNote??''))return group
 const statuses=(group.funds??[]).map(fund=>statusForIsin(fund.isin))
 const pea=groupPeaStatus(statuses)
 if(pea===undefined)return {...group,pea}
 const subject=statuses.length===1?'part citée':'parts citées'
 const wording=pea?(statuses.every(value=>value===true)?`${subject} éligible${statuses.length===1?'':'s'} au PEA`:'au moins une part citée éligible au PEA'):`${subject} non éligible${statuses.length===1?'':'s'} au PEA`
 return {...group,pea,choiceNote:group.choiceNote.replace(/statut PEA non documenté/gi,match=>match[0]==='S'?wording[0].toUpperCase()+wording.slice(1):wording)}
}
