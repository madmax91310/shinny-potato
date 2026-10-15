import references from './exposures.json' with {type:'json'}
import { ASSETS } from './data.js'
import { portfolioExposure } from '../../lib/portfolio-exposure.js'
export { references }
export const pct = n => `${n.toLocaleString('fr-FR', {maximumFractionDigits:2})} %`
export const euro = n => `${n.toLocaleString('fr-FR', {maximumFractionDigits:2})} €`
export function prepareProfile(profile, index=0) {
  // Editorial holdings, independent of the monthly contributions; never infer capital.
  const patterns = [[55,25,15,5],[40,35,20,5],[65,20,10,5],[30,30,25,15]]
  const raw = profile.lines.map((_,i)=>patterns[index%4][i] ?? 5)
  const total = raw.reduce((s,n)=>s+n,0)
  const weights = raw.map(n=>Math.round(n/total*100))
  weights[0] += 100-weights.reduce((s,n)=>s+n,0)
  return {...profile, mode:'prepared',scope:'Portefeuille investi', approved:false,
    lines:profile.lines.map((line,i)=>({...line,weight:weights[i],isin:references[line.asset]?.isin ?? ''}))}
}
export function validateProfile(profile) {
  const errors=[]
  if (!profile.name?.trim() || profile.name.length>45) errors.push('Indique un pseudonyme de 1 à 45 caractères.')
  if (!profile.scope?.trim() || profile.scope.length>60) errors.push('Précise le périmètre (60 caractères maximum).')
  if (!Array.isArray(profile.lines) || profile.lines.length<1 || profile.lines.length>8) return [...errors,'Le portefeuille doit contenir entre 1 et 8 positions.']
  if(profile.lines.some(l=>!ASSETS[l.asset] || !Number.isFinite(l.weight)||l.weight<0||l.weight>100||!Number.isFinite(l.amount)||l.amount<0||l.amount>1000000)) errors.push('Vérifie les actifs, les poids et les versements : uniquement des nombres positifs ou nuls.')
  if(profile.lines.some(l=>l.weight===0 && l.amount===0)) errors.push('Supprime les positions sans poids ni versement.')
  if(profile.lines.some(l=>l.isin && l.isin!==references[l.asset]?.isin)) errors.push('Le support confirmé doit correspondre à l’actif sélectionné.')
  if(new Set(profile.lines.map(l=>l.asset)).size!==profile.lines.length) errors.push('Regroupe les positions portant sur le même actif.')
  if(Math.abs(profile.lines.reduce((s,l)=>s+l.weight,0)-100)>.001) errors.push('Les poids du portefeuille doivent totaliser 100 %.')
  return errors
}
export function analyzeProfile(profile) {
  const errors=validateProfile(profile)
  if(errors.length) return {errors}
  const monthly=profile.lines.reduce((s,l)=>s+l.amount,0)
  const changes=profile.lines.map(l=>({...l,share:monthly?l.amount/monthly*100:0,delta:monthly?l.amount/monthly*100-l.weight:0})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))
  const records=Object.fromEntries(Object.values(references).map(r=>[r.isin,r]))
  const held=profile.lines.filter(l=>l.weight>0).map(l=>({isin:l.isin,pct:l.weight}))
  const fields=Object.fromEntries(['countries','sectors'].map(field=>{
    const groups=portfolioExposure(held,records,field)
    return [field,{groups,coverage:groups.reduce((s,g)=>s+g.coverage,0)}]
  }))
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
