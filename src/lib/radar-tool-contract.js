// UI validates producer-proposed destinations rather than trusting arbitrary
// URLs or inventing inputs for tools which have no matching entry contract.
export function validatedRadarActions(event) {
  return (event.toolActions??[]).filter(action=>
    action.kind==='etf-sheet'&&/^\/fiches-etf\?isin=[A-Z]{2}[A-Z0-9]{10}$/.test(action.to)&&action.stage==='qualified-catalogue'||
    action.kind==='grok'&&action.to==='/hey-grok'&&action.state?.radar?.version===1&&action.state.radar.id===event.id&&typeof action.state.radar.text==='string'&&action.state.radar.text.length<1800
  ).slice(0,2)
}
