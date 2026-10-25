import { references, exposureRecords } from './records.js'
import { ASSETS } from './data.js'
import { publishedExposure } from './exposure.js'
export { references }
export const MAX_POSITIONS=50
export const PROFILE_SCOPES = ['Portefeuille investi','PEA + CTO','PEA','CTO','Ensemble des placements']
export const pct = n => `${n.toLocaleString('fr-FR', {maximumFractionDigits:2})} %`
export const euro = n => `${n.toLocaleString('fr-FR', {maximumFractionDigits:2})} €`
export function prepareProfile(profile) {
  // Prepared holdings are explicit editorial scenarios, never inferred from DCA.
  // The fallback only initializes custom inputs that do not carry holdings yet.
  const weights = profile.holdings?.length === profile.lines.length
    ? profile.holdings
    : profile.lines.map((_,i)=>i===0?100:0)
  return {...profile, selection:profile.selection === 'controversial' ? 'controversial' : 'classic', mode:'prepared',scope:'Portefeuille investi', approved:false,
    lines:profile.lines.map((line,i)=>({...line,weight:weights[i],isin:references[line.asset]?.isin ?? ''}))}
}
export function validateProfile(profile) {
  const errors=[]
  if ((!profile.imageOnly && !profile.name?.trim()) || (profile.name||'').length>45) errors.push('Indique un pseudonyme de 1 à 45 caractères.')
  if (!PROFILE_SCOPES.includes(profile.scope)) errors.push('Choisis un périmètre dans la liste.')
  if (!Array.isArray(profile.lines) || profile.lines.length<1 || profile.lines.length>MAX_POSITIONS) return [...errors,'Le portefeuille doit contenir entre 1 et 50 positions.']
  if(profile.lines.some(l=>!ASSETS[l.asset] || !Number.isFinite(l.weight)||l.weight<0||l.weight>100||(!profile.imageOnly&&(!Number.isFinite(l.amount)||l.amount<0||l.amount>1000000)))) errors.push('Vérifie les actifs, les poids et les versements : uniquement des nombres positifs ou nuls.')
  if(profile.lines.some(l=>l.weight===0 && (profile.imageOnly||l.amount===0))) errors.push('Supprime les positions sans poids ni versement.')
  if(profile.lines.some(l=>l.isin && l.isin!==references[l.asset]?.isin)) errors.push('Le support confirmé doit correspondre à l’actif sélectionné.')
  if(new Set(profile.lines.map(l=>l.isin||l.asset)).size!==profile.lines.length) errors.push('Regroupe les positions portant sur le même actif.')
  if(Math.abs(profile.lines.reduce((s,l)=>s+l.weight,0)-100)>.001) errors.push('Les poids du portefeuille doivent totaliser 100 %.')
  return errors
}
export function analyzeProfile(profile) {
  const errors=validateProfile(profile)
  if(errors.length) return {errors}
  if(!profile.lines.every(line=>exposureRecords.isReady(line.asset))) return {errors:['Chargement des expositions…']}
  const monthly=profile.imageOnly?0:profile.lines.reduce((s,l)=>s+l.amount,0)
  const changes=profile.lines.map(l=>({...l,share:monthly?l.amount/monthly*100:0,delta:monthly?l.amount/monthly*100-l.weight:0})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))
  const fields=Object.fromEntries(['countries','sectors'].map(field=>[field,publishedExposure(profile.lines,references,field)]))
  return {errors:[],monthly,changes,...fields}
}
export function observation(profile,analysis=analyzeProfile(profile)) {
  if(analysis.errors.length)return ''
  if(!analysis.monthly)return 'Aucun versement mensuel n’est prévu sur ce portefeuille.'
  const line=analysis.changes[0]
  if(Math.abs(line.delta)<.05)return 'Les versements suivent la répartition actuelle du portefeuille.'
  if(line.amount===0)return `${line.label} représente ${pct(line.weight)} du portefeuille, sans nouveau versement mensuel.`
  return `${line.label} représente ${pct(line.weight)} du portefeuille et reçoit ${pct(line.share)} des versements. ${line.delta>0?'Les nouveaux versements tendent donc à renforcer sa place.':'Sa part dans les versements est plus faible que son poids actuel.'}`
}
export function publicationReady(profile) {
  return !validateProfile(profile).length && (profile.mode!=='participant'||profile.approved===true)
}
