import {lazy, Suspense, useState} from 'react'
import Button from '../../design-system/Button.jsx'
import PageHeader from '../../design-system/PageHeader.jsx'
import WeeklyPost from './WeeklyPost.jsx'
import ManualEntry from './ManualEntry.jsx'
const QualifiedApp = lazy(() => import('./QualifiedApp.jsx'))
export default function App() {
 const [advanced,setAdvanced]=useState(false)
 return <div className="flows-page">
  <PageHeader title="Où va l’argent des ETF ?" />
  <WeeklyPost />
  {advanced ? <><Button variant="secondary" onClick={()=>setAdvanced(false)}>Revenir à la saisie simple</Button><Suspense fallback={<p>Chargement…</p>}><QualifiedApp /></Suspense></> : <ManualEntry />}
  {!advanced&&<details className="etf-flows flows-advanced"><summary>Anciennes observations qualifiées</summary><p>Leur stockage et leurs contrôles restent disponibles séparément.</p><Button variant="secondary" onClick={()=>setAdvanced(true)}>Ouvrir l’import qualifié</Button></details>}
 </div>
}
