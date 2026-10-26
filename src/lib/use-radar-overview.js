import { useSyncExternalStore } from 'react'
import { validateRadarOverview } from './radar-overview.js'
import { READ_EVENT,cacheSignalGroups } from './radar-read-state.js'

export const RADAR_OVERVIEW_URL='https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/summary.json'
const listeners=new Set()
let state={status:'loading',data:null,error:null,revision:0},flight=null,timer=null
const emit=()=>{for(const listener of listeners)listener()}
const changed=()=>{state={...state,revision:state.revision+1};emit()}
export async function refreshRadarOverview() {
  if(flight)return flight
  flight=(async()=>{
    try{
      const response=await fetch(RADAR_OVERVIEW_URL,{cache:'no-cache',signal:AbortSignal.timeout(12000)})
      if(!response.ok)throw Error(`Résumé du Radar indisponible (HTTP ${response.status})`)
      const data=validateRadarOverview(await response.json())
      if(Date.now()-Date.parse(data.checkedAt)>36*3600000 || Date.parse(data.checkedAt)>Date.now()+60000)throw Error('Le résumé du Radar est ancien ou sa date est invalide')
      state={status:'ready',data,error:null,revision:state.revision+1}
      cacheSignalGroups(data.groups)
    }catch(error){state={...state,status:'error',error:error.message,revision:state.revision+1}}
    finally{flight=null;emit()}
  })()
  return flight
}
const focus=()=>{if(document.visibilityState==='visible')refreshRadarOverview()}
function subscribe(listener) {
  listeners.add(listener)
  if(listeners.size===1){
    window.addEventListener(READ_EVENT,changed);window.addEventListener('storage',changed);window.addEventListener('focus',focus)
    document.addEventListener('visibilitychange',focus)
    timer=setInterval(focus,300000)
    if(!state.data||state.status==='error')refreshRadarOverview()
  }
  return()=>{
    listeners.delete(listener)
    if(!listeners.size){clearInterval(timer);window.removeEventListener(READ_EVENT,changed);window.removeEventListener('storage',changed);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus)}
  }
}
export default function useRadarOverview(){return useSyncExternalStore(subscribe,()=>state,()=>state)}
