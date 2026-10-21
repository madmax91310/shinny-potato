import LONG from './ranking-histories.json' with { type: 'json' }
import ANNIVERSARY from './anniversary-index-history.json' with { type: 'json' }
import { currentEvidence } from './evidence-freshness.js'
import { canonicalIndexHistoryId } from './index-history-identities.js'
import { indexMethodNote } from '../lib/performance-conventions.js'
// Reuse issuer index levels already maintained by the existing collectors.
// Exact-share quotations and extensions of existing ids retain their original routes.
const sources = { ...Object.fromEntries(Object.values(LONG).filter(r=>!r.targetId && r.parser==='msci').map(r=>[r.id,r])), ftseAllWorld:ANNIVERSARY.ftseAllWorld }
const monthIndex = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? '') ? Number(value.slice(0,4))*12+Number(value.slice(5)) : NaN
const observations = globalThis.process?.env?.MONTHLY_ARCHIVE_AUDIT==='1' ? [] : Object.entries(sources).filter(([,r])=>{
  if(!r || r.isin || !['msci','ftse'].includes(r.parser) || !['NETR','GRTR'].includes(r.variant) || !['EUR','USD'].includes(r.currency)
    || !/^[a-f0-9]{64}$/.test(r.responseSha256??'') || !r.sourceUrls?.length || !r.sourceUrls.every(u=>u.startsWith('https://')) || !r.points?.length) return false
  const end=monthIndex(r.periodEnd),date=Number.isFinite(end)?new Date(Date.UTC(Number(r.periodEnd.slice(0,4)),Number(r.periodEnd.slice(5)),0)).toISOString().slice(0,10):null
  return r.points[0][0]===r.periodStart && r.points.at(-1)[0]===r.periodEnd && end<new Date().getUTCFullYear()*12+new Date().getUTCMonth()+1
    && currentEvidence(r.checkedAt,date,'series.monthly') && r.points.every(([ym,value],i,all)=>Number.isFinite(monthIndex(ym)) && Number.isFinite(value) && value>0
      && (!i || monthIndex(ym)===monthIndex(all[i-1][0])+1) && !(i>=2 && value===all[i-1][1] && value===all[i-2][1]))
})
export const CERTIFIED_INDEX_HISTORIES = Object.fromEntries(observations.map(([id,r])=>{
  const name=r.label.replace(/^Indice /,'')
  return [id,{...r,id,indexId:canonicalIndexHistoryId(id),label:`${name} ${r.variant}`,icon:'📊',tweetPhrase:`l’indice ${name} ${r.variant}`,priceUnit:'points',
    anniversaryAvailable:Boolean(ANNIVERSARY[id]),
    methodNote:indexMethodNote({name,variant:r.variant==='NETR'?'Net Return':'Gross Return',currency:r.currency,income:r.variant==='NETR'?'net':'gross'}),
    points:r.points.map(([date,price])=>({date,price}))}]
}))
export const CERTIFIED_INDEX_HISTORY_REVIEW = Object.fromEntries(observations.map(([id,r])=>[`history:${id}`,{
  sourceUrls:r.sourceUrls,checkedAt:r.checkedAt,asOf:null,periodStart:r.periodStart,periodEnd:r.periodEnd,dateStatus:'month-only',sourceStatus:'documented',method:r.method,
  note:`Niveaux officiels réutilisés depuis les collectes existantes. SHA-256 ${r.responseSha256}.`,
}]))
