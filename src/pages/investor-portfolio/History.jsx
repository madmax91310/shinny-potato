import {lazy,Suspense,useState} from 'react'
const HistoryContent=lazy(()=>import('./HistoryContent.jsx'))
export default function History({portfolio}) {
  const [opened,setOpened]=useState(false)
  return <details className="portfolio-exposure" onToggle={event=>{if(event.currentTarget.open)setOpened(true)}}>
    <summary>Évolution des photographies 13F archivées</summary>
    {opened&&<Suspense fallback={<p>Chargement des archives…</p>}><HistoryContent portfolio={portfolio}/></Suspense>}
  </details>
}
