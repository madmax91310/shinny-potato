import { tweetStatus } from './lib.js'
export function radarSuggestion(state) {
  const row=state?.radar
  if(row?.version!==1||!/^[a-f0-9]{24}$/.test(row.id??'')||typeof row.text!=='string'||!tweetStatus(row.text).canCopy||typeof row.context!=='string')return null
  try{if(new URL(row.sourceUrl).protocol!=='https:')return null}catch{return null}
  return row
}
