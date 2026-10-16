import { useEffect, useState } from 'react'
import { ensureCalculatorAsset } from '../data/calculator-history.js'
export function useSelectedHistory(id){
 const [result,setResult]=useState({id:null,status:'loading'}),[attempt,setAttempt]=useState(0)
 useEffect(()=>{let active=true;setResult({id,status:'loading'});(id==='custom'?Promise.resolve():ensureCalculatorAsset(id)).then(()=>{if(active)setResult({id,status:'ready'})}).catch(()=>{if(active)setResult({id,status:'error'})});return()=>{active=false}},[id,attempt])
 return {ready:id==='custom'||(result.id===id&&result.status==='ready'),error:result.id===id&&result.status==='error',retry:()=>setAttempt(n=>n+1)}
}
