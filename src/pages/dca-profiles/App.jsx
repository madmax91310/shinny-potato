import { useLocation } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import SimpleExposure from './SimpleExposure.jsx'
import './dca-profiles.css'
const DcaApp = lazy(() => import('./DcaApp.jsx'))
export default function App(){
 const {search}=useLocation()
 const [mode,setMode]=useState('exposure'),[dcaVisited,setDcaVisited]=useState(false)
 return <><nav className="dca-simple-tabs" aria-label="Choisir un outil"><button aria-pressed={mode==='exposure'} onClick={()=>setMode('exposure')}>Analyser une allocation</button><button aria-pressed={mode==='dca'} onClick={()=>{setDcaVisited(true);setMode('dca')}}>Le DCA de…</button></nav><div hidden={mode!=='exposure'}><SimpleExposure key={search} isin={new URLSearchParams(search).get('isin')}/></div><div hidden={mode!=='dca'}>{dcaVisited&&<Suspense fallback={<p role="status">Chargement du DCA…</p>}><DcaApp/></Suspense>}</div></>
}
