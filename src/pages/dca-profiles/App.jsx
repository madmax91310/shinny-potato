import { useSearchParams } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import SimpleExposure from './SimpleExposure.jsx'
import './dca-profiles.css'
const DcaApp = lazy(() => import('./DcaApp.jsx'))
export default function App(){
 const [params,setParams]=useSearchParams()
 const isin=params.get('isin'), mode=params.get('mode')==='dca'?'dca':'exposure'
 const [dcaVisited,setDcaVisited]=useState(mode==='dca')
 function setMode(next){setParams(previous=>{const value=new URLSearchParams(previous);if(next==='dca')value.set('mode','dca');else value.delete('mode');return value})}
 return <><nav className="dca-simple-tabs" aria-label="Choisir un outil"><button aria-pressed={mode==='exposure'} onClick={()=>setMode('exposure')}>Analyser une allocation</button><button aria-pressed={mode==='dca'} onClick={()=>{setDcaVisited(true);setMode('dca')}}>Le DCA d’un abonné</button></nav><div hidden={mode!=='exposure'}><SimpleExposure key={isin??''} isin={isin}/></div><div hidden={mode!=='dca'}>{(dcaVisited||mode==='dca')&&<Suspense fallback={<p role="status">Chargement du DCA…</p>}><DcaApp/></Suspense>}</div></>
}
