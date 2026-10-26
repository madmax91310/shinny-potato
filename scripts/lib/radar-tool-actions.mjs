import { ETFS } from '../../src/data/etf-cards.js'
import reviewed from '../../src/data/etf-presentation-reviewed-ids.json' with {type:'json'}
import { publicationMaterial } from '../../src/lib/radar-material.js'
import { reliability } from '../../src/lib/radar-editorial.js'
import { tweetStatus } from '../../src/pages/hey-grok/lib.js'

const cards=new Map(ETFS.filter(e=>reviewed.includes(e.id)&&e.isin&&e.ter&&e.name).map(e=>[e.isin,e]))
// These are real input contracts: ETF sheets read ?isin; Hey Grok explicitly
// accepts a versioned router-state suggestion below. No catalogue write occurs.
export function radarToolActions(event,now=Date.now()) {
  const material=publicationMaterial(event,now),actions=[]
  if(material.status!=='sufficient'||!reliability(event,now).usable)return actions
  const isins=[event.entity,...(event.products??[]).map(p=>p.isin)].filter(isin=>cards.has(isin))
  if(event.family==='etf'&&new Set(isins).size===1){
    const isin=isins[0],card=cards.get(isin)
    actions.push({kind:'etf-sheet',to:`/fiches-etf?isin=${isin}`,label:`Consulter la fiche ${card.name}`,note:'Fiche existante et revue du catalogue ; l’annonce n’a pas modifié ses données. Contrôler les dates avant export.',stage:'qualified-catalogue'})
  }
  if(material.question&&(material.positioning||material.money&&material.comparison)){
    const question=material.positioning?'Comment lire ce repère sans confondre la situation individuelle et la population étudiée ?':'Quelles conditions faut-il garder pour interpréter cette comparaison ?'
    const text=`Hey @grok, ${material.mainFact}\n\n${question}\nSource : ${event.sourceUrl}`
    if(tweetStatus(text).canCopy)actions.push({kind:'grok',to:'/hey-grok',label:'Préparer une question Hey @Grok',note:'Question issue des faits cités, à relire ; compteur X dans l’éditeur.',state:{radar:{version:1,id:event.id,text,sourceUrl:event.sourceUrl,publishedAt:material.attention.at,context:material.mainFact}}})
  }
  return actions.slice(0,2)
}
