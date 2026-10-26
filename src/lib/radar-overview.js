// Small projection of the existing feed, not a second editorial store. Produced
// with the same ranking as the Radar; never contains technical incidents.
export const RADAR_POLICY_VERSION = 3
export function overviewSubject(group) {
  const event=group.event,material=group.assessment.material
  return {id:event.id,eventIds:group.events.map(e=>e.id),readEventIds:group.readIds,title:event.title,mainFact:material.mainFact,
    publishedAt:event.originalPublishedAt??event.publishedAt??null,observedAt:event.financialChangeEvidence?.observedAt??event.changeEvidence?.observedAt??null,
    whyNow:material.nowReason,reason:(['reaction','reach','novelty'].map(key=>group.assessment.criteria.find(c=>c.key===key&&c.points>0)).find(Boolean)?.reason??material.nowReason),score:group.assessment.score,
    sourceUrl:event.sourceUrl,to:`/radar-editorial?subject=${encodeURIComponent(event.id)}`}
}
export function makeRadarOverview(feed,selection) {
  return {schemaVersion:1,policyVersion:RADAR_POLICY_VERSION,checkedAt:feed.checkedAt,sourceRevision:feed.sourceRevision,
    groups:selection.ready.map(g=>g.readIds),selection:selection.selected.map(overviewSubject)}
}
export function validateRadarOverview(value) {
  if(value?.schemaVersion!==1||value.policyVersion!==RADAR_POLICY_VERSION||!Number.isFinite(Date.parse(value.checkedAt))||!Array.isArray(value.groups)||!Array.isArray(value.selection)||value.selection.length>5)throw Error('Résumé du Radar non reconnu')
  const validId=id=>typeof id==='string'&&/^[a-f0-9]{24}$/.test(id)
  if(value.groups.length>2000||value.groups.some(g=>!Array.isArray(g)||!g.length||g.some(id=>!validId(id))))throw Error('Groupes du Radar invalides')
  for(const row of value.selection) {
    if(!validId(row.id)||!Array.isArray(row.eventIds)||row.eventIds.some(id=>!validId(id))||!row.eventIds.includes(row.id)||!Array.isArray(row.readEventIds)||!row.readEventIds.length||row.readEventIds.some(id=>!validId(id))||typeof row.title!=='string'||typeof row.mainFact!=='string'||typeof row.reason!=='string'||!Number.isFinite(row.score)||row.to!==`/radar-editorial?subject=${row.id}`||new URL(row.sourceUrl).protocol!=='https:')throw Error('Sujet du résumé invalide')
  }
  return value
}
export function overviewUnread(overview,read=[]) {
  const seen=new Set(read)
  return overview.groups.filter(group=>group.some(id=>!seen.has(id))).length
}
