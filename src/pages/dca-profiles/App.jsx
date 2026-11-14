import { useSearchParams } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import SimpleExposure from './SimpleExposure.jsx'
import './dca-profiles.css'
const DcaApp = lazy(() => import('./DcaApp.jsx'))
export default function App(){
 const [params,setParams]=useSearchParams()
 const isin=params.get('isin'), mode=['dca','subscribers'].includes(params.get('mode'))?params.get('mode'):'exposure'
 const exposure=mode==='exposure'
 const [dcaVisited,setDcaVisited]=useState(!exposure)
 function setMode(next){setParams(previous=>{const value=new URLSearchParams(previous);if(next!=='exposure')value.set('mode',next);else value.delete('mode');return value})}
 return <><nav className="dca-simple-tabs" aria-label="Choisir un outil">{[['exposure','Analyser une allocation'],['dca','Le DCA d’un abonné'],['subscribers','Profils d’abonnés']].map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>{if(id!=='exposure')setDcaVisited(true);setMode(id)}}>{label}</button>)}</nav><div hidden={!exposure}><SimpleExposure key={isin??''} isin={isin}/></div><div hidden={exposure}>{(dcaVisited||!exposure)&&<Suspense fallback={<p role="status">Chargement du DCA…</p>}><DcaApp subscriberMode={mode==='subscribers'}/></Suspense>}</div></>
}
