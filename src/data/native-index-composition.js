// A full economic-index reference needs its own admitted source and exact-share
// benchmark proof. A physical ETF proxy cannot acquire this status by a label.
import contracts from './native-index-composition-contracts.json' with {type:'json'}
const hash=value=>/^[a-f0-9]{64}$/.test(value||'')
const day=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return NaN
 const parsed=Date.parse(value)
 return Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===value?parsed:NaN
}
export function qualifiedNativeIndexComposition(record,isin,now=new Date()){
 const share=contracts.shares[isin],index=contracts.indices[share?.indexId],h=record
 if(!index||!h||h.basis!=='index'||h.subjectIsin!==isin||h.indexId!==share.indexId||h.scope!=='equity-index')return false
 const known=Array.isArray(h.rows)?h.rows.filter(row=>row.isin):[]
 const p=h.coverageProof,stamp=day(h.asOf),shareDate=day(h.shareAsOf),control=Date.parse(h.checkedAt),today=+new Date(now)
 return h.sourceUrl===index.weightSourceUrl&&hash(h.sha256)&&hash(h.shareSha256)&&hash(h.identitySha256)
  &&typeof h.method==='string'&&h.method.trim().length>0&&Number.isFinite(stamp)&&Number.isFinite(shareDate)&&stamp<=shareDate&&shareDate<=today
  &&Number.isFinite(control)&&control<=today&&stamp<=control&&shareDate<=control
  &&h.shareSourceUrl===share.shareDocumentBase&&h.identityAsOf===h.asOf
  &&typeof h.identitySourceUrl==='string'&&h.identitySourceUrl.startsWith(index.identitySourcePrefix)
  &&h.identitySourceUrl.includes('asOfDate='+h.asOf.replaceAll('-',''))
  &&new Set(known.map(row=>row.isin)).size===known.length
  &&p?.kind==='complete-native-index'&&p.endMarkerPresent===true&&p.indexId===share.indexId&&p.originalPublishedWeights===true&&p.normalizationApplied===false
  &&Array.isArray(h.rows)&&p.sourceRowCount===h.rows.length&&h.rows.length>=index.minimumMembers&&h.rows.length<=index.maximumMembers
}
