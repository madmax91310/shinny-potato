import {lazy,Suspense,useState} from 'react'
const OfferConditions=lazy(()=>import('./OfferConditions.jsx'))
export default function ConditionsDetails({conditions}){const[open,setOpen]=useState(false);return <details onToggle={e=>setOpen(e.currentTarget.open)}><summary>Conditions de l’annonce</summary>{open&&<Suspense fallback={<p>Chargement…</p>}><OfferConditions conditions={conditions}/></Suspense>}</details>}
