// Descriptive supports only: no security identifier, rate or inferred composition.
export const SAVINGS = {
 'livret-a': {name:'Livret A', category:'Épargne réglementée', aliases:['livret']},
 ldds: {name:'LDDS', category:'Épargne réglementée', aliases:['Livret de développement durable et solidaire']},
 lep: {name:'LEP', category:'Épargne réglementée', aliases:['Livret d’épargne populaire']},
 pel: {name:'PEL', category:'Épargne réglementée', aliases:['Plan épargne logement']},
 'fonds-euros': {name:'Fonds en euros', category:'Fonds en euros', aliases:['fonds euros']},
 'compte-a-terme': {name:'Compte à terme', category:'Comptes à terme', aliases:['CAT','dépôt à terme']},
 liquidites: {name:'Liquidités', category:'Liquidités', aliases:['cash','espèces']},
}
export const SAVINGS_REFERENCES = Object.fromEntries(Object.entries(SAVINGS).map(([id,r])=>[id,{
 ...r, kind:'savings', outsideClassification:r.name,
}]))
// Reuse the selector's existing families; savings require only these precise additions.
export const MANUAL_CATEGORIES = ['Monde','États-Unis','Europe','Émergents','Asie hors Japon','Japon',
 'Actions','Obligations et monétaire','Multi-actifs','Crypto','Matières premières','Immobilier',
 'Dividendes et revenus','Secteurs et thématiques','Facteurs et pondérations','Autres actifs',
 'Épargne réglementée','Fonds en euros','Comptes à terme','Liquidités']
const outsideCategories = new Set(['Épargne réglementée','Fonds en euros','Comptes à terme','Liquidités',
 'Obligations et monétaire','Crypto','Matières premières'])
export const isManualLine = line => line?.manual === true && /^manual:[0-9a-f-]{36}$/.test(line.asset || '')
export const validManualIdentity = line => isManualLine(line) && !line.isin && MANUAL_CATEGORIES.includes(line.category)
export function newManualLine({label='',category='Autres actifs',weight=0,amount=0}={}) {
 return {asset:`manual:${crypto.randomUUID()}`,manual:true,label,category,weight,amount,isin:'',emoji:'•'}
}
export function outsideClassification(line, references) {
 if (isManualLine(line)) return outsideCategories.has(line.category) ? line.label || line.category : null
 return references[line.asset]?.outsideClassification || null
}
