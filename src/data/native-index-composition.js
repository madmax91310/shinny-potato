// A full economic-index reference needs its own admitted source and exact-share
// benchmark proof. A physical ETF proxy cannot acquire this status by a label.
import contracts from './native-index-composition-contracts.json' with {type:'json'}
import freshness from './freshness-policy.json' with {type:'json'}
const hash=value=>/^[a-f0-9]{64}$/.test(value||'')
const day=value=>{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return NaN
 const parsed=Date.parse(value)
 return Number.isFinite(parsed)&&new Date(parsed).toISOString().slice(0,10)===value?parsed:NaN
}
export function qualifiedNativeIndexComposition(record,isin,now=new Date()){
 const share=contracts.shares[isin],index=contracts.indices[share?.indexId],h=record
 if(!index||!h||h.basis!=='index'||h.subjectIsin!==isin||h.indexId!==share.indexId||h.scope!=='equity-index')return false
 if(index.methodCode==='invesco-published-economic-index-v1')return qualifiedIssuerIndex(h,share,index,now)
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

function qualifiedIssuerIndex(h,share,index,now){
 const stamp=day(h.asOf),shareStamp=day(h.shareAsOf),metadataStamp=day(h.metadataAsOf),control=Date.parse(h.checkedAt),today=+new Date(now)
 const p=h.coverageProof,rows=h.rows
 const subjectSource=share.shareDocumentBase?h.shareSourceUrl===share.shareDocumentBase:
  typeof h.shareSourceUrl==='string'&&h.shareSourceUrl.startsWith(share.shareDocumentPrefix)
   &&h.shareSourceUrl===share.shareDocumentPrefix+h.shareAsOf
   &&h.shareDiscoverySourceUrl===share.shareDocumentDiscoveryUrl&&hash(h.shareDiscoverySha256)
 return h.methodCode===index.methodCode&&h.sourceUrl===index.weightSourceUrl&&hash(h.sha256)
  &&typeof h.method==='string'&&h.method.trim().length>0&&subjectSource&&hash(h.shareSha256)
  &&[stamp,shareStamp,metadataStamp,control].every(Number.isFinite)
  &&stamp<=control&&shareStamp<=control&&metadataStamp<=control&&control<=today&&metadataStamp>=stamp
  &&(today-shareStamp)/86400000<=freshness.fields['etf.default'].dataDays
  &&h.metadataSourceUrl===index.metadataSourceUrl&&hash(h.metadataSha256)
  &&h.identityAsOf===h.asOf&&h.identitySourceUrl===h.sourceUrl&&h.identitySha256===h.sha256
  &&Array.isArray(rows)&&rows.length>=index.minimumMembers&&rows.length<=index.maximumMembers
  &&rows.every(row=>/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(row.isin||'')&&typeof row.name==='string'&&row.name.trim()
    &&Number.isFinite(row.weightPct)&&row.weightPct>=0&&row.weightPct<=100)
  &&new Set(rows.map(row=>row.isin)).size===rows.length
  &&Math.abs(rows.reduce((s,row)=>s+row.weightPct,0)-100)<=rows.length*.00005+.0001
  &&p?.kind==='complete-issuer-published-index'&&p.indexId===share.indexId
  &&p.sourceRowCount===rows.length&&p.publisherRowCount===rows.length
  &&p.originalPublishedWeights===true&&p.normalizationApplied===false
  &&p.publisherPageUrl===index.publisherPageUrl&&hash(p.publisherPageSha256)&&hash(p.tableTextSha256)
  &&p.economicExposurePublished===true&&p.separateSubstituteBasketPublished===true
}
