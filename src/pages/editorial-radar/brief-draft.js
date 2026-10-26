export function briefDraft(event) {
  if(!event.draftMaterial)return event.draft
  const material=event.draftMaterial
  return [event.title,material.mainFact,...(event.draftFacts??[]).slice(0,1).map(f=>f.text),material.population,`Publication originale : ${event.originalPublishedAt??event.publishedAt??'date non documentée'}${event.financialChangeEvidence?' · Changement constaté : '+event.financialChangeEvidence.observedAt:''}`,`Source : ${event.sourceUrl}`].filter(Boolean).join('\n\n')
}
