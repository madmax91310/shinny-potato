import CONFIG from '../../scripts/ranking-sources.json' with {type:'json'}
// A visual alias reuses the approved illustration of the same share. It never
// supplies financial prices, a currency conversion or an alternative history.
export const HISTORY_VISUAL_ALIASES=Object.fromEntries(CONFIG.series.filter(r=>r.sharedHistory&&r.artHistoryId).map(r=>[r.id,r.artHistoryId]))
export function withHistoryVisuals(base) {
  const aliases=Object.fromEntries(Object.entries(HISTORY_VISUAL_ALIASES).map(([id,reference])=>{
    if(!base[reference])throw new Error(`Illustration de référence absente : ${reference}`)
    return [id,base[reference]]
  }))
  return {...base,...aliases}
}
